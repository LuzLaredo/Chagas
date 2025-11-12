import { Router } from "express";
import {
  getViviendaById,
  getViviendas,
  getAllViviendas,
  getViviendaImage,
  getViviendasConCoordenadas
} from "../controllers/viviendasController.js";

const router = Router();

router.get("/", getViviendas);
router.get("/all", getAllViviendas);
router.get("/coordenadas", getViviendasConCoordenadas);
router.get("/:id", getViviendaById);
router.get("/:id/image", getViviendaImage);

export default router;
