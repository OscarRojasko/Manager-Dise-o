import { Router } from "express";
import { CreateProduccionBody, UpdateProduccionBody } from "@workspace/api-zod";
import { produccion, nextProduccionId } from "../data/store.js";

const router = Router();

// GET /produccion
router.get("/produccion", (req, res) => {
  const { estado } = req.query as Record<string, string | undefined>;
  let result = [...produccion].sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));
  if (estado) {
    result = result.filter(p => p.estado === estado);
  }
  res.json(result);
});

// POST /produccion
router.post("/produccion", (req, res) => {
  const parsed = CreateProduccionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    return;
  }
  const { idPedido, descripcion, operario, observaciones } = parsed.data;
  const newRecord = {
    id: nextProduccionId(),
    idPedido,
    descripcion,
    estado: "Pendiente" as const,
    operario,
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: null,
    observaciones: observaciones ?? null,
  };
  produccion.push(newRecord);
  res.status(201).json(newRecord);
});

// PUT /produccion/:id
router.put("/produccion/:id", (req, res) => {
  const idx = produccion.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Registro de producción no encontrado" });
    return;
  }
  const parsed = UpdateProduccionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    return;
  }
  const { estado, operario, observaciones, fechaFin } = parsed.data;
  if (estado !== undefined) produccion[idx].estado = estado;
  if (operario !== undefined) produccion[idx].operario = operario;
  if (observaciones !== undefined) produccion[idx].observaciones = observaciones;
  if (fechaFin !== undefined) produccion[idx].fechaFin = fechaFin;
  // Auto-set fechaFin if transitioning to Finalizado
  if (estado === "Finalizado" && !produccion[idx].fechaFin) {
    produccion[idx].fechaFin = new Date().toISOString().split("T")[0];
  }
  res.json(produccion[idx]);
});

export default router;
