import db, { verifyConnection } from "../config/db.js";

// ========================================================
// 🔹 Función genérica para ejecutar queries con verificación
// ========================================================
const executeQuery = (query, values = [], callback) => {
  verifyConnection((err) => {
    if (err) {
      console.error("❌ Error de conexión:", err.message);
      return callback(err);
    }

    db.query(query, values, (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  });
};

// ========================================================
// 🔹 Crear usuario (⚠️ sin volver a hashear)
// ========================================================
export const crearUsuario = async (usuarioData, callback) => {
  try {
    const query = `
      INSERT INTO Usuarios (nombre_completo, correo_electronico, contrasena, rol, estado)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [
      usuarioData.nombre_completo,
      usuarioData.correo_electronico,
      usuarioData.contrasena, // ✅ ya viene hasheada desde el controlador
      usuarioData.rol || "usuario",
      usuarioData.estado || "activo",
    ];

    executeQuery(query, values, callback);
  } catch (err) {
    callback(err);
  }
};

// ========================================================
// 🔹 Buscar usuario por email
// ========================================================
export const buscarPorEmail = (correo, callback) => {
  const query = "SELECT * FROM Usuarios WHERE correo_electronico = ?";
  executeQuery(query, [correo], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

// ========================================================
// 🔹 Buscar usuario por ID
// ========================================================
export const buscarPorId = (id, callback) => {
  const query = "SELECT * FROM Usuarios WHERE usuario_id = ?";
  executeQuery(query, [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

// ========================================================
// 🔹 Obtener todos los usuarios con municipios asignados
// ========================================================
export const obtenerTodos = (callback) => {
  const query = `
    SELECT 
      u.usuario_id, 
      u.nombre_completo, 
      u.correo_electronico, 
      u.rol, 
      u.estado,
      COALESCE(GROUP_CONCAT(m.nombre_municipio SEPARATOR ', '), '') AS municipios
    FROM Usuarios u
    LEFT JOIN Usuario_Municipio um ON u.usuario_id = um.usuario_id
    LEFT JOIN Municipios m ON um.municipio_id = m.municipio_id
    GROUP BY u.usuario_id
  `;
  executeQuery(query, [], callback);
};

// ========================================================
// 🔹 Actualizar usuario
// ========================================================
export const actualizarUsuario = (id, usuarioData, callback) => {
  const query = `
    UPDATE Usuarios 
    SET nombre_completo=?, correo_electronico=?, contrasena=?, rol=?, estado=? 
    WHERE usuario_id=?
  `;
  const values = [
    usuarioData.nombre_completo,
    usuarioData.correo_electronico,
    usuarioData.contrasena,
    usuarioData.rol,
    usuarioData.estado,
    id,
  ];
  executeQuery(query, values, callback);
};

// ========================================================
// 🔹 Eliminar usuario (marcar inactivo)
// ========================================================
export const eliminarUsuario = (id, callback) => {
  const query = "UPDATE Usuarios SET estado='inactivo' WHERE usuario_id=?";
  executeQuery(query, [id], callback);
};

// ========================================================
// 🔹 Verificar credenciales (login) – compara bcrypt en controlador
// ========================================================
export const verificarCredenciales = (correo, contrasena, callback) => {
  const query = "SELECT * FROM Usuarios WHERE correo_electronico = ?";
  executeQuery(query, [correo], async (err, results) => {
    if (err) return callback(err);
    const usuario = results[0];
    if (!usuario) return callback(null, null);

    // ⚠️ No hasheamos aquí, la comparación se hace con bcrypt.compare()
    // en el controlador login.
    callback(null, usuario);
  });
};

// ========================================================
// 🔹 Obtener técnicos activos
// ========================================================
export const obtenerTecnicos = (callback) => {
  const query = `
    SELECT usuario_id, nombre_completo 
    FROM Usuarios 
    WHERE rol='tecnico' AND estado='activo'
    ORDER BY nombre_completo
  `;
  executeQuery(query, [], callback);
};

// ========================================================
// 🔹 Obtener jefes de grupo activos
// ========================================================
export const obtenerJefesGrupo = (callback) => {
  const query = `
    SELECT usuario_id, nombre_completo 
    FROM Usuarios 
    WHERE rol='jefe_grupo' AND estado='activo'
    ORDER BY nombre_completo
  `;
  executeQuery(query, [], callback);
};
