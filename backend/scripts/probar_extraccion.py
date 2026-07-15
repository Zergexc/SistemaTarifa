# -*- coding: utf-8 -*-
"""Harness de pruebas del pipeline de extracción IA contra casos reales.

Corre el pipeline (lector → GPT-4.1 → normalizador) sobre los tarifarios de
prueba y compara el resultado canónico contra el Excel esperado, celda por celda.

Uso (desde backend/):
    python scripts/probar_extraccion.py            # todos los casos
    python scripts/probar_extraccion.py wilson     # un caso puntual

Requiere OPENAI_API_KEY en backend/.env y los archivos de prueba en CARPETA_CASOS.
"""
import io
import sys
from datetime import datetime
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import openpyxl  # noqa: E402

from app.services.ia import lector, normalizador  # noqa: E402
from app.services.ia.extractor import extraer  # noqa: E402

CARPETA_CASOS = Path(r"C:\Users\Zerge\Desktop\tarifas")

# Cada caso: documentos fuente + consideraciones del operario + Excel esperado.
CASOS = {
    "territorio": {
        "documentos": ["Tarifario 2026-2027 Hotel Territorio.pdf"],
        "consideraciones": "Desarrollo desde junio 2026.",
        "esperado": "ARPMYAC0009 - Hotel Territorio - JUN26 to JUN27.xlsx",
    },
    "wilson": {
        "documentos": [
            "desde el 01-04-26 hasta 30-06-26.pdf",
            "01-07-26 hasta 31-12-26.pdf",
        ],
        "consideraciones": "Descontar IVA. Calcular triple con cama extra.",
        "esperado": "ARSALAC0030 - Wilson Apart hotel - ABR26 to DIC26.xlsx",
    },
    "eclaireurs": {
        "documentos": ["Tarifas.msg"],
        "consideraciones": None,
        "esperado": "ARUSHAC0024 - Les Eclaireurs - JUL26 to JUN27.xlsx",
    },
    # Caso de visión: guardar la imagen del tarifario como Monaco.png en CARPETA_CASOS
    "monaco": {
        "documentos": ["Monaco.png"],
        "consideraciones": "Desarrollo desde junio 2026.",
        "esperado": "ARUSHAC0051 - Hotel Monaco - JUN26 to JUL27.xlsx",
    },
}

TOLERANCIA = 0.01


def leer_esperado(path: Path) -> list[dict]:
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb["Tarifas"]
    filas = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or row[3] is None:
            continue
        filas.append(
            {
                "room_type": str(row[3]).strip(),
                "from_date": _fecha(row[5]),
                "to_date": _fecha(row[6]),
                "net": {"SGL": row[7], "DBL": row[8], "TRP": row[9], "QUA": row[10]},
                "gross": {"SGL": row[11], "DBL": row[12], "TRP": row[13], "QUA": row[14]},
                "currency": row[15],
            }
        )
    wb.close()
    return filas


def _fecha(v) -> str | None:
    if isinstance(v, datetime):
        return v.date().isoformat()
    return str(v)[:10] if v else None


def _num(v) -> float | None:
    return None if v in (None, "") else round(float(v), 2)


def comparar_bloque(esperado: dict, obtenido) -> list[str]:
    difs = []
    for campo in ("SGL", "DBL", "TRP", "QUA"):
        e = _num(esperado[campo])
        o = _num(getattr(obtenido, campo))
        if e is None and o is None:
            continue
        if e is None or o is None or abs(e - o) > TOLERANCIA:
            difs.append(f"{campo}: esperado={e} obtenido={o}")
    return difs


