// routes/comunidadesRoutes.js
import { Router } from "express";
import {
  obtenerComunidades,
  obtenerComunidadesPorMunicipio
} from "../controllers/comunidadesController.js";

const router = Router();

// Obtener todas las comunidades
router.get("/", obtenerComunidades);

// Obtener comunidades por municipio
router.get("/municipio/:municipioId", obtenerComunidadesPorMunicipio);

export default router;