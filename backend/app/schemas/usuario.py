from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

ROLES_VALIDOS = {"OPERADOR", "REVISOR", "ADMINISTRADOR"}


class UsuarioCreate(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    password: str
    rol: str


class UsuarioUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1)
    apellido: str | None = Field(default=None, min_length=1)
    email: EmailStr | None = None
    rol: str | None = None
    password: str | None = Field(default=None, min_length=8)
    activo: bool | None = None


class PerfilUpdate(BaseModel):
    nombre: str = Field(min_length=1)
    apellido: str = Field(min_length=1)


class PasswordChange(BaseModel):
    password_actual: str
    password_nueva: str = Field(min_length=8)


class UsuarioResponse(BaseModel):
    id_usuario: int
    nombre: str
    apellido: str
    email: str
    rol: str
    activo: bool
    fecha_registro: datetime

    model_config = {"from_attributes": True}
