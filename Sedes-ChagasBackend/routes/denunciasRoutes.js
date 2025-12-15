// En routes/denunciasRoutes.js - Modificar los imports
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
  updateDenunciaProgramacion,
  updateDenunciaReprogramacion  // 🆕 AGREGAR ESTE IMPORT
} from "../controllers/denunciasController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = Router();

/* ==========================
   🔹 RUTAS PÚBLICAS (sin token)
   ========================== */

// Obtener denuncia por ID
router.get("/:id", obtenerPorId);

// Obtener denuncias por vivienda
router.get("/vivienda/:id", getDenunciaByViviendaId);

// ✅ Programar denuncia (ruta pública)
router.put("/:id/programacion", updateDenunciaProgramacion);

// ✅ Reprogramar denuncia (ruta pública) - 🆕 NUEVA RUTA
router.put("/:id/reprogramacion", updateDenunciaReprogramacion);

/* ==========================
   🔒 RUTAS PROTEGIDAS (requieren token)
   ========================== */

// ✅ MOVER la ruta de listar aquí para que tenga acceso a req.user
router.get("/", verificarToken, listar);

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