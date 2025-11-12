import db from "../config/db.js";

// Obtener todos los municipios
export const getMunicipios = (req, res) => {
  const query = "SELECT * FROM Municipios ORDER BY nombre_municipio";
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error obteniendo municipios:", err);
      return res.status(500).json({ error: "Error obteniendo municipios" });
    }
    res.json(results);
  });
};

// Obtener municipio por ID
export const getMunicipioById = (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM Municipios WHERE municipio_id = ?";
  
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Error en consulta" });
    if (results.length === 0) return res.status(404).json({ error: "Municipio no encontrado" });
    res.json(results[0]);
  });
};