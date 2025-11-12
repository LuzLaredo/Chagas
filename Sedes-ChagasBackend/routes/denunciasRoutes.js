// routes/denunciasRoutes.js
import { Router } from "express";
import {
  crear,
  listar,
  obtenerPorId,
  actualizar,
  eliminar,
  cancelar,
  uploadFiles,
  getDenunciaByViviendaId,
  updateDenunciaProgramacion
} from "../controllers/denunciasController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = Router();

/* ==========================
   🔹 RUTAS PÚBLICAS (sin token)
   ========================== */

// Obtener todas las denuncias (opcionalmente filtradas)
router.get("/", listar);

// Obtener denuncia por ID
router.get("/:id", obtenerPorId);

// Obtener denuncias por vivienda
router.get("/vivienda/:id", getDenunciaByViviendaId);

// ✅ Programar denuncia (ruta pública)
router.put("/:id/programacion", updateDenunciaProgramacion);

/* ==========================
   🔒 RUTAS PROTEGIDAS (requieren token)
   ========================== */

router.use(verificarToken);

// Crear nueva denuncia
router.post("/", uploadFiles, crear);

// Actualizar denuncia (general)
router.put("/:id", actualizar);

// Eliminar denuncia
router.delete("/:id", eliminar);

// Cancelar denuncia
router.post("/:id/cancelar", cancelar);

export default router;
