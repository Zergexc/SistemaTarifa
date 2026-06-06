import { useState } from 'react'
import { Outlet } from 'react-router-dom'
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
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="text-right hidden sm:block">
              <p className="font-medium text-gray-900">{user?.nombre} {user?.apellido}</p>
              <p className="text-xs text-gray-400">{getRolLabel(user?.rol)}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-xs shrink-0">
              {user?.nombre?.[0]?.toUpperCase()}{user?.apellido?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
