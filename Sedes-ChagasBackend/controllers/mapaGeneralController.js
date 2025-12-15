// C:\PS3-CHAGAS\Sedes-ChagasBackend\controllers\mapaGeneralController.js
import * as mapaGeneralModel from "../models/mapaGeneralModel.js";
import db from "../config/db.js";

// Función auxiliar para obtener el municipio del supervisor
function obtenerMunicipioSupervisor(usuarioId, callback) {
  db.query(
    'SELECT municipio_id FROM Usuario_Municipio WHERE usuario_id = ? LIMIT 1',
    [usuarioId],
    (err, results) => {
      if (err || !results || results.length === 0) {
        return callback(null, null);
      }
      callback(null, results[0].municipio_id);
    }
  );
}

export const getMapaGeneral = async (req, res) => {
  try {
    const usuarioId = req.user?.usuario_id;
    const rol = req.user?.rol;
    
    // Si es supervisor, filtrar por su municipio
    if (rol === 'supervisor' && usuarioId) {
      obtenerMunicipioSupervisor(usuarioId, (err, municipioId) => {
        if (err || !municipioId) {
          return res.status(403).json({ message: "Supervisor sin municipio asignado" });
        }
        
        mapaGeneralModel.getAllMapaGeneral(municipioId)
          .then(datos => res.json(datos))
          .catch(error => {
            console.error("Error en getMapaGeneral:", error);
            res.status(500).json({ message: "Error al obtener datos del mapa general" });
          });
      });
      return;
    }
    
    // Para otros roles, obtener todos los datos
    const datos = await mapaGeneralModel.getAllMapaGeneral();
    res.json(datos);
  } catch (error) {
    console.error("Error en getMapaGeneral:", error);
    res.status(500).json({ message: "Error al obtener datos del mapa general" });
  }
};
