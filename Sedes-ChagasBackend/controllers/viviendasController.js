import Vivienda from "../models/viviendasModel.js";
import db from "../config/db.js";

/* ============================================================
   ✅ Controlador de Viviendas
   ============================================================ */

// Obtener una vivienda por ID
export const getViviendaById = async (req, res) => {
  try {
    const { id } = req.params;
    const vivienda = await Vivienda.getById(id);

    if (!vivienda) {
      return res.status(404).json({ error: "Vivienda no encontrada" });
    }

    // Si tiene imagen, convertir a base64
    if (vivienda.foto_entrada && Buffer.isBuffer(vivienda.foto_entrada)) {
      vivienda.foto_entrada = vivienda.foto_entrada.toString("base64");
    }

    res.json(vivienda);
  } catch (err) {
    console.error("❌ Error en getViviendaById:", err);
    res.status(500).json({ error: "Error al obtener vivienda" });
  }
};

// Obtener las primeras 10 viviendas con comunidad y municipio
export const getViviendas = async (req, res) => {
  try {
    const [results] = await db.promise().query(`
      SELECT v.*, c.nombre_comunidad, m.nombre_municipio 
      FROM Viviendas v
      LEFT JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
      LEFT JOIN Municipios m ON c.municipio_id = m.municipio_id
      LIMIT 10
    `);

    const viviendas = results.map(v => ({
      ...v,
      foto_entrada:
        v.foto_entrada && Buffer.isBuffer(v.foto_entrada)
          ? v.foto_entrada.toString("base64")
          : v.foto_entrada,
    }));

    res.json(viviendas);
  } catch (err) {
    console.error("❌ Error en getViviendas:", err);
    res.status(500).json({ error: "Error al obtener viviendas" });
  }
};

// Obtener todas las viviendas (sin límite)
export const getAllViviendas = async (req, res) => {
  try {
    const [results] = await db.promise().query(`
      SELECT v.vivienda_id, v.numero_vivienda, v.jefe_familia, c.nombre_comunidad 
      FROM Viviendas v
      LEFT JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
      ORDER BY v.numero_vivienda
    `);

    res.json(results);
  } catch (err) {
    console.error("❌ Error en getAllViviendas:", err);
    res.status(500).json({ error: "Error al obtener viviendas" });
  }
};

// Obtener imagen de una vivienda específica
export const getViviendaImage = async (req, res) => {
  try {
    const { id } = req.params;
    const vivienda = await Vivienda.getImageById(id);

    if (!vivienda || !vivienda.foto_entrada) {
      return res.status(404).json({ error: "Imagen no encontrada" });
    }

    res.setHeader("Content-Type", "image/jpeg");
    res.send(vivienda.foto_entrada);
  } catch (err) {
    console.error("❌ Error en getViviendaImage:", err);
    res.status(500).json({ error: "Error al obtener imagen" });
  }
};

// Obtener viviendas con coordenadas válidas
export const getViviendasConCoordenadas = async (req, res) => {
  try {
    const [results] = await db.promise().query(`
      SELECT v.vivienda_id, v.direccion, v.latitud, v.longitud, v.numero_vivienda, 
             c.nombre_comunidad, m.nombre_municipio
      FROM Viviendas v
      LEFT JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
      LEFT JOIN Municipios m ON c.municipio_id = m.municipio_id
      WHERE v.latitud IS NOT NULL AND v.longitud IS NOT NULL
    `);

    res.json(results);
  } catch (err) {
    console.error("❌ Error en getViviendasConCoordenadas:", err);
    res.status(500).json({ error: "Error al obtener coordenadas" });
  }
};
