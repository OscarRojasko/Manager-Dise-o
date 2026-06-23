---
name: SIGOS Architecture
description: Key decisions for the SIGOS management system for Sublicolor C.A.
---

## Core Decision: In-memory MVP

The backend uses an in-memory data store (`artifacts/api-server/src/data/store.ts`) seeded from the original Sublicolor C.A. JSON files. No PostgreSQL is used for the initial build.

**Why:** User explicitly asked for local-first MVP for testing before implementing production storage.

**How to apply:** When user asks to add persistence, add Drizzle schema to `lib/db/src/schema/`, run `pnpm --filter @workspace/db run push`, and rewrite route handlers to use `db` from `@workspace/db` instead of the in-memory arrays.

## Validation pattern

All route handlers import Zod schemas from `@workspace/api-zod` (generated from openapi.yaml). Use `.safeParse(req.body)` and return 400 on failure. Also add manual `Number.isFinite` / `Number.isInteger` guards for numeric fields since Zod coerces only the type, not the domain constraint.

**Why:** Code review flagged NaN corruption and negative quantity stock manipulation as severe issues.

## OpenAPI spec naming

Body schemas must use entity-shaped names (e.g. `ClienteInput`, not `CreateClienteBody`) to avoid TS2308 collisions in `lib/api-zod` barrel exports.

## Data model IDs

- Inventario: SKU string key (TZ-001, TN-004, etc.)
- Clientes: CLI-NNN
- Pedidos: PED-NNNN (starts at 1001)
- Produccion: PROD-NNN
- Movimientos: MOV-NNNN
- Usuarios: USR-NNN
