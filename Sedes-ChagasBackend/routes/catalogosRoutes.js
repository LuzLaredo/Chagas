import express from "express";
import { 
  obtenerCatalogosCompletos,
  obtenerMunicipiosController,
  obtenerComunidadesController,
  obtenerSedesController,
  obtenerRedesSaludController,
  obtenerEstablecimientosController,
  obtenerMunicipiosUsuarioController,
  obtenerTecnicosController,
  obtenerJefesGrupoController,
  obtenerCatalogosPorUsuario // NUEVO: Agregar esta importación
} from "../controllers/catalogosController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Endpoint principal para el formulario RR1 (para administradores)
router.get("/completos", obtenerCatalogosCompletos);

// NUEVO: Endpoint para catálogos filtrados por usuario
router.get("/por-usuario", obtenerCatalogosPorUsuario);

// Endpoints individuales para selects dependientes
router.get("/municipios", obtenerMunicipiosController);
router.get("/comunidades", obtenerComunidadesController);
router.get("/sedes", obtenerSedesController);
router.get("/redes-salud", obtenerRedesSaludController);
router.get("/establecimientos", obtenerEstablecimientosController);

// Endpoint específico para municipios del usuario
router.get("/municipios-usuario", obtenerMunicipiosUsuarioController);

// Endpoints para usuarios (técnicos y jefes de grupo)
router.get("/tecnicos", obtenerTecnicosController);
router.get("/jefes-grupo", obtenerJefesGrupoController);

export default router;