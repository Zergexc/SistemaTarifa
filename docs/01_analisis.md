# Análisis del Sistema — TarifaIA

## 1. Visión

### El problema

Los equipos que trabajan con múltiples proveedores reciben tarifarios en formatos distintos: Excel, PDF, Word e imágenes escaneadas. Cada proveedor usa su propia estructura. El proceso de convertirlos manualmente a una plantilla corporativa estándar es lento, propenso a errores y sin trazabilidad.

### La solución

TarifaIA automatiza ese proceso: el usuario carga un documento, la IA extrae y estandariza la información, detecta inconsistencias, y genera una plantilla Excel lista para carga empresarial. Todo con historial de revisiones y auditoría.

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite |
| Backend | Python FastAPI |
| Base de datos | PostgreSQL |
| IA | OpenAI GPT-4.1 (configurable vía `OPENAI_MODEL`) |
| Extracción | Pandas, pdfplumber, python-docx, EasyOCR |
| Generación Excel | OpenPyXL |
| Auth | JWT con usuario y contraseña propios |

### Roles del sistema

| Rol | Qué puede hacer |
|---|---|
| **Operador** | Cargar documentos, ejecutar procesamiento, editar resultados, generar plantillas |
| **Revisor** | Aprobar o rechazar plantillas, registrar observaciones |
| **Administrador** | Gestionar usuarios y cuentas |

---

## 2. Requisitos funcionales

Organizados por módulo. Solo se listan las funciones que serán implementadas en el MVP.

### Autenticación
- Login con correo y contraseña → emisión de token JWT
- Control de acceso por rol en todos los endpoints
- El administrador puede activar o desactivar cuentas

### Carga de documentos
- Formatos aceptados: `.xlsx`, `.xls`, `.pdf`, `.docx`, `.jpg`, `.png`
- Validación de formato y tamaño antes de aceptar
- Registro del documento: nombre, tipo, tamaño, usuario y fecha de carga
- Estado inicial: `CARGADO`
- Si el Excel tiene múltiples hojas → el usuario selecciona cuáles procesar

### Procesamiento con IA
- Extracción automática según tipo: Pandas / pdfplumber / python-docx / OCR
- Preprocesamiento en backend antes de llamar a OpenAI (control de tokens)
- OpenAI transforma los datos a un JSON canónico estandarizado con nivel de confianza
- El JSON generado por la IA (`json_ia`) se almacena de forma inmutable
- El operador puede editar la tabla → se guarda como `json_editado` (el `json_ia` no se toca)
- El operador puede enviar prompts adicionales en texto libre para refinar el resultado
- Cada prompt genera una nueva iteración de procesamiento y queda registrado en el historial
- La iteración activa se identifica con `es_vigente = true`

### Detección de inconsistencias
- La IA detecta anomalías contextuales (valores fuera de rango, datos sospechosos)
- El backend valida: campos obligatorios, nulos, formatos inválidos, duplicados
- Cada inconsistencia tiene severidad: `INFO` / `WARNING` / `ERROR`

### Vista previa
- Tabla editable con los datos extraídos
- Celdas resaltadas según severidad de inconsistencias
- Resumen de inconsistencias y nivel de confianza visible

### Generación de plantilla Excel
- Se usa `json_editado` si existe, sino `json_ia`
- No se puede generar si hay inconsistencias `ERROR` sin resolver
- Si existe plantilla corporativa base → se completa; si no → se genera desde cero
- Soporte de versionado: si una plantilla es rechazada, la nueva versión referencia a la anterior
- Estado tras generación: `PENDIENTE_REVISION`

### Revisión y aprobación
- El revisor ve la cola de plantillas `PENDIENTE_REVISION`
- Puede aprobar (comentario opcional) o rechazar (comentario obligatorio)
- Al rechazar, el operador puede corregir y generar una nueva versión sin recargar el documento
- Todas las revisiones quedan registradas con usuario, decisión, comentario y fecha

### Trazabilidad
- Historial de documentos con estado actual
- Historial de iteraciones por documento
- Historial de revisiones por plantilla
- Descarga de plantillas aprobadas

---

## 3. Requisitos no funcionales

