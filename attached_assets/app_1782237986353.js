const INVENTARIO_STORAGE_KEY = 'sigos_inventario';

async function inicializarSistema() {
    const menuLinks = document.querySelectorAll('.main-nav a');

    // REGISTRO DE VISTAS
    const vistas = {
        'Dashboard': document.getElementById('vista-Dashboard'),
        'Inventario': document.getElementById('vista-Inventario'),
        'Ventas y CRM': document.getElementById('vista-ventas-crm'),
        'Producción': document.getElementById('vista-Producción'),
        'Usuarios': document.getElementById('vista-Usuarios')
    };

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const nombreVistaSeleccionada = e.target.textContent.trim();

            if (!vistas[nombreVistaSeleccionada]) {
                console.log('Vista en construcción...');
                return;
            }

            menuLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');

            Object.values(vistas).forEach(vista => {
                if (vista) {
                    vista.classList.remove('vista-activa');
                    vista.classList.add('vista-oculta');
                }
            });

            vistas[nombreVistaSeleccionada].classList.remove('vista-oculta');
            vistas[nombreVistaSeleccionada].classList.add('vista-activa');
        });
    });

   const btnNuevoRegistro = document.getElementById('btn-nuevo-registro');
    if (btnNuevoRegistro) btnNuevoRegistro.addEventListener('click', crearNuevoRegistro);

    const btnNuevoCliente = document.getElementById('btn-nuevo-cliente');
if (btnNuevoCliente) {
    btnNuevoCliente.addEventListener('click', inyectarClienteDePrueba);
}
    
    const btnNuevoPedido = document.getElementById('btn-nuevo-pedido');
    if (btnNuevoPedido) btnNuevoPedido.addEventListener('click', crearNuevoPedido);

    // --- RENDERIZADO INICIAL ---
    await renderizarTabla();                 // Tabla de Inventario
    await renderizarTablaClientes();         // Tabla de Clientes
    await renderizarTablaPedidos();          // Tabla de Pedidos
    await actualizarDashboard();             // Contadores del Panel Principal
    inicializarTabsCRM();
}

document.addEventListener('DOMContentLoaded', inicializarSistema);

// ==========================================
// SIMULACIÓN DE BASE DE DATOS JSON (MVP)
// ==========================================

const inventarioInicialJSON = [
    { sku: 'TZ-001', nombre: 'Taza Blanca 11oz', categoria: 'Insumos', stockActual: 120, stockMinimo: 50 },
    { sku: 'TN-004', nombre: 'Tinta Sublimación Negra', categoria: 'Tintas', stockActual: 2, stockMinimo: 5 }
];

function guardarInventario(datos) {
    const datosString = JSON.stringify(datos);
    localStorage.setItem(INVENTARIO_STORAGE_KEY, datosString);
    console.log('Inventario guardado exitosamente.');
}

