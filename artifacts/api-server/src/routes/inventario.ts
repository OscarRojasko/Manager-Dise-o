import { Router } from "express";
import {
  CreateItemInventarioBody,
  UpdateItemInventarioBody,
  CreateMovimientoBody,
} from "@workspace/api-zod";
import {
  inventario,
  movimientos,
  nextMovimientoId,
  refreshCritico,
  type ItemInventario,
  type Movimiento,
} from "../data/store.js";

const router = Router();

// GET /inventario
router.get("/inventario", (req, res) => {
  const { categoria } = req.query as Record<string, string | undefined>;
  let result = [...inventario];
  if (categoria) {
    result = result.filter(
      i => i.categoria.toLowerCase() === categoria.toLowerCase()
    );
  }
  res.json(result);
});

// POST /inventario
router.post("/inventario", (req, res) => {
  const parsed = CreateItemInventarioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    return;
  }
  const { sku, nombre, categoria, stockActual, stockMinimo } = parsed.data;
  if (!Number.isInteger(stockActual) || stockActual < 0) {
    res.status(400).json({ error: "stockActual debe ser un entero >= 0" });
    return;
  }
  if (!Number.isInteger(stockMinimo) || stockMinimo < 0) {
    res.status(400).json({ error: "stockMinimo debe ser un entero >= 0" });
    return;
  }
  if (inventario.find(i => i.sku === sku)) {
    res.status(400).json({ error: "Ya existe un ítem con ese SKU" });
    return;
  }
  const newItem: ItemInventario = refreshCritico({
    sku,
    nombre,
    categoria,
    stockActual,
    stockMinimo,
    enStockCritico: false,
  });
  inventario.push(newItem);
  res.status(201).json(newItem);
});

// GET /inventario/movimientos — must be declared BEFORE /:sku
router.get("/inventario/movimientos", (req, res) => {
  const { sku } = req.query as Record<string, string | undefined>;
  let result = [...movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  if (sku) {
    result = result.filter(m => m.sku === sku);
  }
  res.json(result);
});

// POST /inventario/movimientos
router.post("/inventario/movimientos", (req, res) => {
  const parsed = CreateMovimientoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    return;
  }
  const { sku, tipoMovimiento, cantidad, responsable, observacion } = parsed.data;

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    res.status(400).json({ error: "cantidad debe ser un entero positivo (> 0)" });
    return;
  }

  const idx = inventario.findIndex(i => i.sku === sku);
  if (idx === -1) {
    res.status(400).json({ error: `SKU ${sku} no encontrado en inventario` });
    return;
  }

  // Apply the movement to the stock
  if (tipoMovimiento === "Entrada") {
    inventario[idx].stockActual += cantidad;
  } else if (tipoMovimiento === "Salida") {
    if (inventario[idx].stockActual < cantidad) {
      res.status(400).json({ error: "Stock insuficiente para registrar esta salida" });
      return;
    }
    inventario[idx].stockActual -= cantidad;
  } else if (tipoMovimiento === "Ajuste") {
    inventario[idx].stockActual = cantidad;
  }
  inventario[idx] = refreshCritico(inventario[idx]);

  const newMovimiento: Movimiento = {
    id: nextMovimientoId(),
    sku,
    tipoMovimiento,
    cantidad,
    fecha: new Date().toISOString(),
    responsable,
    observacion: observacion ?? "",
  };
  movimientos.push(newMovimiento);
  res.status(201).json(newMovimiento);
});

// PUT /inventario/:sku
router.put("/inventario/:sku", (req, res) => {
  const { sku } = req.params;
  const parsed = UpdateItemInventarioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    return;
  }
  const idx = inventario.findIndex(i => i.sku === sku);
  if (idx === -1) {
    res.status(404).json({ error: "Ítem no encontrado" });
    return;
  }
  const { nombre, categoria, stockActual, stockMinimo } = parsed.data;

  if (stockActual !== undefined) {
    if (!Number.isInteger(stockActual) || stockActual < 0) {
      res.status(400).json({ error: "stockActual debe ser un entero >= 0" });
      return;
    }
    inventario[idx].stockActual = stockActual;
  }
  if (stockMinimo !== undefined) {
    if (!Number.isInteger(stockMinimo) || stockMinimo < 0) {
      res.status(400).json({ error: "stockMinimo debe ser un entero >= 0" });
      return;
    }
    inventario[idx].stockMinimo = stockMinimo;
  }
  if (nombre !== undefined) inventario[idx].nombre = nombre;
  if (categoria !== undefined) inventario[idx].categoria = categoria;
  inventario[idx] = refreshCritico(inventario[idx]);
  res.json(inventario[idx]);
});

// DELETE /inventario/:sku
router.delete("/inventario/:sku", (req, res) => {
  const { sku } = req.params;
  const idx = inventario.findIndex(i => i.sku === sku);
  if (idx === -1) {
    res.status(404).json({ error: "Ítem no encontrado" });
    return;
  }
  inventario.splice(idx, 1);
  res.status(204).send();
});

export default router;
