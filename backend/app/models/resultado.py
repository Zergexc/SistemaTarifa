from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class ResultadoExtraccion(Base):
    __tablename__ = "resultados_extraccion"

    id_resultado = Column(Integer, primary_key=True, index=True)
    id_documento = Column(Integer, ForeignKey("documentos.id_documento"), nullable=False)
    texto_extraido = Column(Text, nullable=True)
    json_ia = Column(JSON, nullable=True)
    json_editado = Column(JSON, nullable=True)
    modelo_ia_usado = Column(String(100), nullable=True)
    tokens_entrada = Column(Integer, nullable=True)
    tokens_salida = Column(Integer, nullable=True)
    nivel_confianza = Column(Float, nullable=True)
    numero_iteracion = Column(Integer, nullable=False, default=1)
    fecha_generacion = Column(DateTime, server_default=func.now(), nullable=False)

    documento = relationship("Documento", back_populates="resultados")
    errores = relationship("ErrorDetectado", back_populates="resultado")
    plantillas = relationship("PlantillaGenerada", back_populates="resultado")
    historial_prompt = relationship("HistorialPrompt", back_populates="resultado", uselist=False)


class HistorialPrompt(Base):
    __tablename__ = "historial_prompts"

    id_prompt = Column(Integer, primary_key=True, index=True)
    id_documento = Column(Integer, ForeignKey("documentos.id_documento"), nullable=False)
    id_resultado = Column(Integer, ForeignKey("resultados_extraccion.id_resultado"), nullable=False)
    texto_prompt = Column(Text, nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    fecha_envio = Column(DateTime, server_default=func.now(), nullable=False)

    documento = relationship("Documento", back_populates="historial_prompts")
    resultado = relationship("ResultadoExtraccion", back_populates="historial_prompt")
    usuario = relationship("Usuario", back_populates="historial_prompts")


class ErrorDetectado(Base):
    __tablename__ = "errores_detectados"

    id_error = Column(Integer, primary_key=True, index=True)
    id_resultado = Column(Integer, ForeignKey("resultados_extraccion.id_resultado"), nullable=False)
    tipo_error = Column(String(100), nullable=False)
    campo_afectado = Column(String(100), nullable=True)
    valor_detectado = Column(String(500), nullable=True)
    descripcion = Column(Text, nullable=False)
    severidad = Column(String(20), nullable=False)
    resuelto = Column(Boolean, default=False, nullable=False)
    resuelto_por = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    metodo_resolucion = Column(String(50), nullable=True)
    fecha_resolucion = Column(DateTime, nullable=True)

    resultado = relationship("ResultadoExtraccion", back_populates="errores")
    usuario_resolucion = relationship("Usuario", foreign_keys=[resuelto_por])
