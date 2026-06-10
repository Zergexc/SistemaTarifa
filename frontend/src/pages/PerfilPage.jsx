import { useState } from 'react'
import { KeyRound, UserCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, getRolLabel } from '@/lib/utils'
import api from '@/services/api'

export default function PerfilPage() {
  const { user, updateUser } = useAuth()
  const [perfil, setPerfil] = useState({ nombre: user.nombre, apellido: user.apellido })
  const [savingPerfil, setSavingPerfil] = useState(false)
  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' })
  const [savingPassword, setSavingPassword] = useState(false)

  async function handlePerfilSubmit(e) {
    e.preventDefault()
    setSavingPerfil(true)
    try {
      const res = await api.patch('/api/auth/me', perfil)
      updateUser(res.data)
      toast.success('Perfil actualizado correctamente')
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Error al actualizar el perfil'
      toast.error(typeof msg === 'string' ? msg : 'Error al actualizar el perfil')
    } finally {
      setSavingPerfil(false)
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    if (passwords.nueva.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }
    if (passwords.nueva !== passwords.confirmar) {
      toast.error('Las contraseñas nuevas no coinciden')
      return
    }
    setSavingPassword(true)
    try {
      await api.put('/api/auth/me/password', {
        password_actual: passwords.actual,
        password_nueva: passwords.nueva,
      })
      toast.success('Contraseña actualizada correctamente')
      setPasswords({ actual: '', nueva: '', confirmar: '' })
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Error al cambiar la contraseña'
      toast.error(typeof msg === 'string' ? msg : 'Error al cambiar la contraseña')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-blue-700">Mi perfil</h1>
        <p className="text-sm text-gray-500 mt-1">
          Administra la información y seguridad de tu cuenta
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-semibold text-xl shrink-0">
              {user.nombre?.[0]?.toUpperCase()}{user.apellido?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-gray-900 truncate">
                {user.nombre} {user.apellido}
              </p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant={user.rol === 'ADMINISTRADOR' ? 'info' : 'default'}>
                  {getRolLabel(user.rol)}
                </Badge>
                <span className="text-xs text-gray-400">
                  Miembro desde {formatDate(user.fecha_registro)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCircle className="h-5 w-5 text-blue-600" />
              Información personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePerfilSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={perfil.nombre}
                  onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  value={perfil.apellido}
                  onChange={(e) => setPerfil({ ...perfil, apellido: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" value={user.email} disabled className="bg-gray-50 text-gray-500" />
                <p className="text-xs text-gray-400">
                  El correo solo puede ser modificado por un administrador.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={savingPerfil}>
                {savingPerfil ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-5 w-5 text-blue-600" />
              Cambiar contraseña
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password-actual">Contraseña actual</Label>
                <Input
                  id="password-actual"
                  type="password"
                  value={passwords.actual}
                  onChange={(e) => setPasswords({ ...passwords, actual: e.target.value })}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password-nueva">Nueva contraseña</Label>
                <Input
                  id="password-nueva"
                  type="password"
                  value={passwords.nueva}
                  onChange={(e) => setPasswords({ ...passwords, nueva: e.target.value })}
                  required
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-400">Mínimo 8 caracteres.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password-confirmar">Confirmar nueva contraseña</Label>
                <Input
                  id="password-confirmar"
                  type="password"
                  value={passwords.confirmar}
                  onChange={(e) => setPasswords({ ...passwords, confirmar: e.target.value })}
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={savingPassword}>
                {savingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
