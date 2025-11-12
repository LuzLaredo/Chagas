// ===========================================================
// models/denunciasModel.js
// ===========================================================

import db from "../config/db.js";

// Crear
export const crearDenuncia = (data, callback) => {
  const viviendaId = data.vivienda_id || 1;

  const query = `
    INSERT INTO Denuncias
      (usuario_id, vivienda_id, descripcion, fotos_vinchucas, fecha_denuncia, latitud, longitud, altura, estado_denuncia, fecha_programacion, fecha_ejecucion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.usuario_id || null,
    viviendaId,
    data.descripcion,
    data.fotos_vinchucas || null,
    data.fecha_denuncia || new Date().toISOString().slice(0, 10),
    data.latitud ?? null,
    data.longitud ?? null,
    data.altura ?? null,
    data.estado_denuncia || "recibida",
    data.fecha_programacion || null,
    data.fecha_ejecucion || null,
  ];

  db.query(query, values, (err, results) => {
    if (err) return callback(err);
    callback(null, { insertId: results.insertId });
  });
};

// Listar con filtros
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
      d.descripcion, 
      d.fotos_vinchucas,
      v.foto_entrada AS foto_vivienda, -- ✅ corrección aquí
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
      v.direccion,
      c.nombre_comunidad, 
      m.nombre_municipio
    FROM Denuncias d
    LEFT JOIN Usuarios u ON d.usuario_id = u.usuario_id
    LEFT JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
    LEFT JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
    LEFT JOIN Municipios m ON c.municipio_id = m.municipio_id
    ${whereSql}
    ORDER BY d.fecha_creacion DESC
  `;

  db.query(query, params, (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

// Obtener por ID
export const obtenerDenunciaPorId = (id, callback) => {
  const query = `
    SELECT 
      d.denuncia_id as id, 
      d.usuario_id, 
      d.vivienda_id, 
      d.descripcion, 
      d.fotos_vinchucas,
      v.foto_entrada AS foto_vivienda, -- ✅ corrección aquí
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
      v.direccion,
      c.nombre_comunidad, 
      m.nombre_municipio
    FROM Denuncias d
    LEFT JOIN Usuarios u ON d.usuario_id = u.usuario_id
    LEFT JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
    LEFT JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
    LEFT JOIN Municipios m ON c.municipio_id = m.municipio_id
    WHERE d.denuncia_id = ?
    LIMIT 1
  `;
  db.query(query, [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0] || null);
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
      altura = COALESCE(?, altura)
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
