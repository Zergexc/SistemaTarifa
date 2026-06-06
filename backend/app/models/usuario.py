from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(50), nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    fecha_registro = Column(DateTime, server_default=func.now(), nullable=False)

    documentos = relationship("Documento", back_populates="usuario")
    revisiones = relationship("Revision", back_populates="usuario")
    historial_prompts = relationship("HistorialPrompt", back_populates="usuario")
