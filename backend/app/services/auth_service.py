from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.models.usuario import Usuario


def login(email: str, password: str, db: Session) -> Usuario | None:
    user = db.query(Usuario).filter(Usuario.email == email, Usuario.activo == True).first()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def build_token(user: Usuario) -> str:
    return create_access_token({"sub": str(user.id_usuario), "email": user.email, "rol": user.rol})
