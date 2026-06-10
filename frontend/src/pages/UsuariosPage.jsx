import { useEffect, useState } from 'react'
import { Pencil, Search, UserCheck, UserPlus, Users, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatsCard } from '@/components/StatsCard'
import { StatsCardSkeleton, TableSkeleton } from '@/components/Skeletons'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/contexts/AuthContext'
import { ROLES } from '@/lib/constants'
import { getRolLabel } from '@/lib/utils'
import api from '@/services/api'

const EMPTY_FORM = { nombre: '', apellido: '', email: '', password: '', rol: 'OPERADOR' }

function RolSelect({ value, onChange }) {
  return (
    <select
      className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value}
      onChange={onChange}
    >
      {ROLES.map((r) => (
        <option key={r.value} value={r.value}>{r.label}</option>
      ))}
    </select>
  )
}

export default function UsuariosPage() {
  const { user: currentUser } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    fetchUsuarios()
  }, [])

  function fetchUsuarios() {
    setLoading(true)
    api.get('/api/usuarios/')
      .then((res) => setUsuarios(res.data))
      .finally(() => setLoading(false))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/usuarios/', form)
      toast.success('Usuario creado correctamente')
      setForm(EMPTY_FORM)
      setDialogOpen(false)
      fetchUsuarios()
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Error al crear el usuario'
      toast.error(typeof msg === 'string' ? msg : 'Error al crear el usuario')
    } finally {
      setSaving(false)
    }
  }

  function openEdit(usuario) {
    setEditForm({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      password: '',
      rol: usuario.rol,
    })
    setEditTarget(usuario)
  }

  async function handleEdit(e) {
    e.preventDefault()
    if (editForm.password && editForm.password.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }
    setSavingEdit(true)
    try {
      const payload = {
        nombre: editForm.nombre,
        apellido: editForm.apellido,
        email: editForm.email,
        rol: editForm.rol,
      }
      if (editForm.password) payload.password = editForm.password
      const res = await api.patch(`/api/usuarios/${editTarget.id_usuario}`, payload)
      setUsuarios((prev) =>
        prev.map((u) => (u.id_usuario === editTarget.id_usuario ? res.data : u))
      )
      toast.success('Usuario actualizado correctamente')
      setEditTarget(null)
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Error al actualizar el usuario'
      toast.error(typeof msg === 'string' ? msg : 'Error al actualizar el usuario')
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleToggleActivo(usuario) {
    try {
      await api.patch(`/api/usuarios/${usuario.id_usuario}`, { activo: !usuario.activo })
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id_usuario === usuario.id_usuario ? { ...u, activo: !u.activo } : u
        )
      )
      toast.success(`Usuario ${!usuario.activo ? 'activado' : 'desactivado'}`)
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Error al actualizar el usuario'
      toast.error(typeof msg === 'string' ? msg : 'Error al actualizar el usuario')
    }
  }

  const filtered = usuarios.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.nombre.toLowerCase().includes(q) ||
      u.apellido.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      String(u.id_usuario).includes(q)
    )
  })

  const activos = usuarios.filter((u) => u.activo).length
  const inactivos = usuarios.filter((u) => !u.activo).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-700">Administración de Usuarios</h1>
        <p className="text-sm text-gray-500 mt-1">Gestiona los usuarios del sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard label="Total usuarios" value={usuarios.length} icon={Users} />
            <StatsCard label="Activos" value={activos} icon={UserCheck} />
            <StatsCard label="Inactivos" value={inactivos} icon={UserX} />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle>Usuarios del sistema</CardTitle>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, correo o ID..."
                className="pl-9 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Create dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4" />
                  Crear usuario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo usuario</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Nombre</Label>
                      <Input
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Apellido</Label>
                      <Input
                        value={form.apellido}
                        onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Correo electrónico</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contraseña</Label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rol</Label>
                    <RolSelect
                      value={form.rol}
                      onChange={(e) => setForm({ ...form, rol: e.target.value })}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Creando...' : 'Crear usuario'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton columns={5} rows={4} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const isSelf = u.id_usuario === currentUser?.id_usuario
                  return (
                    <TableRow key={u.id_usuario}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {u.nombre} {u.apellido}
                            {isSelf && <span className="ml-2 text-xs text-gray-400">(tú)</span>}
                          </p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500">#{u.id_usuario}</TableCell>
                      <TableCell>
                        <Badge variant={u.rol === 'ADMINISTRADOR' ? 'info' : 'default'}>
                          {getRolLabel(u.rol)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.activo ? 'success' : 'error'}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isSelf ? (
                          <span className="text-xs text-gray-400">
                            Gestiona tu cuenta desde Mi perfil
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(u)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant={u.activo ? 'outline' : 'success'}
                              onClick={() => handleToggleActivo(u)}
                            >
                              {u.activo ? 'Desactivar' : 'Activar'}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Apellido</Label>
                <Input
                  value={editForm.apellido}
                  onChange={(e) => setEditForm({ ...editForm, apellido: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Correo electrónico</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nueva contraseña</Label>
              <Input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Dejar en blanco para no cambiarla"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <RolSelect
                value={editForm.rol}
                onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={savingEdit}>
                {savingEdit ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
