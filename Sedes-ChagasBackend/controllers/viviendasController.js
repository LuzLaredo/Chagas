// ===========================================================
// controllers/viviendasController.js - VERSIÓN COMPLETA ACTUALIZADA
// ===========================================================

import Vivienda from "../models/viviendasModel.js";
import db from "../config/db.js";

/* ============================================================
   ✅ Controlador de Viviendas - VERSIÓN MEJORADA CON NUEVOS CAMPOS
   ============================================================ */

// Obtener municipios
export const getMunicipios = async (req, res) => {
  try {
    const [results] = await db.promise().query(`
      SELECT municipio_id, nombre_municipio 
      FROM Municipios 
      ORDER BY nombre_municipio
    `);
    res.json(results);
  } catch (err) {
    console.error("❌ Error en getMunicipios:", err);
    res.status(500).json({ error: "Error al obtener municipios" });
  }
};

// Obtener comunidades por municipio
export const getComunidadesByMunicipio = async (req, res) => {
  try {
    const { municipioId } = req.params;
    const [results] = await db.promise().query(`
      SELECT comunidad_id, nombre_comunidad 
      FROM Comunidades 
      WHERE municipio_id = ? AND estado = 'activo'
      ORDER BY nombre_comunidad
    `, [municipioId]);
    res.json(results);
  } catch (err) {
    console.error("❌ Error en getComunidadesByMunicipio:", err);
    res.status(500).json({ error: "Error al obtener comunidades" });
  }
};

// Obtener viviendas por municipio - VERSIÓN ACTUALIZADA
export const getViviendasByMunicipio = async (req, res) => {
  try {
    const { municipioId } = req.params;
    
    const [results] = await db.promise().query(`
      SELECT 
        v.vivienda_id, 
        v.numero_vivienda, 
        v.jefe_familia, 
        v.direccion,
        v.latitud,
        v.longitud,
        v.altura,
        v.foto_entrada,
        v.fotoVinchucas, -- 🆕 NUEVO CAMPO
        v.vivienda_mejorada,
        v.comunidad_id,
        v.municipio_id,
        c.nombre_comunidad,
        m.nombre_municipio
      FROM Viviendas v
      LEFT JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
      LEFT JOIN Municipios m ON v.municipio_id = m.municipio_id
      WHERE v.municipio_id = ?
      ORDER BY v.numero_vivienda
    `, [municipioId]);

    res.json(results);
  } catch (err) {
    console.error("❌ Error en getViviendasByMunicipio:", err);
    res.status(500).json({ error: "Error al obtener viviendas por municipio" });
  }
};

// Obtener información de comunidad por ID
export const getComunidadById = async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.promise().query(`
      SELECT comunidad_id, nombre_comunidad, municipio_id
      FROM Comunidades 
      WHERE comunidad_id = ?
    `, [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: "Comunidad no encontrada" });
    }
    
    res.json(results[0]);
  } catch (err) {
    console.error("❌ Error en getComunidadById:", err);
    res.status(500).json({ error: "Error al obtener comunidad" });
  }
};

