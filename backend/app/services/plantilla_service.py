"""Generación de la plantilla Excel estandarizada con estilo corporativo.

Formato de salida (estándar del área de tarifas):
  Destination | HotelCode | HotelName | RoomType | SupplierCode | FromDate | ToDate
  | SGL DBL TRP QUA (bloque NETA) | SGL DBL TRP QUA (bloque GENERAL) | Currency | Includes | Notes

El estilo (colores, bordes, filtros, formatos numéricos) NO altera ningún dato:
solo cambia la presentación.
"""
import uuid
from datetime import datetime
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.plantilla import EstadoPlantilla, PlantillaGenerada
from app.models.resultado import ResultadoExtraccion

# --- Paleta corporativa (mismo azul que la UI) -----------------------------
AZUL_TITULO = "1E3A8A"
AZUL_NETA = "1D4ED8"
AZUL_GENERAL = "3B82F6"
GRIS_CEBRA = "F3F4F6"
GRIS_BORDE = "D1D5DB"
BLANCO = "FFFFFF"

FUENTE_TITULO = Font(name="Calibri", size=14, bold=True, color=BLANCO)
FUENTE_GRUPO = Font(name="Calibri", size=10, bold=True, color=BLANCO)
FUENTE_HEADER = Font(name="Calibri", size=10, bold=True, color=BLANCO)
FUENTE_DATO = Font(name="Calibri", size=10, color="111827")
FUENTE_PIE = Font(name="Calibri", size=9, italic=True, color="6B7280")

CENTRO = Alignment(horizontal="center", vertical="center", wrap_text=True)
IZQUIERDA = Alignment(horizontal="left", vertical="center")
DERECHA = Alignment(horizontal="right", vertical="center")

_lado = Side(style="thin", color=GRIS_BORDE)
BORDE = Border(left=_lado, right=_lado, top=_lado, bottom=_lado)

FMT_MONEDA = "#,##0"
FMT_FECHA = "DD/MM/YYYY"

# Columnas: (título, ancho, rol, campo). El rol define estilo/formato; el campo,
# de dónde sale el valor. Robusto a agregar/quitar columnas.
# FUERA DE ALCANCE (los completa Oppen): HotelCode, Destination, SupplierCode,
# Notes, Includes → NO se incluyen. La app solo produce datos de tarifa + HotelName.
COLUMNAS = [
    ("HotelName", 26, "texto", "hotel_name"),
    ("RoomType", 22, "texto", "room_type"),
    ("FromDate", 12, "fecha", "from_date"),
    ("ToDate", 12, "fecha", "to_date"),
    ("SGL", 10, "neta", "sgl"), ("DBL", 10, "neta", "dbl"),
    ("TRP", 10, "neta", "trp"), ("QUA", 10, "neta", "qua"),
    ("SGL", 10, "general", "sgl_gross"), ("DBL", 10, "general", "dbl_gross"),
    ("TRP", 10, "general", "trp_gross"), ("QUA", 10, "general", "qua_gross"),
    ("Currency", 10, "moneda", "currency"),
]
N_COLS = len(COLUMNAS)  # 13 (solo datos que produce la app)
FILA_HEADER = 1         # encabezados en la fila 1 (formato estándar del área)


def _parse_fecha(valor):
    if isinstance(valor, str):
        try:
            return datetime.strptime(valor[:10], "%Y-%m-%d").date()
        except ValueError:
            return valor
    return valor


