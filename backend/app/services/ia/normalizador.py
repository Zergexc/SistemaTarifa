"""Normalización Capa A → Capa B (canónico).

Aquí viven las reglas de negocio deterministas. La IA solo lee el documento;
todo cálculo (IVA, comisión, rellenos, recortes de periodo) ocurre acá,
de forma auditable y reproducible.

Consideraciones especiales soportadas (texto libre del operario):
- "descontar iva"          → divide toda tarifa entre 1.21 (IVA Argentina)
- "comision 20%"           → neta = bruta x (1 - 0.20)
- "triple con cama extra"  → TRP = DBL + cama extra (cuando no hay triple)
- "desarrollo desde 06/2026" o "desde junio 2026" → recorta periodos previos
"""
import re
import unicodedata
from datetime import date, datetime, timedelta

from app.schemas.extraccion import (
    ExtraCanonico,
    ExtraccionIA,
    FilaCanonica,
    TarifarioCanonico,
    TarifasOcupacion,
)

IVA_ARGENTINA = 1.21

OCUPACION_MAP = {
    "single": "SGL", "sgl": "SGL", "individual": "SGL", "sencilla": "SGL",
    "doble": "DBL", "dbl": "DBL", "double": "DBL", "matrimonial": "DBL", "twin": "DBL",
    "triple": "TRP", "tpl": "TRP", "trp": "TRP",
    "cuadruple": "QUA", "qua": "QUA", "quad": "QUA", "quadruple": "QUA",
}

MESES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6,
    "julio": 7, "agosto": 8, "septiembre": 9, "setiembre": 9, "octubre": 10,
    "noviembre": 11, "diciembre": 12,
}


def _sin_acentos(texto: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )


def _parse_fecha(valor: str | None) -> date | None:
    if not valor:
        return None
    try:
        return datetime.strptime(valor[:10], "%Y-%m-%d").date()
    except ValueError:
        return None


def _map_ocupacion(raw: str | None) -> str | None:
    if not raw:
        return None
    clave = _sin_acentos(raw.strip().lower())
    for token, codigo in OCUPACION_MAP.items():
        if token in clave:
            return codigo
    return None


class Consideraciones:
    """Interpreta el texto libre de consideraciones del operador."""

    def __init__(self, texto: str | None):
        self.texto = _sin_acentos((texto or "").lower())

    @property
    def descontar_iva(self) -> bool:
        return "descontar iva" in self.texto or "quitar iva" in self.texto or "sin iva" in self.texto

    @property
    def comision_pct(self) -> float | None:
        m = re.search(r"comision\s*(?:de\s*)?(\d+(?:[.,]\d+)?)\s*%", self.texto)
        return float(m.group(1).replace(",", ".")) if m else None

    @property
    def triple_con_cama_extra(self) -> bool:
        return bool(re.search(r"(triple|trp).{0,25}cama\s*(extra|adicional)", self.texto)) or bool(
            re.search(r"cama\s*(extra|adicional).{0,25}(triple|trp)", self.texto)
        )

    @property
    def inicio_desarrollo(self) -> date | None:
        """'desarrollo desde 06/2026', 'desde junio 2026', 'cargar desde 2026-06-01'."""
        m = re.search(r"desde\s+(\d{4})-(\d{2})-(\d{2})", self.texto)
        if m:
            return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        m = re.search(r"desde\s+(?:el\s+)?(\d{1,2})/(\d{4})", self.texto)
        if m:
            return date(int(m.group(2)), int(m.group(1)), 1)
        m = re.search(r"desde\s+([a-z]+)\s+(?:de\s+)?(\d{4})", self.texto)
        if m and m.group(1) in MESES:
            return date(int(m.group(2)), MESES[m.group(1)], 1)
        return None


