# src/layouts — Layouts de la aplicación

Componentes que envuelven las páginas y definen la estructura visual común.

## Archivos (a crear en Fase 7)

| Archivo | Descripción |
|---|---|
| `AuthLayout.jsx` | Layout para páginas públicas (login). Sin sidebar ni navbar. |
| `MainLayout.jsx` | Layout para páginas protegidas. Incluye navbar y sidebar con navegación por rol. |

## Uso

```jsx
// En el router de la aplicación
<Route element={<AuthLayout />}>
  <Route path="/login" element={<LoginPage />} />
</Route>

<Route element={<MainLayout />}>
  <Route path="/documentos" element={<DocumentosPage />} />
  <Route path="/revisiones" element={<RevisionesPage />} />
</Route>
```

`MainLayout` debe leer el rol del usuario desde el contexto de auth para mostrar las opciones de navegación correctas según el rol (Operador / Revisor / Administrador).
