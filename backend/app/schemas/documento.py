from datetime import datetime

from pydantic import BaseModel


class DocumentoResponse(BaseModel):
    id_documento: int
    nombre_archivo: str
    tipo: str
    estado: str
    tamano_bytes: int
    fecha_carga: datetime
    id_usuario: int


class HojasExcelResponse(BaseModel):
    hojas: list[str]
