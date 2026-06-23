import * as React from "react"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { 
  Users,
  Shield,
  Trash2,
  Edit,
  Plus
} from "lucide-react"

import {
  useGetUsuarios,
  useCreateUsuario,
  useUpdateUsuario,
  useDeleteUsuario,
  getGetUsuariosQueryKey
} from "@workspace/api-client-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function Usuarios() {
  const { data: usuarios, isLoading } = useGetUsuarios()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const queryClient = useQueryClient()

  const createUsuario = useCreateUsuario()
  const deleteUsuario = useDeleteUsuario()

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createUsuario.mutate({
      data: {
        nombre: formData.get("nombre") as string,
        email: formData.get("email") as string,
        rol: formData.get("rol") as any,
        estado: formData.get("estado") as any,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUsuariosQueryKey() })
        setIsCreateOpen(false)
      }
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este acceso?")) {
      deleteUsuario.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUsuariosQueryKey() })
        }
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accesos del Sistema</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Control de usuarios, roles y permisos operativos.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" /> 
              {usuarios?.length || 0} Usuarios Activos
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="shrink-0 gap-1">
                  <Plus className="h-4 w-4" /> Nuevo Operador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreate}>
                  <DialogHeader>
                    <DialogTitle>Crear Usuario del Sistema</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="nombre" className="text-right">Nombre</Label>
                      <Input id="nombre" name="nombre" placeholder="Nombre Apellido" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">Correo</Label>
                      <Input id="email" name="email" type="email" placeholder="usuario@sublicolor.com" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rol" className="text-right">Rol/Área</Label>
                      <Select id="rol" name="rol" className="col-span-3" required>
                        <option value="Admin">Administrador (Total)</option>
                        <option value="Ventas">Ventas y CRM</option>
                        <option value="Produccion">Taller/Producción</option>
                        <option value="Inventario">Almacén/Inventario</option>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="estado" className="text-right">Estado</Label>
                      <Select id="estado" name="estado" className="col-span-3" required>
                        <option value="Activo">Activo (Con acceso)</option>
                        <option value="Inactivo">Inactivo (Suspendido)</option>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createUsuario.isPending}>
                      {createUsuario.isPending ? "Guardando..." : "Crear Acceso"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol Operativo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Cargando...</TableCell></TableRow>
              ) : usuarios?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No hay usuarios registrados.</TableCell></TableRow>
              ) : (
                usuarios?.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-xs">
                          {usuario.nombre.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{usuario.nombre}</div>
                          <div className="text-xs text-muted-foreground">{usuario.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        usuario.rol === 'Admin' ? 'default' : 
                        usuario.rol === 'Produccion' ? 'secondary' : 'outline'
                      } className="rounded-sm font-mono text-[10px]">
                        {usuario.rol.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${usuario.estado === 'Activo' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-xs font-medium text-muted-foreground">{usuario.estado}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(usuario.id)}
                          disabled={usuario.rol === 'Admin'} // Don't let them easily delete admins
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
