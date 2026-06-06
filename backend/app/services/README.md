# app/services — Lógica de negocio

Contiene toda la lógica de negocio del sistema. Los routers delegan aquí; los servicios no conocen HTTP.

## Archivos (a crear en Fases 4, 5 y 6)

| Archivo | Fase | Responsabilidad |
|---|---|---|
| `auth_service.py` | 4 | Verificación de credenciales, emisión y validación de JWT |
| `usuario_service.py` | 4 | CRUD de usuarios, hash de contraseñas |
| `documento_service.py` | 4 | Registro de documentos, gestión de estados, almacenamiento de archivos |
| `extractor_service.py` | 5 | Extracción de datos según tipo: Pandas / pdfplumber / python-docx / OCR |
| `ia_service.py` | 5 | Preprocesamiento, llamada a OpenAI, almacenamiento de `json_ia` |
| `inconsistencia_service.py` | 5 | Detección de errores en backend, validaciones básicas |
| `plantilla_service.py` | 6 | Generación de Excel con OpenPyXL, versionado de plantillas |
| `revision_service.py` | 6 | Registro de aprobaciones y rechazos, actualización de estados |

## Flujo de procesamiento (Fase 5)

```
extractor_service  →  ia_service  →  inconsistencia_service
      │                   │                    │
 Extrae texto       Llama OpenAI          Valida campos
 según tipo         Guarda json_ia        Guarda errores
```

El procesamiento se ejecuta en background para soportar el patrón de polling del frontend.
