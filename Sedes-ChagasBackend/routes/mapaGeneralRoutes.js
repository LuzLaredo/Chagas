// C:\PS3-CHAGAS\Sedes-ChagasBackend\routes\mapaGeneralRoutes.js
import express from "express";
import * as mapaGeneralController from "../controllers/mapaGeneralController.js";

const router = express.Router();

// GET /api/mapaGeneral
router.get("/", mapaGeneralController.getMapaGeneral);

export default router;
