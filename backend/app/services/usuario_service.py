from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.usuario import Usuario
from app.schemas.usuario import ROLES_VALIDOS, UsuarioCreate


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


def toggle_activo(id: int, activo: bool, current_user_id: int, db: Session) -> Usuario:
    if id == current_user_id:
        raise ValueError("No puedes modificar tu propia cuenta")

    user = db.query(Usuario).filter(Usuario.id_usuario == id).first()
    if not user:
        raise ValueError("Usuario no encontrado")

    user.activo = activo
    db.commit()
    db.refresh(user)
    return user
