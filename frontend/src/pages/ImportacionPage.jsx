import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { CloudUpload, FileCheck, Info } from 'lucide-react'
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
}

export default function ImportacionPage() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const navigate = useNavigate()

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxFiles: 1,
    onDropRejected: () => toast.error('Formato no permitido. Use .xlsx, .xls, .pdf, .docx, .jpg o .png'),
  })

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      await api.post('/api/documentos', form)
      toast.success('Documento cargado correctamente')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Error al cargar el documento'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-blue-700">Carga de tarifarios</h1>
        <p className="text-sm text-gray-500 mt-1">Sube tu archivo para registrarlo en el sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar archivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : file
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <>
                <FileCheck className="h-10 w-10 text-green-500" />
                <div className="text-center">
                  <p className="font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
                </div>
                <p className="text-xs text-gray-400">Clic para cambiar el archivo</p>
              </>
            ) : (
              <>
                <CloudUpload className="h-10 w-10 text-gray-400" />
                <div className="text-center">
                  <p className="font-medium text-gray-700">
                    {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra y suelta tu archivo aquí'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">o haz clic para seleccionarlo</p>
                </div>
                <p className="text-xs text-gray-400">
                  Formatos aceptados: .xlsx, .xls, .pdf, .docx, .jpg, .png
                </p>
              </>
            )}
          </div>

          {/* IA notice */}
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              El procesamiento con inteligencia artificial estará disponible en la próxima fase del proyecto.
              Por ahora el documento se registra en estado <strong>CARGADO</strong>.
            </p>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? 'Cargando...' : 'Cargar documento'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
