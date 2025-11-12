import express from "express";
import { ee2Controller } from "../controllers/ee2Controller.js";

const router = express.Router();

// GET /api/ee2/estadisticas
router.get("/estadisticas", ee2Controller.getEstadisticas);

// GET /api/ee2/municipios
router.get("/municipios", ee2Controller.getMunicipios);

// GET /api/ee2/evaluaciones - NUEVA RUTA
router.get("/evaluaciones", ee2Controller.getEvaluaciones);

export default router;