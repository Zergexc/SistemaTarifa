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


class ErrorResponse(BaseModel):
    id_error: int
    id_resultado: int
    tipo_error: str
    campo_afectado: str | None = None
    valor_detectado: str | None = None
    descripcion: str
    severidad: str
    resuelto: bool

    class Config:
        from_attributes = True


class ResultadoResponse(BaseModel):
    id_resultado: int
    id_documento: int
    texto_extraido: str | None = None
    json_ia: dict | None = None
    json_editado: dict | None = None
    modelo_ia_usado: str | None = None
    tokens_entrada: int | None = None
    tokens_salida: int | None = None
    fecha_generacion: datetime
    errores: list[ErrorResponse]

    class Config:
        from_attributes = True


class ResultadoUpdateRequest(BaseModel):
    json_editado: dict


class ProcesarRequest(BaseModel):
    consideraciones: str | None = None


class PlantillaResponse(BaseModel):
    id_plantilla: int
    id_documento: int
    documento_origen: str
    version: int
    estado: str
    fecha_generacion: datetime