| # | Requisito |
|---|---|
| RNF-01 | Contraseñas almacenadas con bcrypt. Variables sensibles solo en `.env` |
| RNF-02 | Procesamiento asíncrono con polling (no WebSockets en el MVP) |
| RNF-03 | Modelo de IA configurable vía `OPENAI_MODEL` sin tocar el código |
| RNF-04 | Almacenamiento de archivos en ruta local configurable (migrable a S3/MinIO) |
| RNF-05 | Arquitectura en capas: API → Servicios → Modelos → BD |
| RNF-06 | API REST con Swagger/OpenAPI generado automáticamente por FastAPI |
| RNF-07 | Ejecutable en local con Docker Compose |

### Fuera del MVP
No se implementará en esta versión: notificaciones por email, conversión de monedas, integración directa con el sistema destino, SSO, despliegue productivo, WebSockets.

---

## 4. Flujo principal del sistema

```
Operador carga documento
        │
        ▼
¿Excel con múltiples hojas?
  Sí → usuario selecciona hojas
        │
        ▼
Backend extrae datos (Pandas / pdfplumber / python-docx / OCR)
        │
        ▼
OpenAI genera JSON canónico + nivel de confianza
        │
        ▼
Backend detecta inconsistencias → las clasifica (INFO / WARNING / ERROR)
        │
        ▼
Vista previa: tabla editable + resumen de inconsistencias
        │
   ┌────┴────────────────────────┐
   │                             │
Operador edita         Operador agrega prompt
tabla manualmente      adicional → nueva iteración
   │                             │
   └────────────┬────────────────┘
                ▼
   Operador aprueba resultado
                │
                ▼
   Sistema genera plantilla Excel
                │
                ▼
   Revisor aprueba o rechaza
     │                  │
  APROBADA          RECHAZADA
  (disponible        (operador corrige
   para descarga)     → nueva versión)
```

---

## 5. Casos de uso principales

### UC-01 — Cargar y procesar documento
**Actor:** Operador
1. Carga el archivo → sistema valida formato y tamaño
2. Si Excel con múltiples hojas → selecciona hojas a procesar
3. Inicia el procesamiento → estado cambia a `PROCESANDO`
4. Backend extrae datos → OpenAI genera JSON canónico
5. Sistema detecta inconsistencias y actualiza estado a `PROCESADO`
6. Frontend detecta el fin por polling y muestra la vista previa

**Error:** Si falla extracción u OpenAI → estado `ERROR_PROCESAMIENTO`, se puede reintentar

---

### UC-02 — Revisar y ajustar resultado
**Actor:** Operador
1. Ve la tabla editable con inconsistencias resaltadas
2. Puede editar celdas directamente → se guarda en `json_editado` (el `json_ia` no cambia)
3. Puede escribir instrucciones adicionales en texto libre → sistema reprocesa con OpenAI
4. Cada reprocesamiento genera una nueva iteración con número incremental

---

### UC-03 — Generar plantilla Excel
**Actor:** Operador
1. Con el resultado aprobado, solicita generar la plantilla
2. El sistema bloquea la acción si hay inconsistencias `ERROR` sin resolver
3. Genera el Excel y lo almacena → estado `PENDIENTE_REVISION`

---

### UC-04 — Revisar y aprobar plantilla
**Actor:** Revisor
1. Ve la cola de plantillas `PENDIENTE_REVISION`
2. Revisa el contenido y las inconsistencias detectadas
3. **Aprueba** → estado `APROBADA`, disponible para descarga
4. **Rechaza** → debe ingresar comentario obligatorio, estado `RECHAZADA`
5. El operador ve el motivo y puede generar una nueva versión (referenciando a la rechazada)

---

### UC-05 — Gestionar usuarios
**Actor:** Administrador
1. Crea usuarios con nombre, correo, contraseña y rol asignado
2. Activa o desactiva cuentas existentes
3. Un usuario desactivado no puede iniciar sesión

---

## 6. Historias de usuario

### HU-01 — Cargar documento

**Como** operador, **quiero** cargar un tarifario en cualquier formato soportado, **para** iniciar el procesamiento automático.

**Criterios de aceptación:**
- [ ] Acepta .xlsx, .xls, .pdf, .docx, .jpg, .png
- [ ] Rechaza otros formatos con mensaje claro
- [ ] Registra el documento con usuario, fecha y estado `CARGADO`

---

