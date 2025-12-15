// =======================================================
// routes/notificacionesRoutes.js - FINAL
// =======================================================
import { Router } from "express";
import { 
    listarMisNotificaciones, 
    marcarComoLeida,
    marcarTodasComoLeidas,      // ← ¡Nombre correcto!
    obtenerConteoNoLeidas,
    obtenerRecientes
} from "../controllers/notificacionesController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// 1. GET /api/notificaciones
router.get("/", listarMisNotificaciones);

// 2. GET /api/notificaciones/recientes
router.get("/recientes", obtenerRecientes);

// 3. GET /api/notificaciones/conteo
router.get("/conteo", obtenerConteoNoLeidas);

// 4. PUT /api/notificaciones/:id/leer
router.put("/:id/leer", marcarComoLeida);

// 5. PUT /api/notificaciones/marcar-todas
router.put("/marcar-todas", marcarTodasComoLeidas);

export default router;