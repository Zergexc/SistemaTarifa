# Planificación del Proyecto — TarifaIA

## Tabla de contenidos
1. [Roadmap del MVP](#1-roadmap-del-mvp)
2. [Plan de fases](#2-plan-de-fases)
3. [Estrategia Git](#3-estrategia-git)

---

## 1. Roadmap del MVP

El proyecto se divide en 8 fases. El avance actual corresponde al **40%** — análisis, diseño y preparación técnica completos.

```
██████████████████████░░░░░░░░░░░░░░░░░░░░░░  40%
```

| Fase | Descripción | Estado |
|---|---|---|
| **Fase 1** | Análisis y diseño | ✅ Completada |
| **Fase 2** | Base de datos y migraciones | ✅ Completada |
| **Fase 3** | Scaffold y estructura del repositorio | ✅ Completada |
| **Fase 4** | Backend — autenticación y carga de documentos | ⏳ Pendiente |
| **Fase 5** | Backend — procesamiento con IA y detección de inconsistencias | ⏳ Pendiente |
| **Fase 6** | Backend — generación de Excel y flujo de revisión | ⏳ Pendiente |
| **Fase 7** | Frontend React | ⏳ Pendiente |
| **Fase 8** | Pruebas y ajustes finales | ⏳ Pendiente |

> Las fases 1, 2 y 3 constituyen el **avance del 40%** presentado en la primera revisión académica.

---

## 2. Plan de fases

### Fase 1 — Análisis y diseño ✅
**Entregables:**
- Documento de análisis: visión, alcance, requisitos, casos de uso, historias de usuario
- Documento de diseño: arquitectura, modelo de datos, diseño de API REST
- Documento de planificación: roadmap, estrategia Git, plan de fases

**Decisiones clave tomadas en esta fase:**
- Stack tecnológico definido
- Modelo de datos validado (10 entidades)
- 22 endpoints diseñados
- Estrategia de procesamiento asíncrono con polling

---

### Fase 2 — Base de datos y migraciones ✅
**Entregables:**
- Modelos SQLAlchemy para las 10 entidades
- Migraciones con Alembic
- Script de datos iniciales (catálogos y usuario administrador)
- Conexión configurada vía variables de entorno

**Dependencias:** Fase 1 completada

---

### Fase 3 — Scaffold y estructura del repositorio ✅
**Entregables:**
- Estructura de carpetas del backend (`app/api`, `app/services`, `app/models`, etc.)
- Estructura de carpetas del frontend (`src/components`, `src/pages`, `src/services`, etc.)
- README por módulo explicando su responsabilidad

**Dependencias:** Fase 1 completada

---

### Fase 4 — Backend: autenticación y carga de documentos ⏳
**Entregables:**
- Endpoints de autenticación: login, logout, me
- Middleware de validación JWT por rol
- Endpoints de gestión de usuarios (admin)
- Endpoints de carga de documentos con validación de formato y almacenamiento local
- Detección de hojas en archivos Excel

**Endpoints a implementar:** `/api/auth/*`, `/api/usuarios/*`, `POST /api/documentos`, `GET /api/documentos/{id}/hojas`

**Dependencias:** Fase 2 y 3 completadas

---

### Fase 5 — Backend: procesamiento con IA ⏳
**Entregables:**
- Servicio de extracción por tipo de documento (Pandas / pdfplumber / python-docx / OCR)
- Preprocesamiento de datos para minimizar tokens
- Integración con OpenAI (Structured Outputs, prompt del sistema)
- Almacenamiento de `json_ia`, tokens consumidos y nivel de confianza
- Detección de inconsistencias (IA + validaciones backend)
- Endpoint de edición manual (`json_editado`)
- Endpoint de prompt adicional con nueva iteración
- Polling: estado del documento actualizado durante el proceso

**Endpoints a implementar:** `POST /api/documentos/{id}/procesar`, `GET /api/resultados/{id}`, `PATCH /api/resultados/{id}/editar`, endpoints de errores

**Dependencias:** Fase 4 completada. Requiere definir la estructura del JSON canónico y el prompt del sistema.

> ⚠️ **Pendiente de Fase 1:** Recopilar ejemplos reales de tarifarios para definir el JSON canónico y el prompt de OpenAI antes de implementar esta fase.

---

### Fase 6 — Backend: generación de Excel y revisión ⏳
**Entregables:**
- Servicio de generación de plantilla Excel con OpenPyXL
- Lógica de versionado de plantillas (`id_plantilla_padre`)
- Endpoints de plantillas: generar, listar, descargar
- Endpoints de revisiones: aprobar y rechazar
- Validación: bloqueo si existen errores `ERROR` sin resolver

**Endpoints a implementar:** `POST /api/documentos/{id}/plantillas`, `GET /api/plantillas/*`, `POST /api/plantillas/{id}/revisiones`

**Dependencias:** Fase 5 completada. Requiere estructura de plantilla Excel definida.

---

### Fase 7 — Frontend React ⏳
**Entregables:**
- Pantalla de login con manejo de token JWT
- Dashboard diferenciado por rol
- Pantalla de carga de documentos con selección de hojas
- Vista de procesamiento con indicador de estado (polling)
- Tabla editable con resaltado de inconsistencias por severidad
- Panel de prompt adicional
- Pantalla de generación de plantilla
- Cola de revisión para el revisor (aprobar/rechazar)
- Historial de documentos y plantillas

**Dependencias:** Fases 4, 5 y 6 completadas (API disponible)

---

### Fase 8 — Pruebas y ajustes finales ⏳
**Entregables:**
- Pruebas de los flujos principales: carga → procesamiento → generación → revisión
- Corrección de bugs detectados
- Ajustes de UX basados en pruebas
- Docker Compose funcional para demostración
- README de instalación y ejecución local

**Dependencias:** Todas las fases anteriores

---

## 3. Estrategia Git

### Ramas

| Rama | Propósito |
|---|---|
| `main` | Versiones estables. Solo recibe merges desde `develop` con tag de versión |
| `develop` | Rama de integración continua. Aquí se trabaja durante el desarrollo |

Durante las fases de implementación (4 en adelante) se pueden crear ramas `feature/nombre` desde `develop` y fusionarlas cuando el feature esté completo. Para el avance académico del 40%, se trabaja directamente sobre `develop`.

### Convención de commits

Se usa **Conventional Commits** en español. Formato:

```
<tipo>: <descripción en imperativo, sin punto final>
```

| Tipo | Cuándo usarlo |
|---|---|
| `feat` | Nueva funcionalidad implementada |
| `fix` | Corrección de un bug |
| `docs` | Cambios en documentación |
| `chore` | Configuración, scaffold, herramientas, dependencias |
| `refactor` | Reestructuración sin cambio funcional |
| `test` | Adición o modificación de pruebas |

**Ejemplos correctos:**
```
feat: implementar endpoint de carga de documentos
feat: agregar selección de hojas para archivos Excel
fix: corregir validación de formato en carga de archivos
docs: agregar diseño técnico con arquitectura y modelo de datos
chore: agregar scaffold del backend con estructura de módulos
refactor: consolidar documentación en estructura simplificada
test: agregar pruebas para el servicio de extracción PDF
```

### Tags de versión

Al completar cada hito académico, se hace merge a `main` y se crea un tag:

| Tag | Hito |
|---|---|
| `v0.1.0-analisis` | Avance del 40% — análisis, diseño y scaffold |
| `v0.2.0-backend` | Backend funcional (fases 4, 5 y 6) |
| `v1.0.0-mvp` | MVP completo con frontend y pruebas |

### Flujo de trabajo recomendado

```
1. Trabajar en develop
2. Commits frecuentes y descriptivos por cada funcionalidad concluida
3. Al completar un hito → merge develop → main → crear tag
```

```bash
# Ejemplo de tag al completar el 40%
git checkout main
git merge develop
git tag -a v0.1.0-analisis -m "Avance 40%: análisis, diseño y scaffold"
git push origin main --tags
```

---

*Fase 1 — Análisis y Diseño | Versión 1.0*
