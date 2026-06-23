# SIGOS — Documentación Técnica del Sistema
## Sistema de Gestión Operativa de Sublicolor C.A.

**Versión:** 1.0.0  
**Fecha:** Junio 2026  
**Clasificación:** Documento Técnico Interno  
**Estándar de referencia:** ISO/IEC 25010:2023 (SQuaRE), ISO/IEC 42010:2011 (Descripción de Arquitecturas)

---

## Tabla de Contenido

1. [Arquitectura de Software](#1-arquitectura-de-software)
   - 1.1 [Estructura del Sistema — Estilo de Arquitectura](#11-estructura-del-sistema--estilo-de-arquitectura)
   - 1.2 [Características de la Arquitectura — Criterios de Calidad ISO/IEC 25010](#12-características-de-la-arquitectura--criterios-de-calidad-isoiec-25010)
   - 1.3 [Decisiones de Arquitectura](#13-decisiones-de-arquitectura)
   - 1.4 [Principios de Diseño](#14-principios-de-diseño)
   - 1.5 [Modelado de Datos y Patrones de Arquitectura](#15-modelado-de-datos-y-patrones-de-arquitectura)
2. [Diseño de Software](#2-diseño-de-software)
   - 2.1 [Componentes de Software](#21-componentes-de-software)
   - 2.2 [Modelado de Datos Lógico](#22-modelado-de-datos-lógico)
   - 2.3 [Patrones de Diseño](#23-patrones-de-diseño)

---

## 1. Arquitectura de Software

### 1.1 Estructura del Sistema — Estilo de Arquitectura

#### 1.1.1 Visión General

SIGOS adopta una arquitectura **Cliente–Servidor desacoplada dentro de un monorepo administrado por pnpm workspaces**. Esta organización permite gestionar múltiples paquetes relacionados bajo un único repositorio versionado, compartiendo dependencias y garantizando coherencia entre el contrato de la API, la validación del servidor y el cliente generado automáticamente.

El sistema se divide en dos artefactos ejecutables independientes:

| Artefacto | Tipo | Tecnología base | Responsabilidad |
|-----------|------|-----------------|-----------------|
| `artifacts/api-server` | Backend REST | Node.js 24 + Express 5 | Lógica de negocio, validación, estado de datos |
| `artifacts/sigos` | Frontend SPA | React 18 + Vite 7 | Interfaz de usuario, visualización, interacción |

Y tres bibliotecas compartidas que no son ejecutables sino contratos y utilidades reutilizables:

| Paquete | Tipo | Contenido |
|---------|------|-----------|
| `lib/api-spec` | Especificación | OpenAPI 3.1 YAML + configuración de generación de código |
| `lib/api-client-react` | Cliente generado | Hooks React Query para consumo del API |
| `lib/api-zod` | Schemas generados | Schemas Zod para validación en tiempo de ejecución |

#### 1.1.2 Diagrama de Capas del Sistema

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              artifacts/sigos  (React SPA)                │    │
│  │                                                          │    │
│  │  ┌─────────────┐  ┌───────────────┐  ┌──────────────┐  │    │
│  │  │  App / Router│  │  Pages / Views│  │  UI Components│  │    │
│  │  │  (Wouter)   │  │  (5 módulos)  │  │  (Radix UI)  │  │    │
│  │  └──────┬──────┘  └───────┬───────┘  └──────────────┘  │    │
│  │         │                 │                              │    │
│  │  ┌──────▼─────────────────▼────────────────────────┐   │    │
│  │  │  @workspace/api-client-react  (React Query Hooks)│   │    │
│  │  └─────────────────────────┬────────────────────────┘   │    │
│  └────────────────────────────┼────────────────────────────┘    │
└───────────────────────────────┼──────────────────────────────────┘
                                │ HTTP/JSON
                                │ (path-based proxy /api/*)
┌───────────────────────────────▼──────────────────────────────────┐
│                        SERVIDOR (Node.js)                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            artifacts/api-server  (Express 5)             │    │
│  │                                                          │    │
│  │  ┌──────────────┐  ┌────────────────┐  ┌────────────┐  │    │
│  │  │  Middleware   │  │  Route Handlers│  │  Data Store│  │    │
│  │  │  (CORS, JSON,│  │  (6 dominios)  │  │ (In-Memory)│  │    │
│  │  │   Logging)   │  │               │  │            │  │    │
│  │  └──────────────┘  └───────┬────────┘  └─────┬──────┘  │    │
│  │                            │                  │         │    │
│  │  ┌─────────────────────────▼──────────────────▼──────┐  │    │
│  │  │        @workspace/api-zod  (Validación Zod)        │  │    │
│  │  └────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    CONTRATO COMPARTIDO                           │
│                                                                  │
│   lib/api-spec/openapi.yaml  →  Orval codegen  →  api-client   │
│                                               →  api-zod        │
└──────────────────────────────────────────────────────────────────┘
```

#### 1.1.3 Estilo Arquitectónico Dominante: API-First con Código Generado

El elemento más significativo de la arquitectura SIGOS es la adopción del paradigma **API-First**: el contrato de la API (`lib/api-spec/openapi.yaml`) es la fuente única de verdad (*single source of truth*) a partir de la cual se derivan automáticamente:

- Los tipos TypeScript que describen todas las entidades del sistema
- Los hooks de React Query para cada endpoint (GET, POST, PUT, DELETE)
- Los schemas Zod para validación de entradas en el servidor

Este enfoque elimina la posibilidad de divergencia entre la documentación, el cliente y el servidor, ya que cualquier modificación a la interfaz pública del sistema debe comenzar necesariamente por la especificación OpenAPI.

#### 1.1.4 Topología de Comunicación

```
                    lib/api-spec/openapi.yaml
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
  lib/api-client-react            lib/api-zod
  (hooks React Query)         (schemas Zod)
              │                         │
              ▼                         ▼
   artifacts/sigos           artifacts/api-server
   (consume la API)          (valida con Zod)
```

La comunicación entre el cliente y el servidor ocurre exclusivamente mediante HTTP/JSON. El proxy del entorno Replit enruta las peticiones al prefijo `/api/*` hacia el API server, y las demás hacia el servidor Vite del frontend.

---

### 1.2 Características de la Arquitectura — Criterios de Calidad ISO/IEC 25010

La norma **ISO/IEC 25010:2023** define el modelo de calidad de sistemas y software en ocho características principales. A continuación se evalúa cada característica en el contexto de SIGOS:

#### 1.2.1 Adecuación Funcional (*Functional Suitability*)

> Grado en que el producto provee funciones que satisfacen las necesidades declaradas e implícitas cuando se usa bajo condiciones especificadas.

| Sub-característica | Implementación en SIGOS |
|-------------------|------------------------|
| **Completitud funcional** | SIGOS cubre los cinco dominios operativos de Sublicolor C.A.: inventario, movimientos de stock, CRM de clientes, gestión de pedidos, control de producción y administración de usuarios. Cada dominio expone operaciones CRUD completas. |
| **Corrección funcional** | La lógica de negocio crítica (e.g., aplicación de movimientos de stock, cálculo de `enStockCritico`, transición de estado `Finalizado` con `fechaFin` automática) está encapsulada en el servidor y protegida por validación Zod antes de cualquier mutación de datos. |
| **Pertinencia funcional** | Los módulos del sistema se corresponden directamente con los procesos reales del taller: el Dashboard agrega KPIs operativos en tiempo real; la pantalla de Inventario combina el catálogo con el historial de movimientos; Ventas integra clientes y pedidos en una sola vista. |

#### 1.2.2 Eficiencia en el Desempeño (*Performance Efficiency*)

> Desempeño relativo a la cantidad de recursos utilizados bajo condiciones establecidas.

| Sub-característica | Implementación en SIGOS |
|-------------------|------------------------|
| **Comportamiento temporal** | El almacén en memoria (`store.ts`) elimina la latencia de red hacia una base de datos en el MVP. Las operaciones de lectura son O(n) sobre arrays en memoria, aceptables para el volumen operativo de una PYME. |
| **Utilización de recursos** | El frontend utiliza React Query con caché configurada por tipo de query (`staleTime`, `gcTime`). Las mutaciones invalidan selectivamente solo las queries afectadas, evitando refetch global innecesario. |
| **Capacidad** | La arquitectura in-memory es explícitamente de alcance MVP. La ruta de migración hacia PostgreSQL está documentada y el cliente de base de datos Drizzle (`lib/db/`) ya está disponible en el monorepo. |

#### 1.2.3 Compatibilidad (*Compatibility*)

> Grado en que el producto puede intercambiar información con otros productos y/o realizar sus funciones compartiendo el mismo entorno.

| Sub-característica | Implementación en SIGOS |
|-------------------|------------------------|
| **Interoperabilidad** | El API expone un contrato OpenAPI 3.1 estándar. Cualquier cliente HTTP puede consumir el sistema. El formato de respuesta es JSON puro con tipos bien definidos. |
| **Coexistencia** | El sistema opera en un monorepo pnpm. Los artefactos comparten el mismo proceso de build pero son deployables de forma independiente. No hay conflictos de puerto gracias a la variable de entorno `PORT` inyectada por el entorno de ejecución. |

#### 1.2.4 Usabilidad (*Usability*)

> Grado en que el producto puede ser usado por usuarios específicos para alcanzar metas específicas con efectividad, eficiencia y satisfacción.

| Sub-característica | Implementación en SIGOS |
|-------------------|------------------------|
| **Reconocibilidad apropiada** | La navegación por módulos sigue convenciones estándar de dashboards de gestión (sidebar fijo, breadcrumb implícito por módulo activo). Los iconos Lucide asociados a cada módulo refuerzan la semiótica visual. |
| **Capacidad de aprendizaje** | Los formularios de creación/edición usan dialogs modales con campos etiquetados en español venezolano. Los estados de error de la API se muestran mediante el sistema de notificaciones Sonner. |
| **Protección contra errores de usuario** | La validación Zod en el servidor retorna mensajes de error descriptivos (HTTP 400) que el cliente muestra en toast. Los campos numéricos aplican guardas de tipo y rango antes de mutar el estado. |
| **Accesibilidad** | Los componentes UI están construidos sobre Radix UI Primitives, que implementan ARIA roles, estados y propiedades siguiendo el patrón WAI-ARIA. |

#### 1.2.5 Fiabilidad (*Reliability*)

> Grado en que el sistema realiza funciones especificadas bajo condiciones especificadas durante un período de tiempo especificado.

| Sub-característica | Implementación en SIGOS |
|-------------------|------------------------|
| **Madurez** | Las mutaciones de inventario validan la suficiencia de stock antes de aplicar una Salida (retorna HTTP 400 si `stockActual < cantidad`). No existe operación que pueda generar stock negativo. |
| **Disponibilidad** | El sistema no requiere base de datos externa para operar, eliminando esa fuente de fallo en el entorno MVP. El servidor se recupera automáticamente mediante el gestor de workflows de Replit. |
| **Tolerancia a fallos** | React Query reintenta las queries fallidas con backoff exponencial por defecto. Los errores de mutación son capturados en los callbacks `onError` y surfaced al usuario sin romper el estado de la UI. |
| **Capacidad de recuperación** | Al ser in-memory, un reinicio del servidor restaura el estado inicial desde los datos semilla. Esta limitación es documentada explícitamente y resuelta en la ruta de migración a PostgreSQL. |

#### 1.2.6 Seguridad (*Security*)

> Grado en que el producto protege información y datos de modo que personas, otros productos o sistemas tengan el grado de acceso a datos apropiado a sus tipos y niveles de autorización.

| Sub-característica | Implementación en SIGOS |
|-------------------|------------------------|
| **Confidencialidad** | No se transmiten credenciales en texto plano. Las contraseñas de usuario no están modeladas en el MVP (el sistema asume una red interna de confianza). La ruta de producción requiere implementar autenticación JWT o sesiones. |
| **Integridad** | Toda mutación pasa por validación Zod con tipos estrictos. Los enums son verificados en tiempo de ejecución: valores fuera del conjunto conocido retornan HTTP 400 antes de alcanzar el almacén. |
| **No repudio** | Los movimientos de inventario registran el campo `responsable` (nombre del operador que ejecutó la operación) y la `fecha` exacta en formato ISO 8601, conformando una bitácora de auditoría. |
| **Autenticidad** | El MVP no implementa autenticación. La arquitectura está preparada para incorporarla: el middleware de Express puede interceptar el token en el header `Authorization` antes de que los routers reciban la petición. |

#### 1.2.7 Mantenibilidad (*Maintainability*)

> Grado de efectividad y eficiencia con que el producto puede ser modificado por los mantenedores.

| Sub-característica | Implementación en SIGOS |
|-------------------|------------------------|
| **Modularidad** | Cada dominio de negocio es un router Express independiente (`inventario.ts`, `clientes.ts`, `pedidos.ts`, `produccion.ts`, `usuarios.ts`). En el frontend, cada módulo es un componente de página autónomo. |
| **Reusabilidad** | Los paquetes `api-client-react` y `api-zod` son reutilizables por cualquier cliente del monorepo (e.g., una app móvil futura). Los componentes UI de `components/ui/` son atómicos y reutilizables en cualquier vista. |
| **Analizabilidad** | TypeScript 5.9 con modo estricto activo en todos los paquetes. El logging estructurado con Pino genera registros en JSON con nivel, timestamp y detalles de request/response para cada petición HTTP. |
| **Capacidad de modificación** | La adición de un nuevo endpoint requiere: (1) editar `openapi.yaml`, (2) ejecutar `orval codegen`, (3) implementar el route handler. El proceso es sistemático y no requiere modificar código existente. |
| **Capacidad de prueba** | Los route handlers son funciones puras con entrada (req) y salida (res) bien definidas. La separación del almacén en `store.ts` permite sustituirlo por un mock en pruebas sin modificar la lógica de rutas. |

#### 1.2.8 Portabilidad (*Portability*)

> Grado de efectividad y eficiencia con que el sistema puede ser transferido de un entorno a otro.

| Sub-característica | Implementación en SIGOS |
|-------------------|------------------------|
| **Adaptabilidad** | El sistema lee la configuración sensible al entorno desde variables de entorno (`PORT`, `SESSION_SECRET`). No hay rutas absolutas ni dependencias del sistema de archivos del host. |
| **Instalabilidad** | Un único `pnpm install` en la raíz del monorepo instala todas las dependencias. El build completo se ejecuta con `pnpm run build`. |
| **Reemplazabilidad** | El almacén in-memory implementa la misma interfaz de arrays tipados que implementaría un ORM. La migración a Drizzle + PostgreSQL requiere únicamente reescribir `store.ts` y los getters, manteniendo intactos los route handlers. |

---

### 1.3 Decisiones de Arquitectura

Las decisiones de arquitectura se documentan siguiendo el formato **ADR** (Architectural Decision Record).

---

#### ADR-001: Monorepo con pnpm Workspaces

**Estado:** Aceptado  
**Contexto:** El sistema requiere compartir tipos TypeScript, schemas de validación y configuración entre el frontend y el backend sin duplicar código ni publicar paquetes a un registro externo.  
**Decisión:** Adoptar pnpm workspaces con referencias de proyecto TypeScript. Cada paquete tiene su propio `package.json` con nombre `@workspace/<nombre>`.  
**Consecuencias positivas:**
- Una sola instalación de dependencias para todo el sistema.
- Importaciones entre paquetes con resolución de tipos completa en tiempo de compilación.
- Versionamiento coherente del sistema completo.

**Consecuencias negativas:**
- Mayor complejidad inicial de configuración respecto a un proyecto monolítico simple.
- Los desarrolladores deben entender el grafo de dependencias del workspace.

---

#### ADR-002: API-First con OpenAPI 3.1 y Generación de Código con Orval

**Estado:** Aceptado  
**Contexto:** En proyectos con frontend y backend separados, la duplicación manual de tipos entre cliente y servidor genera errores difíciles de detectar. Se necesita un mecanismo para garantizar que ambos extremos hablen el mismo contrato.  
**Decisión:** Definir el contrato API en `lib/api-spec/openapi.yaml` como fuente única de verdad. Usar Orval para generar automáticamente hooks React Query (`lib/api-client-react`) y schemas Zod (`lib/api-zod`) desde ese contrato.  
**Consecuencias positivas:**
- Imposibilidad de divergencia entre contrato, cliente y validación del servidor.
- La documentación del API es el código, no un artefacto separado.
- Añadir un endpoint produce automáticamente el hook y el schema correspondientes.

**Consecuencias negativas:**
- Cambios en el contrato requieren ejecutar el paso de codegen explícitamente.
- El código generado no debe editarse manualmente.

---

#### ADR-003: Almacenamiento In-Memory para el MVP

**Estado:** Aceptado (revisable para producción)  
**Contexto:** El objetivo inicial es validar la funcionalidad del sistema en un entorno local antes de comprometer infraestructura de base de datos. Se dispone de datos reales de Sublicolor C.A. para usar como semilla.  
**Decisión:** Implementar el almacén de datos como arrays TypeScript en memoria (`store.ts`) con datos semilla cargados al iniciar el servidor. No se requiere `DATABASE_URL` ni instancia de PostgreSQL.  
**Consecuencias positivas:**
- El sistema arranca sin dependencias externas.
- El tiempo de respuesta de las operaciones de lectura es mínimo (O(n) en memoria).
- Facilita el desarrollo y las pruebas locales.

**Consecuencias negativas:**
- Los datos no persisten entre reinicios del servidor.
- No escala a volúmenes grandes de datos.
- **Ruta de migración:** `store.ts` puede reemplazarse por llamadas al cliente Drizzle (`lib/db/`) manteniendo intactos los route handlers, ya que la interfaz de acceso a datos no está acoplada a la implementación.

---

#### ADR-004: Validación Zod en el Servidor con Schemas Generados

**Estado:** Aceptado  
**Contexto:** Los route handlers de Express reciben entrada no confiable desde el cuerpo HTTP. Sin validación, valores malformados (NaN, enums inválidos, negativos) pueden corromper el almacén en memoria de forma silenciosa.  
**Decisión:** Cada route handler que acepta un cuerpo de petición (POST, PUT) llama a `<Schema>.safeParse(req.body)`. Si el parseo falla, retorna HTTP 400 con la lista de errores de Zod. Para restricciones de dominio no capturables por Zod (e.g., `cantidad > 0`, `stockActual >= 0`), se aplican guardas explícitas adicionales con `Number.isInteger` y comparaciones de rango.  
**Consecuencias positivas:**
- El almacén nunca recibe datos tipados incorrectamente.
- Los mensajes de error son descriptivos y orientados al usuario (no stack traces).
- La validación es coherente con el contrato OpenAPI porque los schemas Zod se generan desde el mismo spec.

---

#### ADR-005: Routing del Frontend con Wouter

**Estado:** Aceptado  
**Contexto:** Se necesita un sistema de routing para la SPA que sea liviano y compatible con React 18 y el entorno de preview proxiado de Replit.  
**Decisión:** Usar Wouter en lugar de React Router DOM. Wouter es minimalista (< 2KB), sin dependencias externas y con una API similar a la de React Router v6.  
**Consecuencias:** Routing funcional con code-splitting implícito por módulo de página.

---

#### ADR-006: Componentes UI basados en Radix UI + Tailwind CSS (shadcn/ui)

**Estado:** Aceptado  
**Contexto:** Se necesita una biblioteca de componentes que garantice accesibilidad, sea altamente personalizable y no imponga un sistema de diseño visual rígido.  
**Decisión:** Usar el patrón shadcn/ui: componentes instalados directamente en el proyecto (`artifacts/sigos/src/components/ui/`) construidos sobre Radix UI Primitives y estilizados con Tailwind CSS utility classes.  
**Consecuencias positivas:**
- Control total sobre el código de los componentes (no son una dependencia de caja negra).
- Accesibilidad garantizada por Radix UI (WAI-ARIA).
- Personalización sin override de estilos de terceros.

---

### 1.4 Principios de Diseño

#### 1.4.1 Principio de Responsabilidad Única (SRP — Single Responsibility Principle)

Cada módulo del sistema tiene una única razón para cambiar:

- **Route handlers:** Orquestan validación → acceso al almacén → formateo de respuesta. No contienen lógica de presentación.
- **store.ts:** Gestiona exclusivamente el estado de los datos en memoria. Los cálculos derivados (`enStockCritico = stockActual <= stockMinimo`) se centralizan en la función `refreshCritico()` de este módulo.
- **Componentes de página:** Son responsables de la presentación de un módulo funcional. No contienen lógica de negocio.
- **Hooks generados:** Cada hook encapsula exactamente un endpoint de la API.

#### 1.4.2 Principio Abierto/Cerrado (OCP — Open/Closed Principle)

El sistema está abierto a extensión y cerrado a modificación:

- Añadir un nuevo dominio (e.g., Reportes, Contabilidad) requiere:
  1. Añadir paths al `openapi.yaml`.
  2. Ejecutar codegen.
  3. Crear un nuevo router Express y montarlo en `routes/index.ts`.
  4. Crear una nueva página React.
- Ninguno de estos pasos modifica código existente.

#### 1.4.3 Inversión de Dependencias (DIP — Dependency Inversion Principle)

Los route handlers dependen de la abstracción (los arrays tipados exportados por `store.ts`) y no de una implementación concreta de base de datos. Esto permite reemplazar `store.ts` por una implementación Drizzle sin tocar los handlers.

#### 1.4.4 Principio de Mínimo Conocimiento (Law of Demeter)

Los componentes React no conocen la existencia del servidor. Solo interactúan con los hooks del cliente generado. A su vez, los hooks no conocen los detalles de implementación del servidor; solo conocen la URL del endpoint y los tipos de su interfaz.

#### 1.4.5 Contrato como Fuente de Verdad (Contract-First Design)

Ningún tipo de entidad se define manualmente en el cliente ni en el servidor. Todos los tipos, schemas y hooks se derivan del `openapi.yaml`. Este principio garantiza coherencia sistémica sin coordinación manual entre equipos.

#### 1.4.6 Falla Rápida y Ruidosa (Fail Fast)

El sistema rechaza entradas inválidas en el primer punto de contacto (el route handler), antes de que el dato alcance el almacén. Los errores no se suprimen silenciosamente; se retornan como respuestas HTTP 400 con descripción detallada.

#### 1.4.7 Separación de Lógica de Negocio y Presentación

La lógica de negocio reside exclusivamente en el servidor (validación de reglas, cálculo de estados derivados, transiciones de estado de producción). El frontend es un consumidor pasivo de datos; aplica filtros locales únicamente para mejorar la experiencia de usuario (búsqueda, filtrado por categoría) sin recalcular reglas del dominio.

---

### 1.5 Modelado de Datos y Patrones de Arquitectura

#### 1.5.1 Modelo Conceptual de Entidades

A nivel de arquitectura, el dominio de SIGOS se organiza alrededor de seis entidades raíz:

```
╔══════════════════════╗         ╔══════════════════════╗
║     ItemInventario   ║         ║       Cliente        ║
║──────────────────────║         ║──────────────────────║
║  SKU (PK, string)    ║         ║  id (PK, CLI-NNN)    ║
║  nombre              ║         ║  tipo                ║
║  categoria           ║         ║  nombre              ║
║  stockActual         ║         ║  documento (RIF/CI)  ║
║  stockMinimo         ║         ║  contacto            ║
║  enStockCritico*     ║         ║  email               ║
╚══════════╤═══════════╝         ║  direccion           ║
           │                     ╚══════════╤═══════════╝
           │ 1:N                            │ 1:N
╔══════════▼═══════════╗         ╔══════════▼═══════════╗
║      Movimiento      ║         ║        Pedido        ║
║──────────────────────║         ║──────────────────────║
║  id (PK, MOV-NNNN)  ║         ║  id (PK, PED-NNNN)  ║
║  sku (FK)            ║         ║  idCliente (FK)      ║
║  tipoMovimiento      ║         ║  fechaRegistro       ║
║  cantidad            ║         ║  estadoProduccion    ║
║  fecha               ║         ║  estadoPago          ║
║  responsable         ║         ║  total               ║
║  observacion         ║         ║  observaciones       ║
╚══════════════════════╝         ║  detalles[]          ║
                                 ╚══════════╤═══════════╝
╔══════════════════════╗                   │ 1:N
║      Usuario         ║         ╔══════════▼═══════════╗
║──────────────────────║         ║   ProduccionRecord   ║
║  id (PK, USR-NNN)   ║         ║──────────────────────║
║  nombre              ║         ║  id (PK, PROD-NNN)  ║
║  rol                 ║         ║  idPedido (FK)       ║
║  email               ║         ║  descripcion         ║
║  estado              ║         ║  estado              ║
╚══════════════════════╝         ║  operario            ║
                                 ║  fechaInicio         ║
                                 ║  fechaFin*           ║
                                 ║  observaciones       ║
                                 ╚══════════════════════╝
* campo derivado / calculado automáticamente
```

#### 1.5.2 Patrón de Arquitectura: Repository (implícito)

Aunque el almacén es in-memory, el acceso a datos sigue el patrón **Repository**: los route handlers no operan directamente sobre estructuras de datos crudas; importan los arrays exportados por `store.ts` y los modifican a través de funciones utilitarias centralizadas (`refreshCritico`, `nextXxxId`). Esta indirección es el contrato que permite sustituir la implementación.

#### 1.5.3 Patrón de Arquitectura: BFF (Backend for Frontend)

El API server actúa como un **BFF**: su endpoint `/dashboard/summary` no es un recurso REST puro, sino una consulta agregada diseñada específicamente para las necesidades del Dashboard del frontend. Agrega datos de múltiples dominios (inventario, pedidos, clientes) en una sola respuesta, reduciendo el número de round-trips necesarios para renderizar la vista principal.

```
GET /api/dashboard/summary
→ {
    pedidosEnProduccion:    integer,   // conteo sobre pedidos[]
    insumosEnStockCritico:  integer,   // conteo sobre inventario[]
    totalClientes:          integer,   // conteo sobre clientes[]
    totalPedidos:           integer,   // conteo sobre pedidos[]
    totalIngresos:          number,    // suma de pedidos[].total
    pedidosPendientesPago:  integer,   // filtro sobre pedidos[]
    itemsCriticos:          ItemInventario[],  // proyección
    pedidosRecientes:       Pedido[]           // proyección
  }
```

---

## 2. Diseño de Software

### 2.1 Componentes de Software

#### 2.1.1 Árbol de Componentes del Backend

```
artifacts/api-server/
├── src/
│   ├── index.ts              [PUNTO DE ENTRADA]
│   │   └── Crea el servidor HTTP y lo vincula al puerto $PORT
│   │
│   ├── app.ts                [CONFIGURACIÓN EXPRESS]
│   │   ├── cors()            — Permite peticiones desde el origen del frontend
│   │   ├── express.json()    — Parseo de cuerpos JSON
│   │   ├── pino-http         — Logging estructurado de cada request/response
│   │   └── mount /api/*      — Prefijo global de todos los routers
│   │
│   ├── routes/
│   │   ├── index.ts          [ROUTER RAÍZ]
│   │   │   └── Monta: dashboard, inventario, clientes, pedidos, produccion, usuarios
│   │   │
│   │   ├── dashboard.ts      [AGREGADOR DE KPIs]
│   │   │   └── GET /dashboard/summary
│   │   │
│   │   ├── inventario.ts     [DOMINIO: INVENTARIO]
│   │   │   ├── GET  /inventario                   (lista con filtro por categoría)
│   │   │   ├── POST /inventario                   (crear ítem, validación Zod)
│   │   │   ├── PUT  /inventario/:sku              (actualizar ítem, validación Zod)
│   │   │   ├── DEL  /inventario/:sku              (eliminar ítem)
│   │   │   ├── GET  /inventario/movimientos       (historial con filtro por SKU)
│   │   │   └── POST /inventario/movimientos       (registrar movimiento + mutar stock)
│   │   │
│   │   ├── clientes.ts       [DOMINIO: CRM]
│   │   │   ├── GET  /clientes                     (lista con filtro por tipo)
│   │   │   ├── POST /clientes                     (crear cliente)
│   │   │   ├── GET  /clientes/:id                 (detalle por ID)
│   │   │   ├── PUT  /clientes/:id                 (actualizar cliente)
│   │   │   └── DEL  /clientes/:id                 (eliminar cliente)
│   │   │
│   │   ├── pedidos.ts        [DOMINIO: PEDIDOS/VENTAS]
│   │   │   ├── GET  /pedidos                      (lista con filtros por estado)
│   │   │   ├── POST /pedidos                      (crear pedido)
│   │   │   ├── GET  /pedidos/:id                  (detalle por ID)
│   │   │   └── PUT  /pedidos/:id                  (actualizar estado/pago)
│   │   │
│   │   ├── produccion.ts     [DOMINIO: PRODUCCIÓN]
│   │   │   ├── GET  /produccion                   (lista con filtro por estado)
│   │   │   ├── POST /produccion                   (crear registro de producción)
│   │   │   └── PUT  /produccion/:id               (actualizar estado, fechaFin auto)
│   │   │
│   │   └── usuarios.ts       [DOMINIO: USUARIOS]
│   │       ├── GET  /usuarios                     (lista completa)
│   │       ├── POST /usuarios                     (crear usuario, email único)
│   │       ├── PUT  /usuarios/:id                 (actualizar usuario)
│   │       └── DEL  /usuarios/:id                 (eliminar usuario)
│   │
│   ├── data/
│   │   └── store.ts          [ALMACÉN EN MEMORIA]
│   │       ├── Tipos TypeScript de todas las entidades
│   │       ├── Arrays exportados: inventario[], movimientos[], clientes[],
│   │       │   pedidos[], produccion[], usuarios[]
│   │       ├── Datos semilla cargados desde los JSON originales de Sublicolor C.A.
│   │       ├── Generadores de ID: nextMovimientoId(), nextClienteId(),
│   │       │   nextPedidoId(), nextProduccionId(), nextUsuarioId()
│   │       └── refreshCritico(): recalcula enStockCritico tras cada mutación
│   │
│   └── lib/
│       └── logger.ts         [PINO LOGGER]
│           └── Configuración de nivel de log y formato según NODE_ENV
```

#### 2.1.2 Árbol de Componentes del Frontend

```
artifacts/sigos/
├── src/
│   ├── main.tsx              [PUNTO DE ENTRADA REACT]
│   │   └── ReactDOM.createRoot → <App />
│   │
│   ├── App.tsx               [RAÍZ DE LA APLICACIÓN]
│   │   ├── QueryClientProvider   — Contexto React Query (caché global)
│   │   ├── TooltipProvider       — Contexto Radix UI Tooltip
│   │   ├── Router (Wouter)       — Contexto de enrutamiento
│   │   │   └── Switch
│   │   │       ├── Route "/"            → <Dashboard />
│   │   │       ├── Route "/inventario"  → <Inventario />
│   │   │       ├── Route "/ventas"      → <Ventas />
│   │   │       ├── Route "/produccion"  → <Produccion />
│   │   │       ├── Route "/usuarios"    → <Usuarios />
│   │   │       └── Route "*"            → <NotFound />
│   │   └── Toaster               — Sistema global de notificaciones (Sonner)
│   │
│   ├── components/
│   │   ├── layout.tsx            [SHELL DE LA APLICACIÓN]
│   │   │   ├── Sidebar           — Navegación principal (navItems con iconos Lucide)
│   │   │   ├── Topbar            — Barra superior con búsqueda y notificaciones
│   │   │   └── main              — Área de contenido de la página activa
│   │   │
│   │   └── ui/                   [BIBLIOTECA DE COMPONENTES ATÓMICOS]
│   │       ├── button.tsx        ├── dialog.tsx        ├── table.tsx
│   │       ├── badge.tsx         ├── form.tsx          ├── tabs.tsx
│   │       ├── card.tsx          ├── input.tsx         ├── select.tsx
│   │       ├── tooltip.tsx       ├── label.tsx         └── ... (+15 más)
│   │
│   └── pages/
│       ├── dashboard.tsx         [MÓDULO: DASHBOARD]
│       │   ├── useGetDashboardSummary()
│       │   ├── KPI Cards (6 métricas)
│       │   ├── Tabla: Insumos Críticos
│       │   └── Tabla: Pedidos Recientes
│       │
│       ├── inventario.tsx        [MÓDULO: INVENTARIO]
│       │   ├── useGetInventario(), useCreateItemInventario()
│       │   ├── useUpdateItemInventario(), useDeleteItemInventario()
│       │   ├── useGetMovimientos(), useCreateMovimiento()
│       │   ├── Tab "Catálogo": tabla con filtro por búsqueda y categoría
│       │   ├── Tab "Movimientos": historial ordenado por fecha
│       │   └── Dialogs: Crear ítem, Registrar movimiento
│       │
│       ├── ventas.tsx            [MÓDULO: VENTAS Y CRM]
│       │   ├── useGetClientes(), useCreateCliente(), useDeleteCliente()
│       │   ├── useGetPedidos(), useCreatePedido(), useUpdatePedido()
│       │   ├── Tab "Clientes": directorio con filtro por tipo
│       │   ├── Tab "Pedidos": órdenes con estados de producción y pago
│       │   └── Dialogs: Crear cliente, Crear pedido, Actualizar estado
│       │
│       ├── produccion.tsx        [MÓDULO: PRODUCCIÓN]
│       │   ├── useGetProduccion(), useCreateProduccion(), useUpdateProduccion()
│       │   ├── useGetPedidos()   — para seleccionar pedido al crear orden
│       │   ├── Vista: Kanban / tabla de órdenes con filtro por estado
│       │   └── Dialogs: Nueva orden de producción, Actualizar estado
│       │
│       └── usuarios.tsx          [MÓDULO: USUARIOS]
│           ├── useGetUsuarios(), useCreateUsuario()
│           ├── useUpdateUsuario(), useDeleteUsuario()
│           ├── Tabla de operadores con roles y estados
│           └── Dialogs: Crear usuario, Editar usuario
```

#### 2.1.3 Paquetes Compartidos — Bibliotecas del Monorepo

```
lib/
├── api-spec/
│   ├── openapi.yaml          [CONTRATO API — fuente única de verdad]
│   └── orval.config.ts       [CONFIGURACIÓN CODEGEN]
│       ├── output.client: "react-query"  → lib/api-client-react
│       └── output.client: "zod"         → lib/api-zod
│
├── api-client-react/
│   └── src/generated/
│       ├── api.ts            [HOOKS REACT QUERY GENERADOS]
│       │   ├── useGetInventario, useCreateItemInventario, ...
│       │   ├── useGetMovimientos, useCreateMovimiento, ...
│       │   ├── useGetClientes, useCreateCliente, ...
│       │   ├── useGetPedidos, useCreatePedido, useUpdatePedido, ...
│       │   ├── useGetProduccion, useCreateProduccion, useUpdateProduccion, ...
│       │   └── useGetUsuarios, useCreateUsuario, ...
│       └── api.schemas.ts    [TIPOS TYPESCRIPT GENERADOS]
│           └── ItemInventario, Movimiento, Cliente, Pedido,
│               ProduccionRecord, Usuario, DashboardSummary, ...
│
└── api-zod/
    └── src/generated/
        └── api.ts            [SCHEMAS ZOD GENERADOS]
            ├── CreateItemInventarioBody, UpdateItemInventarioBody
            ├── CreateMovimientoBody
            ├── CreateClienteBody, UpdateClienteBody
            ├── CreatePedidoBody, UpdatePedidoBody
            ├── CreateProduccionBody, UpdateProduccionBody
            └── CreateUsuarioBody, UpdateUsuarioBody
```

---

### 2.2 Modelado de Datos Lógico

#### 2.2.1 Entidades y Atributos

##### Entidad: `ItemInventario`

| Atributo | Tipo | Restricciones | Descripción |
|----------|------|---------------|-------------|
| `sku` | `string` | PK, formato `XX-NNN` | Identificador único del ítem (Stock Keeping Unit) |
| `nombre` | `string` | required, minLength: 1 | Nombre descriptivo del producto/insumo |
| `categoria` | `string (enum)` | `Insumos`, `Tintas`, `Textil`, `Papelería`, `Equipos`, `Otros` | Clasificación funcional |
| `stockActual` | `integer` | `≥ 0` | Unidades disponibles en el momento actual |
| `stockMinimo` | `integer` | `≥ 0` | Umbral de alerta de reabastecimiento |
| `enStockCritico` | `boolean` | derivado: `stockActual ≤ stockMinimo` | Bandera de alerta calculada automáticamente |

**Datos semilla (muestra):**

| SKU | Nombre | Categoría | Stock Actual | Stock Mínimo | Crítico |
|-----|--------|-----------|-------------|-------------|---------|
| TZ-001 | Taza Blanca 11oz | Insumos | 120 | 50 | No |
| TZ-002 | Taza Mágica Termosensible | Insumos | 15 | 20 | **Sí** |
| TN-004 | Tinta Sublimación Negra | Tintas | 2 | 5 | **Sí** |
| TX-015 | Gorra Tipo Camionero | Textil | 12 | 25 | **Sí** |
| PP-001 | Resma Papel Sublimación A4 | Papelería | 3 | 5 | **Sí** |

---

##### Entidad: `Movimiento`

| Atributo | Tipo | Restricciones | Descripción |
|----------|------|---------------|-------------|
| `id` | `string` | PK, formato `MOV-NNNN` | Identificador secuencial auto-generado |
| `sku` | `string` | FK → `ItemInventario.sku` | Ítem afectado por el movimiento |
| `tipoMovimiento` | `enum` | `Entrada`, `Salida`, `Ajuste` | Naturaleza del movimiento |
| `cantidad` | `integer` | `> 0` | Unidades afectadas |
| `fecha` | `string` | formato ISO 8601 | Timestamp de registro |
| `responsable` | `string` | required | Nombre del operador que ejecutó el movimiento |
| `observacion` | `string` | opcional | Comentario libre |

**Reglas de negocio sobre movimientos:**
- `Entrada`: incrementa `stockActual` en `cantidad`
- `Salida`: decrementa `stockActual` en `cantidad`; rechaza si `stockActual < cantidad`
- `Ajuste`: establece `stockActual = cantidad` directamente (corrección de inventario físico)
- Toda mutación de stock recalcula `enStockCritico` inmediatamente.

---

##### Entidad: `Cliente`

| Atributo | Tipo | Restricciones | Descripción |
|----------|------|---------------|-------------|
| `id` | `string` | PK, formato `CLI-NNN` | Identificador secuencial auto-generado |
| `tipo` | `enum` | `Natural`, `Jurídico`, `Corporativo` | Clasificación fiscal del cliente |
| `nombre` | `string` | required | Nombre o razón social |
| `documento` | `string` | required | RIF o cédula de identidad |
| `contacto` | `string` | required | Nombre de la persona de contacto |
| `email` | `string` | formato email | Correo electrónico |
| `direccion` | `string` | required | Dirección fiscal o de entrega |

---

##### Entidad: `Pedido`

| Atributo | Tipo | Restricciones | Descripción |
|----------|------|---------------|-------------|
| `id` | `string` | PK, formato `PED-NNNN` | Identificador secuencial (inicia en 1001) |
| `idCliente` | `string` | FK → `Cliente.id` | Cliente que realizó el pedido |
| `fechaRegistro` | `string` | formato YYYY-MM-DD | Fecha de creación del pedido |
| `estadoProduccion` | `enum` | `Pendiente`, `En Producción`, `Listo`, `Entregado`, `Cancelado` | Estado en el flujo de producción |
| `estadoPago` | `enum` | `Pendiente`, `Abonado`, `Pagado`, `Cancelado` | Estado financiero del pedido |
| `total` | `number` | `≥ 0` | Monto total en moneda de operación |
| `observaciones` | `string \| null` | opcional | Notas adicionales |
| `detalles` | `DetallePedido[]` | required | Ítems del pedido |

##### Sub-entidad: `DetallePedido`

| Atributo | Tipo | Restricciones | Descripción |
|----------|------|---------------|-------------|
| `sku` | `string` | FK → `ItemInventario.sku` | Producto solicitado |
| `cantidad` | `integer` | `> 0` | Cantidad solicitada |
| `precioUnitario` | `number` | `≥ 0` | Precio por unidad al momento del pedido |

**Máquina de estados — `estadoProduccion`:**
```
                    ┌──────────────┐
                    │   Pendiente  │
                    └──────┬───────┘
                           │ (iniciar producción)
                    ┌──────▼───────┐
                    │En Producción │
                    └──────┬───────┘
                           │ (producción terminada)
                    ┌──────▼───────┐
                    │    Listo     │
                    └──────┬───────┘
                           │ (entrega al cliente)
                    ┌──────▼───────┐
                    │   Entregado  │
                    └──────────────┘
                           ▲
          ┌────────────────┘ (desde cualquier estado)
          │
    ┌─────┴──────┐
    │  Cancelado │
    └────────────┘
```

---

##### Entidad: `ProduccionRecord`

| Atributo | Tipo | Restricciones | Descripción |
|----------|------|---------------|-------------|
| `id` | `string` | PK, formato `PROD-NNN` | Identificador secuencial auto-generado |
| `idPedido` | `string` | FK → `Pedido.id` | Pedido al que corresponde esta orden |
| `descripcion` | `string` | required | Descripción del trabajo a realizar |
| `estado` | `enum` | `Pendiente`, `En Proceso`, `Finalizado`, `Cancelado` | Estado de la orden de producción |
| `operario` | `string` | required | Responsable de la ejecución |
| `fechaInicio` | `string` | formato YYYY-MM-DD | Fecha de apertura de la orden |
| `fechaFin` | `string \| null` | auto-set al transicionar a `Finalizado` | Fecha de cierre |
| `observaciones` | `string \| null` | opcional | Notas del operario |

**Regla de negocio:** Cuando el campo `estado` transiciona a `Finalizado` y `fechaFin` es `null`, el servidor asigna automáticamente `fechaFin = fecha_actual`.

---

##### Entidad: `Usuario`

| Atributo | Tipo | Restricciones | Descripción |
|----------|------|---------------|-------------|
| `id` | `string` | PK, formato `USR-NNN` | Identificador secuencial auto-generado |
| `nombre` | `string` | required | Nombre completo del operador |
| `rol` | `enum` | `Admin`, `Produccion`, `Ventas`, `Inventario` | Perfil de acceso y responsabilidad |
| `email` | `string` | unique, formato email | Correo electrónico (futuro: identificador de autenticación) |
| `estado` | `enum` | `Activo`, `Inactivo` | Estado de la cuenta |

**Restricción de integridad:** No pueden existir dos usuarios con el mismo `email`. El servidor valida esta condición en `POST /usuarios` y retorna HTTP 400 si hay colisión.

---

#### 2.2.2 Diagrama Entidad-Relación Lógico

```
ITEM_INVENTARIO (sku PK)
        │
        │ 1 ─────────── N
        │
   MOVIMIENTO (id PK)
   sku FK → ITEM_INVENTARIO.sku
   tipoMovimiento: Entrada | Salida | Ajuste


CLIENTE (id PK)
        │
        │ 1 ─────────── N
        │
    PEDIDO (id PK)
    idCliente FK → CLIENTE.id
    detalles[]: [{sku, cantidad, precioUnitario}]
        │
        │ 1 ─────────── N
        │
  PRODUCCION_RECORD (id PK)
  idPedido FK → PEDIDO.id


USUARIO (id PK)
   (entidad independiente — sin FK salvo responsable en MOVIMIENTO, que es string libre)
```

#### 2.2.3 Generación de Identificadores

Los identificadores no son autoincremento de base de datos. Se calculan dinámicamente buscando el máximo sufijo numérico existente en el array correspondiente:

```typescript
// Patrón general — ejemplo para MOV-NNNN
function nextMovimientoId(): string {
  const maxNum = movimientos.reduce((max, m) => {
    const num = parseInt(m.id.split("-")[1], 10);
    return num > max ? num : max;
  }, 0);
  return `MOV-${String(maxNum + 1).padStart(4, "0")}`;
}
```

Este patrón garantiza que los IDs sean legibles por humanos, únicos dentro de la sesión, y coherentes con el formato de los datos originales de Sublicolor C.A.

---

### 2.3 Patrones de Diseño

#### 2.3.1 Patrón: Query Object (React Query)

**Contexto:** El frontend necesita obtener, cachear y sincronizar datos del servidor sin gestionar manualmente el estado de carga, error y revalidación.

**Implementación:** TanStack React Query actúa como el sistema de gestión de estado del servidor. Cada tipo de dato tiene una `queryKey` única:

```typescript
// Ejemplo simplificado del hook generado
export const useGetInventario = (params?: GetInventarioQueryParams) =>
  useQuery({
    queryKey: ["inventario", params],
    queryFn: () => fetch("/api/inventario"),
    staleTime: 30_000,  // datos frescos por 30 segundos
  });

// Al mutar, se invalida selectivamente la query afectada
export const useCreateItemInventario = () =>
  useMutation({
    mutationFn: (body: CreateItemInventarioBody) =>
      fetch("/api/inventario", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventario"] }),
  });
```

**Beneficio:** El componente React no gestiona `useState` para datos remotos. Solo consume el hook y reacciona a `isLoading`, `data` y `error`.

---

#### 2.3.2 Patrón: Strategy (Tipos de Movimiento de Inventario)

**Contexto:** Los tres tipos de movimiento de stock (`Entrada`, `Salida`, `Ajuste`) aplican transformaciones diferentes al `stockActual`.

**Implementación:** El route handler `POST /inventario/movimientos` implementa una estrategia por tipo:

```typescript
if (tipoMovimiento === "Entrada") {
  inventario[idx].stockActual += cantidad;
} else if (tipoMovimiento === "Salida") {
  if (inventario[idx].stockActual < cantidad) {
    return res.status(400).json({ error: "Stock insuficiente" });
  }
  inventario[idx].stockActual -= cantidad;
} else if (tipoMovimiento === "Ajuste") {
  inventario[idx].stockActual = cantidad; // reemplazo directo
}
inventario[idx] = refreshCritico(inventario[idx]);
```

Cada rama encapsula una estrategia de mutación distinta, validando precondiciones específicas antes de ejecutar.

---

#### 2.3.3 Patrón: Decorator (Middleware Express)

**Contexto:** Las peticiones HTTP deben procesarse con funcionalidad transversal (logging, parseo de JSON, CORS) sin que esa lógica contamine los route handlers.

**Implementación:** Express aplica una cadena de middlewares como decoradores sobre cada petición entrante, antes de que alcance cualquier router:

```typescript
app.use(cors({ origin: true }));
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use("/api", apiRouter);
```

Cada middleware "decora" el objeto `req` con datos adicionales o ejecuta efectos secundarios (logging) de forma transparente para los handlers.

---

#### 2.3.4 Patrón: Facade (BFF / Dashboard Summary)

**Contexto:** El Dashboard necesita datos de inventario, pedidos y clientes. Sin un agregador, el frontend realizaría múltiples peticiones paralelas que llegan en momentos distintos, produciendo renders parciales.

**Implementación:** El endpoint `GET /api/dashboard/summary` actúa como una fachada que consulta todos los arrays internos del almacén y retorna una estructura plana optimizada para el consumidor:

```typescript
router.get("/dashboard/summary", (req, res) => {
  const itemsCriticos = inventario.filter(i => i.enStockCritico);
  const pedidosRecientes = [...pedidos]
    .sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro))
    .slice(0, 5);
  res.json({
    pedidosEnProduccion: pedidos.filter(p => p.estadoProduccion === "En Producción").length,
    insumosEnStockCritico: itemsCriticos.length,
    totalClientes: clientes.length,
    totalPedidos: pedidos.length,
    totalIngresos: pedidos.reduce((s, p) => s + p.total, 0),
    pedidosPendientesPago: pedidos.filter(p => p.estadoPago === "Pendiente").length,
    itemsCriticos,
    pedidosRecientes,
  });
});
```

---

#### 2.3.5 Patrón: Observer (Invalidación de Caché React Query)

**Contexto:** Cuando un usuario registra un movimiento de inventario, las vistas de inventario y el dashboard deben actualizarse sin que el componente que ejecutó la mutación conozca qué otras vistas existen.

**Implementación:** React Query implementa un sistema de publicación/suscripción interno. Al llamar a `queryClient.invalidateQueries({ queryKey: ["inventario"] })` en el `onSuccess` de una mutación, todos los componentes suscritos a esa `queryKey` reciben la señal de revalidación y re-fetching automáticamente.

```typescript
// El componente Inventario NO necesita saber que el Dashboard también usa inventario
useMutation({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["inventario"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }
});
```

---

#### 2.3.6 Patrón: Compound Component (Componentes UI Radix/shadcn)

**Contexto:** Los elementos de UI complejos (Dialog, Tabs, Select) requieren múltiples sub-componentes que comparten estado implícito.

**Implementación:** Los componentes de `components/ui/` siguen el patrón Compound Component de Radix UI. El estado es gestionado por el componente raíz; los hijos se comunican mediante contexto interno:

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Nuevo Ítem</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Agregar Insumo</DialogTitle>
    </DialogHeader>
    <FormularioInventario />
  </DialogContent>
</Dialog>
```

Ningún componente hijo necesita `props` para conocer el estado `open`; lo recibe del contexto del componente raíz.

---

#### 2.3.7 Patrón: Code Generation (Generación de Código desde Especificación)

**Contexto:** Mantener sincronizados manualmente los tipos TypeScript del cliente, los schemas de validación del servidor y la documentación del API es inviable a medida que el sistema crece.

**Implementación:** Orval consume `openapi.yaml` y genera dos artefactos:

1. **`lib/api-client-react/src/generated/api.ts`** — hooks React Query tipados para cada operación del spec.
2. **`lib/api-zod/src/generated/api.ts`** — schemas Zod con todas las restricciones del spec (tipos, enums, formatos, requeridos).

La regeneración se activa con:
```bash
pnpm --filter @workspace/api-spec run codegen
```

Este patrón convierte la especificación OpenAPI en un compilador que produce código correcto por construcción.

---

*Fin del documento — SIGOS v1.0.0*  
*Sublicolor C.A. — Junio 2026*
