# SIGOS — Sistema de Gestión Operativa de Sublicolor C.A.

Sistema de gestión interna para una tienda de impresiones y diseño gráfico por sublimación. Cubre inventario, CRM, pedidos, producción y usuarios.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — inicia el API server (puerto asignado por workflow)
- `pnpm --filter @workspace/sigos run dev` — inicia el frontend React+Vite
- `pnpm run typecheck` — typecheck completo en todos los paquetes
- `pnpm run build` — typecheck + build todos los paquetes
- `pnpm --filter @workspace/api-spec run codegen` — regenera hooks React Query y schemas Zod desde el spec OpenAPI

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + TailwindCSS + shadcn/ui + Recharts + Wouter
- Backend: Express 5 (API server compartido)
- Almacenamiento: In-memory (MVP local) — seeded con datos de Sublicolor C.A.
- Validación: Zod v4 (generada desde OpenAPI spec via Orval)
- API codegen: Orval (desde `lib/api-spec/openapi.yaml`)

## Where things live

- `lib/api-spec/openapi.yaml` — fuente de verdad de todos los contratos API
- `lib/api-client-react/src/generated/` — hooks React Query generados (no editar manualmente)
- `lib/api-zod/src/generated/` — schemas Zod de validación (no editar manualmente)
- `artifacts/api-server/src/data/store.ts` — almacén in-memory con datos semilla
- `artifacts/api-server/src/routes/` — route handlers Express (dashboard, inventario, clientes, pedidos, produccion, usuarios)
- `artifacts/sigos/src/` — frontend React SPA con módulos por página

## Módulos del sistema

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Dashboard | `/` | KPIs en tiempo real: pedidos en producción, insumos críticos, clientes, ingresos |
| Inventario | `/inventario` | Catálogo de insumos (SKU) + historial de movimientos de stock |
| Ventas y CRM | `/ventas` | Directorio de clientes + gestión de órdenes/pedidos |
| Producción | `/produccion` | Órdenes de producción con estados (Pendiente → En Proceso → Finalizado) |
| Usuarios | `/usuarios` | Gestión de usuarios y roles (Admin, Produccion, Ventas, Inventario) |

## Architecture decisions

- **MVP local sin base de datos**: El almacenamiento es in-memory en el API server, seeded con los datos originales de Sublicolor C.A. Los datos se reinician al reiniciar el server. Para persistencia en producción, migrar a PostgreSQL con Drizzle (ya configurado en `lib/db/`).
- **Validación con Zod generada**: Todos los route handlers usan los schemas Zod de `@workspace/api-zod` para validar inputs antes de procesar, garantizando integridad de datos y cumplimiento del contrato OpenAPI.
- **In-memory + movimiento de stock**: `POST /inventario/movimientos` aplica el movimiento (Entrada/Salida/Ajuste) directamente al stock del ítem y actualiza la bandera `enStockCritico` automáticamente.
- **OpenAPI-first**: El spec en `lib/api-spec/openapi.yaml` es la única fuente de verdad. Cambios en endpoints requieren: editar el spec → correr codegen → implementar el route handler.

## User preferences

- Prioridad en funcionalidad sobre cualquier otra métrica
- Sistema en español (Venezuela)
- Sin base de datos para pruebas locales iniciales
- Pilares tecnológicos: HTML5, CSS, JavaScript/TypeScript, JSON

## Gotchas

- Después de cambiar `lib/api-spec/openapi.yaml`, siempre correr: `pnpm --filter @workspace/api-spec run codegen`
- El API server usa almacenamiento in-memory: reiniciarlo borra los cambios hechos en runtime
- Para verificar la app con curl: usar `localhost:80/api/...` (no el puerto directo del service)
- No usar `pnpm run dev` en la raíz del workspace

## Pointers

- Ver skill `pnpm-workspace` para estructura del workspace, TypeScript y paquetes compartidos
- Ver `lib/db/` para migrar a PostgreSQL con Drizzle cuando se requiera persistencia
