# app/api — Routers FastAPI

Contiene los routers HTTP organizados por recurso. Cada archivo corresponde a un módulo de la API.

## Archivos (a crear en Fase 4)

| Archivo | Prefijo | Descripción |
|---|---|---|
| `auth.py` | `/api/auth` | Login, logout, datos del usuario autenticado |
| `usuarios.py` | `/api/usuarios` | CRUD de usuarios (solo Administrador) |
| `documentos.py` | `/api/documentos` | Carga, listado, procesamiento de documentos |
| `resultados.py` | `/api/resultados` | Consulta y edición de resultados de extracción |
| `plantillas.py` | `/api/plantillas` | Generación, listado y descarga de plantillas |
| `revisiones.py` | `/api/revisiones` | Aprobación y rechazo de plantillas (Revisor) |

## Responsabilidad de esta capa

Los routers son **delgados**: solo reciben el request HTTP, validan el token JWT mediante la dependencia de seguridad, y delegan la lógica al servicio correspondiente en `app/services/`.

No deben contener lógica de negocio.

## Ejemplo de estructura de un router

```python
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.services import documentos_service
from app.schemas.documento import DocumentoResponse

router = APIRouter()

@router.get("/{id}", response_model=DocumentoResponse)
def get_documento(id: int, current_user=Depends(get_current_user)):
    return documentos_service.get_by_id(id, current_user)
```
