"""Schemas del pipeline de extracción IA.

Capa A (ExtraccionIA): lo que devuelve GPT-4.1, fiel al documento.
Capa B (TarifarioCanonico): resultado normalizado por reglas de negocio,
mapea 1:1 al Excel estándar de salida.
"""
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Capa A — extracción cruda (structured output de GPT-4.1)
# ---------------------------------------------------------------------------

class FilaTarifaIA(BaseModel):
    """Una tarifa puntual: habitación + ocupación + periodo + precio(s)."""
    room_name_raw: str = Field(description="Nombre de la habitación tal cual aparece en el documento")
    room_name_english: str | None = Field(description="Nombre propuesto en inglés para el catálogo (ej. Family Suite)")
    occupancy_raw: str | None = Field(description="Ocupación tal cual el documento: SINGLE, DOBLE, TRIPLE, CUADRUPLE, o null si la tarifa es por habitación")
    from_date: str | None = Field(description="Inicio de vigencia ISO YYYY-MM-DD de esta tarifa, null si aplica la vigencia global del documento")
    to_date: str | None = Field(description="Fin de vigencia ISO YYYY-MM-DD, null si aplica la global")
    price_gross: float | None = Field(description="Tarifa mostrador/público/bruta si el documento la indica")
    price_net: float | None = Field(description="Tarifa neta/agencia si el documento la indica")


class ExtraIA(BaseModel):
    """Conceptos tarifarios que no son habitaciones (cama extra, cuna, etc.)."""
    concept: str
    price_gross: float | None
    price_net: float | None
    commissionable: bool | None = Field(description="False si el documento dice 'no comisionable', null si no se indica")
    from_date: str | None = Field(description="Inicio de vigencia ISO YYYY-MM-DD del periodo al que pertenece este concepto (ej. la cama extra de esa temporada). null si aplica a todo el documento")
    to_date: str | None = Field(description="Fin de vigencia ISO YYYY-MM-DD del periodo al que pertenece este concepto. null si aplica a todo el documento")


class ExtraccionIA(BaseModel):
    """Salida estructurada de GPT-4.1: SOLO lo que dice el documento."""
    hotel_name: str | None = Field(description="Nombre del hotel según el documento")
    document_date: str | None = Field(description="Fecha de emisión del documento ISO YYYY-MM-DD (día 01 si solo hay mes)")
    market_segment: str | None = Field(description="Segmento si se indica: turismo internacional, operadores, etc.")
    currency_raw: str | None = Field(description="Moneda tal cual aparece: AR$, USD, U$D, $, etc.")
    currency_iso: str | None = Field(description="Moneda normalizada ISO 4217: ARS, USD, etc.")
    rate_type: str | None = Field(description="'net' si el documento dice tarifas netas, 'gross' si mostrador/público, 'both' si trae ambas columnas")
    taxes_note: str | None = Field(description="Texto literal sobre impuestos: 'NO INCLUYE IVA', 'incluye impuestos', 'netas de IVA'...")
    taxes_included: bool | None = Field(description="True si las tarifas incluyen impuestos, False si no, null si no se indica")
    validity_from: str | None = Field(description="Inicio de vigencia global del tarifario ISO YYYY-MM-DD")
    validity_to: str | None = Field(description="Fin de vigencia global ISO YYYY-MM-DD")
    meals_included: list[str] = Field(description="Comidas incluidas: breakfast, half_board, full_board")
    rate_rows: list[FilaTarifaIA]
    extras: list[ExtraIA]
    warnings: list[str] = Field(description="Ambigüedades o datos dudosos detectados durante la extracción")


# ---------------------------------------------------------------------------
# Capa B — canónico normalizado (persistido en json_ia, mapea al Excel)
# ---------------------------------------------------------------------------

class TarifasOcupacion(BaseModel):
    SGL: float | None = None
    DBL: float | None = None
    TRP: float | None = None
    QUA: float | None = None


class FilaCanonica(BaseModel):
    """Una fila del Excel estándar: RoomType x periodo."""
    room_type: str
    room_type_source: str
    from_date: str
    to_date: str
    net: TarifasOcupacion = Field(default_factory=TarifasOcupacion)
    gross: TarifasOcupacion = Field(default_factory=TarifasOcupacion)


class ExtraCanonico(BaseModel):
    concept: str
    price_gross: float | None = None
    price_net: float | None = None
    commissionable: bool | None = None
    from_date: str | None = None
    to_date: str | None = None


class TarifarioCanonico(BaseModel):
    hotel_name_detected: str | None = None
    document_date: str | None = None
    currency: str | None = None
    includes_label: str = "Accommodation Only"
    taxes_included: bool | None = None
    filas: list[FilaCanonica] = []
    extras: list[ExtraCanonico] = []
    warnings: list[str] = []


class ResultadoPipeline(BaseModel):
    """Lo que se guarda en ResultadoExtraccion.json_ia."""
    capa_a: ExtraccionIA
    canonico: TarifarioCanonico
