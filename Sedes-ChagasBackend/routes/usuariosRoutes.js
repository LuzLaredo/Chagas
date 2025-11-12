import express from "express";
import { 
  getUsuarios,
  getUsuarioById,
  register,
  login,
  updateUsuarioController,
  deleteUsuarioController,
  getTecnicos,
  getJefesGrupo
} from "../controllers/usuariosController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ===========================================================
// 🔹 Rutas públicas
// ===========================================================
router.post("/register", register);
router.post("/login", login);

// ===========================================================
// 🔹 Rutas protegidas (deben ir antes del CRUD dinámico)
// ===========================================================
router.get("/tecnicos", verificarToken, getTecnicos);
router.get("/jefes-grupo", verificarToken, getJefesGrupo);

// ===========================================================
// 🔹 CRUD usuarios
// ===========================================================
router.get("/", getUsuarios);                 // Listar todos
router.get("/:id", getUsuarioById);          // Obtener uno por ID
router.put("/:id", updateUsuarioController); // Actualizar
router.delete("/:id", deleteUsuarioController); // Eliminar

export default router;
