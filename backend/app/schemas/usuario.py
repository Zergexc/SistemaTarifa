from datetime import datetime

from pydantic import BaseModel, EmailStr

ROLES_VALIDOS = {"OPERADOR", "REVISOR", "ADMINISTRADOR"}


class UsuarioCreate(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    password: str
    rol: str


class UsuarioUpdate(BaseModel):
    activo: bool


class UsuarioResponse(BaseModel):
    id_usuario: int
    nombre: str
    apellido: str
    email: str
    rol: str
    activo: bool
    fecha_registro: datetime

    model_config = {"from_attributes": True}