### HU-02 — Seleccionar hojas de Excel

**Como** operador, **quiero** elegir qué hojas de un Excel procesar, **para** evitar enviar información irrelevante a la IA.

**Criterios de aceptación:**
- [ ] El sistema detecta y lista las hojas disponibles
- [ ] Solo las hojas seleccionadas se envían a extracción
- [ ] Si hay una sola hoja, se procesa automáticamente sin preguntar

---

### HU-03 — Procesar documento con IA

**Como** operador, **quiero** que el sistema extraiga y estandarice automáticamente la información del tarifario, **para** obtener un JSON canónico sin trabajo manual.

**Criterios de aceptación:**
- [ ] El sistema selecciona la estrategia de extracción según el tipo de archivo
- [ ] OpenAI devuelve un JSON canónico con nivel de confianza
- [ ] El `json_ia` se almacena de forma inmutable
- [ ] El frontend detecta el fin del procesamiento por polling
- [ ] En caso de error, el estado cambia a `ERROR_PROCESAMIENTO` con descripción

---

### HU-04 — Ver resultado con inconsistencias resaltadas

**Como** operador, **quiero** ver los datos extraídos en una tabla con indicadores visuales de problemas, **para** identificar rápidamente qué necesita corrección.

**Criterios de aceptación:**
- [ ] Tabla editable con datos del JSON canónico
- [ ] Celdas con problemas resaltadas por severidad (INFO / WARNING / ERROR)
- [ ] Resumen visible con número de inconsistencias por nivel
- [ ] Nivel de confianza de la IA visible

---

### HU-05 — Editar datos manualmente

**Como** operador, **quiero** corregir valores en la tabla directamente, **para** compensar errores de la IA sin reprocesar el documento.

**Criterios de aceptación:**
- [ ] Puedo editar cualquier celda de la tabla
- [ ] Los cambios se guardan en `json_editado`
- [ ] El `json_ia` original permanece intacto y visible para comparación

---

### HU-06 — Refinar con prompt adicional

**Como** operador, **quiero** dar instrucciones adicionales en español para ajustar el procesamiento, **para** incorporar contexto que no está en el documento.

**Criterios de aceptación:**
- [ ] Campo de texto libre para ingresar instrucciones
- [ ] El prompt se almacena en el historial del documento
- [ ] El sistema reprocesa con OpenAI incluyendo el prompt y muestra el nuevo resultado
- [ ] La iteración anterior queda accesible en el historial

---

### HU-07 — Generar plantilla Excel

**Como** operador, **quiero** generar la plantilla Excel estandarizada una vez aprobado el resultado, **para** tenerla lista para el proceso de carga.

**Criterios de aceptación:**
- [ ] El sistema usa `json_editado` si existe, sino `json_ia`
- [ ] Bloquea la generación si hay inconsistencias `ERROR` sin resolver
- [ ] La plantilla queda en estado `PENDIENTE_REVISION` tras generarse
- [ ] Si es una nueva versión de una rechazada, referencia a la versión anterior

---

### HU-08 — Aprobar plantilla

**Como** revisor, **quiero** aprobar una plantilla que cumple los criterios de calidad, **para** habilitarla para su descarga.

**Criterios de aceptación:**
- [ ] Puedo aprobar con comentario opcional
- [ ] El estado cambia a `APROBADA`
- [ ] La plantilla queda disponible para descarga

---

### HU-09 — Rechazar plantilla con observaciones

**Como** revisor, **quiero** rechazar una plantilla indicando el motivo, **para** que el operador pueda corregirla.

**Criterios de aceptación:**
- [ ] El comentario es obligatorio al rechazar
- [ ] El estado cambia a `RECHAZADA`
- [ ] El operador ve el motivo y puede generar una nueva versión sin recargar el documento

---

### HU-10 — Gestionar usuarios

**Como** administrador, **quiero** crear cuentas y asignar roles, **para** controlar quién accede al sistema y con qué permisos.

**Criterios de aceptación:**
- [ ] Puedo crear usuarios con nombre, correo, contraseña y rol
- [ ] El correo debe ser único en el sistema
- [ ] Puedo activar o desactivar cuentas — un usuario inactivo no puede hacer login

---

*Fase 1 — Análisis y Diseño | Versión 1.1*
