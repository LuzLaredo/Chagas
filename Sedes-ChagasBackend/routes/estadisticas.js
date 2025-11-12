import express from "express";
import { getEstadisticasGenerales } from "../controllers/estadisticasController.js";

const router = express.Router();

// GET /api/estadisticas/generales
router.get("/generales", getEstadisticasGenerales);

export default router;
