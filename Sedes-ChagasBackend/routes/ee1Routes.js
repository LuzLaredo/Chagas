// routes/ee1Routes.js
import { Router } from "express";
import {
  crearDetalle,
  listarDetalles,
  editarDetalle,
  borrarDetalle,
} from "../controllers/ee1Controller.js";

const router = Router();

/**
 * Endpoints RESTful principales
 */
router.post("/", crearDetalle);        // Crear detalle
router.get("/", listarDetalles);       // Listar todos
router.put("/:id", editarDetalle);     // Editar por ID
router.delete("/:id", borrarDetalle);  // Borrar por ID

/**
 * Endpoint adicional (alias)
 * → Si quieren mantener "guardar-detalle"
 */
router.post("/guardar-detalle", crearDetalle);

export default router;
