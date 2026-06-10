from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.usuario import PasswordChange, PerfilUpdate, UsuarioResponse
from app.services import auth_service, usuario_service

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = auth_service.login(data.email, data.password, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
    return TokenResponse(access_token=auth_service.build_token(user), rol=user.rol)


@router.get("/me", response_model=UsuarioResponse)
def me(current_user: Usuario = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UsuarioResponse)
def actualizar_perfil(
    data: PerfilUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return usuario_service.update_perfil(current_user, data, db)


@router.put("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def cambiar_password(
    data: PasswordChange,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        usuario_service.change_password(current_user, data, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
