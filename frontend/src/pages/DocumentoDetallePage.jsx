import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bot, Calendar, FileText, HardDrive, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TabNav } from '@/components/ui/tabs'
import { ESTADO_BADGE, TIPO_BADGE } from '@/lib/constants'
import { formatBytes, formatDate, getRolLabel } from '@/lib/utils'
import api from '@/services/api'

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

function TabPendiente({ titulo, descripcion }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 mb-4">
        <Bot className="h-7 w-7 text-blue-400" />
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

  useEffect(() => {
    api.get(`/api/documentos/${id}`)
      .then((res) => setDoc(res.data))
      .catch(() => navigate('/documentos'))
      .finally(() => setLoading(false))
  }, [id, navigate])

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
    <div className="space-y-6 max-w-4xl">
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
                    En la siguiente fase del proyecto, el sistema procesará automáticamente este
                    documento con GPT-4.1 para extraer y estructurar los datos tarifarios.
                    Los resultados aparecerán en las pestañas Validación, Incidencias y Plantilla.
                  </p>
                  <p className="text-xs text-blue-400">
                    Estado actual: <strong>{doc.estado.replace(/_/g, ' ')}</strong>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        )}

        {/* Tab: Validación */}
        {activeTab === 'validacion' && (
          isProcessado ? (
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Datos extraídos por la IA disponibles aquí.</p>
            </CardContent>
          ) : (
            <TabPendiente
              titulo="Resultados de validación"
              descripcion="Los datos extraídos automáticamente del documento aparecerán aquí una vez que el procesamiento con IA esté activo. El sistema estructurará la información tarifaria en formato tabular revisable."
            />
          )
        )}

        {/* Tab: Incidencias */}
        {activeTab === 'incidencias' && (
          isProcessadoOrError ? (
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Incidencias detectadas disponibles aquí.</p>
            </CardContent>
          ) : (
            <TabPendiente
              titulo="Incidencias detectadas"
              descripcion="Las inconsistencias identificadas durante el procesamiento aparecerán aquí. El sistema detectará automáticamente errores de formato, valores fuera de rango y datos faltantes con su nivel de severidad."
            />
          )
        )}

        {/* Tab: Plantilla */}
        {activeTab === 'plantilla' && (
          isProcessado ? (
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Plantilla generada disponible aquí.</p>
            </CardContent>
          ) : (
            <TabPendiente
              titulo="Plantilla Excel"
              descripcion="La plantilla Excel estandarizada lista para carga empresarial estará disponible aquí una vez completado el procesamiento. Podrás revisar el resumen de registros válidos y descargar el archivo directamente."
            />
          )
        )}
      </Card>
    </div>
  )
}
