# app/schemas — Modelos Pydantic

Contiene los esquemas de validación de requests y serialización de responses usando Pydantic v2.

## Archivos (a crear en Fase 4)

| Archivo | Esquemas |
|---|---|
| `auth.py` | `LoginRequest`, `TokenResponse` |
| `usuario.py` | `UsuarioCreate`, `UsuarioResponse`, `UsuarioUpdate` |
| `documento.py` | `DocumentoResponse`, `ProcesamientoRequest` |
| `resultado.py` | `ResultadoResponse`, `EdicionManualRequest` |
| `error.py` | `ErrorDetectadoResponse`, `ResolverErrorRequest` |
| `plantilla.py` | `PlantillaResponse`, `PlantillaListResponse` |
| `revision.py` | `RevisionCreate`, `RevisionResponse` |

## Convención de nombres

- `*Create` — datos requeridos para crear un recurso (request body en POST)
- `*Update` / `*Request` — datos para modificar o accionar sobre un recurso
- `*Response` — datos retornados al cliente (response body)

## Ejemplo

```python
class DocumentoResponse(BaseModel):
    id_documento: int
    nombre_archivo: str
    estado: str
    fecha_carga: datetime

    model_config = ConfigDict(from_attributes=True)
```

El `from_attributes=True` permite que Pydantic lea directamente desde los modelos SQLAlchemy.
