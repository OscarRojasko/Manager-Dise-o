import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import dashboardRouter from "./dashboard.js";
import inventarioRouter from "./inventario.js";
import clientesRouter from "./clientes.js";
import pedidosRouter from "./pedidos.js";
import produccionRouter from "./produccion.js";
import usuariosRouter from "./usuarios.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(inventarioRouter);
router.use(clientesRouter);
router.use(pedidosRouter);
router.use(produccionRouter);
router.use(usuariosRouter);

export default router;
