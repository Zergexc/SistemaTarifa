import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle, Clock, FileText, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ESTADO_BADGE } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import api from '@/services/api'

/*
 * Tipos de evento del ciclo de vida de un documento.
 * Diseñado para extenderse con eventos futuros:
 * PROCESAMIENTO_INICIADO, PLANTILLA_GENERADA, PLANTILLA_APROBADA, PLANTILLA_RECHAZADA, etc.
 */
const EVENTO_CONFIG = {
  DOCUMENTO_CARGADO: {
    label: 'Documento cargado',
    icon: Upload,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    badgeVariant: 'info',
  },
  PROCESAMIENTO_COMPLETADO: {
    label: 'Procesamiento completado',
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-50',
    badgeVariant: 'success',
  },
  ERROR_PROCESAMIENTO: {
    label: 'Error en procesamiento',
    icon: AlertCircle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    badgeVariant: 'error',
  },
  PROCESANDO: {
    label: 'En procesamiento',
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    badgeVariant: 'warning',
  },
}

function estadoToEvento(estado) {
  if (estado === 'PROCESADO') return 'PROCESAMIENTO_COMPLETADO'
  if (estado === 'ERROR_PROCESAMIENTO') return 'ERROR_PROCESAMIENTO'
  if (estado === 'PROCESANDO') return 'PROCESANDO'
  return 'DOCUMENTO_CARGADO'
}

function buildEvents(docs) {
  return docs
    .map((doc) => ({
      id: doc.id_documento,
      tipo: estadoToEvento(doc.estado),
      fecha: doc.fecha_carga,
      titulo: doc.nombre_archivo,
      subtitulo: `${doc.tipo} · ${doc.estado.replace(/_/g, ' ')}`,
      documentoId: doc.id_documento,
      estadoBadge: doc.estado,
    }))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
}

export default function HistorialPage() {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/documentos')
      .then((res) => setEventos(buildEvents(res.data)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-700">Historial</h1>
        <p className="text-sm text-gray-500 mt-1">
          Línea de tiempo de actividad del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eventos registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Cargando historial...</p>
          ) : eventos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-3">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">Sin actividad registrada</p>
              <p className="text-xs text-gray-400 mt-1">
                Los eventos aparecerán aquí cuando se carguen documentos
              </p>
            </div>
          ) : (
            <ol className="relative border-l border-gray-200 space-y-0 ml-3">
              {eventos.map((evento) => {
                const config = EVENTO_CONFIG[evento.tipo] ?? EVENTO_CONFIG.DOCUMENTO_CARGADO
                const Icon = config.icon
                return (
                  <li key={`${evento.tipo}-${evento.id}`} className="mb-8 ml-6">
                    {/* Dot */}
                    <span
                      className={`absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full ${config.bg} ring-4 ring-white`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                    </span>

                    {/* Content */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={config.badgeVariant} className="text-xs">
                            {config.label}
                          </Badge>
                          <time className="text-xs text-gray-400">
                            {formatDate(evento.fecha)}
                          </time>
                        </div>
                        <Link
                          to={`/documentos/${evento.documentoId}`}
                          className="mt-1 block text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors truncate max-w-md"
                        >
                          {evento.titulo}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">{evento.subtitulo}</p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
