import express from 'express';
import { getRR2Estadisticas, getCatalogosFiltros } from "../controllers/rr2Controller.js";

const router = express.Router();

// Ruta para obtener estadísticas RR2
router.get('/', getRR2Estadisticas);

// Ruta para obtener catálogos de filtros
router.get('/catalogos', getCatalogosFiltros);

export default router;