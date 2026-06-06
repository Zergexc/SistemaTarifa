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

function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400 text-sm">
        Cargando...
      </div>
    )
  }
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
  if (loading) return null
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

          <Route element={<AdminRoute />}>
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
