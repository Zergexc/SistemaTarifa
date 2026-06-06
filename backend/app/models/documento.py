from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class TipoDocumento(Base):
    __tablename__ = "tipos_documento"

    id_tipo_documento = Column(Integer, primary_key=True)
    descripcion = Column(String(50), unique=True, nullable=False)

    documentos = relationship("Documento", back_populates="tipo_documento")


class EstadoDocumento(Base):
    __tablename__ = "estados_documento"

    id_estado_documento = Column(Integer, primary_key=True)
    descripcion = Column(String(50), unique=True, nullable=False)

    documentos = relationship("Documento", back_populates="estado_documento")


class Documento(Base):
    __tablename__ = "documentos"

    id_documento = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    id_tipo_documento = Column(Integer, ForeignKey("tipos_documento.id_tipo_documento"), nullable=False)
    id_estado_documento = Column(Integer, ForeignKey("estados_documento.id_estado_documento"), nullable=False)
    nombre_archivo = Column(String(255), nullable=False)
    ruta_almacenamiento = Column(String(500), nullable=False)
    tamano_bytes = Column(Integer, nullable=False)
    fecha_carga = Column(DateTime, server_default=func.now(), nullable=False)

    usuario = relationship("Usuario", back_populates="documentos")
    tipo_documento = relationship("TipoDocumento", back_populates="documentos")
    estado_documento = relationship("EstadoDocumento", back_populates="documentos")
    resultados = relationship("ResultadoExtraccion", back_populates="documento")
    historial_prompts = relationship("HistorialPrompt", back_populates="documento")
