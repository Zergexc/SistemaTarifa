import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { ArrowLeft, CloudUpload, FileCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBytes } from '@/lib/utils'
import api from '@/services/api'

const ACCEPT = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg'],
  'image/png': ['.png'],
  'application/vnd.ms-outlook': ['.msg'],
}

export default function NuevoDocumentoPage() {
  const [file, setFile] = useState(null)
  const [consideraciones, setConsideraciones] = useState('')
  const [uploading, setUploading] = useState(false)
  const navigate = useNavigate()

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxFiles: 1,
    onDropRejected: () =>
      toast.error('Formato no permitido. Use .xlsx, .xls, .pdf, .docx, .jpg, .png o .msg'),
  })

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post('/api/documentos', form)
      toast.success('Documento registrado correctamente')
      navigate(`/documentos/${res.data.id_documento}`)
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Error al cargar el documento'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          to="/documentos"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Documentos
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-blue-700">Cargar tarifario</h1>
        <p className="text-sm text-gray-500 mt-1">
          El documento quedará registrado en el sistema listo para su procesamiento
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar archivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-14 cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : file
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/40'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <FileCheck className="h-7 w-7 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
                </div>
                <p className="text-xs text-gray-400">Clic para cambiar el archivo</p>
              </>
            ) : (
              <>
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                    isDragActive ? 'bg-blue-100' : 'bg-gray-100'
                  }`}
                >
                  <CloudUpload
                    className={`h-7 w-7 transition-colors ${
                      isDragActive ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-700">
                    {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra y suelta tu archivo aquí'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">o haz clic para seleccionarlo</p>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {['.xlsx', '.xls', '.pdf', '.docx', '.jpg', '.png', '.msg'].map((ext) => (
                    <span
                      key={ext}
                      className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500"
                    >
                      {ext}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Consideraciones especiales de IA */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Consideraciones especiales de IA
            </label>
            <textarea
              rows={4}
              value={consideraciones}
              onChange={(e) => setConsideraciones(e.target.value)}
              placeholder="Introduce cualquier parámetro, modelo o instrucción específica para el procesamiento de IA..."
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400">
              Estas instrucciones se aplicarán cuando el procesamiento con IA esté activo.
            </p>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
            size="lg"
          >
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploading ? 'Registrando documento...' : 'Registrar documento'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
