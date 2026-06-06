import { Clock } from 'lucide-react'

export default function ComingSoonPage({ title = 'Esta sección' }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 mb-4">
        <Clock className="h-8 w-8 text-blue-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
      <p className="mt-2 text-sm text-gray-400 max-w-sm">
        Esta funcionalidad estará disponible en una fase posterior del proyecto,
        una vez que el procesamiento con IA esté activo.
      </p>
    </div>
  )
}
