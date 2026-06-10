import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileSearch, Plus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableSkeleton } from '@/components/Skeletons'
import { ESTADO_BADGE, TIPO_BADGE } from '@/lib/constants'
import { formatBytes, formatDate } from '@/lib/utils'
import api from '@/services/api'

const SELECT_CLASS =
  'h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function DocumentosPage() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('TODOS')
  const [tipo, setTipo] = useState('TODOS')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/documentos')
      .then((res) => setDocs(res.data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = docs.filter((doc) => {
    const matchSearch = doc.nombre_archivo.toLowerCase().includes(search.toLowerCase())
    const matchEstado = estado === 'TODOS' || doc.estado === estado
    const matchTipo = tipo === 'TODOS' || doc.tipo === tipo
    return matchSearch && matchEstado && matchTipo
  })

  const hasFilters = search !== '' || estado !== 'TODOS' || tipo !== 'TODOS'

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
        <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle>Todos los documentos</CardTitle>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre..."
                className="pl-9 w-56"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className={SELECT_CLASS} value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="TODOS">Todos los estados</option>
              {Object.keys(ESTADO_BADGE).map((e) => (
                <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <select className={SELECT_CLASS} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="TODOS">Todos los tipos</option>
              {Object.keys(TIPO_BADGE).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton columns={5} rows={6} />
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
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-3">
                <FileSearch className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Sin resultados</p>
              <p className="text-sm text-gray-400 mt-1">
                Ningún documento coincide con los filtros aplicados
              </p>
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearch('')
                    setEstado('TODOS')
                    setTipo('TODOS')
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
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
                {filtered.map((doc) => (
                  <TableRow
                    key={doc.id_documento}
                    className="cursor-pointer"
                    onClick={() => navigate(`/documentos/${doc.id_documento}`)}
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
