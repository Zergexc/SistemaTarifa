from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.usuario import Usuario
from app.schemas.usuario import (
    ROLES_VALIDOS,
    PasswordChange,
    PerfilUpdate,
    UsuarioCreate,
    UsuarioUpdate,
)


def get_all(db: Session) -> list[Usuario]:
    return db.query(Usuario).order_by(Usuario.fecha_registro.desc()).all()


def create(data: UsuarioCreate, db: Session) -> Usuario:
    if data.rol not in ROLES_VALIDOS:
        raise ValueError(f"Rol inválido. Valores permitidos: {', '.join(ROLES_VALIDOS)}")

    user = Usuario(
        nombre=data.nombre,
        apellido=data.apellido,
        email=data.email,
        password_hash=hash_password(data.password),
        rol=data.rol,
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise ValueError("El email ya está registrado")
    return user


def update(id: int, data: UsuarioUpdate, current_user_id: int, db: Session) -> Usuario:
    if id == current_user_id:
        raise ValueError("No puedes modificar tu propia cuenta")

    user = db.query(Usuario).filter(Usuario.id_usuario == id).first()
    if not user:
        raise ValueError("Usuario no encontrado")

    if data.rol is not None:
        if data.rol not in ROLES_VALIDOS:
            raise ValueError(f"Rol inválido. Valores permitidos: {', '.join(ROLES_VALIDOS)}")
        user.rol = data.rol
    if data.nombre is not None:
        user.nombre = data.nombre
    if data.apellido is not None:
        user.apellido = data.apellido
    if data.email is not None:
        user.email = data.email
    if data.password is not None:
        user.password_hash = hash_password(data.password)
    if data.activo is not None:
        user.activo = data.activo

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise ValueError("El email ya está registrado")
    return user


def update_perfil(user: Usuario, data: PerfilUpdate, db: Session) -> Usuario:
    user.nombre = data.nombre
    user.apellido = data.apellido
    db.commit()
    db.refresh(user)
    return user


def change_password(user: Usuario, data: PasswordChange, db: Session) -> None:
    if not verify_password(data.password_actual, user.password_hash):
        raise ValueError("La contraseña actual es incorrecta")

    user.password_hash = hash_password(data.password_nueva)
    db.commit()
