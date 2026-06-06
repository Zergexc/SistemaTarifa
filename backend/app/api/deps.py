from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.usuario import Usuario

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise exc
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            raise exc
    except JWTError:
        raise exc

    user = db.query(Usuario).filter(
        Usuario.id_usuario == int(user_id),
        Usuario.activo == True,
    ).first()
    if user is None:
        raise exc
    return user


def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.rol != "ADMINISTRADOR":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso restringido")
    return current_user


def require_operador(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.rol not in ("OPERADOR", "ADMINISTRADOR"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso restringido")
    return current_user
