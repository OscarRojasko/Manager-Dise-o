import { Router } from "express";
import { CreateClienteBody, UpdateClienteBody } from "@workspace/api-zod";
import { clientes, nextClienteId } from "../data/store.js";

const router = Router();

// GET /clientes
router.get("/clientes", (req, res) => {
  const { tipo } = req.query as Record<string, string | undefined>;
  let result = [...clientes];
  if (tipo) {
    result = result.filter(c => c.tipo.toLowerCase() === tipo.toLowerCase());
  }
  res.json(result);
});

// POST /clientes
router.post("/clientes", (req, res) => {
  const parsed = CreateClienteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    return;
  }
  const { tipo, nombre, documento, contacto, email, direccion } = parsed.data;
  const newCliente = {
    id: nextClienteId(),
    tipo,
    nombre,
    documento,
    contacto,
    email,
    direccion,
  };
  clientes.push(newCliente);
  res.status(201).json(newCliente);
});

// GET /clientes/:id
router.get("/clientes/:id", (req, res) => {
  const cliente = clientes.find(c => c.id === req.params.id);
  if (!cliente) {
    res.status(404).json({ error: "Cliente no encontrado" });
    return;
  }
  res.json(cliente);
});

// PUT /clientes/:id
router.put("/clientes/:id", (req, res) => {
  const idx = clientes.findIndex(c => c.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Cliente no encontrado" });
    return;
  }
  const parsed = UpdateClienteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    return;
  }
  const { tipo, nombre, documento, contacto, email, direccion } = parsed.data;
  if (tipo !== undefined) clientes[idx].tipo = tipo;
  if (nombre !== undefined) clientes[idx].nombre = nombre;
  if (documento !== undefined) clientes[idx].documento = documento;
  if (contacto !== undefined) clientes[idx].contacto = contacto;
  if (email !== undefined) clientes[idx].email = email;
  if (direccion !== undefined) clientes[idx].direccion = direccion;
  res.json(clientes[idx]);
});

// DELETE /clientes/:id
router.delete("/clientes/:id", (req, res) => {
  const idx = clientes.findIndex(c => c.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Cliente no encontrado" });
    return;
  }
  clientes.splice(idx, 1);
  res.status(204).send();
});

export default router;
