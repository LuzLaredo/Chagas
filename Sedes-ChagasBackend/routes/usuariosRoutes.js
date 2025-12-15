// 📁 routes/usuariosRoutes.js
import express from "express";
import {
    getUsuarios,
    getUsuarioById,
    register,
    login,
    updateUsuarioController,
    deleteUsuarioController,
    updateUsuarioEstadoController, // ⬅️ NEW
    getTecnicos,
    getJefesGrupo,
    solicitarRecuperacionContrasena,
    resetearContrasena,
    getMunicipiosByUsuarioId
} from "../controllers/usuariosController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// -----------------------------------------------------------
// 🔹 Rutas públicas (SIN TOKEN)
// -----------------------------------------------------------

// 🔓 Autenticación
router.post("/register", register);
router.post("/login", login);

// 🔓 Recuperación de contraseña
router.post('/solicitar-recuperacion', solicitarRecuperacionContrasena);
router.post('/resetear-contrasena', resetearContrasena);

// 🔓 Listar todos los usuarios
router.get("/", getUsuarios);

// 🔓 Obtener uno por ID (View/Edit)
router.get("/:id", getUsuarioById);

// 🔓 Actualizar usuario
router.put("/:id", updateUsuarioController);

// 🔓 Eliminar usuario
router.delete("/:id", deleteUsuarioController);

// 🔓 Cambiar estado (Activar/Desactivar) - Solicitado por usuario
router.patch("/:id/estado", updateUsuarioEstadoController);

// -----------------------------------------------------------
// 🔹 Rutas que siguen protegidas (con Token)
// -----------------------------------------------------------

// Las siguientes rutas requieren que el token sea enviado, aunque no el rol
router.get("/tecnicos", verificarToken, getTecnicos);
router.get("/jefes-grupo", verificarToken, getJefesGrupo);

// Esta ruta necesita la identidad del usuario para saber qué municipios tiene asignados
router.get("/:usuarioId/municipios", verificarToken, getMunicipiosByUsuarioId);

export default router;