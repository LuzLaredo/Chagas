import express from "express";
import { 
  obtenerEstadisticasRR3Controller, 
  obtenerCatalogosRR3 
} from "../controllers/rr3Controller.js";

const router = express.Router();

// 📊 Estadísticas RR3 por municipio - SIN AUTENTICACIÓN
router.get("/", obtenerEstadisticasRR3Controller);

// 📋 Catálogos para RR3 - SIN AUTENTICACIÓN  
router.get("/catalogos", obtenerCatalogosRR3);

// Ruta de prueba
router.get("/test", (req, res) => {
  res.json({ 
    message: "✅ RR3 funcionando correctamente",
    timestamp: new Date().toISOString(),
    endpoints: {
      estadisticas: "GET /api/rr3",
      catalogos: "GET /api/rr3/catalogos"
    }
  });
});

export default router;