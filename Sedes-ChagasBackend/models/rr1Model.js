import db, { verifyConnection } from "../config/db.js";

const executeQuery = (query, values, callback) => {
  verifyConnection((err) => {
    if (err) {
      console.error("❌ Error de conexión:", err.message);
      return callback(err);
    }
    
    db.query(query, values, (err, results) => {
      if (err) {
        console.error("❌ Error en query:", err.message);
        return callback(err);
      }
      callback(null, results);
    });
  });
};

// Crear formulario RR1 principal CON FECHA AUTOMÁTICA
export const crearFormularioRR1 = (formularioData, callback) => {
  console.log("📝 Datos recibidos para formulario RR1:", formularioData);
  
  const query = `
    INSERT INTO Formulario_RR1 (
      tecnico_id, jefe1_id, jefe2_id, jefe3_id, jefe4_id,
      sede_id, redsalud_id, establecimiento_id,
      municipio_id, comunidad_id, numero_vivienda, jefe_familia,
      habitantes_protegidos, cerrada, renuente, habitaciones_rociadas,
      habitaciones_no_rociadas, habitaciones_total, corrales, gallineros,
      conejeras, zarzos_trojes, otros_peridomicilio, numero_cargas,
      cantidad_insecticida, firma_conformidad, rociado, no_rociado,
      insecticida_utilizado, lote, dosis, estado,
      fecha_registro  -- ✅ AGREGAR fecha_registro
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    -- ✅ USAR NOW() para fecha automática
  `;

  const values = [
    formularioData.tecnico_id,
    formularioData.jefe1_id || null,
    formularioData.jefe2_id || null,
    formularioData.jefe3_id || null,
    formularioData.jefe4_id || null,
    formularioData.sede_id || null,
    formularioData.redsalud_id || null,
    formularioData.establecimiento_id || null,
    formularioData.municipio_id || null,
    formularioData.comunidad_id || null,
    formularioData.numero_vivienda,
    formularioData.jefe_familia,
    formularioData.habitantes_protegidos || 0,
    formularioData.cerrada ? 1 : 0,
    formularioData.renuente ? 1 : 0,
    formularioData.habitaciones_rociadas || 0,
    formularioData.habitaciones_no_rociadas || 0,
    formularioData.habitaciones_total || 0,
    formularioData.corrales || 0,
    formularioData.gallineros || 0,
    formularioData.conejeras || 0,
    formularioData.zarzos_trojes || 0,
    formularioData.otros_peridomicilio || 0,
    formularioData.numero_cargas || 0,
    formularioData.cantidad_insecticida || 0,
    formularioData.firma_conformidad || "",
    formularioData.rociado ? 1 : 0,
    formularioData.no_rociado ? 1 : 0,
    formularioData.insecticida_utilizado || "",
    formularioData.lote || "",
    formularioData.dosis || 0,
    formularioData.estado || 'activo'
    // ✅ NO incluir fecha_registro en values porque se usa NOW()
  ];

  console.log("🔧 Ejecutando query con valores:", values);

  executeQuery(query, values, (err, results) => {
    if (err) {
      console.error("❌ Error en crearFormularioRR1:", err.message);
      return callback(err);
    }
    console.log("✅ Formulario RR1 creado, ID:", results.insertId);
    callback(null, results);
  });
};

// Obtener todos los formularios RR1
export const obtenerFormulariosRR1 = (callback) => {
  const query = `
    SELECT 
      fr.*,
      u1.nombre_completo as tecnico_nombre,
      u2.nombre_completo as jefe1_nombre
    FROM Formulario_RR1 fr
    LEFT JOIN Usuarios u1 ON fr.tecnico_id = u1.usuario_id
    LEFT JOIN Usuarios u2 ON fr.jefe1_id = u2.usuario_id
    WHERE fr.estado != 'apagado'
    ORDER BY fr.fecha_registro DESC
  `;
  
  executeQuery(query, [], (err, results) => {
    if (err) {
      console.error("❌ Error al obtener formularios:", err.message);
      return callback(err);
    }
    console.log(`✅ Obtenidos ${results.length} formularios RR1 con nombres de jefe1`);
    callback(null, results);
  });
};

// Obtener formulario RR1 por ID
// RR1Model.js - VERSIÓN SIMPLIFICADA
// Obtener formulario RR1 por ID completo con nombres
// rr1Model.js
export const obtenerFormularioRR1PorId = (id, callback) => {
  const query = `
  SELECT fr.*,
    u1.nombre_completo AS tecnico_nombre,
    u2.nombre_completo AS jefe1_nombre,
    u3.nombre_completo AS jefe2_nombre,
    u4.nombre_completo AS jefe3_nombre,
    u5.nombre_completo AS jefe4_nombre,
    m.nombre_municipio AS municipio_nombre,
    c.nombre_comunidad AS comunidad_nombre,
    s.nombre_sede AS sede_nombre,
    rs.nombre_red AS redsalud_nombre,
    es.nombre_establecimiento AS establecimiento_nombre
  FROM Formulario_RR1 fr
    LEFT JOIN Usuarios u1 ON fr.tecnico_id = u1.usuario_id
    LEFT JOIN Usuarios u2 ON fr.jefe1_id = u2.usuario_id
    LEFT JOIN Usuarios u3 ON fr.jefe2_id = u3.usuario_id
    LEFT JOIN Usuarios u4 ON fr.jefe3_id = u4.usuario_id
    LEFT JOIN Usuarios u5 ON fr.jefe4_id = u5.usuario_id
    LEFT JOIN Municipios m ON fr.municipio_id = m.municipio_id
    LEFT JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
    LEFT JOIN Sedes s ON fr.sede_id = s.sede_id
    LEFT JOIN RedSalud rs ON fr.redsalud_id = rs.redsalud_id
    LEFT JOIN EstablecimientosSalud es ON fr.establecimiento_id = es.establecimiento_id
  WHERE fr.id_rr1 = ?
    AND fr.estado != 'apagado'
`;

  executeQuery(query, [id], (err, results) => {
    if (err) {
      console.error("❌ Error SQL:", err.message, err.sql);
      return callback(err);
    }
    if (results.length === 0) {
      return callback(null, null);
    }
    callback(null, results[0]);
  });
};