async function cargarInventario() {
    const datosString = localStorage.getItem(INVENTARIO_STORAGE_KEY);

    if (datosString) {
        return JSON.parse(datosString);
    }

    try {
        const response = await fetch('DATA/inventario.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const datos = await response.json();
        guardarInventario(datos);
        return datos;
    } catch (error) {
        console.warn('No se pudo cargar DATA/inventario.json, usando datos iniciales.', error);
        guardarInventario(inventarioInicialJSON);
        return inventarioInicialJSON;
    }
}

function agregarInventario(nuevoItem) {
    const inventarioActual = JSON.parse(localStorage.getItem(INVENTARIO_STORAGE_KEY) || '[]');
    inventarioActual.push(nuevoItem);
    guardarInventario(inventarioActual);
    return inventarioActual;
}

async function renderizarTabla() {
    const datosInventario = await cargarInventario();
    const tbody = document.getElementById('tabla-inventario-body');
    tbody.innerHTML = '';

    datosInventario.forEach(item => {
        const alertaHTML = item.stockActual <= item.stockMinimo
            ? `<span class="badge-alerta">${item.stockMinimo}</span>`
            : item.stockMinimo;

        const fila = `
            <tr>
                <td>${item.sku}</td>
                <td>${item.nombre}</td>
                <td>${item.categoria}</td>
                <td>${item.stockActual}</td>
                <td>${alertaHTML}</td>
                <td>
                    <button class="btn-secondary btn-restar" data-sku="${item.sku}" style="padding: 5px 10px; font-size: 0.8rem;">-1 Stock</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });

    asignarEventosBotones();
}

function asignarEventosBotones() {
    const botonesRestar = document.querySelectorAll('.btn-restar');

    botonesRestar.forEach(boton => {
        boton.addEventListener('click', async (e) => {
            const skuSeleccionado = e.target.getAttribute('data-sku');
            let inventarioActual = await cargarInventario();
            const productoIndex = inventarioActual.findIndex(p => p.sku === skuSeleccionado);

            if (productoIndex !== -1 && inventarioActual[productoIndex].stockActual > 0) {
                inventarioActual[productoIndex].stockActual -= 1;
                guardarInventario(inventarioActual);
                await renderizarTabla();
            }
        });
    });
}

function crearNuevoRegistro() {
    const sku = prompt('Ingresa el SKU del producto:');
    if (!sku) return;

    const nombre = prompt('Ingresa el nombre del producto:');
    if (!nombre) return;

    const categoria = prompt('Ingresa la categoría:');
    if (!categoria) return;

    const stockActual = Number(prompt('Ingresa el stock actual:'));
    if (Number.isNaN(stockActual) || stockActual < 0) {
        alert('Stock actual inválido. Usa un número mayor o igual a 0.');
        return;
    }

    const stockMinimo = Number(prompt('Ingresa el stock mínimo:'));
    if (Number.isNaN(stockMinimo) || stockMinimo < 0) {
        alert('Stock mínimo inválido. Usa un número mayor o igual a 0.');
        return;
    }

    agregarInventario({ sku, nombre, categoria, stockActual, stockMinimo });
    renderizarTabla();
}

// ==========================================
// MÓDULO: VENTAS Y CRM (Clientes)
// ==========================================

const CLIENTES_STORAGE_KEY = 'sigos_clientes';

// Datos por defecto para el MVP si no hay archivo JSON cargado
const clientesInicialJSON = [
    { id: "CLI-001", tipo: "Jurídico", nombre: "Agencia Creativa C.A.", documento: "J-123456789", contacto: "0414-1234567", email: "compras@agenciacreativa.com", direccion: "Av. Principal, Valera" },
    { id: "CLI-002", tipo: "Natural", nombre: "María Pérez", documento: "V-20123456", contacto: "0424-9876543", email: "mariap@email.com", direccion: "La Puerta, Trujillo" }
];

function guardarClientes(datos) {
    localStorage.setItem(CLIENTES_STORAGE_KEY, JSON.stringify(datos));
    console.log('Clientes guardados exitosamente.');
}

async function cargarClientes() {
    const datosString = localStorage.getItem(CLIENTES_STORAGE_KEY);
    if (datosString) {
        return JSON.parse(datosString);
    }
    
    // Si no existen en memoria, usamos los datos iniciales
    guardarClientes(clientesInicialJSON);
    return clientesInicialJSON;
}

function agregarCliente(nuevoCliente) {
    const clientesActuales = JSON.parse(localStorage.getItem(CLIENTES_STORAGE_KEY) || '[]');
    clientesActuales.push(nuevoCliente);
    guardarClientes(clientesActuales);
}

async function renderizarTablaClientes() {
    const datosClientes = await cargarClientes();
    const tbody = document.getElementById('tabla-clientes-body');
    
    // Verificamos que el tbody exista antes de renderizar (evita errores en otras vistas)
    if (!tbody) return; 
    
    tbody.innerHTML = '';

    datosClientes.forEach(cliente => {
        const fila = `
            <tr>
                <td><strong>${cliente.id}</strong></td>
                <td>${cliente.nombre}</td>
                <td><span style="background: #e9ecef; padding: 3px 8px; border-radius: 4px; font-size: 0.85rem;">${cliente.tipo}</span></td>
                <td>${cliente.contacto}</td>
                <td>${cliente.documento}</td>
                <td>
                    <button class="btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;">Ver Detalles</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}

function crearNuevoCliente() {
    const nombre = prompt('Ingresa el Nombre o Razón Social:');
    if (!nombre) return;

    const tipo = prompt('Ingresa el tipo (Natural o Jurídico):');
    if (!tipo) return;

    const documento = prompt('Ingresa el documento (Cédula o RIF):');
    const contacto = prompt('Ingresa el teléfono de contacto:');
    
    // Generador simple de ID para MVP (ej. CLI-003)
    const clientesActuales = JSON.parse(localStorage.getItem(CLIENTES_STORAGE_KEY) || '[]');
    const nuevoId = `CLI-00${clientesActuales.length + 1}`;

    agregarCliente({ 
        id: nuevoId, 
        nombre: nombre, 
        tipo: tipo, 
        documento: documento || "N/A", 
        contacto: contacto || "N/A",
        email: "Pendiente",
        direccion: "Pendiente"
    });
    
    renderizarTablaClientes();
}

// ==========================================
// LÓGICA DE PESTAÑAS (TABS) INTERNAS
// ==========================================
function inicializarTabsCRM() {
    const tabs = document.querySelectorAll('.btn-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // 1. Quitar estilos activos de todos los botones
            tabs.forEach(t => {
                t.style.color = 'var(--texto-secundario)';
                t.style.borderBottom = 'none';
            });
            
            // 2. Dar estilo activo al botón clickeado
            e.target.style.color = 'var(--color-azul-oscuro)';
            e.target.style.borderBottom = '3px solid var(--color-azul-claro)';
            
            // 3. Ocultar todos los contenidos de las pestañas
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            
            // 4. Mostrar el contenido correspondiente
            const targetId = e.target.getAttribute('data-target');
            document.getElementById(targetId).style.display = 'block';
        });
    });
}

