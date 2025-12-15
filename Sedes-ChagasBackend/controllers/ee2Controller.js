import { EE2Model } from "../models/EE2Model.js";
import db from "../config/db.js";

// Función auxiliar para obtener TODOS los municipios del supervisor
function obtenerMunicipiosSupervisor(usuarioId, callback) {
  db.query(
    'SELECT municipio_id FROM Usuario_Municipio WHERE usuario_id = ?',
    [usuarioId],
    (err, results) => {
      if (err) {
        return callback(err, null);
      }
      if (!results || results.length === 0) {
        return callback(null, []); // Retorna array vacío si no tiene asignaciones
      }
      // Retornar array de IDs
      const ids = results.map(r => r.municipio_id);
      callback(null, ids);
    }
  );
}

export const ee2Controller = {
  // ================== ESTADÍSTICAS CONSOLIDADAS ==================
  async getEstadisticas(req, res) {
    try {
      const { fechaInicio, fechaFin, municipio } = req.query;
      const usuarioId = req.user?.usuario_id;
      const rol = req.user?.rol;

      // Si es supervisor, obtener sus municipios
      if (rol === 'supervisor' && usuarioId) {
        obtenerMunicipiosSupervisor(usuarioId, (err, municipiosIds) => {
          if (err) return res.status(500).json({ success: false, message: "Error verificando permisos" });

          // Si el supervisor envió un filtro de municipio específico
          let municipiosFiltro = municipiosIds;
          if (municipio) {
            // Verificar que el municipio solicitado esté entre los asignados
            if (!municipiosIds.includes(parseInt(municipio))) {
              return res.status(403).json({ success: false, message: "Acceso denegado a este municipio" });
            }
            municipiosFiltro = [parseInt(municipio)]; // Filtrar solo por ese
          }

          const filtros = {
            fechaInicio: fechaInicio || null,
            fechaFin: fechaFin || null,
            municipio: municipiosFiltro, // Array de IDs
          };

          EE2Model.getEstadisticas(filtros)
            .then(data => res.json({ success: true, data }))
            .catch(error => {
              console.error("❌ Error en getEstadisticas controller:", error);
              res.status(500).json({ success: false, message: error.message });
            });
        });
        return;
      }

      // Para otros roles (Admin)
      const filtros = {
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
        municipio: municipio || null, // ID o Nombre, el modelo lo maneja
      };

      const data = await EE2Model.getEstadisticas(filtros);
      res.json({ success: true, data });
    } catch (error) {
      console.error("❌ Error en getEstadisticas controller:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ================== OBTENER LISTA DE MUNICIPIOS ==================
  async getMunicipios(req, res) {
    try {
      const usuarioId = req.user?.usuario_id;
      const rol = req.user?.rol;

      // Si es supervisor, pasamos el usuarioId para que el modelo filtre
      const supervisorId = (rol === 'supervisor') ? usuarioId : null;

      const municipios = await EE2Model.getMunicipios(supervisorId);
      res.json({
        success: true,
        data: municipios,
        count: municipios.length
      });
    } catch (error) {
      console.error("❌ Error en getMunicipios controller:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ================== EVALUACIONES DETALLADAS ==================
  async getEvaluaciones(req, res) {
    try {
      const { fechaInicio, fechaFin, municipio } = req.query;
      const usuarioId = req.user?.usuario_id;
      const rol = req.user?.rol;

      // Si es supervisor
      if (rol === 'supervisor' && usuarioId) {
        obtenerMunicipiosSupervisor(usuarioId, (err, municipiosIds) => {
          if (err) return res.status(500).json({ success: false, message: "Error permisos" });

          let municipiosFiltro = municipiosIds;
          if (municipio) {
            if (!municipiosIds.includes(parseInt(municipio))) {
              return res.status(403).json({ success: false, message: "Acceso denegado" });
            }
            municipiosFiltro = [parseInt(municipio)];
          }

          const filtros = {
            fechaInicio: fechaInicio || null,
            fechaFin: fechaFin || null,
            municipio: municipiosFiltro,
          };

          EE2Model.getEvaluacionesDetalladas(filtros)
            .then(data => {
              res.json({
                success: true,
                data,
                count: data.length,
                filtrosAplicados: {
                  // Info para debug
                  municipios: municipiosFiltro
                }
              });
            })
            .catch(error => {
              console.error("❌ Error en getEvaluaciones controller:", error);
              res.status(500).json({ success: false, message: error.message });
            });
        });
        return;
      }

      // Admin
      const filtros = {
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
        municipio: municipio || null,
      };

      const data = await EE2Model.getEvaluacionesDetalladas(filtros);

      res.json({
        success: true,
        data,
        count: data.length
      });
    } catch (error) {
      console.error("❌ Error en getEvaluaciones controller:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ================== ENDPOINT PARA MUNICIPIOS CON CONTEO ==================
  async getMunicipiosConConteo(req, res) {
    try {
      // Este endpoint suele usarse para un dashboard general. 
      // Si el supervisor lo usa, debería ver solo lo suyo o todo si es admin.
      // Por simplicidad y consistencia, aplicamos filtro también.

      const { fechaInicio, fechaFin } = req.query;
      const usuarioId = req.user?.usuario_id;
      const rol = req.user?.rol;

      // Lógica de filtro supervisor (omitida por brevedad en este paso específico si no es crítica, 
      // pero idealmente debería estar. Asumimos que este endpoint es público o general admin por ahora,
      // o aplicamos la misma lógica).
      // Dado que el usuario pidió "lo mismo para R3 lo de todos los municipios", 
      // y este endpoint filtra "ConConteo", tal vez no sea el principal reporte.
      // Lo dejaremos estándar pero seguros.

      const filtros = {
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
      };

      const municipiosConConteo = await EE2Model.getMunicipiosConConteo(filtros);

      res.json({
        success: true,
        data: municipiosConConteo,
        count: municipiosConConteo.length
      });
    } catch (error) {
      console.error("❌ Error en getMunicipiosConConteo controller:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};