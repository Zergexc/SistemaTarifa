import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bot,
  Calendar,
  FileText,
  HardDrive,
  User,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Save,
  Download,
  Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TabNav } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ESTADO_BADGE, TIPO_BADGE } from '@/lib/constants'
import { formatBytes, formatDate } from '@/lib/utils'
import api from '@/services/api'
import { toast } from 'sonner'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 shrink-0">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 mt-0.5 break-all">{value}</p>
      </div>
    </div>
  )
}

function TabPendiente({ titulo, descripcion, loading }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 mb-4">
        {loading ? (
          <Loader2 className="h-7 w-7 text-blue-500 animate-spin" />
        ) : (
          <Bot className="h-7 w-7 text-blue-400" />
        )}
      </div>
      <h3 className="text-base font-semibold text-gray-600">{titulo}</h3>
      <p className="text-sm text-gray-400 max-w-sm mt-2 leading-relaxed">{descripcion}</p>
    </div>
  )
}

export default function DocumentoDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('detalle')
  
  // Estados para procesamiento y validación
  const [resultado, setResultado] = useState(null)
  const [editedData, setEditedData] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [consideraciones, setConsideraciones] = useState('')

  // Cargar documento al inicio
  useEffect(() => {
    api.get(`/api/documentos/${id}`)
      .then((res) => setDoc(res.data))
      .catch(() => navigate('/documentos'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  // Polling si el documento está en estado PROCESANDO
  useEffect(() => {
    let interval
    if (doc && doc.estado === 'PROCESANDO') {
      setProcessing(true)
      interval = setInterval(() => {
        api.get(`/api/documentos/${id}`)
          .then((res) => {
            setDoc(res.data)
            if (res.data.estado !== 'PROCESANDO') {
              setProcessing(false)
              clearInterval(interval)
              toast.success('El procesamiento con IA ha finalizado')
            }
          })
          .catch(() => clearInterval(interval))
      }, 3000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [doc, id])

  // Cargar resultados de la extracción de la IA
  useEffect(() => {
    if (doc && (doc.estado === 'PROCESADO' || doc.estado === 'ERROR_PROCESAMIENTO')) {
      api.get(`/api/documentos/${id}/resultado`)
        .then((res) => {
          setResultado(res.data)
          setEditedData(res.data.json_editado || res.data.json_ia)
        })
        .catch((err) => console.error(err))
    }
  }, [doc, id])

  // Disparar procesamiento
  async function handleProcesar() {
    setProcessing(true)
    try {
      await api.post(`/api/documentos/${id}/procesar`, {
        consideraciones: consideraciones.trim() || null,
      })
      toast.success('Procesamiento iniciado con éxito')
      setDoc((prev) => ({ ...prev, estado: 'PROCESANDO' }))
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Error al iniciar el procesamiento')
      setProcessing(false)
    }
  }

  // Modificar celda de la tabla
  function handleCellChange(index, field, value) {
    setEditedData((prev) => {
      const copy = { ...prev }
      const tarifasCopy = [...copy.tarifas]
      
      if (['sgl', 'dbl', 'trp', 'qua'].includes(field)) {
        tarifasCopy[index] = {
          ...tarifasCopy[index],
          [field]: value === '' ? null : parseFloat(value),
        }
      } else {
        tarifasCopy[index] = {
          ...tarifasCopy[index],
          [field]: value,
        }
      }
      
      copy.tarifas = tarifasCopy
      return copy
    })
  }

  // Modificar información general del hotel
  function handleHotelInfoChange(field, value) {
    setEditedData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  // Agregar fila a la tabla
  function handleAddRow() {
    setEditedData((prev) => {
      const copy = { ...prev }
      copy.tarifas = [
        ...copy.tarifas,
        {
          room_type: 'Nueva Habitación',
          from_date: '2026-01-01',
          to_date: '2026-12-31',
          sgl: null,
          dbl: null,
          trp: null,
          qua: null,
          includes: '',
        },
      ]
      return copy
    })
  }

  // Eliminar fila
  function handleDeleteRow(index) {
    setEditedData((prev) => {
      const copy = { ...prev }
      copy.tarifas = copy.tarifas.filter((_, i) => i !== index)
      return copy
    })
  }

  // Guardar cambios en el backend y refrescar incidencias
  async function handleSave() {
    setSaving(true)
    try {
      const res = await api.put(`/api/documentos/${id}/resultado`, {
        json_editado: editedData,
      })
      setResultado(res.data)
      setEditedData(res.data.json_editado)
      toast.success('Cambios guardados y validación recalculada correctamente')
    } catch (err) {
      toast.error('Error al guardar los cambios de validación')
    } finally {
      setSaving(false)
    }
  }

  // Descargar plantilla excel
  async function handleDownloadTemplate() {
    setDownloading(true)
    try {
      const response = await api.get(`/api/documentos/${id}/plantilla/descargar`, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      const contentDisposition = response.headers['content-disposition']
      let filename = `plantilla_documento_${id}.xlsx`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?(?:;|$)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1]
        }
      }
      // Asegurar siempre la extensión .xlsx
      if (!filename.toLowerCase().endsWith('.xlsx')) {
        filename += '.xlsx'
      }

      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Plantilla descargada con éxito')
    } catch (err) {
      toast.error('Error al descargar la plantilla')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-4 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-7 w-72 max-w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <Card className="overflow-hidden">
          <div className="flex gap-6 border-b border-gray-200 px-6 pt-4 pb-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-md shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-40 max-w-full" />
                    </div>
                  </div>
                ))}
              </div>
              <Skeleton className="h-48 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!doc) return null

  const isProcessado = doc.estado === 'PROCESADO'
  const isProcessadoOrError = isProcessado || doc.estado === 'ERROR_PROCESAMIENTO'

  const tabs = [
    { id: 'detalle', label: 'Detalle', available: true },
    { id: 'validacion', label: 'Validación', available: isProcessado },
    { id: 'incidencias', label: 'Incidencias', available: isProcessadoOrError },
    { id: 'plantilla', label: 'Plantilla', available: isProcessado },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/documentos" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Documentos
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate max-w-xs">{doc.nombre_archivo}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-blue-700 break-all">{doc.nombre_archivo}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={TIPO_BADGE[doc.tipo] ?? 'default'}>{doc.tipo}</Badge>
            <Badge variant={ESTADO_BADGE[doc.estado] ?? 'default'}>
              {doc.estado.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs + content */}
      <Card className="overflow-hidden">
        <TabNav tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {/* Tab: Detalle */}
        {activeTab === 'detalle' && (
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Información del archivo</h3>
                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  <InfoRow icon={FileText} label="Nombre" value={doc.nombre_archivo} />
                  <InfoRow icon={FileText} label="Tipo" value={doc.tipo} />
                  <InfoRow icon={HardDrive} label="Tamaño" value={formatBytes(doc.tamano_bytes)} />
                  <InfoRow icon={Calendar} label="Fecha de carga" value={formatDate(doc.fecha_carga)} />
                  <InfoRow icon={User} label="ID documento" value={`#${doc.id_documento}`} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Estado del procesamiento</h3>
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-semibold text-blue-700">Procesamiento con IA</span>
                  </div>
                  <p className="text-sm text-blue-600 leading-relaxed">
                    Extrae y estructura automáticamente los datos del tarifario utilizando OpenAI GPT-4.
                  </p>
                  
                  {doc.estado === 'CARGADO' && (
                    <>
                      <textarea
                        rows={3}
                        value={consideraciones}
                        onChange={(e) => setConsideraciones(e.target.value)}
                        placeholder="Consideraciones especiales (opcional): ej. descontar IVA, calcular triple con cama extra, desarrollo desde junio 2026..."
                        className="w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <Button
                        onClick={handleProcesar}
                        disabled={processing}
                        className="w-full mt-2"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          'Iniciar Procesamiento con IA'
                        )}
                      </Button>
                    </>
                  )}

                  {doc.estado === 'PROCESANDO' && (
                    <div className="flex items-center gap-2 text-sm text-blue-500 mt-2 font-medium">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analizando documento y extrayendo tarifas (10-15s)...
                    </div>
                  )}

                  {doc.estado === 'PROCESADO' && (
                    <div className="text-xs text-green-600 font-semibold flex items-center gap-1.5 mt-2">
                      <CheckCircle className="h-4 w-4" />
                      Procesado con IA correctamente. Revisa los datos en las pestañas superiores.
                    </div>
                  )}

                  {doc.estado === 'ERROR_PROCESAMIENTO' && (
                    <div className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      Ocurrió un error al procesar el archivo.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        )}

        {/* Tab: Validación */}
        {activeTab === 'validacion' && (
          isProcessado ? (
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase">Nombre Hotel</span>
                    <Input 
                      value={editedData?.hotel_name ?? ''} 
                      onChange={(e) => handleHotelInfoChange('hotel_name', e.target.value)} 
                      className="max-w-xs font-semibold text-gray-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase">Moneda</span>
                    <Input 
                      value={editedData?.currency ?? ''} 
                      onChange={(e) => handleHotelInfoChange('currency', e.target.value)} 
                      className="w-24 uppercase font-semibold text-gray-800"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleAddRow} size="sm">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Añadir fila
                  </Button>
                  <Button onClick={handleSave} disabled={saving} size="sm">
                    {saving ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-1.5 h-4 w-4" />
                    )}
                    Guardar cambios
                  </Button>
                </div>
              </div>

              {editedData?.tarifas && (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[160px]">Tipo Habitación</TableHead>
                        <TableHead className="min-w-[120px]">Desde</TableHead>
                        <TableHead className="min-w-[120px]">Hasta</TableHead>
                        <TableHead className="w-24 text-right">SGL</TableHead>
                        <TableHead className="w-24 text-right">DBL</TableHead>
                        <TableHead className="w-24 text-right">TRP</TableHead>
                        <TableHead className="w-24 text-right">QUA</TableHead>
                        <TableHead className="w-12 text-center"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editedData.tarifas.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="p-2">
                            <Input 
                              value={row.room_type} 
                              onChange={(e) => handleCellChange(idx, 'room_type', e.target.value)} 
                              className="h-8 py-1 px-2 text-xs"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="date"
                              value={row.from_date} 
                              onChange={(e) => handleCellChange(idx, 'from_date', e.target.value)} 
                              className="h-8 py-1 px-2 text-xs"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="date"
                              value={row.to_date} 
                              onChange={(e) => handleCellChange(idx, 'to_date', e.target.value)} 
                              className="h-8 py-1 px-2 text-xs"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number"
                              placeholder="N/A"
                              value={row.sgl ?? ''} 
                              onChange={(e) => handleCellChange(idx, 'sgl', e.target.value)} 
                              className="h-8 py-1 px-2 text-xs text-right"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number"
                              placeholder="N/A"
                              value={row.dbl ?? ''} 
                              onChange={(e) => handleCellChange(idx, 'dbl', e.target.value)} 
                              className="h-8 py-1 px-2 text-xs text-right"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number"
                              placeholder="N/A"
                              value={row.trp ?? ''} 
                              onChange={(e) => handleCellChange(idx, 'trp', e.target.value)} 
                              className="h-8 py-1 px-2 text-xs text-right"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number"
                              placeholder="N/A"
                              value={row.qua ?? ''} 
                              onChange={(e) => handleCellChange(idx, 'qua', e.target.value)} 
                              className="h-8 py-1 px-2 text-xs text-right"
                            />
                          </TableCell>
                          <TableCell className="p-2 text-center">
                            <button
                              onClick={() => handleDeleteRow(idx)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              title="Eliminar fila"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          ) : (
            <TabPendiente
              titulo="Resultados de validación"
              descripcion="Los datos extraídos automáticamente del documento aparecerán aquí una vez que el procesamiento con IA esté activo."
              loading={processing}
            />
          )
        )}

        {/* Tab: Incidencias */}
        {activeTab === 'incidencias' && (
          isProcessadoOrError ? (
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Listado de Incidencias Detectadas</h3>
              
              {!resultado?.errores || resultado.errores.length === 0 ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <div>
                    <span className="font-semibold">¡Todo correcto!</span> No se detectaron inconsistencias en la validación de tarifas o continuidad de fechas. El documento está listo para generar la plantilla.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      Se han detectado <strong>{resultado.errores.length}</strong> problemas. Corrígelos en la pestaña de <strong>Validación</strong> y guarda para re-evaluar la información.
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                    {resultado.errores.map((err) => (
                      <div key={err.id_error} className="p-4 hover:bg-gray-50 flex items-start gap-3 justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-800">{err.tipo_error.replace(/_/g, ' ')}</span>
                            <Badge variant={err.severidad === 'ALTA' ? 'destructive' : 'warning'}>
                              {err.severidad}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{err.descripcion}</p>
                          {err.campo_afectado && (
                            <p className="text-xs text-gray-400">Campo afectado: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600 font-mono">{err.campo_afectado}</code></p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          ) : (
            <TabPendiente
              titulo="Incidencias detectadas"
              descripcion="Las inconsistencias y brechas de fechas detectadas durante el procesamiento aparecerán aquí."
              loading={processing}
            />
          )
        )}

        {/* Tab: Plantilla */}
        {activeTab === 'plantilla' && (
          isProcessado ? (
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-10 text-center max-w-md mx-auto">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 mb-4">
                  {downloading ? (
                    <Loader2 className="h-7 w-7 text-green-500 animate-spin" />
                  ) : (
                    <Download className="h-7 w-7 text-green-500" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-800">Generación de Plantilla Estructurada</h3>
                <p className="text-sm text-gray-500 mt-2">
                  La plantilla Excel estandarizada con todas las habitaciones pivoteadas por fecha está lista para descarga.
                </p>
                <Button 
                  className="mt-6 w-full max-w-xs bg-green-600 hover:bg-green-700 text-white" 
                  onClick={handleDownloadTemplate}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Descargando...
                    </>
                  ) : (
                    'Descargar Excel Estandarizado'
                  )}
                </Button>
              </div>
            </CardContent>
          ) : (
            <TabPendiente
              titulo="Plantilla Excel"
              descripcion="La plantilla Excel estandarizada estará disponible aquí una vez completado el procesamiento."
              loading={processing}
            />
          )
        )}
      </Card>
    </div>
  )
}
