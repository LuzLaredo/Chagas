import EE3 from "../models/EE3Model.js";
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
        return callback(null, []); // Retorna array vacío
      }
      const ids = results.map(r => r.municipio_id);
      callback(null, ids);
    }
  );
}

// Listar evaluaciones de EE3
export async function listarEvaluaciones(req, res) {
  try {
    const usuarioId = req.user?.usuario_id;
    const rol = req.user?.rol;
    const query = req.query || {};

    // Si es supervisor, obtener sus municipios
    if (rol === 'supervisor' && usuarioId) {
      obtenerMunicipiosSupervisor(usuarioId, (err, municipiosIds) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Error verificando permisos" });
        }

        let municipiosFiltro = municipiosIds;

        // Si el supervisor intenta filtrar por un municipio específico
        if (query.municipio) {
          if (!municipiosIds.includes(parseInt(query.municipio))) {
            return res.status(403).json({ success: false, message: "No tiene permiso" });
          }
          municipiosFiltro = [parseInt(query.municipio)];
        }

        // Pasamos array al modelo
        const customQuery = { ...query, municipioId: municipiosFiltro };

        EE3.listarEvaluaciones(customQuery)
          .then(data => res.json({ success: true, data }))
          .catch(err => {
            console.error("EE3 listarEvaluaciones:", err);
            res.status(500).json({
              success: false,
              message: "Error al listar evaluaciones",
              error: err.message || String(err)
            });
          });
      });
      return;
    }

    // Admin o roles globales
    // Renombrar 'municipio' a 'municipioId' si viene del query (consistency check)
    if (query.municipio && !query.municipioId) {
      query.municipioId = query.municipio;
    }

    const data = await EE3.listarEvaluaciones(query);
    res.json({ success: true, data });
  } catch (err) {
    console.error("EE3 listarEvaluaciones:", err);
    res.status(500).json({
      success: false,
      message: "Error al listar evaluaciones",
      error: err.message || String(err)
    });
  }
}

// Obtener estadísticas de EE3
export async function estadisticas(req, res) {
  try {
    const usuarioId = req.user?.usuario_id;
    const rol = req.user?.rol;
    const query = req.query || {};

    // Si es supervisor
    if (rol === 'supervisor' && usuarioId) {
      obtenerMunicipiosSupervisor(usuarioId, (err, municipiosIds) => {
        if (err) return res.status(500).json({ success: false, message: "Error permisos" });

        let municipiosFiltro = municipiosIds;
        if (query.municipio) {
          if (!municipiosIds.includes(parseInt(query.municipio))) {
            return res.status(403).json({ success: false, message: "No tiene permiso" });
          }
          municipiosFiltro = [parseInt(query.municipio)];
        }

        const customQuery = { ...query, municipioId: municipiosFiltro };

        EE3.estadisticas(customQuery)
          .then(data => res.json({ success: true, data }))
          .catch(err => {
            console.error("EE3 estadisticas:", err);
            res.status(500).json({
              success: false,
              message: "Error al obtener estadísticas",
              error: err.message || String(err)
            });
          });
      });
      return;
    }

    if (query.municipio && !query.municipioId) {
      query.municipioId = query.municipio;
    }

    const data = await EE3.estadisticas(query);
    res.json({ success: true, data });
  } catch (err) {
    console.error("EE3 estadisticas:", err);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: err.message || String(err)
    });
  }
}
