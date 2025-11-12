import { Router } from "express";
import { 
  getDenunciaByViviendaId, 
  createDenuncia,
  updateDenunciaProgramacion 
} from "../controllers/denunciasController.js";

const router = Router();

router.get("/vivienda/:id", getDenunciaByViviendaId);
router.post("/", createDenuncia);
router.put("/:id/programacion", updateDenunciaProgramacion);

export default router;