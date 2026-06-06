# Frontend — TarifaIA

SPA construida con React + Vite.

## Estructura

```
src/
├── layouts/      # Wrappers de layout (con/sin sidebar, con/sin auth)
├── pages/        # Una página por ruta principal
├── components/   # Componentes reutilizables
├── services/     # Llamadas a la API (Axios)
└── hooks/        # Custom hooks (polling, auth, etc.)
```

## Instalación

```bash
cd frontend
npm install
```

## Configuración

Crear `frontend/.env.local`:
```
VITE_API_URL=http://localhost:8000
```

## Ejecución

```bash
npm run dev
```

Aplicación disponible en `http://localhost:5173`

## Inicialización del proyecto (primera vez)

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios react-router-dom
```
