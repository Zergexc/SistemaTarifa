"""Orquestador del pipeline de extracción: documento → IA → validación → BD.

Estructura del flujo (la que usa el frontend con polling):
    procesar_documento_completo(documento_id, db, consideraciones)
        → lector (PDF/msg/Excel/Word/imagen)
        → GPT-4.1 structured outputs (Capa A, fiel al documento)
        → normalizador (reglas de negocio: IVA, comisión, SGL=DBL, periodos)
        → mapeo a formato plano {hotel_name, currency, tarifas[]} para la UI
        → motor de validación (solapes, huecos, tarifas vacías → ErrorDetectado)
"""
import re
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.documento import Documento, EstadoDocumento
from app.models.resultado import ErrorDetectado, HistorialPrompt, ResultadoExtraccion
from app.schemas.extraccion import TarifarioCanonico
from app.services.ia import lector, normalizador
from app.services.ia.extractor import extraer


# --- Mapeo del canónico al formato plano que consume la UI -----------------

def _canonico_a_flat(canonico: TarifarioCanonico) -> dict:
    """Aplana el canónico al JSON que edita el operario en la pestaña Validación.

    Las tarifas visibles son las NETAS (costo real para la agencia); si el
    documento solo trae brutas sin comisión conocida, se usan las brutas.
    """
    tarifas = []
    for f in canonico.filas:
        # El operario edita la NETA (sgl/dbl/trp/qua); la BRUTA/general
        # (sgl_gross/...) viaja aparte, es referencial y va al 2do bloque del Excel.
        tarifas.append(
            {
                "room_type": f.room_type,
                "from_date": f.from_date,
                "to_date": f.to_date,
                "sgl": f.net.SGL,
                "dbl": f.net.DBL,
                "trp": f.net.TRP,
                "qua": f.net.QUA,
                "sgl_gross": f.gross.SGL,
                "dbl_gross": f.gross.DBL,
                "trp_gross": f.gross.TRP,
                "qua_gross": f.gross.QUA,
                "includes": canonico.includes_label,
            }
        )
    return {
        "hotel_name": canonico.hotel_name_detected or "Hotel Desconocido",
        "currency": canonico.currency or "USD",
        "destination": "",
        "supplier_code": "",
        "tarifas": tarifas,
        "extras": [e.model_dump() for e in canonico.extras],
        "warnings": canonico.warnings,
    }


# HotelCode, Destination, SupplierCode, Notes e Includes están FUERA DE ALCANCE:
# son datos exclusivos del sistema Oppen. La app no los genera ni valida; los deja
# vacíos y Oppen los completa. Aquí solo producimos los datos de tarifa.


def _calcular_confianza(datos: dict) -> float:
    """Heurística: baja con cada warning y con campos clave faltantes."""
    confianza = 1.0
    confianza -= 0.08 * len(datos.get("warnings", []))
    if not datos.get("currency"):
        confianza -= 0.15
    if not datos.get("tarifas"):
        confianza -= 0.5
    return round(max(0.0, min(1.0, confianza)), 2)


# --- Motor de Validación ----------------------------------------------------