def normalizar(extraccion: ExtraccionIA, consideraciones_texto: str | None = None) -> TarifarioCanonico:
    cons = Consideraciones(consideraciones_texto)
    warnings: list[str] = list(extraccion.warnings)

    # --- 1. Agrupar filas por (habitación, periodo) y pivotar ocupaciones ---
    vig_from = extraccion.validity_from
    vig_to = extraccion.validity_to
    grupos: dict[tuple[str, str, str], FilaCanonica] = {}
    filas_triple_sueltas = []  # habitaciones llamadas "Triple" sin ocupación propia

    for fila in extraccion.rate_rows:
        f_from = fila.from_date or vig_from
        f_to = fila.to_date or vig_to
        if not f_from or not f_to:
            warnings.append(
                f"Fila '{fila.room_name_raw}' sin vigencia determinable: se omitió."
            )
            continue

        nombre_norm = _sin_acentos(fila.room_name_raw.strip().lower())
        nombre_en_norm = _sin_acentos((fila.room_name_english or "").strip().lower())
        ocupacion = _map_ocupacion(fila.occupancy_raw)

        # Habitación cuyo NOMBRE es una ocupación ("Triple", "Hab. Sgl") → se pliega después
        codigo_nombre = OCUPACION_MAP.get(nombre_norm) or OCUPACION_MAP.get(nombre_en_norm)
        if codigo_nombre and ocupacion in (None, codigo_nombre):
            filas_triple_sueltas.append((codigo_nombre, f_from, f_to, fila))
            continue

        room_type = (fila.room_name_english or fila.room_name_raw).strip()
        clave = (room_type, f_from, f_to)
        if clave not in grupos:
            grupos[clave] = FilaCanonica(
                room_type=room_type,
                room_type_source=fila.room_name_raw,
                from_date=f_from,
                to_date=f_to,
            )
        destino = grupos[clave]

        codigo = ocupacion or "DBL"  # tarifa por habitación → base doble
        if fila.price_net is not None:
            setattr(destino.net, codigo, fila.price_net)
        if fila.price_gross is not None:
            setattr(destino.gross, codigo, fila.price_gross)

    # --- 2. Plegar ocupaciones sueltas ("Triple", "Hab. Sgl") en su habitación base ---
    for codigo, f_from, f_to, fila in filas_triple_sueltas:
        candidatas = [
            g for (rt, gf, gt), g in grupos.items()
            if gf == f_from and gt == f_to
            and _sin_acentos(rt.lower()) in ("standard", "superior")
        ]
        if not candidatas and not any(
            gf == f_from and gt == f_to for (_, gf, gt) in grupos
        ):
            # El tarifario solo lista ocupaciones sin nombrar habitación
            # (ej. "Sgl/Dbl/Tpl") → se crea la habitación Standard implícita.
            clave = ("Standard", f_from, f_to)
            grupos[clave] = FilaCanonica(
                room_type="Standard",
                room_type_source=fila.room_name_raw,
                from_date=f_from,
                to_date=f_to,
            )
            candidatas = [grupos[clave]]
        if len(candidatas) == 1:
            destino = candidatas[0]
            if fila.price_net is not None:
                setattr(destino.net, codigo, fila.price_net)
            if fila.price_gross is not None:
                setattr(destino.gross, codigo, fila.price_gross)
        else:
            warnings.append(
                f"Habitación '{fila.room_name_raw}' parece una ocupación {codigo} pero no "
                "se pudo determinar a qué habitación base pertenece: revisar manualmente."
            )

    filas = list(grupos.values())

    # --- 3. Extras ---
    extras = [
        ExtraCanonico(
            concept=e.concept,
            price_gross=e.price_gross,
            price_net=e.price_net,
            commissionable=e.commissionable,
            from_date=e.from_date,
            to_date=e.to_date,
        )
        for e in extraccion.extras
    ]

    # --- 4. TRP = DBL + cama extra (solo si el operador lo pidió) ---
    camas_extra = [e for e in extras if re.search(r"cama", _sin_acentos(e.concept.lower()))]

    def _cama_extra_de(fila: FilaCanonica) -> ExtraCanonico | None:
        """Devuelve la cama extra del MISMO periodo de la fila.

        Documentos multi-temporada traen una cama extra por periodo; usar la del
        periodo equivocado da una TRP incorrecta. Si solo hay una cama extra (o
        ninguna tiene periodo), se usa esa para todos.
        """
        exactas = [e for e in camas_extra if e.from_date == fila.from_date and e.to_date == fila.to_date]
        if exactas:
            return exactas[0]
        sin_periodo = [e for e in camas_extra if e.from_date is None and e.to_date is None]
        if sin_periodo:
            return sin_periodo[0]
        if len(camas_extra) == 1:
            return camas_extra[0]
        return None

    def _es_habitacion_base(f: FilaCanonica) -> bool:
        """La regla de cama extra aplica a habitaciones base, no a suites/aparts."""
        nombre = _sin_acentos(f.room_type.lower())
        return not any(t in nombre for t in ("suite", "apart", "dpto", "departamento"))

    if cons.triple_con_cama_extra:
        if camas_extra:
            for f in filas:
                if not _es_habitacion_base(f):
                    continue
                cama_extra = _cama_extra_de(f)
                if cama_extra is None:
                    continue
                if f.net.TRP is None and f.net.DBL is not None and cama_extra.price_net is not None:
                    f.net.TRP = f.net.DBL + cama_extra.price_net
                if f.gross.TRP is None and f.gross.DBL is not None and cama_extra.price_gross is not None:
                    f.gross.TRP = f.gross.DBL + cama_extra.price_gross
        else:
            warnings.append(
                "Se pidió calcular triple con cama extra pero no se encontró cama extra en el documento."
            )
    elif camas_extra and any(f.net.TRP is None and f.gross.TRP is None for f in filas):
        warnings.append(
            "El documento tiene cama extra y hay habitaciones sin tarifa triple. "
            "Si corresponde, agregue la consideración 'calcular triple con cama extra'."
        )

    # --- 5. Descontar IVA / aplicar comisión ---
    def _aplicar(bloques_fn):
        for f in filas:
            for bloque in (f.net, f.gross):
                for campo in ("SGL", "DBL", "TRP", "QUA"):
                    v = getattr(bloque, campo)
                    if v is not None:
                        setattr(bloque, campo, bloques_fn(v))
        for e in extras:
            if e.price_net is not None:
                e.price_net = bloques_fn(e.price_net)
            if e.price_gross is not None:
                e.price_gross = bloques_fn(e.price_gross)

    if cons.descontar_iva:
        _aplicar(lambda v: v / IVA_ARGENTINA)

    if cons.comision_pct is not None:
        factor = 1 - cons.comision_pct / 100
        for f in filas:
            for campo in ("SGL", "DBL", "TRP", "QUA"):
                bruto = getattr(f.gross, campo)
                if bruto is not None and getattr(f.net, campo) is None:
                    setattr(f.net, campo, round(bruto * factor, 2))

    # --- 6. SGL = DBL cuando no hay tarifa single (y viceversa) ---
    for f in filas:
        for bloque in (f.net, f.gross):
            if bloque.SGL is None and bloque.DBL is not None:
                bloque.SGL = bloque.DBL
            elif bloque.DBL is None and bloque.SGL is not None:
                bloque.DBL = bloque.SGL

    # --- 7. Recorte al inicio de desarrollo (consideración o fecha del documento) ---
    inicio = cons.inicio_desarrollo
    if inicio is None:
        doc_date = _parse_fecha(extraccion.document_date)
        if doc_date:
            inicio = doc_date.replace(day=1)
    if inicio:
        recortadas: list[FilaCanonica] = []
        for f in filas:
            f_to = _parse_fecha(f.to_date)
            f_from = _parse_fecha(f.from_date)
            if f_to and f_to < inicio:
                warnings.append(
                    f"Periodo {f.from_date} a {f.to_date} de '{f.room_type}' es anterior "
                    f"al inicio de desarrollo ({inicio}): se descartó."
                )
                continue
            if f_from and f_from < inicio:
                f.from_date = inicio.isoformat()
            recortadas.append(f)
        filas = recortadas

    # --- 8. Validar continuidad de periodos por habitación ---
    por_room: dict[str, list[FilaCanonica]] = {}
    for f in filas:
        por_room.setdefault(f.room_type, []).append(f)
    for room, lista in por_room.items():
        lista.sort(key=lambda f: f.from_date)
        for ant, sig in zip(lista, lista[1:]):
            fin = _parse_fecha(ant.to_date)
            inicio_sig = _parse_fecha(sig.from_date)
            if fin and inicio_sig:
                if inicio_sig > fin + timedelta(days=1):
                    warnings.append(
                        f"Hueco en '{room}': {ant.to_date} → {sig.from_date} sin tarifa."
                    )
                elif inicio_sig <= fin:
                    warnings.append(
                        f"Solape en '{room}': {sig.from_date} inicia antes de que termine {ant.to_date}."
                    )

    filas.sort(key=lambda f: (f.from_date, f.room_type))

    # --- 9. Etiqueta Includes ---
    includes = "Accommodation Only"
    if "breakfast" in extraccion.meals_included:
        includes = "Accommodation and Breakfast"
    if "half_board" in extraccion.meals_included:
        includes = "Accommodation and Half Board"
    if "full_board" in extraccion.meals_included:
        includes = "Accommodation and Full Board"

    return TarifarioCanonico(
        hotel_name_detected=extraccion.hotel_name,
        document_date=extraccion.document_date,
        currency=extraccion.currency_iso or extraccion.currency_raw,
        includes_label=includes,
        taxes_included=extraccion.taxes_included,
        filas=filas,
        extras=extras,
        warnings=warnings,
    )
