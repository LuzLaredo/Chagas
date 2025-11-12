import db, { verifyConnection } from "../config/db.js";

// Función para ejecutar queries con verificación de conexión
const executeQuery = (query, values = [], callback) => {
  verifyConnection((err) => {
    if (err) {
      console.error("❌ Error de conexión en executeQuery:", err.message);
      return callback(err);
    }
    
    db.query(query, values, (err, results) => {
      if (err) {
        console.error("❌ Error en query:", err.message);
        console.error("📝 Query:", query);
        console.error("🔧 Valores:", values);
        return callback(err);
      }
      callback(null, results);
    });
  });
};

// Obtener todos los municipios
export const obtenerMunicipios = (callback) => {
  const query = `
    SELECT 
      municipio_id,
      nombre_municipio as nombre,
      coordenadas,
      departamento
    FROM Municipios 
    ORDER BY nombre_municipio ASC
  `;
  
  executeQuery(query, [], callback);
};

// Obtener comunidades por municipio (o todas)
export const obtenerComunidades = (municipioId = null, callback) => {
  let query = `
    SELECT 
      c.comunidad_id,
      c.nombre_comunidad as nombre,
      c.municipio_id,
      c.cantidad_viviendas,
      c.estado,
      m.nombre_municipio as municipio_nombre
    FROM Comunidades c
    LEFT JOIN Municipios m ON c.municipio_id = m.municipio_id
    WHERE c.estado = 'activo'
  `;
  
  const values = [];
  
  if (municipioId) {
    query += ` AND c.municipio_id = ?`;
    values.push(municipioId);
  }
  
  query += ` ORDER BY c.nombre_comunidad ASC`;
  
  executeQuery(query, values, callback);
};

// Obtener todas las sedes
export const obtenerSedes = (callback) => {
  const query = `
    SELECT 
      sede_id,
      nombre_sede as nombre,
      direccion
    FROM Sedes 
    ORDER BY nombre_sede ASC
  `;
  
  executeQuery(query, [], callback);
};

// Obtener redes de salud por sede (o todas)
export const obtenerRedesSalud = (sedeId = null, callback) => {
  let query = `
    SELECT 
      rs.redsalud_id,
      rs.nombre_red as nombre,
      rs.sede_id,
      s.nombre_sede as sede_nombre
    FROM RedSalud rs
    LEFT JOIN Sedes s ON rs.sede_id = s.sede_id
    WHERE 1=1
  `;
  
  const values = [];
  
  if (sedeId) {
    query += ` AND rs.sede_id = ?`;
    values.push(sedeId);
  }
  
  query += ` ORDER BY rs.nombre_red ASC`;
  
  executeQuery(query, values, callback);
};

// Obtener establecimientos de salud por red (o todos)
export const obtenerEstablecimientosSalud = (redsaludId = null, callback) => {
  let query = `
    SELECT 
      es.establecimiento_id,
      es.nombre_establecimiento as nombre,
      es.redsalud_id,
      es.tipo_establecimiento,
      rs.nombre_red as red_salud_nombre,
      s.nombre_sede as sede_nombre
    FROM EstablecimientosSalud es
    LEFT JOIN RedSalud rs ON es.redsalud_id = rs.redsalud_id
    LEFT JOIN Sedes s ON rs.sede_id = s.sede_id
    WHERE 1=1
  `;
  
  const values = [];
  
  if (redsaludId) {
    query += ` AND es.redsalud_id = ?`;
    values.push(redsaludId);
  }
  
  query += ` ORDER BY es.nombre_establecimiento ASC`;
  
  executeQuery(query, values, callback);
};

// Obtener todos los catalogos en una sola operación
export const obtenerTodosLosCatalogos = (callback) => {
  console.log("📋 Obteniendo todos los catálogos...");
  
  obtenerMunicipios((err, municipios) => {
    if (err) return callback(err);
    
    obtenerComunidades(null, (err, comunidades) => {
      if (err) return callback(err);
      
      obtenerSedes((err, sedes) => {
        if (err) return callback(err);
        
        obtenerRedesSalud(null, (err, redesSalud) => {
          if (err) return callback(err);
          
          obtenerEstablecimientosSalud(null, (err, establecimientos) => {
            if (err) return callback(err);
            
            const catalogosCompletos = {
              municipios: municipios || [],
              comunidades: comunidades || [],
              sedes: sedes || [],
              redesSalud: redesSalud || [],
              establecimientos: establecimientos || []
            };
            
            console.log(`✅ Todos los catálogos obtenidos exitosamente`);
            callback(null, catalogosCompletos);
          });
        });
      });
    });
  });
};

// Obtener municipios asignados a un usuario específico
export const obtenerMunicipiosPorUsuario = (usuarioId, callback) => {
  const query = `
    SELECT 
      m.municipio_id,
      m.nombre_municipio as nombre,
      m.coordenadas,
      m.departamento,
      um.fecha_asignacion
    FROM Municipios m
    INNER JOIN Usuario_Municipio um ON m.municipio_id = um.municipio_id
    WHERE um.usuario_id = ?
    ORDER BY m.nombre_municipio ASC
  `;
  
  executeQuery(query, [usuarioId], callback);
};

// Función para obtener técnicos (desde tabla Usuarios)
export const obtenerTecnicos = (callback) => {
  const query = `
    SELECT 
      usuario_id,
      nombre_completo as nombre
    FROM Usuarios 
    WHERE rol = 'tecnico' AND estado = 'activo'
    ORDER BY nombre_completo ASC
  `;
  
  executeQuery(query, [], callback);
};

// Función para obtener jefes de grupo (desde tabla Usuarios)
export const obtenerJefesGrupo = (callback) => {
  const query = `
    SELECT 
      usuario_id,
      nombre_completo as nombre
    FROM Usuarios 
    WHERE rol = 'jefe_grupo' AND estado = 'activo'
    ORDER BY nombre_completo ASC
  `;
  
  executeQuery(query, [], callback);
};