// ==========================================
// MÓDULO: GESTIÓN DE PEDIDOS
// ==========================================
const PEDIDOS_STORAGE_KEY = 'sigos_pedidos';

// Datos de prueba para Pedidos
const pedidosInicialJSON = [
    { id: "PED-1001", idCliente: "CLI-001", fechaRegistro: "2026-06-02", estadoProduccion: "En Producción", estadoPago: "Abonado", total: 150.00 }
];

function guardarPedidos(datos) {
    localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(datos));
}

async function cargarPedidos() {
    const datosString = localStorage.getItem(PEDIDOS_STORAGE_KEY);
    if (datosString) return JSON.parse(datosString);
    
    guardarPedidos(pedidosInicialJSON);
    return pedidosInicialJSON;
}

async function renderizarTablaPedidos() {
    const datosPedidos = await cargarPedidos();
    const tbody = document.getElementById('tabla-pedidos-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    datosPedidos.forEach(pedido => {
        // Estilo condicional para el estado
        let colorEstado = pedido.estadoProduccion === "En Producción" ? "var(--color-naranja)" : "var(--color-verde)";

        const fila = `
            <tr>
                <td><strong>${pedido.id}</strong></td>
                <td><span style="background: #e9ecef; padding: 3px 8px; border-radius: 4px; font-size: 0.85rem;">${pedido.idCliente}</span></td>
                <td>${pedido.fechaRegistro}</td>
                <td style="color: ${colorEstado}; font-weight: bold;">${pedido.estadoProduccion}</td>
                <td>$${pedido.total.toFixed(2)}</td>
                <td>
                    <button class="btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;">Ver / Editar</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}

function crearNuevoPedido() {
    const idCliente = prompt('Ingresa el ID del Cliente (Ej. CLI-001):');
    if (!idCliente) return;
    const total = Number(prompt('Ingresa el monto total del pedido ($):'));
    
    const pedidosActuales = JSON.parse(localStorage.getItem(PEDIDOS_STORAGE_KEY) || '[]');
    const nuevoId = `PED-100${pedidosActuales.length + 1}`;
    
    // Obtenemos la fecha actual en formato YYYY-MM-DD
    const fechaHoy = new Date().toISOString().split('T')[0];

    pedidosActuales.push({
        id: nuevoId,
        idCliente: idCliente,
        fechaRegistro: fechaHoy,
        estadoProduccion: "En Producción",
        estadoPago: "Pendiente",
        total: total || 0.00
    });
    
    guardarPedidos(pedidosActuales);
    renderizarTablaPedidos();
    actualizarDashboard(); // Actualiza los gráficos del inicio
}

// ==========================================
// MÓDULO: DASHBOARD Y ESTADÍSTICAS (KPIs)
// ==========================================
async function actualizarDashboard() {
    // 1. Cargar todas las bases de datos virtuales
    const inventario = await cargarInventario();
    const clientes = await cargarClientes();
    const pedidos = await cargarPedidos();

    // 2. Calcular las métricas
    const totalClientes = clientes.length;
    const pedidosEnProduccion = pedidos.filter(p => p.estadoProduccion === "En Producción").length;
    const insumosCriticos = inventario.filter(item => item.stockActual <= item.stockMinimo).length;

    // 3. Inyectar en el HTML
    const kpiClientes = document.getElementById('kpi-clientes');
    const kpiPedidos = document.getElementById('kpi-pedidos');
    const kpiStock = document.getElementById('kpi-stock');

    if (kpiClientes) kpiClientes.textContent = totalClientes;
    if (kpiPedidos) kpiPedidos.textContent = pedidosEnProduccion;
    if (kpiStock) kpiStock.textContent = insumosCriticos;
}




// ==========================================
// FUNCIÓN: INSERCIÓN DE PRUEBA (MÓDULO CRM)
// ==========================================
function inyectarClienteDePrueba() {
    // 1. Recuperamos los clientes actuales o iniciamos arreglo vacío
    let clientes = JSON.parse(localStorage.getItem('sigos_clientes')) || [];

    // 2. Creamos un objeto de prueba
    const nuevoCliente = {
        id: "CLI-" + Math.floor(Math.random() * 1000),
        nombre: "Empresa Cliente #" + (clientes.length + 1),
        tipo: "Corporativo",
        contacto: "contacto@empresa" + (clientes.length + 1) + ".com",
        documento: "J-000" + Math.floor(Math.random() * 9999)
    };

    // 3. Agregamos al arreglo y guardamos
    clientes.push(nuevoCliente);
    localStorage.setItem('sigos_clientes', JSON.stringify(clientes));

    // 4. Refrescamos la tabla (Asegúrate de tener esta función definida)
    renderizarTablaClientes();

    console.log("Cliente de prueba insertado con éxito.");
}