// routes/estadisticasRoutes.js
import { Router } from "express";
import {
  getEstadisticasGenerales,
  getDistribucionViviendas,
  getTopComunidades,
  getCostosModelos,
  getAllEstadisticas,
  getEstadisticasPorFechas,
  getEstadisticasPorMunicipio,
  getEstadisticasPorFechasYMunicipio,
  getEvolucionTemporal,
  getEficaciaRociado,
  getDistribucionEjemplares,
  getMetricasProgreso,
  getComparacionFechas,
  getMunicipios,
  getEstadisticasDenuncias,
  getEficienciaRociado,
  getAnalisisTemporal,
  getDistribucionGeografica,
  getAnalisisEjemplares,
  getIndicadoresRendimiento
} from "../controllers/estadisticasController.js";

const router = Router();

// Rutas públicas para estadísticas (solo lectura)
router.get("/generales", getEstadisticasGenerales);
router.get("/distribucion-viviendas", getDistribucionViviendas);
router.get("/top-comunidades", getTopComunidades);
router.get("/costos-modelos", getCostosModelos);
router.get("/all", getAllEstadisticas);
router.get("/por-fechas", getEstadisticasPorFechas);
router.get("/por-municipio/:municipioId", getEstadisticasPorMunicipio);
router.get("/por-fechas-municipio", getEstadisticasPorFechasYMunicipio);
router.get("/municipios", getMunicipios);
router.get("/evolucion-temporal", getEvolucionTemporal);
router.get("/eficacia-rociado", getEficaciaRociado);
router.get("/distribucion-ejemplares", getDistribucionEjemplares);
router.get("/metricas-progreso", getMetricasProgreso);
router.get("/comparacion-fechas", getComparacionFechas);
router.get("/estadisticas-denuncias", getEstadisticasDenuncias);
router.get("/eficiencia-rociado", getEficienciaRociado);

// Nuevas rutas para métricas avanzadas
router.get("/analisis-temporal", getAnalisisTemporal);
router.get("/distribucion-geografica", getDistribucionGeografica);
router.get("/analisis-ejemplares", getAnalisisEjemplares);
router.get("/indicadores-rendimiento", getIndicadoresRendimiento);

export default router;
