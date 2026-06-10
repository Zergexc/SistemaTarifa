import { Link, useLocation } from 'react-router-dom'
import {
  Clock,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCog,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Documentos', icon: FileText, path: '/documentos', roles: ['OPERADOR', 'ADMINISTRADOR'] },
  { label: 'Plantillas', icon: FileSpreadsheet, path: '/plantillas' },
  { label: 'Historial', icon: Clock, path: '/historial' },
]

const ADMIN_ITEMS = [
  { label: 'Usuarios', icon: Users, path: '/usuarios' },
]

export function AppSidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const { user, logout } = useAuth()

  const isActive = (path) => location.pathname.startsWith(path)

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.rol)
  )
  const items = user?.rol === 'ADMINISTRADOR'
    ? [...visibleItems, ...ADMIN_ITEMS]
    : visibleItems

  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar-bg h-screen sticky top-0 transition-all duration-300 ease-in-out shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Header */}
      <div className="flex items-center h-16 px-3 border-b border-sidebar-border shrink-0">
        <button
          onClick={onToggle}
          className="flex h-9 w-9 items-center justify-center rounded-md text-sidebar-fg hover:bg-sidebar-hover hover:text-sidebar-fg-active transition-colors shrink-0"
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
        {!collapsed && (
          <span className="ml-3 text-white font-bold text-base tracking-wide truncate">
            TarifaIA
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
        {items.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-2 py-2.5 text-sm transition-colors',
                collapsed ? 'justify-center' : '',
                active
                  ? 'bg-sidebar-active text-sidebar-fg-active font-medium'
                  : 'text-sidebar-fg hover:bg-sidebar-hover hover:text-sidebar-fg-active'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 shrink-0 space-y-0.5">
        <Link
          to="/perfil"
          title={collapsed ? 'Mi perfil' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-md px-2 py-2.5 text-sm transition-colors',
            collapsed ? 'justify-center' : '',
            isActive('/perfil')
              ? 'bg-sidebar-active text-sidebar-fg-active font-medium'
              : 'text-sidebar-fg hover:bg-sidebar-hover hover:text-sidebar-fg-active'
          )}
        >
          <UserCog className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Mi perfil</span>}
        </Link>
        <button
          onClick={logout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={cn(
            'flex items-center gap-3 w-full rounded-md px-2 py-2.5 text-sm text-sidebar-fg hover:bg-sidebar-hover hover:text-sidebar-fg-active transition-colors',
            collapsed ? 'justify-center' : ''
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}