def correr_caso(nombre: str, caso: dict) -> bool:
    print(f"\n{'=' * 70}\nCASO: {nombre.upper()}")
    print(f"Consideraciones: {caso['consideraciones'] or '(ninguna)'}")

    # Procesar cada documento fuente y acumular filas canónicas
    filas_obtenidas = []
    warnings = []
    for doc_nombre in caso["documentos"]:
        ruta = CARPETA_CASOS / doc_nombre
        print(f"\n  Procesando: {doc_nombre}")
        contenido = lector.leer_documento(str(ruta))
        capa_a, uso = extraer(contenido, caso["consideraciones"])
        canonico = normalizador.normalizar(capa_a, caso["consideraciones"])
        print(f"    tokens: {uso['tokens_entrada']}+{uso['tokens_salida']}  "
              f"filas: {len(canonico.filas)}  moneda: {canonico.currency}")
        filas_obtenidas.extend(canonico.filas)
        warnings.extend(canonico.warnings)

    for w in warnings:
        print(f"    [warning] {w}")

    # Comparar contra el Excel esperado
    esperadas = leer_esperado(CARPETA_CASOS / caso["esperado"])
    print(f"\n  Esperadas: {len(esperadas)} filas | Obtenidas: {len(filas_obtenidas)} filas")

    ok = True
    usadas = set()
    for exp in esperadas:
        # Si el Excel esperado dejó el bloque bruta vacío, no se compara
        # (el encargado solo carga la neta en algunos casos; la bruta es referencial).
        comparar_gross = any(exp["gross"][c] is not None for c in ("SGL", "DBL", "TRP", "QUA"))

        # buscar fila obtenida con mismo periodo y tarifas coincidentes
        candidata = None
        for i, obt in enumerate(filas_obtenidas):
            if i in usadas:
                continue
            if obt.from_date == exp["from_date"] and obt.to_date == exp["to_date"]:
                difs = comparar_bloque(exp["net"], obt.net)
                if comparar_gross:
                    difs += comparar_bloque(exp["gross"], obt.gross)
                if not difs:
                    candidata = (i, obt, [])
                    break
                if candidata is None:
                    candidata = (i, obt, difs)
        etiqueta = f"{exp['room_type']} [{exp['from_date']} → {exp['to_date']}]"
        if candidata is None:
            print(f"  ✗ {etiqueta}: SIN FILA para ese periodo")
            ok = False
        else:
            i, obt, difs = candidata
            usadas.add(i)
            if difs:
                print(f"  ✗ {etiqueta} (comparada con '{obt.room_type}'):")
                for d in difs:
                    print(f"      {d}")
                ok = False
            else:
                nota = "" if obt.room_type == exp["room_type"] else f"  (nombre IA: '{obt.room_type}')"
                print(f"  ✓ {etiqueta}{nota}")

    sobrantes = [f for i, f in enumerate(filas_obtenidas) if i not in usadas]
    for f in sobrantes:
        print(f"  ⚠ Fila extra no esperada: {f.room_type} [{f.from_date} → {f.to_date}]")

    print(f"\n  RESULTADO: {'✅ PASA' if ok else '❌ FALLA'}")
    return ok


def main():
    filtro = sys.argv[1].lower() if len(sys.argv) > 1 else None
    casos = {k: v for k, v in CASOS.items() if filtro is None or k == filtro}
    # Omitir casos cuyos documentos fuente no existen todavía
    for nombre in list(casos):
        faltantes = [d for d in casos[nombre]["documentos"] if not (CARPETA_CASOS / d).exists()]
        if faltantes:
            print(f"[omitido] {nombre}: falta {', '.join(faltantes)} en {CARPETA_CASOS}")
            del casos[nombre]
    if not casos:
        print(f"Caso desconocido: {filtro}. Disponibles: {', '.join(CASOS)}")
        sys.exit(1)

    resultados = {nombre: correr_caso(nombre, caso) for nombre, caso in casos.items()}

    print(f"\n{'=' * 70}\nRESUMEN")
    for nombre, paso in resultados.items():
        print(f"  {'✅' if paso else '❌'} {nombre}")
    sys.exit(0 if all(resultados.values()) else 1)


if __name__ == "__main__":
    main()
