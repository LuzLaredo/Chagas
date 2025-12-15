// controllers/comunidadesController.js
import db from "../config/db.js";

// Obtener todas las comunidades
export const obtenerComunidades = (req, res) => {
  const query = `
    SELECT 
      comunidad_id, 
      nombre_comunidad, 
      municipio_id,
      cantidad_viviendas,
      estado
    FROM Comunidades 
    WHERE estado = 'activo'
    ORDER BY nombre_comunidad
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener comunidades:", err);
      return res.status(500).json({ error: "Error en BD" });
    }
    res.json(results);
  });
};

// Obtener comunidades por municipio
export const obtenerComunidadesPorMunicipio = (req, res) => {
  const { municipioId } = req.params;

  const query = `
    SELECT 
      comunidad_id, 
      nombre_comunidad, 
      municipio_id,
      cantidad_viviendas,
      estado
    FROM Comunidades 
    WHERE municipio_id = ? AND estado = 'activo'
    ORDER BY nombre_comunidad
  `;

  db.query(query, [municipioId], (err, results) => {
    if (err) {
      console.error("Error al obtener comunidades por municipio:", err);
      return res.status(500).json({ error: "Error en BD" });
    }
    res.json(results);
  });
};