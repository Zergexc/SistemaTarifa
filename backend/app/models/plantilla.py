from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class EstadoPlantilla(Base):
    __tablename__ = "estados_plantilla"

    id_estado_plantilla = Column(Integer, primary_key=True)
    descripcion = Column(String(50), unique=True, nullable=False)

    plantillas = relationship("PlantillaGenerada", back_populates="estado_plantilla")


class PlantillaGenerada(Base):
    __tablename__ = "plantillas_generadas"

    id_plantilla = Column(Integer, primary_key=True, index=True)
    id_resultado = Column(Integer, ForeignKey("resultados_extraccion.id_resultado"), nullable=False)
    id_estado_plantilla = Column(Integer, ForeignKey("estados_plantilla.id_estado_plantilla"), nullable=False)
    id_plantilla_padre = Column(Integer, ForeignKey("plantillas_generadas.id_plantilla"), nullable=True)
    nombre_archivo = Column(String(255), nullable=False)
    ruta_almacenamiento = Column(String(500), nullable=False)
    version = Column(Integer, nullable=False, default=1)
    fecha_generacion = Column(DateTime, server_default=func.now(), nullable=False)

    resultado = relationship("ResultadoExtraccion", back_populates="plantillas")
    estado_plantilla = relationship("EstadoPlantilla", back_populates="plantillas")
    plantilla_padre = relationship("PlantillaGenerada", remote_side=[id_plantilla])
    revisiones = relationship("Revision", back_populates="plantilla")
