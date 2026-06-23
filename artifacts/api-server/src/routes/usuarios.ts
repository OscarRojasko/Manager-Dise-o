import { Router } from "express";
import { CreateUsuarioBody, UpdateUsuarioBody } from "@workspace/api-zod";
import { usuarios, nextUsuarioId } from "../data/store.js";

const router = Router();

// GET /usuarios
router.get("/usuarios", (_req, res) => {
  res.json([...usuarios]);
});

// POST /usuarios
router.post("/usuarios", (req, res) => {
  const parsed = CreateUsuarioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    return;
  }
  const { nombre, rol, email, estado } = parsed.data;
  if (usuarios.find(u => u.email === email)) {
    res.status(400).json({ error: "Ya existe un usuario con ese email" });
    return;
  }
  const newUsuario = { id: nextUsuarioId(), nombre, rol, email, estado };
  usuarios.push(newUsuario);
  res.status(201).json(newUsuario);
});

// PUT /usuarios/:id
router.put("/usuarios/:id", (req, res) => {
  const idx = usuarios.findIndex(u => u.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }
  const parsed = UpdateUsuarioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    return;
  }
  const { nombre, rol, email, estado } = parsed.data;
  if (nombre !== undefined) usuarios[idx].nombre = nombre;
  if (rol !== undefined) usuarios[idx].rol = rol;
  if (email !== undefined) usuarios[idx].email = email;
  if (estado !== undefined) usuarios[idx].estado = estado;
  res.json(usuarios[idx]);
});

// DELETE /usuarios/:id
router.delete("/usuarios/:id", (req, res) => {
  const idx = usuarios.findIndex(u => u.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }
  usuarios.splice(idx, 1);
  res.status(204).send();
});

export default router;
