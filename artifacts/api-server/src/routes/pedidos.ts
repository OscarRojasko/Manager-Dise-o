import { Router } from "express";
import { CreatePedidoBody, UpdatePedidoBody } from "@workspace/api-zod";
import { pedidos, nextPedidoId } from "../data/store.js";

const router = Router();

// GET /pedidos
router.get("/pedidos", (req, res) => {
  const { estadoProduccion, estadoPago } = req.query as Record<string, string | undefined>;
  let result = [...pedidos].sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro));
  if (estadoProduccion) {
    result = result.filter(p => p.estadoProduccion === estadoProduccion);
  }
  if (estadoPago) {
    result = result.filter(p => p.estadoPago === estadoPago);
  }
  res.json(result);
});

// POST /pedidos
router.post("/pedidos", (req, res) => {
  const parsed = CreatePedidoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    return;
  }
  const { idCliente, estadoPago, total, observaciones, detalles } = parsed.data;
  if (!Number.isFinite(total) || total < 0) {
    res.status(400).json({ error: "total debe ser un número positivo" });
    return;
  }
  const newPedido = {
    id: nextPedidoId(),
    idCliente,
    fechaRegistro: new Date().toISOString().split("T")[0],
    estadoProduccion: "Pendiente" as const,
    estadoPago,
    total,
    observaciones: observaciones ?? null,
    detalles,
  };
  pedidos.push(newPedido);
  res.status(201).json(newPedido);
});

// GET /pedidos/:id
router.get("/pedidos/:id", (req, res) => {
  const pedido = pedidos.find(p => p.id === req.params.id);
  if (!pedido) {
    res.status(404).json({ error: "Pedido no encontrado" });
    return;
  }
  res.json(pedido);
});

// PUT /pedidos/:id
router.put("/pedidos/:id", (req, res) => {
  const idx = pedidos.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Pedido no encontrado" });
    return;
  }
  const parsed = UpdatePedidoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    return;
  }
  const { estadoProduccion, estadoPago, total, observaciones, detalles } = parsed.data;
  if (total !== undefined) {
    if (!Number.isFinite(total) || total < 0) {
      res.status(400).json({ error: "total debe ser un número positivo" });
      return;
    }
    pedidos[idx].total = total;
  }
  if (estadoProduccion !== undefined) pedidos[idx].estadoProduccion = estadoProduccion;
  if (estadoPago !== undefined) pedidos[idx].estadoPago = estadoPago;
  if (observaciones !== undefined) pedidos[idx].observaciones = observaciones;
  if (detalles !== undefined) pedidos[idx].detalles = detalles;
  res.json(pedidos[idx]);
});

export default router;
