from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_operador
from app.models.documento import Documento
from app.models.usuario import Usuario
from app.schemas.documento import DocumentoResponse, HojasExcelResponse
from app.services import documento_service

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
