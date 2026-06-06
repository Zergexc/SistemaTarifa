from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Revision(Base):
    __tablename__ = "revisiones"

    id_revision = Column(Integer, primary_key=True, index=True)
    id_plantilla = Column(Integer, ForeignKey("plantillas_generadas.id_plantilla"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    comentario = Column(Text, nullable=True)
    decision = Column(String(20), nullable=False)
    fecha_revision = Column(DateTime, server_default=func.now(), nullable=False)

    plantilla = relationship("PlantillaGenerada", back_populates="revisiones")
    usuario = relationship("Usuario", back_populates="revisiones")
