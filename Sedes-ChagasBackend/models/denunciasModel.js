// ===========================================================
// models/denunciasModel.js
// ===========================================================

import db from "../config/db.js";

// Crear
export const crearDenuncia = (data, callback) => {
  // Manejar vivienda_id correctamente: puede ser null, número, o string
  let viviendaId = null;
  if (data.vivienda_id !== null && data.vivienda_id !== undefined && data.vivienda_id !== '') {
    const parsed = typeof data.vivienda_id === 'string' ? parseInt(data.vivienda_id, 10) : data.vivienda_id;
    viviendaId = isNaN(parsed) ? null : parsed;
  }

  const query = `
    INSERT INTO Denuncias
      (usuario_id, vivienda_id, municipio_id, comunidad_id, direccion, descripcion, foto_vivienda, fotos_vinchucas, fecha_denuncia, latitud, longitud, altura, estado_denuncia, codigo_pais, numero_telefono, fecha_programacion, fecha_ejecucion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.usuario_id || null,
    viviendaId, // Ahora puede ser null correctamente
    data.municipio_id || null,
    data.comunidad_id || null, // 🆕 AGREGADO
    data.direccion || null, // 🆕 AGREGADO
    data.descripcion,
    data.foto_vivienda || null, // 🆕 AGREGADO
    data.fotos_vinchucas || null,
    data.fecha_denuncia || new Date().toISOString().slice(0, 10),
    data.latitud ?? null,
    data.longitud ?? null,
    data.altura ?? null,
    data.estado_denuncia || "recibida",
    data.codigo_pais || '+591', // 🆕 NUEVO CAMPO
    data.numero_telefono || null, // 🆕 NUEVO CAMPO
    data.fecha_programacion || null,
    data.fecha_ejecucion || null,
  ];

  db.query(query, values, (err, results) => {
    if (err) return callback(err);
    callback(null, { insertId: results.insertId });
  });
};

// Listar con filtros
// En denunciasModel.js - Asegurar que la consulta traiga los campos de teléfono
export const obtenerDenunciaPorId = (id, callback) => {
  const query = `
    SELECT 
      d.denuncia_id as id, 
      d.usuario_id, 
      d.vivienda_id, 
      d.municipio_id as denuncia_municipio_id,
      d.comunidad_id,
      d.direccion as denuncia_direccion, -- 🆕 IMPORTANTE: alias para evitar conflictos
      d.descripcion, 
      d.fotos_vinchucas,
      d.foto_vivienda,
      d.codigo_pais, -- 🆕 NUEVO CAMPO
      d.numero_telefono, -- 🆕 NUEVO CAMPO
      d.fecha_denuncia, 
      d.latitud, 
      d.longitud, 
      d.altura, 
      d.estado_denuncia, 
      d.id_motivo_cancelacion, 
      d.fecha_programacion, 
      d.fecha_ejecucion, 
      d.fecha_creacion, 
      d.fecha_modificacion,
      u.nombre_completo AS nombre_usuario, 
      u.correo_electronico,
      v.numero_vivienda, 
      v.jefe_familia, 
      v.direccion as vivienda_direccion, -- 🆕 ALIAS para evitar conflicto
      v.comunidad_id,
      c.nombre_comunidad,
      c.municipio_id as comunidad_municipio_id,
      COALESCE(m_directo.nombre_municipio, m.nombre_municipio) AS nombre_municipio,
      COALESCE(m_directo.municipio_id, m.municipio_id) AS municipio_id_final
    FROM Denuncias d
    LEFT JOIN Usuarios u ON d.usuario_id = u.usuario_id
    LEFT JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
    LEFT JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
    LEFT JOIN Municipios m ON c.municipio_id = m.municipio_id
    LEFT JOIN Municipios m_directo ON d.municipio_id = m_directo.municipio_id
    WHERE d.denuncia_id = ?
    LIMIT 1
  `;
  db.query(query, [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0] || null);
  });
};

// También actualizar la función obtenerDenuncias para incluir teléfono
export const obtenerDenuncias = (filtros, callback) => {
  const where = [];
  const params = [];

  if (filtros.estado) {
    where.push("d.estado_denuncia = ?");
    params.push(filtros.estado);
  }
  
  if (filtros.mine && filtros.usuario_id) {
    where.push("d.usuario_id = ?");
    params.push(filtros.usuario_id);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  
  const query = `
    SELECT 
            d.denuncia_id as id, 
            d.usuario_id, 
            d.vivienda_id, 
            d.municipio_id,
            d.comunidad_id,
            d.direccion,
            d.descripcion, 
            d.fotos_vinchucas,
            d.foto_vivienda,
            d.codigo_pais,
            d.numero_telefono,
            d.fecha_denuncia, 
            d.latitud, 
            d.longitud, 
            d.altura, 
            d.estado_denuncia, 
            d.motivo_cancelacion,  -- ✅ CORREGIDO: usar motivo_cancelacion en lugar de id_motivo_cancelacion
            d.motivo_reprogramacion, -- ✅ NUEVO CAMPO
            d.fecha_programacion, 
            d.fecha_ejecucion, 
            d.fecha_creacion, 
            d.fecha_modificacion,
            u.nombre_completo AS nombre_usuario, 
            u.correo_electronico,
            v.numero_vivienda, 
            v.jefe_familia, 
            c.nombre_comunidad, 
            COALESCE(m_directo.nombre_municipio, m.nombre_municipio) AS nombre_municipio
        FROM Denuncias d
        LEFT JOIN Usuarios u ON d.usuario_id = u.usuario_id
        LEFT JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
        LEFT JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
        LEFT JOIN Municipios m ON c.municipio_id = m.municipio_id
        LEFT JOIN Municipios m_directo ON d.municipio_id = m_directo.municipio_id
    ${whereSql}
    ORDER BY d.fecha_creacion DESC
  `;

  db.query(query, params, (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

// Actualizar
export const actualizarDenuncia = (id, data, callback) => {
  const query = `
    UPDATE Denuncias SET
      descripcion = COALESCE(?, descripcion),
      fotos_vinchucas = COALESCE(?, fotos_vinchucas),
      estado_denuncia = COALESCE(?, estado_denuncia),
      fecha_programacion = COALESCE(?, fecha_programacion),
      fecha_ejecucion = COALESCE(?, fecha_ejecucion),
      latitud = COALESCE(?, latitud),
      longitud = COALESCE(?, longitud),
      altura = COALESCE(?, altura),
      codigo_pais = COALESCE(?, codigo_pais), -- 🆕 NUEVO CAMPO
      numero_telefono = COALESCE(?, numero_telefono) -- 🆕 NUEVO CAMPO
    WHERE denuncia_id = ?
  `;
  const values = [
    data.descripcion ?? null,
    data.fotos_vinchucas ?? null,
    data.estado_denuncia ?? null,
    data.fecha_programacion ?? null,
    data.fecha_ejecucion ?? null,
    data.latitud ?? null,
    data.longitud ?? null,
    data.altura ?? null,
    data.codigo_pais ?? null, // 🆕 NUEVO CAMPO
    data.numero_telefono ?? null, // 🆕 NUEVO CAMPO
    id,
  ];
  db.query(query, values, (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

// Eliminar
export const eliminarDenuncia = (id, callback) => {
  const query = `DELETE FROM Denuncias WHERE denuncia_id = ?`;
  db.query(query, [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};