import { FileSpreadsheet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function PlantillasPage() {
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
          {/* Estructura de tabla lista para cuando haya datos */}
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
              {/* Estado vacío */}
              <tr>
                <td colSpan={5}>
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
                </td>
              </tr>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
