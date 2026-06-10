import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import AuthLayout from '@/layouts/AuthLayout'
import MainLayout from '@/layouts/MainLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import DocumentosPage from '@/pages/DocumentosPage'
import NuevoDocumentoPage from '@/pages/NuevoDocumentoPage'
import DocumentoDetallePage from '@/pages/DocumentoDetallePage'
import PlantillasPage from '@/pages/PlantillasPage'
import HistorialPage from '@/pages/HistorialPage'
import UsuariosPage from '@/pages/UsuariosPage'
import PerfilPage from '@/pages/PerfilPage'

function SplashScreen() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 animate-pulse">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-sm text-gray-400">Cargando TarifaIA...</p>
    </div>
  )
}

function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <SplashScreen />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function AdminRoute() {
  const { user } = useAuth()
  if (user?.rol !== 'ADMINISTRADOR') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

function GuestRoute() {
  const { user, loading } = useAuth()
  if (loading) return <SplashScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      {/* Público */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      {/* Autenticado */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/documentos/nuevo" element={<NuevoDocumentoPage />} />
          <Route path="/documentos/:id" element={<DocumentoDetallePage />} />
          <Route path="/plantillas" element={<PlantillasPage />} />
          <Route path="/historial" element={<HistorialPage />} />
          <Route path="/perfil" element={<PerfilPage />} />

          <Route element={<AdminRoute />}>
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
