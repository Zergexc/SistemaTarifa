import uuid
from pathlib import Path

import openpyxl
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.documento import Documento, EstadoDocumento, TipoDocumento

EXTENSION_TIPO = {
    ".xlsx": "EXCEL",
    ".xls": "EXCEL",
    ".pdf": "PDF",
    ".docx": "WORD",
    ".jpg": "IMAGEN",
    ".png": "IMAGEN",
    ".msg": "CORREO",
}


def get_all(usuario_id: int, db: Session) -> list[Documento]:
    return (
        db.query(Documento)
        .filter(Documento.id_usuario == usuario_id)
        .order_by(Documento.fecha_carga.desc())
        .all()
    )


def get_by_id(documento_id: int, db: Session) -> Documento:
    doc = db.query(Documento).filter(Documento.id_documento == documento_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento no encontrado")
    return doc


async def create(file: UploadFile, usuario_id: int, db: Session) -> Documento:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nombre de archivo inválido")

    ext = Path(file.filename).suffix.lower()
    tipo_desc = EXTENSION_TIPO.get(ext)
    if not tipo_desc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato no permitido. Extensiones válidas: {', '.join(EXTENSION_TIPO)}",
        )

    tipo = db.query(TipoDocumento).filter_by(descripcion=tipo_desc).first()
    estado = db.query(EstadoDocumento).filter_by(descripcion="CARGADO").first()
    if not tipo or not estado:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Catálogos no inicializados. Ejecute el seed.",
        )

    contenido = await file.read()
    tamano = len(contenido)

    storage_path = Path(settings.STORAGE_DOCUMENTOS)
    storage_path.mkdir(parents=True, exist_ok=True)

    nombre_unico = f"{uuid.uuid4().hex}_{file.filename}"
    ruta = storage_path / nombre_unico
    ruta.write_bytes(contenido)

    doc = Documento(
        id_usuario=usuario_id,
        id_tipo_documento=tipo.id_tipo_documento,
        id_estado_documento=estado.id_estado_documento,
        nombre_archivo=file.filename,
        ruta_almacenamiento=str(ruta),
        tamano_bytes=tamano,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def get_hojas_excel(doc: Documento) -> list[str]:
    if doc.tipo_documento.descripcion != "EXCEL":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El documento no es un archivo Excel",
        )
    wb = openpyxl.load_workbook(doc.ruta_almacenamiento, read_only=True)
    hojas = wb.sheetnames
    wb.close()
    return hojas
