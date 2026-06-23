import { Router } from "express";
import { inventario, clientes, pedidos } from "../data/store.js";

const router = Router();

router.get("/dashboard/summary", (_req, res) => {
  const pedidosEnProduccion = pedidos.filter(p => p.estadoProduccion === "En Producción").length;
  const insumosEnStockCritico = inventario.filter(i => i.enStockCritico).length;
  const totalClientes = clientes.length;
  const totalPedidos = pedidos.length;
  const totalIngresos = pedidos
    .filter(p => p.estadoPago === "Pagado")
    .reduce((sum, p) => sum + p.total, 0);
  const pedidosPendientesPago = pedidos.filter(
    p => p.estadoPago === "Pendiente" || p.estadoPago === "Abonado"
  ).length;

  const itemsCriticos = inventario
    .filter(i => i.enStockCritico)
    .slice(0, 5);

  const pedidosRecientes = [...pedidos]
    .sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro))
    .slice(0, 5);

  res.json({
    pedidosEnProduccion,
    insumosEnStockCritico,
    totalClientes,
    totalPedidos,
    totalIngresos,
    pedidosPendientesPago,
    itemsCriticos,
    pedidosRecientes,
  });
});

export default router;