def validar_datos_extraidos(datos_json: dict, resultado_id: int, db: Session) -> list[ErrorDetectado]:
    incidencias = []

    tarifas = datos_json.get("tarifas", [])

    # Advertencias del pipeline de extracción (ambigüedades detectadas)
    for w in datos_json.get("warnings", []):
        incidencias.append(ErrorDetectado(
            id_resultado=resultado_id,
            tipo_error="ADVERTENCIA_EXTRACCION",
            campo_afectado=None,
            valor_detectado=None,
            descripcion=w,
            severidad="MEDIA",
        ))

    # Agrupamos tarifas por room_type para verificar solapamiento y continuidad
    tarifas_por_room = {}
    for index, t in enumerate(tarifas):
        rt = (t.get("room_type") or "").strip()
        if not rt:
            continue
        tarifas_por_room.setdefault(rt, []).append((index, t))

    for room_type, items in tarifas_por_room.items():
        parsed_items = []
        for index, item in items:
            fd_str = item.get("from_date")
            td_str = item.get("to_date")
            try:
                fd = datetime.strptime(fd_str, "%Y-%m-%d")
                td = datetime.strptime(td_str, "%Y-%m-%d")
                parsed_items.append((index, fd, td, item))
            except (ValueError, TypeError):
                incidencias.append(ErrorDetectado(
                    id_resultado=resultado_id,
                    tipo_error="FORMATO_FECHA_INVALIDO",
                    campo_afectado=f"tarifas[{index}].from_date / to_date",
                    valor_detectado=f"from: {fd_str}, to: {td_str}",
                    descripcion=f"Habitación '{room_type}': Rango de fechas no tiene formato YYYY-MM-DD válido.",
                    severidad="ALTA",
                ))

        parsed_items.sort(key=lambda x: x[1])

        # Validar continuidad y solapamientos
        for i in range(len(parsed_items) - 1):
            curr_idx, curr_fd, curr_td, curr_item = parsed_items[i]
            next_idx, next_fd, next_td, next_item = parsed_items[i + 1]

            if next_fd < curr_td:
                incidencias.append(ErrorDetectado(
                    id_resultado=resultado_id,
                    tipo_error="FECHAS_SOLAPADAS",
                    campo_afectado=f"tarifas[{curr_idx}] y tarifas[{next_idx}]",
                    valor_detectado=f"({curr_item.get('from_date')} a {curr_item.get('to_date')}) vs ({next_item.get('from_date')} a {next_item.get('to_date')})",
                    descripcion=f"Habitación '{room_type}': Las fechas de vigencia se solapan.",
                    severidad="ALTA",
                ))

            diferencia = next_fd - curr_td
            if diferencia > timedelta(days=1):
                incidencias.append(ErrorDetectado(
                    id_resultado=resultado_id,
                    tipo_error="BRECHA_FECHAS_DETECTADA",
                    campo_afectado=f"tarifas[{curr_idx}] y tarifas[{next_idx}]",
                    valor_detectado=f"Brecha del {curr_item.get('to_date')} al {next_item.get('from_date')}",
                    descripcion=f"Habitación '{room_type}': Hay un hueco de {diferencia.days - 1} días entre vigencias ({curr_item.get('to_date')} y {next_item.get('from_date')}).",
                    severidad="ALTA",
                ))

        # Validar precios obligatorios
        for index, fd, td, item in parsed_items:
            if all(item.get(c) is None for c in ("sgl", "dbl", "trp", "qua")):
                incidencias.append(ErrorDetectado(
                    id_resultado=resultado_id,
                    tipo_error="TARIFA_VACIA",
                    campo_afectado=f"tarifas[{index}]",
                    valor_detectado="SGL, DBL, TRP, QUA nulos",
                    descripcion=f"Habitación '{room_type}' ({item.get('from_date')} a {item.get('to_date')}): No tiene ningún precio registrado.",
                    severidad="MEDIA",
                ))

    for err in incidencias:
        db.add(err)
    db.commit()
    return incidencias


# --- Procesador Principal ----------------------------------------------------

def procesar_documento_completo(
    documento_id: int,
    db: Session,
    consideraciones: str | None = None,
    usuario_id: int | None = None,
) -> dict:
    doc = db.query(Documento).filter(Documento.id_documento == documento_id).first()
    if not doc:
        raise ValueError("Documento no encontrado")

    estado_procesando = db.query(EstadoDocumento).filter_by(descripcion="PROCESANDO").first()
    doc.id_estado_documento = estado_procesando.id_estado_documento
    db.commit()

    try:
        # 1. Leer documento (PDF con tablas, .msg, Excel, Word; imagen → visión)
        contenido = lector.leer_documento(doc.ruta_almacenamiento)

        # 2. Extracción con GPT-4.1 (Capa A) + reglas de negocio (canónico)
        capa_a, uso = extraer(contenido, consideraciones)
        canonico = normalizador.normalizar(capa_a, consideraciones)

        # 3. Aplanar al formato que edita el operario.
        #    HotelCode/Destination quedan vacíos (los completa Oppen, fuera de alcance).
        res_dict = _canonico_a_flat(canonico)
        res_dict["hotel_id"] = ""
        res_dict["destination"] = ""

        # 4. Guardar Resultado en BD
        iteracion = (
            db.query(ResultadoExtraccion).filter_by(id_documento=documento_id).count() + 1
        )
        resultado = ResultadoExtraccion(
            id_documento=doc.id_documento,
            texto_extraido=contenido.get("texto"),
            json_ia=res_dict,
            json_editado=res_dict,  # Por defecto editado inicia igual al de la IA
            modelo_ia_usado=settings.OPENAI_MODEL,
            tokens_entrada=uso.get("tokens_entrada") or 0,
            tokens_salida=uso.get("tokens_salida") or 0,
            nivel_confianza=_calcular_confianza(res_dict),
            numero_iteracion=iteracion,
        )
        db.add(resultado)
        db.commit()
        db.refresh(resultado)

        # 5. Registrar consideraciones del operario para auditoría
        if consideraciones and usuario_id:
            db.add(HistorialPrompt(
                id_documento=doc.id_documento,
                id_resultado=resultado.id_resultado,
                texto_prompt=consideraciones,
                id_usuario=usuario_id,
            ))
            db.commit()

        # 6. Correr validador
        validar_datos_extraidos(res_dict, resultado.id_resultado, db)

        # 7. Cambiar estado a PROCESADO
        estado_procesado = db.query(EstadoDocumento).filter_by(descripcion="PROCESADO").first()
        doc.id_estado_documento = estado_procesado.id_estado_documento
        db.commit()

        return res_dict

    except Exception as e:
        estado_error = db.query(EstadoDocumento).filter_by(descripcion="ERROR_PROCESAMIENTO").first()
        doc.id_estado_documento = estado_error.id_estado_documento
        db.commit()
        raise e
