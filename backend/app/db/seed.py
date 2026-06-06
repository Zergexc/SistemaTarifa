from passlib.context import CryptContext

from app.db.session import SessionLocal
from app.models.documento import TipoDocumento, EstadoDocumento
from app.models.plantilla import EstadoPlantilla
from app.models.usuario import Usuario

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed():
    db = SessionLocal()
    try:
        _seed_tipos_documento(db)
        _seed_estados_documento(db)
        _seed_estados_plantilla(db)
        _seed_admin(db)
        db.commit()
        print("Seed completado.")
    finally:
        db.close()


def _seed_tipos_documento(db):
    if db.query(TipoDocumento).count() > 0:
        return
    tipos = ["EXCEL", "PDF", "WORD", "IMAGEN"]
    for descripcion in tipos:
        db.add(TipoDocumento(descripcion=descripcion))


def _seed_estados_documento(db):
    if db.query(EstadoDocumento).count() > 0:
        return
    estados = ["CARGADO", "PROCESANDO", "PROCESADO", "ERROR_PROCESAMIENTO"]
    for descripcion in estados:
        db.add(EstadoDocumento(descripcion=descripcion))


def _seed_estados_plantilla(db):
    if db.query(EstadoPlantilla).count() > 0:
        return
    estados = ["GENERADA", "PENDIENTE_REVISION", "APROBADA", "RECHAZADA"]
    for descripcion in estados:
        db.add(EstadoPlantilla(descripcion=descripcion))


def _seed_admin(db):
    if db.query(Usuario).filter_by(email="admin@tarifaia.com").first():
        return
    db.add(Usuario(
        nombre="Administrador",
        apellido="Sistema",
        email="admin@tarifaia.com",
        password_hash=pwd_context.hash("admin1234"),
        rol="ADMINISTRADOR",
        activo=True,
    ))


if __name__ == "__main__":
    seed()
