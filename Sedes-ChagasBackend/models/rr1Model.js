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

// Crear formulario RR1 principal
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
      insecticida_utilizado, lote, dosis, estado
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      u.nombre_completo as tecnico_nombre
    FROM Formulario_RR1 fr
    LEFT JOIN Usuarios u ON fr.tecnico_id = u.usuario_id
    ORDER BY fr.fecha_registro DESC
  `;
  
  executeQuery(query, [], (err, results) => {
    if (err) {
      console.error("❌ Error al obtener formularios:", err.message);
      return callback(err);
    }
    console.log(`✅ Obtenidos ${results.length} formularios RR1`);
    callback(null, results);
  });
};

// Obtener formulario RR1 por ID
export const obtenerFormularioRR1PorId = (id, callback) => {
  const query = `
    SELECT 
      fr.*,
      u.nombre_completo as tecnico_nombre
    FROM Formulario_RR1 fr
    LEFT JOIN Usuarios u ON fr.tecnico_id = u.usuario_id
    WHERE fr.id_rr1 = ?
  `;

  executeQuery(query, [id], (err, results) => {
    if (err) {
      console.error("❌ Error al obtener formulario:", err.message);
      return callback(err);
    }
    
    if (results.length === 0) {
      console.log(`❌ Formulario RR1 con ID ${id} no encontrado`);
      return callback(null, null);
    }
    
    console.log(`✅ Formulario RR1 con ID ${id} obtenido correctamente`);
    callback(null, results[0]);
  });
};