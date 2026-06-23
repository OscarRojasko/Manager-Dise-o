// ============================================================
// SIGOS — In-memory data store (MVP local)
// Seeded from the original JSON data files of Sublicolor C.A.
// ============================================================

export interface ItemInventario {
  sku: string;
  nombre: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  enStockCritico: boolean;
}

export interface Movimiento {
  id: string;
  sku: string;
  tipoMovimiento: "Entrada" | "Salida" | "Ajuste";
  cantidad: number;
  fecha: string;
  responsable: string;
  observacion: string;
}

export interface Cliente {
  id: string;
  tipo: "Natural" | "Jurídico" | "Corporativo";
  nombre: string;
  documento: string;
  contacto: string;
  email: string;
  direccion: string;
}

export interface DetallePedido {
  sku: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Pedido {
  id: string;
  idCliente: string;
  fechaRegistro: string;
  estadoProduccion: "Pendiente" | "En Producción" | "Listo" | "Entregado" | "Cancelado";
  estadoPago: "Pendiente" | "Abonado" | "Pagado" | "Cancelado";
  total: number;
  observaciones: string | null;
  detalles: DetallePedido[];
}

export interface ProduccionRecord {
  id: string;
  idPedido: string;
  descripcion: string;
  estado: "Pendiente" | "En Proceso" | "Finalizado" | "Cancelado";
  operario: string;
  fechaInicio: string;
  fechaFin: string | null;
  observaciones: string | null;
}

export interface Usuario {
  id: string;
  nombre: string;
  rol: "Admin" | "Produccion" | "Ventas" | "Inventario";
  email: string;
  estado: "Activo" | "Inactivo";
}

// ---- Seed data from original Sublicolor C.A. JSON files ----

function makeInventario(): ItemInventario[] {
  const raw = [
    { sku: "TZ-001", nombre: "Taza Blanca 11oz", categoria: "Insumos", stockActual: 120, stockMinimo: 50 },
    { sku: "TZ-002", nombre: "Taza Mágica Termosensible", categoria: "Insumos", stockActual: 15, stockMinimo: 20 },
    { sku: "TN-004", nombre: "Tinta Sublimación Negra", categoria: "Tintas", stockActual: 2, stockMinimo: 5 },
    { sku: "TN-005", nombre: "Tinta Sublimación Cyan", categoria: "Tintas", stockActual: 8, stockMinimo: 5 },
    { sku: "TX-010", nombre: "Franela Cuello Redondo Blanca (M)", categoria: "Textil", stockActual: 45, stockMinimo: 30 },
    { sku: "TX-015", nombre: "Gorra Tipo Camionero (Frente Blanco)", categoria: "Textil", stockActual: 12, stockMinimo: 25 },
    { sku: "PP-001", nombre: "Resma Papel Sublimación A4", categoria: "Papelería", stockActual: 3, stockMinimo: 5 },
    { sku: "AC-001", nombre: "Cinta Térmica Alta Temperatura", categoria: "Accesorios", stockActual: 10, stockMinimo: 10 },
  ];
  return raw.map(item => ({ ...item, enStockCritico: item.stockActual <= item.stockMinimo }));
}

export const inventario: ItemInventario[] = makeInventario();

export const movimientos: Movimiento[] = [
  {
    id: "MOV-0001",
    sku: "TZ-001",
    tipoMovimiento: "Entrada",
    cantidad: 100,
    fecha: "2026-06-01T08:30:00",
    responsable: "USR-001",
    observacion: "Compra a proveedor principal",
  },
  {
    id: "MOV-0002",
    sku: "TN-004",
    tipoMovimiento: "Salida",
    cantidad: 1,
    fecha: "2026-06-02T10:15:00",
    responsable: "USR-002",
    observacion: "Uso en orden PED-1001",
  },
  {
    id: "MOV-0003",
    sku: "TX-015",
    tipoMovimiento: "Entrada",
    cantidad: 20,
    fecha: "2026-06-05T09:00:00",
    responsable: "USR-001",
    observacion: "Compra a proveedor textil",
  },
  {
    id: "MOV-0004",
    sku: "PP-001",
    tipoMovimiento: "Salida",
    cantidad: 2,
    fecha: "2026-06-10T14:00:00",
    responsable: "USR-002",
    observacion: "Uso en trabajos de semana",
  },
];

export const clientes: Cliente[] = [
  {
    id: "CLI-001",
    tipo: "Jurídico",
    nombre: "Agencia Creativa C.A.",
    documento: "J-123456789",
    contacto: "0414-1234567",
    email: "compras@agenciacreativa.com",
    direccion: "Av. Principal, Valera",
  },
  {
    id: "CLI-002",
    tipo: "Natural",
    nombre: "María Pérez",
    documento: "V-20123456",
    contacto: "0424-9876543",
    email: "mariap@email.com",
    direccion: "La Puerta, Trujillo",
  },
  {
    id: "CLI-003",
    tipo: "Corporativo",
    nombre: "Distribuidora El Sol C.A.",
    documento: "J-987654321",
    contacto: "0416-5554433",
    email: "ventas@elsol.com",
    direccion: "Zona Industrial, Valera",
  },
];

export const pedidos: Pedido[] = [
  {
    id: "PED-1001",
    idCliente: "CLI-001",
    fechaRegistro: "2026-06-02",
    estadoProduccion: "En Producción",
    estadoPago: "Abonado",
    total: 150.0,
    observaciones: "Urgente para evento corporativo",
    detalles: [
      { sku: "TZ-001", cantidad: 50, precioUnitario: 2.5 },
      { sku: "TN-004", cantidad: 1, precioUnitario: 25.0 },
    ],
  },
  {
    id: "PED-1002",
    idCliente: "CLI-002",
    fechaRegistro: "2026-06-10",
    estadoProduccion: "Pendiente",
    estadoPago: "Pendiente",
    total: 45.0,
    observaciones: null,
    detalles: [
      { sku: "TX-010", cantidad: 3, precioUnitario: 15.0 },
    ],
  },
  {
    id: "PED-1003",
    idCliente: "CLI-003",
    fechaRegistro: "2026-06-15",
    estadoProduccion: "Listo",
    estadoPago: "Pagado",
    total: 320.0,
    observaciones: "Incluye diseño personalizado",
    detalles: [
      { sku: "TX-010", cantidad: 12, precioUnitario: 15.0 },
      { sku: "TX-015", cantidad: 8, precioUnitario: 20.0 },
    ],
  },
  {
    id: "PED-1004",
    idCliente: "CLI-001",
    fechaRegistro: "2026-06-20",
    estadoProduccion: "En Producción",
    estadoPago: "Abonado",
    total: 200.0,
    observaciones: "Segunda parte del pedido corporativo",
    detalles: [
      { sku: "TZ-002", cantidad: 20, precioUnitario: 10.0 },
    ],
  },
];

export const produccion: ProduccionRecord[] = [
  {
    id: "PROD-001",
    idPedido: "PED-1001",
    descripcion: "Sublimación de 50 tazas con logo Agencia Creativa",
    estado: "En Proceso",
    operario: "USR-002",
    fechaInicio: "2026-06-03",
    fechaFin: null,
    observaciones: "Prioridad alta — evento el 20/06",
  },
  {
    id: "PROD-002",
    idPedido: "PED-1003",
    descripcion: "Estampado de 12 franelas + 8 gorras Distribuidora El Sol",
    estado: "Finalizado",
    operario: "USR-002",
    fechaInicio: "2026-06-16",
    fechaFin: "2026-06-19",
    observaciones: null,
  },
  {
    id: "PROD-003",
    idPedido: "PED-1004",
    descripcion: "Sublimación de 20 tazas mágicas — segunda entrega",
    estado: "Pendiente",
    operario: "USR-002",
    fechaInicio: "2026-06-21",
    fechaFin: null,
    observaciones: null,
  },
];

export const usuarios: Usuario[] = [
  {
    id: "USR-001",
    nombre: "Administrador Principal",
    rol: "Admin",
    email: "admin@sublicolor.com",
    estado: "Activo",
  },
  {
    id: "USR-002",
    nombre: "Operador de Taller",
    rol: "Produccion",
    email: "taller@sublicolor.com",
    estado: "Activo",
  },
  {
    id: "USR-003",
    nombre: "Asesora de Ventas",
    rol: "Ventas",
    email: "ventas@sublicolor.com",
    estado: "Activo",
  },
];

// ---- ID generators ----

export function nextMovimientoId(): string {
  const nums = movimientos.map(m => parseInt(m.id.replace("MOV-", ""), 10)).filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `MOV-${String(max + 1).padStart(4, "0")}`;
}

export function nextClienteId(): string {
  const nums = clientes.map(c => parseInt(c.id.replace("CLI-", ""), 10)).filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `CLI-${String(max + 1).padStart(3, "0")}`;
}

export function nextPedidoId(): string {
  const nums = pedidos.map(p => parseInt(p.id.replace("PED-", ""), 10)).filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 1000;
  return `PED-${max + 1}`;
}

export function nextProduccionId(): string {
  const nums = produccion.map(p => parseInt(p.id.replace("PROD-", ""), 10)).filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `PROD-${String(max + 1).padStart(3, "0")}`;
}

export function nextUsuarioId(): string {
  const nums = usuarios.map(u => parseInt(u.id.replace("USR-", ""), 10)).filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `USR-${String(max + 1).padStart(3, "0")}`;
}

export function refreshCritico(item: ItemInventario): ItemInventario {
  return { ...item, enStockCritico: item.stockActual <= item.stockMinimo };
}