// Obtener una vivienda por ID - VERSIÓN ACTUALIZADA
// En viviendasController.js - Asegurar que las consultas de viviendas también funcionen correctamente
export const getViviendaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await db.promise().query(`
      SELECT 
        v.vivienda_id,
        v.numero_vivienda,
        v.jefe_familia,
        v.direccion,
        v.latitud,
        v.longitud,
        v.altura,
        v.foto_entrada,
        v.fotoVinchucas,
        v.vivienda_mejorada,
        v.comunidad_id,
        v.municipio_id,
        c.nombre_comunidad,
        m.nombre_municipio,
        -- 🆕 Obtener también datos de denuncia reciente si existe
        (SELECT d.codigo_pais FROM Denuncias d WHERE d.vivienda_id = v.vivienda_id ORDER BY d.fecha_denuncia DESC LIMIT 1) as codigo_pais,
        (SELECT d.numero_telefono FROM Denuncias d WHERE d.vivienda_id = v.vivienda_id ORDER BY d.fecha_denuncia DESC LIMIT 1) as numero_telefono
      FROM Viviendas v
      LEFT JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
      LEFT JOIN Municipios m ON v.municipio_id = m.municipio_id
      WHERE v.vivienda_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Vivienda no encontrada" });
    }

    const vivienda = rows[0];
    
    // Si tiene imagen de entrada, convertir a base64
    if (vivienda.foto_entrada && Buffer.isBuffer(vivienda.foto_entrada)) {
      vivienda.foto_entrada = vivienda.foto_entrada.toString("base64");
    }

    res.json(vivienda);
  } catch (err) {
    console.error("❌ Error en getViviendaById:", err);
    res.status(500).json({ error: "Error al obtener vivienda" });
  }
};

// Obtener las primeras 10 viviendas con comunidad y municipio - VERSIÓN ACTUALIZADA
export const getViviendas = async (req, res) => {
  try {
    const [results] = await db.promise().query(`
      SELECT 
        v.*, 
        c.nombre_comunidad, 
        m.nombre_municipio,
        v.municipio_id
      FROM Viviendas v
      LEFT JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
      LEFT JOIN Municipios m ON v.municipio_id = m.municipio_id
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

// Obtener todas las viviendas (sin límite) - VERSIÓN ACTUALIZADA
export const getAllViviendas = async (req, res) => {
  try {
    const [results] = await db.promise().query(`
      SELECT 
        v.vivienda_id, 
        v.numero_vivienda, 
        v.jefe_familia, 
        v.direccion,
        v.latitud,
        v.longitud,
        v.altura,
        v.foto_entrada,
        v.fotoVinchucas, -- 🆕 NUEVO CAMPO
        v.comunidad_id,
        v.municipio_id,
        c.nombre_comunidad,
        m.nombre_municipio
      FROM Viviendas v
      LEFT JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
      LEFT JOIN Municipios m ON v.municipio_id = m.municipio_id
      ORDER BY m.nombre_municipio, c.nombre_comunidad, v.numero_vivienda
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

// Obtener viviendas con coordenadas válidas - VERSIÓN ACTUALIZADA
export const getViviendasConCoordenadas = async (req, res) => {
  try {
    const [results] = await db.promise().query(`
      SELECT 
        v.vivienda_id, 
        v.direccion, 
        v.latitud, 
        v.longitud, 
        v.altura,
        v.numero_vivienda, 
        v.jefe_familia,
        c.nombre_comunidad, 
        m.nombre_municipio,
        v.municipio_id
      FROM Viviendas v
      LEFT JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
      LEFT JOIN Municipios m ON v.municipio_id = m.municipio_id
      WHERE v.latitud IS NOT NULL AND v.longitud IS NOT NULL
    `);

    res.json(results);
  } catch (err) {
    console.error("❌ Error en getViviendasConCoordenadas:", err);
    res.status(500).json({ error: "Error al obtener coordenadas" });
  }
};

// 🆕 CREAR NUEVA VIVIENDA - VERSIÓN MEJORADA
export const createVivienda = async (req, res) => {
  try {
    const {
      numero_vivienda,
      jefe_familia,
      direccion,
      latitud,
      longitud,
      altura,
      comunidad_id,
      municipio_id,
      foto_entrada,
      fotoVinchucas // 🆕 NUEVO CAMPO
    } = req.body;

    // Validaciones básicas
    if (!numero_vivienda || !jefe_familia || !comunidad_id || !municipio_id) {
      return res.status(400).json({ 
        error: "Faltan campos obligatorios: numero_vivienda, jefe_familia, comunidad_id, municipio_id" 
      });
    }

    const query = `
      INSERT INTO Viviendas 
        (numero_vivienda, jefe_familia, direccion, latitud, longitud, altura, 
         comunidad_id, municipio_id, foto_entrada, fotoVinchucas, fecha_creacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      numero_vivienda,
      jefe_familia,
      direccion || null,
      latitud || null,
      longitud || null,
      altura || null,
      comunidad_id,
      municipio_id,
      foto_entrada || null,
      fotoVinchucas || null // 🆕 NUEVO CAMPO
    ];

    const [result] = await db.promise().query(query, values);
    
    res.status(201).json({ 
      message: "Vivienda creada exitosamente",
      vivienda_id: result.insertId 
    });

  } catch (err) {
    console.error("❌ Error en createVivienda:", err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Ya existe una vivienda con ese número en esta comunidad" });
    }
    
    res.status(500).json({ error: "Error al crear vivienda" });
  }
};

// 🆕 ACTUALIZAR VIVIENDA - VERSIÓN MEJORADA
export const updateVivienda = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      numero_vivienda,
      jefe_familia,
      direccion,
      latitud,
      longitud,
      altura,
      comunidad_id,
      municipio_id,
      foto_entrada,
      fotoVinchucas, // 🆕 NUEVO CAMPO
      vivienda_mejorada
    } = req.body;

    const query = `
      UPDATE Viviendas SET
        numero_vivienda = COALESCE(?, numero_vivienda),
        jefe_familia = COALESCE(?, jefe_familia),
        direccion = COALESCE(?, direccion),
        latitud = COALESCE(?, latitud),
        longitud = COALESCE(?, longitud),
        altura = COALESCE(?, altura),
        comunidad_id = COALESCE(?, comunidad_id),
        municipio_id = COALESCE(?, municipio_id),
        foto_entrada = COALESCE(?, foto_entrada),
        fotoVinchucas = COALESCE(?, fotoVinchucas), -- 🆕 NUEVO CAMPO
        vivienda_mejorada = COALESCE(?, vivienda_mejorada),
        fecha_modificacion = NOW()
      WHERE vivienda_id = ?
    `;

    const values = [
      numero_vivienda || null,
      jefe_familia || null,
      direccion || null,
      latitud || null,
      longitud || null,
      altura || null,
      comunidad_id || null,
      municipio_id || null,
      foto_entrada || null,
      fotoVinchucas || null, // 🆕 NUEVO CAMPO
      vivienda_mejorada || null,
      id
    ];

    const [result] = await db.promise().query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Vivienda no encontrada" });
    }

    res.json({ message: "Vivienda actualizada exitosamente" });

  } catch (err) {
    console.error("❌ Error en updateVivienda:", err);
    res.status(500).json({ error: "Error al actualizar vivienda" });
  }
};

