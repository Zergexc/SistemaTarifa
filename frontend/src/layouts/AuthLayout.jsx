import { Outlet } from 'react-router-dom'
import machuPicchu from '@/assets/machu-picchu-login.png'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Form side */}
      <div className="flex flex-1 items-center justify-center bg-white px-8">
        <Outlet />
      </div>

      {/* Visual side */}
      <div className="relative hidden lg:flex lg:flex-1 flex-col items-center justify-center overflow-hidden px-12 text-white">
        <img
          src={machuPicchu}
          alt="Machu Picchu"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/75 via-slate-900/45 to-slate-950/80" />

        <div className="relative max-w-sm text-center space-y-6">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-white/15 backdrop-blur-sm mx-auto ring-1 ring-white/20">
            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-white" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold drop-shadow-md">TarifaIA</h2>
          <p className="text-blue-50 text-lg leading-relaxed drop-shadow-md">
            Automatiza la estandarización de tarifarios con inteligencia artificial.
            Reduce tiempos y elimina errores manuales.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            {['Extracción IA', 'Validación', 'Exportación Excel'].map((f) => (
              <span
                key={f}
                className="rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs text-blue-50 ring-1 ring-white/20"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
