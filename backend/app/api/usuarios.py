from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.services import usuario_service

router = APIRouter()


@router.get("/", response_model=list[UsuarioResponse])
def listar(current_user: Usuario = Depends(require_admin), db: Session = Depends(get_db)):
    return usuario_service.get_all(db)


@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear(
    data: UsuarioCreate,
    current_user: Usuario = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        return usuario_service.create(data, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{id}", response_model=UsuarioResponse)
def actualizar(
    id: int,
    data: UsuarioUpdate,
    current_user: Usuario = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        return usuario_service.update(id, data, current_user.id_usuario, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
