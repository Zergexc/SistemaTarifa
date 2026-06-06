import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle, Clock, FileText, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatsCard } from '@/components/StatsCard'
import { ESTADO_BADGE, TIPO_BADGE } from '@/lib/constants'
import { formatBytes, formatDate } from '@/lib/utils'
import api from '@/services/api'

export default function DashboardPage() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/documentos')
      .then((res) => setDocs(res.data))
      .finally(() => setLoading(false))
  }, [])

  const total = docs.length
  const cargados = docs.filter((d) => d.estado === 'CARGADO').length
  const procesados = docs.filter((d) => d.estado === 'PROCESADO').length
  const errores = docs.filter((d) => d.estado === 'ERROR_PROCESAMIENTO').length
  const recientes = docs.slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-700">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Resumen general del sistema</p>
        </div>
        <Button asChild>
          <Link to="/documentos/nuevo">
            <Plus className="h-4 w-4" />
            Cargar documento
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard label="Total documentos" value={total} icon={FileText} />
        <StatsCard label="Pendientes" value={cargados} icon={Clock} />
        <StatsCard label="Procesados" value={procesados} icon={CheckCircle} />
        <StatsCard label="Con errores" value={errores} icon={AlertCircle} />
      </div>

      {/* Recent */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Historial reciente de cargas</CardTitle>
          {docs.length > 8 && (
            <Link to="/documentos" className="text-sm text-blue-600 hover:underline">
              Ver todos
            </Link>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-gray-400 p-6">Cargando...</p>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <p className="text-gray-500 text-sm">No hay documentos registrados aún.</p>
              <Button asChild className="mt-3" size="sm">
                <Link to="/documentos/nuevo">
                  <Plus className="h-4 w-4" />
                  Cargar el primero
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Fecha carga</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recientes.map((doc) => (
                  <TableRow
                    key={doc.id_documento}
                    className="cursor-pointer"
                    onClick={() => (window.location.href = `/documentos/${doc.id_documento}`)}
                  >
                    <TableCell className="font-medium">
                      <Link
                        to={`/documentos/${doc.id_documento}`}
                        className="hover:text-blue-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {doc.nombre_archivo}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={TIPO_BADGE[doc.tipo] ?? 'default'}>{doc.tipo}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ESTADO_BADGE[doc.estado] ?? 'default'}>
                        {doc.estado.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{formatBytes(doc.tamano_bytes)}</TableCell>
                    <TableCell className="text-gray-500 whitespace-nowrap">
                      {formatDate(doc.fecha_carga)}
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
