import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableSkeleton } from '@/components/Skeletons'
import { formatDate } from '@/lib/utils'
import api from '@/services/api'

const ESTADO_PLANTILLA_BADGE = {
  GENERADA: 'info',
  PENDIENTE_REVISION: 'warning',
  APROBADA: 'success',
  RECHAZADA: 'error',
}

export default function PlantillasPage() {
  const [plantillas, setPlantillas] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    api
      .get('/api/documentos/plantillas')
      .then((res) => setPlantillas(res.data))
      .catch(() => toast.error('No se pudieron cargar las plantillas'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDownload(plantilla) {
    setDownloadingId(plantilla.id_plantilla)
    try {
      const response = await api.get(
        `/api/documentos/${plantilla.id_documento}/plantilla/descargar`,
        { responseType: 'blob' }
      )

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      const contentDisposition = response.headers['content-disposition']
      let filename = `plantilla_documento_${plantilla.id_documento}.xlsx`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?(?:;|$)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1]
        }
      }
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
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-700">Plantillas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Plantillas Excel generadas a partir de documentos procesados
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plantillas generadas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <TableSkeleton columns={5} rows={4} />
            </div>
          ) : plantillas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
                <FileSpreadsheet className="h-7 w-7 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-500">
                Sin plantillas generadas
              </h3>
              <p className="text-sm text-gray-400 max-w-sm mt-2 leading-relaxed">
                Las plantillas Excel estandarizadas aparecerán aquí una vez que los documentos
                sean procesados con IA. Cada plantilla corresponde al resultado validado de
                un tarifario.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento origen</TableHead>
                  <TableHead>Versión</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha generación</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plantillas.map((plantilla) => (
                  <TableRow key={plantilla.id_plantilla}>
                    <TableCell>
                      <Link
                        to={`/documentos/${plantilla.id_documento}`}
                        className="font-medium text-gray-800 hover:text-blue-600 transition-colors"
                      >
                        {plantilla.documento_origen}
                      </Link>
                    </TableCell>
                    <TableCell>v{plantilla.version}</TableCell>
                    <TableCell>
                      <Badge variant={ESTADO_PLANTILLA_BADGE[plantilla.estado] ?? 'default'}>
                        {plantilla.estado.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(plantilla.fecha_generacion)}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleDownload(plantilla)}
                        disabled={downloadingId === plantilla.id_plantilla}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                      >
                        {downloadingId === plantilla.id_plantilla ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Descargar
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
