import express from "express";
import { ee2Controller } from "../controllers/ee2Controller.js";

const router = express.Router();

// ================== RUTAS PARA EE2 ==================

// ✅ GET /api/ee2/estadisticas - Estadísticas consolidadas
// Query params: fechaInicio, fechaFin, municipio
router.get("/estadisticas", ee2Controller.getEstadisticas);

// ✅ GET /api/ee2/municipios - Lista de municipios disponibles
// No requiere parámetros
router.get("/municipios", ee2Controller.getMunicipios);

// ✅ GET /api/ee2/evaluaciones - Detalle por comunidad
// Query params: fechaInicio, fechaFin, municipio
router.get("/evaluaciones", ee2Controller.getEvaluaciones);

// ✅ GET /api/ee2/municipios-con-conteo - Municipios con conteo de comunidades (opcional)
// Query params: fechaInicio, fechaFin
router.get("/municipios-con-conteo", ee2Controller.getMunicipiosConConteo);

// ✅ GET /api/ee2/reporte-detallado - Datos para reporte PDF (opcional)
// Query params: fechaInicio, fechaFin, municipio
router.get("/reporte-detallado", async (req, res) => {
  try {
    const { fechaInicio, fechaFin, municipio } = req.query;
    
    const filtros = {
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null,
      municipio: municipio || null,
    };

    const data = await EE2Model.getDatosParaReporte(filtros);
    
    res.json({ 
      success: true, 
      data,
      count: data.length,
      filtrosAplicados: filtros
    });
  } catch (error) {
    console.error("❌ Error en reporte-detallado:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Error al obtener datos para reporte"
    });
  }
});

export default router;