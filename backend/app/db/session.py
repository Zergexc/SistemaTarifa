from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Pool dimensionado para carga concurrente: el default (5+10) se agota y cuelga
# el servidor con ~130 usuarios simultáneos (hallazgo de la prueba de estrés JMeter).
# pool_timeout corto: mejor fallar rápido con 503 que colgar la petición 30 s.
_pool_opts = {}
if not settings.DATABASE_URL.startswith("sqlite"):
    _pool_opts = {
        "pool_size": 20,
        "max_overflow": 30,
        "pool_timeout": 10,
        "pool_pre_ping": True,
    }

engine = create_engine(settings.DATABASE_URL, **_pool_opts)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
