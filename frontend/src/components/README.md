# src/components — Componentes reutilizables

Componentes UI que se usan en más de una página. No tienen lógica de negocio ni llaman a la API.

## Componentes planificados (Fase 7)

| Componente | Descripción |
|---|---|
| `EditableTable.jsx` | Tabla editable con soporte para resaltado de celdas por severidad (INFO / WARNING / ERROR) |
| `InconsistencyPanel.jsx` | Panel lateral con resumen de inconsistencias detectadas |
| `ConfidenceBadge.jsx` | Indicador visual del nivel de confianza del resultado de IA |
| `FileUploader.jsx` | Drag & drop para carga de archivos con validación de formato |
| `SheetSelector.jsx` | Modal para seleccionar hojas de un Excel con múltiples hojas |
| `PromptInput.jsx` | Campo de texto con botón para enviar instrucciones adicionales a la IA |
| `StatusBadge.jsx` | Badge de color para mostrar estados de documentos y plantillas |
| `VersionHistory.jsx` | Lista del historial de versiones de una plantilla |

## Convención

Los componentes reciben datos y callbacks por props. No acceden directamente al estado global ni a servicios externos.

```jsx
// Ejemplo de uso de EditableTable
<EditableTable
  datos={resultado.json_editado || resultado.json_ia}
  errores={errores}
  onCellChange={(campo, valor) => handleEdit(campo, valor)}
/>
```