// 🆕 OBTENER FOTOS DE VIVIENDA (ENTRADA Y VINCHUCAS)
export const getViviendaFotos = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await db.promise().query(`
      SELECT 
        foto_entrada,
        fotoVinchucas -- 🆕 NUEVO CAMPO
      FROM Viviendas 
      WHERE vivienda_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Vivienda no encontrada" });
    }

    const fotos = rows[0];
    
    // Convertir imágenes a base64 si existen
    if (fotos.foto_entrada && Buffer.isBuffer(fotos.foto_entrada)) {
      fotos.foto_entrada = fotos.foto_entrada.toString("base64");
    }

    res.json(fotos);

  } catch (err) {
    console.error("❌ Error en getViviendaFotos:", err);
    res.status(500).json({ error: "Error al obtener fotos de vivienda" });
  }
};

// 🆕 BUSCAR VIVIENDAS POR TÉRMINO
export const searchViviendas = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ error: "Término de búsqueda requerido" });
    }

    const searchTerm = `%${q.trim()}%`;
    
    const [results] = await db.promise().query(`
      SELECT 
        v.vivienda_id, 
        v.numero_vivienda, 
        v.jefe_familia, 
        v.direccion,
        c.nombre_comunidad,
        m.nombre_municipio
      FROM Viviendas v
      LEFT JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
      LEFT JOIN Municipios m ON v.municipio_id = m.municipio_id
      WHERE 
        v.numero_vivienda LIKE ? OR 
        v.jefe_familia LIKE ? OR 
        v.direccion LIKE ? OR
        c.nombre_comunidad LIKE ? OR
        m.nombre_municipio LIKE ?
      ORDER BY m.nombre_municipio, c.nombre_comunidad, v.numero_vivienda
      LIMIT 20
    `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);

    res.json(results);

  } catch (err) {
    console.error("❌ Error en searchViviendas:", err);
    res.status(500).json({ error: "Error al buscar viviendas" });
  }
};