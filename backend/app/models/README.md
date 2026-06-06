# app/models — Modelos SQLAlchemy

Contiene las clases ORM que mapean las entidades del modelo de datos a tablas de PostgreSQL.

## Archivos (a crear en Fase 2)

| Archivo | Entidades |
|---|---|
| `usuario.py` | `Usuario` |
| `documento.py` | `Documento`, `TipoDocumento`, `EstadoDocumento` |
| `resultado.py` | `ResultadoExtraccion`, `HistorialPrompt`, `ErrorDetectado` |
| `plantilla.py` | `PlantillaGenerada`, `EstadoPlantilla` |
| `revision.py` | `Revision` |

## Referencia del modelo de datos

Ver `docs/02_diseno.md` → sección "Modelo de datos" para el DER completo con todos los campos, tipos y relaciones.

## Convenciones

- Todos los modelos heredan de `Base` (declarado en `app/db/base.py`)
- Nombres de tabla en español y en plural: `usuarios`, `documentos`, `resultados_extraccion`
- Claves foráneas con sufijo `_id`: `id_usuario`, `id_documento`
