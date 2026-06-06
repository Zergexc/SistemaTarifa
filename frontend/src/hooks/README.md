# src/hooks — Custom hooks

Hooks reutilizables que encapsulan lógica repetida entre páginas.

## Hooks planificados (Fase 7)

### `useAuth.js`
Expone el usuario autenticado, su rol y las funciones `login()` / `logout()`. Lee el token de `localStorage` al montar y lo valida contra el backend.

```js
const { usuario, rol, login, logout } = useAuth()
```

### `usePolling.js`
Ejecuta una función de consulta en intervalos regulares hasta que una condición se cumple. Usado para detectar el fin del procesamiento de un documento.

```js
// Ejemplo: hacer polling cada 3s hasta que el estado no sea PROCESANDO
const { data, loading } = usePolling(
  () => documentoService.getDetalle(id),
  (data) => data.estado !== 'PROCESANDO',
  3000
)
```

### `useDocumento.js`
Encapsula la carga, procesamiento y consulta de estado de un documento. Combina `documentoService` con `usePolling` para el flujo completo de procesamiento.

## Convención

Los hooks siguen el prefijo `use`. No retornan JSX — solo estado y funciones. Los componentes y páginas los consumen para obtener datos y disparar acciones.
