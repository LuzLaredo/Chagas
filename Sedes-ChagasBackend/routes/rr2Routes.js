import express from 'express';
import { getRR2Estadisticas, getCatalogosFiltros } from "../controllers/rr2Controller.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Ruta para obtener estadísticas RR2 (protegida)
router.get('/', verificarToken, getRR2Estadisticas);

// Ruta para obtener catálogos de filtros (protegida)
router.get('/catalogos', verificarToken, getCatalogosFiltros);

export default router;