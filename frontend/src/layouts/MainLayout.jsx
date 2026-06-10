import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/AppSidebar'
import { useAuth } from '@/contexts/AuthContext'
import { getRolLabel } from '@/lib/utils'

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-end px-6 bg-white border-b border-gray-200 shrink-0">
          <Link
            to="/perfil"
            title="Mi perfil"
            className="flex items-center gap-3 text-sm text-gray-700 rounded-lg px-2 py-1.5 -mr-2 hover:bg-gray-100 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="font-medium text-gray-900">{user?.nombre} {user?.apellido}</p>
              <p className="text-xs text-gray-400">{getRolLabel(user?.rol)}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-semibold text-xs shrink-0">
              {user?.nombre?.[0]?.toUpperCase()}{user?.apellido?.[0]?.toUpperCase()}
            </div>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
