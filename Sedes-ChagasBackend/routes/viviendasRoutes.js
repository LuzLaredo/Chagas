import { Router } from "express";
import {
  getViviendaById,
  getViviendas,
  getAllViviendas,
  getViviendaImage,
  getViviendasConCoordenadas,
  getViviendasByMunicipio,
  getMunicipios,
  getComunidadesByMunicipio,
  getComunidadById
} from "../controllers/viviendasController.js";

const router = Router();

router.get("/", getViviendas);
router.get("/all", getAllViviendas);
router.get("/coordenadas", getViviendasConCoordenadas);
router.get("/municipios", getMunicipios);
router.get("/municipio/:municipioId", getViviendasByMunicipio);
router.get("/comunidades/:municipioId", getComunidadesByMunicipio);
router.get("/comunidad/:id", getComunidadById);
router.get("/:id", getViviendaById);
router.get("/:id/image", getViviendaImage);

export default router;