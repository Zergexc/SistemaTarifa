# src/services — Llamadas a la API

Contiene las funciones que se comunican con el backend. Usan Axios con una instancia configurada con la base URL y el token JWT.

## Archivos (a crear en Fase 7)

| Archivo | Descripción |
|---|---|
| `api.js` | Instancia de Axios con interceptores (agrega el token JWT a cada request) |
| `authService.js` | `login()`, `logout()`, `getMe()` |
| `documentoService.js` | `listar()`, `cargar()`, `getHojas()`, `procesar()`, `getDetalle()` |
| `resultadoService.js` | `getResultado()`, `editarManual()`, `getErrores()`, `resolverError()` |
| `plantillaService.js` | `generar()`, `listar()`, `descargar()` |
| `revisionService.js` | `aprobar()`, `rechazar()`, `getHistorial()` |
| `usuarioService.js` | `listar()`, `crear()`, `actualizarEstado()` |

## Instancia base (`api.js`)

```js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
```

Todos los demás archivos de services importan esta instancia `api` y no crean sus propias instancias de Axios.
