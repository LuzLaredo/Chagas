import express from "express";
import * as ee3Ctrl from "../controllers/ee3Controller.js";

const router = express.Router();

router.get("/evaluaciones", ee3Ctrl.listarEvaluaciones);
router.get("/estadisticas", ee3Ctrl.estadisticas);

export default router;
