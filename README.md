# TarifaIA

Sistema de transformación inteligente de tarifarios de proveedores a plantillas Excel estandarizadas, impulsado por inteligencia artificial

## Descripción

TarifaIA automatiza el proceso de recepción, extracción, validación y estandarización de tarifarios enviados por proveedores en distintos formatos (Excel, PDF, Word e imágenes escaneadas).

El sistema utiliza OpenAI GPT-4.1 para transformar información heterogénea a un JSON canónico estandarizado, detectar inconsistencias y generar plantillas Excel compatibles con el proceso de carga empresarial.

## Estado del proyecto

**Avance actual: 40%** — Análisis, diseño y preparación técnica completados.

| Fase | Descripción | Estado |
|---|---|---|
| Fase 1 | Análisis y diseño | Completada |
| Fase 2 | Base de datos y migraciones | Completada |
| Fase 3 | Frontend React | En curso |
| Fase 4 | Backend — autenticación y carga de documentos | Pendiente |
| Fase 5 | Backend — procesamiento con IA | Pendiente |
| Fase 6 | Backend — generación de Excel y revisión | Pendiente |
| Fase 7 | Pruebas y ajustes finales | Pendiente |

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite |
| Backend | Python 3.11 + FastAPI |
| Base de datos | PostgreSQL 15 |
| IA | OpenAI GPT-4.1 |
| Autenticación | JWT |
| Extracción | Pandas, pdfplumber, python-docx, EasyOCR |
| Generación Excel | OpenPyXL |

## Estructura del repositorio

```
TarifaIA/
├── backend/
│   ├── app/
│   │   ├── api/          # Routers FastAPI por recurso
│   │   ├── models/       # Modelos SQLAlchemy (ORM)
│   │   ├── schemas/      # Modelos Pydantic (validación)
│   │   ├── services/     # Lógica de negocio
│   │   ├── core/         # Configuración y seguridad JWT
│   │   ├── db/           # Sesión de BD y migraciones
│   │   └── main.py       # Punto de entrada FastAPI
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/   # Componentes reutilizables
│       ├── pages/        # Una página por ruta
│       ├── services/     # Llamadas a la API (Axios)
│       ├── hooks/        # Custom hooks (polling, auth)
│       └── layouts/      # Wrappers de layout por rol
├── docs/
│   ├── 01_analisis.md
│   ├── 02_diseno.md
│   └── 03_planificacion.md
├── .env.example
└── README.md
```

## Documentación

| Documento | Contenido |
|---|---|
| [01 — Análisis](docs/01_analisis.md) | Visión, alcance, requisitos funcionales y no funcionales, casos de uso, historias de usuario |
| [02 — Diseño](docs/02_diseno.md) | Arquitectura, diagrama de componentes, modelo de datos, DER, diseño de API REST |
| [03 — Planificación](docs/03_planificacion.md) | Roadmap MVP, estrategia Git, plan de desarrollo por fases |

## Inicio rápido

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd TarifaIA

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Backend
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# 4. Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

Ver `backend/README.md` y `frontend/README.md` para instrucciones detalladas.

## Equipo

Proyecto universitario — en desarrollo.
