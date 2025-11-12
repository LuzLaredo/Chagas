import express from "express";
import { 
  crearRR1, 
  obtenerRR1, 
  obtenerRR1PorId
} from "../controllers/rr1Controller.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

router.post("/", crearRR1);
router.get("/", obtenerRR1);
router.get("/:id", obtenerRR1PorId);

// Eliminar el endpoint de catalogos de aquí, ahora está en catalogosRoutes
// router.get("/catalogos", obtenerCatalogos); // ← ELIMINAR ESTA LÍNEA

export default router;