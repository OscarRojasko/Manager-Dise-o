import * as React from "react"
import { 
  PackageSearch,
  ShoppingCart,
  Users,
  AlertCircle,
  TrendingUp,
  CreditCard,
  ArrowRight,
  Clock
} from "lucide-react"

import { useGetDashboardSummary } from "@workspace/api-client-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export default function Dashboard() {
  const { data: summary, isLoading, error } = useGetDashboardSummary()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error || !summary) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed border-destructive/20 rounded-lg bg-destructive/5 text-destructive p-6 text-center">
        <div>
          <AlertCircle className="h-10 w-10 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">Error al cargar datos</h3>
          <p className="text-sm opacity-80 mt-1">No se pudo conectar con el servidor.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard 
          title="Pedidos en Producción" 
          value={summary.pedidosEnProduccion} 
          icon={ShoppingCart} 
          color="text-blue-500" 
          bg="bg-blue-500/10"
        />
        <KPICard 
          title="Insumos Críticos" 
          value={summary.insumosEnStockCritico} 
          icon={AlertCircle} 
          color="text-destructive" 
          bg="bg-destructive/10"
          alert={summary.insumosEnStockCritico > 0}
        />
        <KPICard 
          title="Total Clientes" 
          value={summary.totalClientes} 
          icon={Users} 
          color="text-green-500" 
          bg="bg-green-500/10"
        />
        <KPICard 
          title="Total Pedidos" 
          value={summary.totalPedidos} 
          icon={PackageSearch} 
          color="text-purple-500" 
          bg="bg-purple-500/10"
        />
        <KPICard 
          title="Ingresos Estimados" 
          value={`$${summary.totalIngresos.toFixed(2)}`} 
          icon={TrendingUp} 
          color="text-amber-500" 
          bg="bg-amber-500/10"
        />
        <KPICard 
          title="Pendientes de Pago" 
          value={summary.pedidosPendientesPago} 
          icon={CreditCard} 
          color="text-orange-500" 
          bg="bg-orange-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Items Table */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Insumos Críticos
              </CardTitle>
              <Badge variant="destructive" className="rounded-sm px-1.5 font-mono text-[10px]">
                {summary.itemsCriticos.length}
              </Badge>
            </div>
            <CardDescription>Items por debajo del stock mínimo</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {summary.itemsCriticos.length > 0 ? (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[100px] text-xs font-semibold">SKU</TableHead>
                    <TableHead className="text-xs font-semibold">Insumo</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Stock</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Min</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.itemsCriticos.slice(0, 5).map((item) => (
                    <TableRow key={item.sku}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{item.sku}</TableCell>
                      <TableCell className="font-medium text-sm">{item.nombre}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-destructive font-bold">{item.stockActual}</span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">{item.stockMinimo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                  <PackageSearch className="h-6 w-6 text-green-500" />
                </div>
                <p className="font-medium text-foreground">Stock Saludable</p>
                <p className="text-sm">No hay insumos críticos actualmente.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders Table */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Pedidos Recientes
              </CardTitle>
            </div>
            <CardDescription>Últimos pedidos registrados</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             {summary.pedidosRecientes.length > 0 ? (
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[80px] text-xs font-semibold">ID</TableHead>
                      <TableHead className="text-xs font-semibold">Fecha</TableHead>
                      <TableHead className="text-xs font-semibold">Estado</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.pedidosRecientes.slice(0, 5).map((pedido) => (
                      <TableRow key={pedido.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {pedido.id.substring(0, 6).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(pedido.fechaRegistro).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            pedido.estadoProduccion === 'Listo' || pedido.estadoProduccion === 'Entregado' ? 'success' :
                            pedido.estadoProduccion === 'En Producción' ? 'info' :
                            pedido.estadoProduccion === 'Cancelado' ? 'destructive' : 'secondary'
                          } className="text-[10px] font-medium px-2 rounded-sm uppercase tracking-wider">
                            {pedido.estadoProduccion}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${pedido.total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             ) : (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                  <PackageSearch className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm">No hay pedidos recientes.</p>
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bg, 
  alert = false 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  color: string; 
  bg: string;
  alert?: boolean;
}) {
  return (
    <Card className={cn("overflow-hidden transition-all duration-200 hover:shadow-md", alert && "border-destructive ring-1 ring-destructive/20")}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground tracking-tight">{title}</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold tracking-tighter">{value}</h2>
            </div>
          </div>
          <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", bg)}>
            <Icon className={cn("h-6 w-6", color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-[250px] w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-[250px] w-full" /></CardContent>
        </Card>
      </div>
    </div>
  )
}
