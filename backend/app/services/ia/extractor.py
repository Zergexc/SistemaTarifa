"""Llamada a GPT-4.1 con structured outputs para extraer la Capa A."""
from openai import OpenAI

from app.core.config import settings
from app.schemas.extraccion import ExtraccionIA
from app.services.ia.prompts import SYSTEM_PROMPT_EXTRACCION, build_user_prompt


class ExtraccionIAError(Exception):
    pass


def extraer(contenido: dict, consideraciones: str | None = None) -> tuple[ExtraccionIA, dict]:
    """Ejecuta la extracción. `contenido` viene de lector.leer_documento().

    Devuelve (ExtraccionIA, uso) donde uso = {"tokens_entrada", "tokens_salida"}.
    """
    if not settings.OPENAI_API_KEY:
        raise ExtraccionIAError("OPENAI_API_KEY no configurada en backend/.env")

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    if "texto" in contenido:
        user_content = build_user_prompt(contenido["texto"], consideraciones)
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT_EXTRACCION},
            {"role": "user", "content": user_content},
        ]
    else:  # imagen → visión
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT_EXTRACCION},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": build_user_prompt("(imagen adjunta)", consideraciones)},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{contenido['mime']};base64,{contenido['imagen_b64']}",
                            "detail": "high",
                        },
                    },
                ],
            },
        ]

    try:
        respuesta = client.beta.chat.completions.parse(
            model=settings.OPENAI_MODEL,
            messages=messages,
            response_format=ExtraccionIA,
            temperature=0,
        )
    except Exception as exc:  # noqa: BLE001 — se reporta el error tal cual al operario
        raise ExtraccionIAError(f"Error llamando a OpenAI: {exc}") from exc

    mensaje = respuesta.choices[0].message
    if mensaje.refusal:
        raise ExtraccionIAError(f"El modelo rechazó la extracción: {mensaje.refusal}")
    if mensaje.parsed is None:
        raise ExtraccionIAError("El modelo no devolvió JSON estructurado válido.")

    uso = {
        "tokens_entrada": respuesta.usage.prompt_tokens if respuesta.usage else None,
        "tokens_salida": respuesta.usage.completion_tokens if respuesta.usage else None,
    }
    return mensaje.parsed, uso
