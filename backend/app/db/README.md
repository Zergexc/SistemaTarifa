# app/db — Base de datos y migraciones

Contiene la sesión de base de datos y la configuración de Alembic para migraciones.

## Archivos (a crear en Fase 2)

### `session.py`
Configura el engine de SQLAlchemy y expone `SessionLocal` y la dependencia `get_db`.

```python
# En cualquier servicio que necesite BD
from app.db.session import get_db
from fastapi import Depends
from sqlalchemy.orm import Session

def mi_servicio(db: Session = Depends(get_db)):
    ...
```

### `base.py`
Declara `Base = declarative_base()`. Todos los modelos de `app/models/` importan esta Base.

## Migraciones con Alembic

```bash
# Crear una migración nueva (detecta cambios en los modelos)
alembic revision --autogenerate -m "crear tabla documentos"

# Aplicar todas las migraciones pendientes
alembic upgrade head

# Revertir la última migración
alembic downgrade -1
```

Las migraciones se generan en `alembic/versions/`. No editar manualmente — usar los comandos de Alembic.
