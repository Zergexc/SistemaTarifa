import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ESTADO_BADGE, TIPO_BADGE } from '@/lib/constants'
import { formatBytes, formatDate } from '@/lib/utils'
import api from '@/services/api'

export default function DocumentosPage() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/documentos')
      .then((res) => setDocs(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-700">Documentos</h1>
          <p className="text-sm text-gray-500 mt-1">Tarifarios registrados en el sistema</p>
        </div>
        <Button asChild>
          <Link to="/documentos/nuevo">
            <Plus className="h-4 w-4" />
            Cargar nuevo
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los documentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-gray-400 p-6">Cargando documentos...</p>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <p className="text-gray-500 font-medium">No hay documentos registrados</p>
              <p className="text-sm text-gray-400 mt-1">
                Comienza cargando el primer tarifario
              </p>
              <Button asChild className="mt-4">
                <Link to="/documentos/nuevo">
                  <Plus className="h-4 w-4" />
                  Cargar documento
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
                {docs.map((doc) => (
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
