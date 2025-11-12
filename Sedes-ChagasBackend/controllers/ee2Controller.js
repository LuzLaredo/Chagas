import { EE2Model } from "../models/EE2Model.js";

export const ee2Controller = {
  // Estadísticas consolidadas
  async getEstadisticas(req, res) {
    try {
      const { fechaInicio, fechaFin, municipioId, sedeId, redId, establecimientoId } = req.query;
      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ success: false, message: "Las fechas de inicio y fin son requeridas" });
      }

      const filtros = {
        fechaInicio,
        fechaFin,
        municipioId: municipioId || null,
        sedeId: sedeId || null,
        redId: redId || null,
        establecimientoId: establecimientoId || null,
      };

      const data = await EE2Model.getEstadisticas(filtros);
      res.json({ success: true, data });
    } catch (error) {
      console.error("❌ Error en getEstadisticas controller:", error);
      res.status(500).json({ success: false, message: error.message || "Error al obtener estadísticas", error: error.message });
    }
  },

  // Municipios
  async getMunicipios(req, res) {
    try {
      const municipios = await EE2Model.getMunicipios();
      res.json({ success: true, data: municipios });
    } catch (error) {
      console.error("❌ Error en getMunicipios controller:", error);
      res.status(500).json({ success: false, message: "Error al obtener municipios", error: error.message });
    }
  },

  // Evaluaciones detalladas por comunidad (con todas las columnas nuevas)
  async getEvaluaciones(req, res) {
    try {
      const { fechaInicio, fechaFin, municipioId, sedeId, redId, establecimientoId } = req.query;
      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ success: false, message: "Las fechas de inicio y fin son requeridas" });
      }

      const filtros = {
        fechaInicio,
        fechaFin,
        municipioId: municipioId || null,
        sedeId: sedeId || null,
        redId: redId || null,
        establecimientoId: establecimientoId || null,
      };

      const data = await EE2Model.getEvaluacionesDetalladas(filtros);
      res.json({ success: true, data });
    } catch (error) {
      console.error("❌ Error en getEvaluaciones controller:", error);
      res.status(500).json({ success: false, message: error.message || "Error al obtener evaluaciones", error: error.message });
    }
  }
};
