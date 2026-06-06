# app/core — Configuración y seguridad

Contiene la configuración global, seguridad JWT y dependencias de FastAPI.

## Archivos (a crear en Fase 4)

### `config.py`
Lee las variables de entorno usando `pydantic-settings`. Expone un objeto `settings` usado en toda la aplicación.

```python
# Uso en cualquier parte del código
from app.core.config import settings
print(settings.OPENAI_MODEL)   # "gpt-4.1"
print(settings.DATABASE_URL)
```

Variables principales: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `STORAGE_DOCUMENTOS`, `STORAGE_PLANTILLAS`, `FRONTEND_URL`.

### `security.py`
Funciones para crear y verificar tokens JWT. Dependencia `get_current_user` usada por los routers.

```python
# En cualquier router protegido
@router.get("/")
def endpoint(current_user = Depends(get_current_user)):
    ...
```

### `dependencies.py`
Dependencias reutilizables de FastAPI: sesión de BD, usuario autenticado, verificación de rol.
