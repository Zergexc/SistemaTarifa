# Backend — TarifaIA

API REST construida con FastAPI + PostgreSQL.

## Estructura

```
app/
├── main.py          # Punto de entrada — instancia FastAPI y registra routers
├── api/             # Routers (endpoints HTTP)
├── models/          # Modelos SQLAlchemy (ORM)
├── schemas/         # Modelos Pydantic (validación y serialización)
├── services/        # Lógica de negocio
├── core/            # Configuración, seguridad JWT, dependencias
└── db/              # Sesión de BD y migraciones Alembic
```

## Instalación

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

## Configuración

Copiar `.env.example` en la raíz del proyecto a `.env` y completar los valores.

## Ejecución

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API disponible en `http://localhost:8000`
Documentación Swagger en `http://localhost:8000/docs`

## Migraciones

```bash
alembic upgrade head          # Aplicar migraciones
alembic revision --autogenerate -m "descripción"  # Crear nueva migración
```
