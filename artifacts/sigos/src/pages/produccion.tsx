import * as React from "react"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { 
  Wrench,
  Search,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Printer
} from "lucide-react"

import {
  useGetProduccion,
  useCreateProduccion,
  useUpdateProduccion,
  useGetPedidos,
  getGetProduccionQueryKey,
  getGetDashboardSummaryQueryKey
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

export default function Produccion() {
  const [estadoFilter, setEstadoFilter] = useState("")
  const { data: produccion, isLoading } = useGetProduccion(estadoFilter ? { estado: estadoFilter } : undefined)
  const { data: pedidos } = useGetPedidos() // To map idPedido -> info
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const queryClient = useQueryClient()

  const createProduccion = useCreateProduccion()
  const updateProduccion = useUpdateProduccion()

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createProduccion.mutate({
      data: {
        idPedido: formData.get("idPedido") as string,
        descripcion: formData.get("descripcion") as string,
        operario: formData.get("operario") as string,
        observaciones: formData.get("observaciones") as string,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProduccionQueryKey() })
        setIsCreateOpen(false)
      }
    })
  }

  const handleStateChange = (id: string, newState: any) => {
    updateProduccion.mutate({ id, data: { estado: newState } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProduccionQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Taller de Producción</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestión de colas de impresión, sublimación y acabados.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="w-[200px]">
                <option value="">Todas las órdenes</option>
                <option value="Pendiente">Pendientes</option>
                <option value="En Proceso">En Máquina / Proceso</option>
                <option value="Finalizado">Trabajos Listos</option>
              </Select>
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="shrink-0 gap-1 bg-sidebar text-sidebar-foreground hover:bg-sidebar/90">
                  <Printer className="h-4 w-4" /> Nueva Orden de Taller
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreate}>
                  <DialogHeader>
                    <DialogTitle>Asignar Trabajo a Taller</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="idPedido" className="text-right">Pedido Asoc.</Label>
                      <Select id="idPedido" name="idPedido" className="col-span-3" required>
                        <option value="">Seleccione pedido...</option>
                        {pedidos?.filter(p => p.estadoProduccion !== 'Entregado').map(p => (
                          <option key={p.id} value={p.id}>{p.id.substring(0,8).toUpperCase()} - ${p.total}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="descripcion" className="text-right">Tarea / Arte</Label>
                      <Input id="descripcion" name="descripcion" placeholder="Ej: Impresión Lona 2x2, Sublimar 50 Tazas" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="operario" className="text-right">Operario Asig.</Label>
                      <Input id="operario" name="operario" placeholder="Nombre del maquinista" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="observaciones" className="text-right">Instrucciones</Label>
                      <Input id="observaciones" name="observaciones" placeholder="Perfil color especial, temperatura..." className="col-span-3" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createProduccion.isPending}>
                      {createProduccion.isPending ? "Generando..." : "Generar Orden"}
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
                <TableHead className="w-[120px]">ID Orden</TableHead>
                <TableHead>Trabajo / Descripción</TableHead>
                <TableHead>Asignado a</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead className="text-right">Acciones de Taller</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">Cargando...</TableCell></TableRow>
              ) : produccion?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">La cola de producción está vacía.</TableCell></TableRow>
              ) : (
                produccion?.map((orden) => (
                  <TableRow key={orden.id} className={orden.estado === 'En Proceso' ? 'bg-primary/5' : ''}>
                    <TableCell>
                      <div className="font-mono text-xs font-bold">{orden.id.substring(0, 8).toUpperCase()}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">Ped: {orden.idPedido.substring(0, 6).toUpperCase()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{orden.descripcion}</div>
                      {orden.observaciones && <div className="text-xs text-muted-foreground mt-0.5 max-w-md truncate">Nota: {orden.observaciones}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                        {orden.operario}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="h-3 w-3" /> {new Date(orden.fechaInicio).toLocaleDateString()}
                      </div>
                      {orden.fechaFin && (
                        <div className="flex items-center gap-1.5 text-primary">
                          <CheckCircle2 className="h-3 w-3" /> {new Date(orden.fechaFin).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {orden.estado === 'Pendiente' && (
                          <Button size="sm" onClick={() => handleStateChange(orden.id, 'En Proceso')} className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700">
                            <Play className="h-3.5 w-3.5" /> Iniciar
                          </Button>
                        )}
                        {orden.estado === 'En Proceso' && (
                          <Button size="sm" onClick={() => handleStateChange(orden.id, 'Finalizado')} className="h-8 gap-1.5 bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Finalizar
                          </Button>
                        )}
                        {orden.estado === 'Finalizado' && (
                          <Badge variant="success" className="h-8 rounded-sm">COMPLETADO</Badge>
                        )}
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
