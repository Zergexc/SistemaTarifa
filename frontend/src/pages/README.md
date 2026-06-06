# src/pages — Páginas de la aplicación

Una página por ruta principal. Las páginas orquestan componentes y llaman a los servicios.

## Páginas (a crear en Fase 7)

| Archivo | Ruta | Rol | Descripción |
|---|---|---|---|
| `LoginPage.jsx` | `/login` | Todos | Formulario de autenticación |
| `DashboardPage.jsx` | `/` | Todos | Pantalla de inicio diferenciada por rol |
| `DocumentosPage.jsx` | `/documentos` | Operador | Listado de documentos cargados |
| `NuevoDocumentoPage.jsx` | `/documentos/nuevo` | Operador | Carga de archivo + selección de hojas |
| `DocumentoDetailPage.jsx` | `/documentos/:id` | Operador | Vista previa editable + historial de iteraciones |
| `RevisionesPage.jsx` | `/revisiones` | Revisor | Cola de plantillas pendientes de aprobación |
| `PlantillaDetailPage.jsx` | `/plantillas/:id` | Revisor | Detalle de plantilla para revisar |
| `UsuariosPage.jsx` | `/usuarios` | Admin | Gestión de cuentas de usuario |

## Convención

Las páginas **no hacen llamadas a la API directamente**. Usan los servicios de `src/services/` y los hooks de `src/hooks/`. El estado local se maneja con `useState`; el estado global (usuario autenticado) con Context API.
