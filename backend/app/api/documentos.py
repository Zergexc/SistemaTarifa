import os

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_operador
from app.db.session import SessionLocal
from app.models.documento import Documento
from app.models.usuario import Usuario
from app.models.resultado import ResultadoExtraccion, ErrorDetectado
from app.models.plantilla import PlantillaGenerada
from app.schemas.documento import (
    DocumentoResponse,
    HojasExcelResponse,
    PlantillaResponse,
    ProcesarRequest,
    ResultadoResponse,
    ResultadoUpdateRequest,
)
from app.services import documento_service, extraccion_service, plantilla_service

router = APIRouter()


def _to_response(doc: Documento) -> DocumentoResponse:
    return DocumentoResponse(
        id_documento=doc.id_documento,
        nombre_archivo=doc.nombre_archivo,
        tipo=doc.tipo_documento.descripcion,
        estado=doc.estado_documento.descripcion,
        tamano_bytes=doc.tamano_bytes,
        fecha_carga=doc.fecha_carga,
        id_usuario=doc.id_usuario,
    )


def _check_ownership(doc: Documento, current_user: Usuario) -> None:
    if current_user.rol != "ADMINISTRADOR" and doc.id_usuario != current_user.id_usuario:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")


def _get_ultimo_resultado(documento_id: int, db: Session) -> ResultadoExtraccion:
    res = (
        db.query(ResultadoExtraccion)
        .filter_by(id_documento=documento_id)
        .order_by(ResultadoExtraccion.numero_iteracion.desc())
        .first()
    )
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resultados no encontrados o el documento no ha sido procesado aún.",
        )
    return res


@router.get("", response_model=list[DocumentoResponse])
def list_documentos(
    current_user: Usuario = Depends(require_operador),
    db: Session = Depends(get_db),
):
    docs = documento_service.get_all(current_user.id_usuario, db)
    return [_to_response(d) for d in docs]


@router.post("", response_model=DocumentoResponse, status_code=status.HTTP_201_CREATED)
async def upload_documento(
    file: UploadFile = File(...),
    current_user: Usuario = Depends(require_operador),
    db: Session = Depends(get_db),
):
    doc = await documento_service.create(file, current_user.id_usuario, db)
    return _to_response(doc)


@router.get("/plantillas", response_model=list[PlantillaResponse])
def list_plantillas(
    current_user: Usuario = Depends(require_operador),
    db: Session = Depends(get_db),
):
    query = (
        db.query(PlantillaGenerada)
        .join(ResultadoExtraccion, PlantillaGenerada.id_resultado == ResultadoExtraccion.id_resultado)
        .join(Documento, ResultadoExtraccion.id_documento == Documento.id_documento)
    )
    if current_user.rol != "ADMINISTRADOR":
        query = query.filter(Documento.id_usuario == current_user.id_usuario)

    plantillas = query.order_by(PlantillaGenerada.fecha_generacion.desc()).all()

    return [
        PlantillaResponse(
            id_plantilla=p.id_plantilla,
            id_documento=p.resultado.id_documento,
            documento_origen=p.resultado.documento.nombre_archivo,
            version=p.version,
            estado=p.estado_plantilla.descripcion,
            fecha_generacion=p.fecha_generacion,
        )
        for p in plantillas
    ]


@router.get("/{documento_id}", response_model=DocumentoResponse)
def get_documento(
    documento_id: int,
    current_user: Usuario = Depends(require_operador),
    db: Session = Depends(get_db),
):
    doc = documento_service.get_by_id(documento_id, db)
    _check_ownership(doc, current_user)
    return _to_response(doc)


@router.get("/{documento_id}/hojas", response_model=HojasExcelResponse)
def get_hojas(
    documento_id: int,
    current_user: Usuario = Depends(require_operador),
    db: Session = Depends(get_db),
):
    doc = documento_service.get_by_id(documento_id, db)
    _check_ownership(doc, current_user)
    hojas = documento_service.get_hojas_excel(doc)
    return HojasExcelResponse(hojas=hojas)


@router.post("/{documento_id}/procesar", status_code=status.HTTP_202_ACCEPTED)
def procesar_documento(
    documento_id: int,
    background_tasks: BackgroundTasks,
    body: ProcesarRequest | None = None,
    current_user: Usuario = Depends(require_operador),
    db: Session = Depends(get_db),
):
    doc = documento_service.get_by_id(documento_id, db)
    _check_ownership(doc, current_user)

    consideraciones = body.consideraciones if body else None
    usuario_id = current_user.id_usuario

    # Tarea en segundo plano con una sesión dedicada (los hilos no comparten sesión)
    def ejecutar_procesamiento_seguro():
        bg_db = SessionLocal()
        try:
            extraccion_service.procesar_documento_completo(
                documento_id, bg_db, consideraciones=consideraciones, usuario_id=usuario_id,
            )
        finally:
            bg_db.close()

    background_tasks.add_task(ejecutar_procesamiento_seguro)
    return {"message": "Procesamiento iniciado en segundo plano"}


@router.get("/{documento_id}/resultado", response_model=ResultadoResponse)
def get_resultado(
    documento_id: int,
    current_user: Usuario = Depends(require_operador),
    db: Session = Depends(get_db),
):
    doc = documento_service.get_by_id(documento_id, db)
    _check_ownership(doc, current_user)
    return _get_ultimo_resultado(documento_id, db)


@router.put("/{documento_id}/resultado", response_model=ResultadoResponse)
def update_resultado(
    documento_id: int,
    payload: ResultadoUpdateRequest,
    current_user: Usuario = Depends(require_operador),
    db: Session = Depends(get_db),
):
    doc = documento_service.get_by_id(documento_id, db)
    _check_ownership(doc, current_user)

    res = _get_ultimo_resultado(documento_id, db)

    res.json_editado = payload.json_editado
    db.commit()
    db.refresh(res)

    # Re-correr validación con los datos editados
    db.query(ErrorDetectado).filter_by(id_resultado=res.id_resultado).delete()
    extraccion_service.validar_datos_extraidos(res.json_editado, res.id_resultado, db)
    db.refresh(res)

    return res


@router.get("/{documento_id}/plantilla/descargar")
def descargar_plantilla(
    documento_id: int,
    current_user: Usuario = Depends(require_operador),
    db: Session = Depends(get_db),
):
    doc = documento_service.get_by_id(documento_id, db)
    _check_ownership(doc, current_user)

    res = _get_ultimo_resultado(documento_id, db)

    try:
        # Generar o actualizar la plantilla excel
        plantilla = plantilla_service.generar_plantilla_excel(res.id_resultado, db)

        if not os.path.exists(plantilla.ruta_almacenamiento):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Archivo de plantilla física no encontrado.",
            )

        return FileResponse(
            path=plantilla.ruta_almacenamiento,
            filename=plantilla.nombre_archivo,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar/descargar plantilla: {str(e)}",
        )
