import * as React from "react"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { 
  Users, 
  ShoppingBag,
  Search,
  Plus,
  Mail,
  Phone,
  Building2,
  User,
  Trash2,
  Edit,
  Eye,
  FileText
} from "lucide-react"

import {
  useGetClientes,
  useCreateCliente,
  useDeleteCliente,
  useGetPedidos,
  useCreatePedido,
  useUpdatePedido,
  getGetClientesQueryKey,
  getGetPedidosQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default function VentasCrm() {
  const [activeTab, setActiveTab] = useState("clientes")
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ventas & CRM</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestión de directorio de clientes y seguimiento de pedidos.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="pedidos" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Pedidos
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="clientes" className="m-0 border-none p-0 outline-none">
            <DirectorioClientes />
          </TabsContent>
          
          <TabsContent value="pedidos" className="m-0 border-none p-0 outline-none">
            <GestionPedidos />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

function DirectorioClientes() {
  const [search, setSearch] = useState("")
  const [tipo, setTipo] = useState("")
  const { data: clientes, isLoading } = useGetClientes(tipo ? { tipo } : undefined)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const queryClient = useQueryClient()

  const createCliente = useCreateCliente()
  const deleteCliente = useDeleteCliente()

  const filteredClientes = clientes?.filter(c => 
    c.nombre.toLowerCase().includes(search.toLowerCase()) || 
    c.documento.toLowerCase().includes(search.toLowerCase())
  ) || []

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createCliente.mutate({
      data: {
        tipo: formData.get("tipo") as any,
        nombre: formData.get("nombre") as string,
        documento: formData.get("documento") as string,
        contacto: formData.get("contacto") as string,
        email: formData.get("email") as string,
        direccion: formData.get("direccion") as string,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetClientesQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() })
        setIsCreateOpen(false)
      }
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar este cliente? Los pedidos asociados podrían verse afectados.")) {
      deleteCliente.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetClientesQueryKey() })
        }
      })
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar cliente, RIF, CI..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-[180px]">
              <option value="">Todos los tipos</option>
              <option value="Natural">Natural</option>
              <option value="Jurídico">Jurídico</option>
              <option value="Corporativo">Corporativo</option>
            </Select>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 gap-1">
                <Plus className="h-4 w-4" /> Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Registrar Cliente</DialogTitle>
                  <DialogDescription>Añade un nuevo cliente al directorio.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tipo" className="text-right">Tipo</Label>
                    <Select id="tipo" name="tipo" className="col-span-3" required>
                      <option value="Natural">Persona Natural</option>
                      <option value="Jurídico">Persona Jurídica</option>
                      <option value="Corporativo">Corporativo</option>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nombre" className="text-right">Razón Social</Label>
                    <Input id="nombre" name="nombre" placeholder="Nombre completo o Empresa" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="documento" className="text-right">Documento</Label>
                    <Input id="documento" name="documento" placeholder="V- / J- / G-" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contacto" className="text-right">Teléfono</Label>
                    <Input id="contacto" name="contacto" placeholder="0414-0000000" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="correo@ejemplo.com" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="direccion" className="text-right">Dirección</Label>
                    <Input id="direccion" name="direccion" className="col-span-3" required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createCliente.isPending}>
                    {createCliente.isPending ? "Guardando..." : "Guardar"}
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
              <TableHead>Cliente</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="h-24 text-center">Cargando...</TableCell></TableRow>
            ) : filteredClientes.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No se encontraron clientes.</TableCell></TableRow>
            ) : (
              filteredClientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        {cliente.tipo === 'Natural' ? <User className="h-5 w-5 text-primary" /> : <Building2 className="h-5 w-5 text-primary" />}
                      </div>
                      <div>
                        <div className="font-medium">{cliente.nombre}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">{cliente.documento}</div>
                        <Badge variant="outline" className="mt-1 text-[10px] py-0">{cliente.tipo}</Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" /> {cliente.contacto}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" /> {cliente.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(cliente.id)}
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
  )
}

function GestionPedidos() {
  const [estadoProd, setEstadoProd] = useState("")
  const { data: pedidos, isLoading } = useGetPedidos(estadoProd ? { estadoProduccion: estadoProd } : undefined)
  const { data: clientes } = useGetClientes()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const queryClient = useQueryClient()

  const createPedido = useCreatePedido()
  const updatePedido = useUpdatePedido()

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createPedido.mutate({
      data: {
        idCliente: formData.get("idCliente") as string,
        estadoPago: formData.get("estadoPago") as any,
        total: Number(formData.get("total")),
        observaciones: formData.get("observaciones") as string,
        detalles: [] // Simplification for demo
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPedidosQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() })
        setIsCreateOpen(false)
      }
    })
  }

  const handleStatusChange = (id: string, newStatus: any) => {
    updatePedido.mutate({ id, data: { estadoProduccion: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPedidosQueryKey() })
      }
    })
  }

  const getClientName = (id: string) => {
    const c = clientes?.find(c => c.id === id);
    return c ? c.nombre : id.substring(0,8)+'...';
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Select value={estadoProd} onChange={(e) => setEstadoProd(e.target.value)} className="w-[200px]">
              <option value="">Cualquier estado</option>
              <option value="Pendiente">Pendientes</option>
              <option value="En Producción">En Producción</option>
              <option value="Listo">Listos</option>
              <option value="Entregado">Entregados</option>
            </Select>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 gap-1 bg-primary">
                <FileText className="h-4 w-4" /> Nuevo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Crear Orden de Pedido</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="idCliente" className="text-right">Cliente</Label>
                    <Select id="idCliente" name="idCliente" className="col-span-3" required>
                      <option value="">Seleccione...</option>
                      {clientes?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="estadoPago" className="text-right">Pago</Label>
                    <Select id="estadoPago" name="estadoPago" className="col-span-3" required>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Abonado">Abonado</option>
                      <option value="Pagado">Pagado 100%</option>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="total" className="text-right">Monto Total $</Label>
                    <Input id="total" name="total" type="number" step="0.01" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="observaciones" className="text-right">Notas</Label>
                    <Input id="observaciones" name="observaciones" placeholder="Fechas de entrega, especificaciones..." className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createPedido.isPending}>
                    {createPedido.isPending ? "Creando..." : "Crear Pedido"}
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
              <TableHead className="w-[100px]">ID / Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado Prod.</TableHead>
              <TableHead>Estado Pago</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">Cargando...</TableCell></TableRow>
            ) : pedidos?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No hay pedidos registrados.</TableCell></TableRow>
            ) : (
              pedidos?.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell>
                    <div className="font-mono text-xs font-semibold">{pedido.id.substring(0, 8).toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{new Date(pedido.fechaRegistro).toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {getClientName(pedido.idCliente)}
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={pedido.estadoProduccion} 
                      onChange={(e) => handleStatusChange(pedido.id, e.target.value)}
                      className="h-8 text-xs font-medium w-[140px]"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Producción">En Producción</option>
                      <option value="Listo">Listo para entrega</option>
                      <option value="Entregado">Entregado</option>
                      <option value="Cancelado">Cancelado</option>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      pedido.estadoPago === 'Pagado' ? 'success' :
                      pedido.estadoPago === 'Abonado' ? 'info' :
                      pedido.estadoPago === 'Cancelado' ? 'destructive' : 'warning'
                    } className="text-[10px]">
                      {pedido.estadoPago}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${pedido.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
