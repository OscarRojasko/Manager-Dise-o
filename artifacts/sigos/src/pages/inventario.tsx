import * as React from "react"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { 
  Package, 
  Search, 
  Plus, 
  History, 
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpToLine,
  Settings2,
  Trash2,
  Edit
} from "lucide-react"

import { 
  useGetInventario, 
  useCreateItemInventario,
  useUpdateItemInventario,
  useDeleteItemInventario,
  useGetMovimientos,
  useCreateMovimiento,
  getGetInventarioQueryKey,
  getGetMovimientosQueryKey,
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

export default function Inventario() {
  const [activeTab, setActiveTab] = useState("catalogo")
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario & Stock</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestión de insumos de sublimación y registro de movimientos.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="catalogo" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Catálogo
          </TabsTrigger>
          <TabsTrigger value="movimientos" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Movimientos
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="catalogo" className="m-0 border-none p-0 outline-none">
            <CatalogoInsumos />
          </TabsContent>
          
          <TabsContent value="movimientos" className="m-0 border-none p-0 outline-none">
            <MovimientosStock />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

function CatalogoInsumos() {
  const [search, setSearch] = useState("")
  const [categoria, setCategoria] = useState("")
  const { data: items, isLoading } = useGetInventario(categoria ? { categoria } : undefined)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const queryClient = useQueryClient()

  const createItem = useCreateItemInventario()
  const deleteItem = useDeleteItemInventario()
  const updateItem = useUpdateItemInventario()

  // Filter local search
  const filteredItems = items?.filter(item => 
    item.nombre.toLowerCase().includes(search.toLowerCase()) || 
    item.sku.toLowerCase().includes(search.toLowerCase())
  ) || []

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createItem.mutate({
      data: {
        sku: formData.get("sku") as string,
        nombre: formData.get("nombre") as string,
        categoria: formData.get("categoria") as string,
        stockActual: Number(formData.get("stockActual")),
        stockMinimo: Number(formData.get("stockMinimo")),
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInventarioQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() })
        setIsCreateOpen(false)
      }
    })
  }

  const handleDelete = (sku: string) => {
    if (confirm("¿Estás seguro de eliminar este insumo?")) {
      deleteItem.mutate({ sku }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetInventarioQueryKey() })
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() })
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
                placeholder="Buscar por SKU o nombre..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-[180px]">
              <option value="">Todas las categorías</option>
              <option value="Tintas">Tintas</option>
              <option value="Papel">Papel</option>
              <option value="Telas">Telas</option>
              <option value="Mantenimiento">Mantenimiento</option>
            </Select>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 gap-1">
                <Plus className="h-4 w-4" /> Nuevo Insumo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Registrar Nuevo Insumo</DialogTitle>
                  <DialogDescription>
                    Añade un nuevo material al catálogo de inventario.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sku" className="text-right">SKU</Label>
                    <Input id="sku" name="sku" placeholder="TIN-C-001" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nombre" className="text-right">Nombre</Label>
                    <Input id="nombre" name="nombre" placeholder="Tinta Cyan Sublimación 1L" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="categoria" className="text-right">Categoría</Label>
                    <Select id="categoria" name="categoria" className="col-span-3" required>
                      <option value="Tintas">Tintas</option>
                      <option value="Papel">Papel</option>
                      <option value="Telas">Telas</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="stockActual" className="text-right">Stock Inicial</Label>
                    <Input id="stockActual" name="stockActual" type="number" defaultValue="0" min="0" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="stockMinimo" className="text-right">Stock Mínimo</Label>
                    <Input id="stockMinimo" name="stockMinimo" type="number" defaultValue="5" min="0" className="col-span-3" required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createItem.isPending}>
                    {createItem.isPending ? "Guardando..." : "Guardar Insumo"}
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
              <TableHead className="w-[120px]">SKU</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">Cargando...</TableCell></TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No se encontraron insumos.</TableCell></TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.sku}>
                  <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {item.nombre}
                      {item.enStockCritico && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold text-muted-foreground rounded-sm">
                      {item.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={item.enStockCritico ? "text-destructive font-bold" : "font-medium"}>
                      {item.stockActual}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.stockMinimo}
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
                        onClick={() => handleDelete(item.sku)}
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

function MovimientosStock() {
  const [skuFilter, setSkuFilter] = useState("")
  const { data: movimientos, isLoading } = useGetMovimientos(skuFilter ? { sku: skuFilter } : undefined)
  const { data: items } = useGetInventario()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const queryClient = useQueryClient()
  
  const createMovimiento = useCreateMovimiento()

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createMovimiento.mutate({
      data: {
        sku: formData.get("sku") as string,
        tipoMovimiento: formData.get("tipoMovimiento") as any,
        cantidad: Number(formData.get("cantidad")),
        responsable: formData.get("responsable") as string,
        observacion: formData.get("observacion") as string,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMovimientosQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetInventarioQueryKey() }) // Stock updates
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() })
        setIsCreateOpen(false)
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filtrar por SKU..."
              className="pl-9"
              value={skuFilter}
              onChange={(e) => setSkuFilter(e.target.value)}
            />
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                <Settings2 className="h-4 w-4" /> Registrar Movimiento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Registrar Movimiento de Stock</DialogTitle>
                  <DialogDescription>
                    Ingresa entradas, salidas o ajustes de inventario.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sku" className="text-right">Insumo (SKU)</Label>
                    <Select id="sku" name="sku" className="col-span-3" required>
                      <option value="">Seleccione insumo...</option>
                      {items?.map(item => (
                        <option key={item.sku} value={item.sku}>{item.sku} - {item.nombre}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tipoMovimiento" className="text-right">Tipo</Label>
                    <Select id="tipoMovimiento" name="tipoMovimiento" className="col-span-3" required>
                      <option value="Entrada">Entrada (Compra/Recepción)</option>
                      <option value="Salida">Salida (Uso Producción)</option>
                      <option value="Ajuste">Ajuste (Corrección)</option>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cantidad" className="text-right">Cantidad</Label>
                    <Input id="cantidad" name="cantidad" type="number" min="1" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="responsable" className="text-right">Responsable</Label>
                    <Input id="responsable" name="responsable" placeholder="Juan Pérez" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="observacion" className="text-right">Motivo</Label>
                    <Input id="observacion" name="observacion" placeholder="Orden #1234 / Factura #987" className="col-span-3" required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMovimiento.isPending}>
                    {createMovimiento.isPending ? "Registrando..." : "Registrar"}
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
              <TableHead className="w-[100px]">Fecha</TableHead>
              <TableHead className="w-[120px]">SKU</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Cant</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Observación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">Cargando...</TableCell></TableRow>
            ) : movimientos?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No hay movimientos registrados.</TableCell></TableRow>
            ) : (
              movimientos?.map((mov) => (
                <TableRow key={mov.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {new Date(mov.fecha).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{mov.sku}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {mov.tipoMovimiento === 'Entrada' ? (
                        <ArrowDownToLine className="h-3.5 w-3.5 text-green-500" />
                      ) : mov.tipoMovimiento === 'Salida' ? (
                        <ArrowUpToLine className="h-3.5 w-3.5 text-orange-500" />
                      ) : (
                        <Settings2 className="h-3.5 w-3.5 text-blue-500" />
                      )}
                      <span className="text-xs font-medium">{mov.tipoMovimiento}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {mov.tipoMovimiento === 'Salida' ? '-' : '+'}{mov.cantidad}
                  </TableCell>
                  <TableCell className="text-sm">{mov.responsable}</TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]" title={mov.observacion}>
                    {mov.observacion}
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