def _construir_excel(datos: dict) -> openpyxl.Workbook:
    tarifas = datos.get("tarifas", [])
    contexto = {
        "hotel_name": datos.get("hotel_name", "Hotel Desconocido"),
        "hotel_code": datos.get("hotel_id", ""),
        "destination": datos.get("destination", ""),
        "currency": datos.get("currency", "USD"),
    }

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = (f"Tarifas {contexto['hotel_code']}"[:31]).strip() or "Tarifas"

    # --- Fila 1: encabezados de columna (formato estándar, sin título ni grupos) ---
    for idx, (titulo, ancho, rol, _campo) in enumerate(COLUMNAS, start=1):
        c = ws.cell(row=FILA_HEADER, column=idx, value=titulo)
        c.font = FUENTE_HEADER
        # el 2do bloque de tarifas (general) se colorea distinto para distinguirlo
        color = AZUL_GENERAL if rol == "general" else AZUL_NETA
        c.fill = PatternFill("solid", fgColor=color)
        c.alignment = CENTRO
        c.border = BORDE
        ws.column_dimensions[get_column_letter(idx)].width = ancho
    ws.row_dimensions[FILA_HEADER].height = 22

    # --- Datos ---
    fila = FILA_HEADER + 1
    for i, t in enumerate(tarifas):
        cebra = PatternFill("solid", fgColor=GRIS_CEBRA) if i % 2 else None
        for col, (_titulo, _ancho, rol, campo) in enumerate(COLUMNAS, start=1):
            if rol in ("fecha",):
                valor = _parse_fecha(t.get(campo))
            elif rol in ("neta", "general"):
                valor = t.get(campo)
            elif campo in contexto:
                valor = contexto[campo]
            else:
                valor = t.get(campo, "")
            c = ws.cell(row=fila, column=col, value=valor)
            c.font = FUENTE_DATO
            c.border = BORDE
            if cebra:
                c.fill = cebra
            if rol in ("neta", "general"):
                c.number_format = FMT_MONEDA
                c.alignment = DERECHA
            elif rol == "fecha":
                c.number_format = FMT_FECHA
                c.alignment = CENTRO
            elif rol == "moneda":
                c.alignment = CENTRO
            else:
                c.alignment = IZQUIERDA
        fila += 1

    ultima = fila - 1

    # --- Interactividad: filtro + congelar la fila de encabezados ---
    if ultima >= FILA_HEADER:
        ws.auto_filter.ref = f"A{FILA_HEADER}:{get_column_letter(N_COLS)}{max(ultima, FILA_HEADER)}"
    ws.freeze_panes = f"A{FILA_HEADER + 1}"  # congela la fila de encabezados

    return wb


def generar_plantilla_excel(resultado_id: int, db: Session) -> PlantillaGenerada:
    resultado = db.query(ResultadoExtraccion).filter_by(id_resultado=resultado_id).first()
    if not resultado:
        raise ValueError("Resultado de extracción no encontrado")

    datos = resultado.json_editado or resultado.json_ia or {}
    wb = _construir_excel(datos)

    storage_path = Path(settings.STORAGE_PLANTILLAS)
    storage_path.mkdir(parents=True, exist_ok=True)

    plantilla = db.query(PlantillaGenerada).filter_by(id_resultado=resultado_id).first()
    if plantilla:
        ruta = Path(plantilla.ruta_almacenamiento)
        wb.save(ruta)
        plantilla.fecha_generacion = func.now()
        plantilla.version += 1
    else:
        estado = db.query(EstadoPlantilla).filter_by(descripcion="GENERADA").first()
        if not estado:
            raise ValueError(
                "Estado de plantilla 'GENERADA' no encontrado. "
                "Ejecuta el seed de la base de datos (app.db.seed)."
            )
        nombre_archivo = f"plantilla_estandarizada_{resultado_id}.xlsx"
        ruta = storage_path / f"{uuid.uuid4().hex}_{nombre_archivo}"
        wb.save(ruta)
        plantilla = PlantillaGenerada(
            id_resultado=resultado_id,
            id_estado_plantilla=estado.id_estado_plantilla,
            nombre_archivo=nombre_archivo,
            ruta_almacenamiento=str(ruta),
            version=1,
        )
        db.add(plantilla)

    db.commit()
    db.refresh(plantilla)
    return plantilla
