import {
  crearUsuario,
  buscarPorEmail,
  buscarPorId,
  obtenerTodos,
  obtenerTecnicos,
  obtenerJefesGrupo,
  actualizarUsuario,
  eliminarUsuario
} from "../models/usuarioModel.js";
import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ===================== CONFIGURACIÓN MAILJET =====================
const transporter = nodemailer.createTransport({
  host: 'in-v3.mailjet.com',
  port: 587,
  auth: {
    user: process.env.MAILJET_API_KEY,
    pass: process.env.MAILJET_SECRET_KEY
  }
});

// Almacenamiento temporal de códigos
const codigosRecuperacion = new Map();

// ===================== REGISTRO =====================
export const register = async (req, res) => {
  let { nombre_completo, correo_electronico, contrasena, rol, municipios } = req.body;
  const usuarioId = req.user?.usuario_id;
  const rolUsuario = req.user?.rol;

  // 🛡️ RESTRICCIÓN DE SEGURIDAD: Jefe de Grupo
  if (rolUsuario === 'jefe_grupo') {
    if (rol === 'administrador' || rol === 'supervisor') {
      console.warn(`⛔ Intento de escalada de privilegios bloqueado. Usuario ${usuarioId} (Jefe) intentó crear ${rol}`);
      return res.status(403).json({
        error: "Acceso denegado: Un Jefe de Grupo no tiene permisos para crear Administradores ni Supervisores."
      });
    }
  }

  // Función auxiliar para continuar el registro
  const continuarRegistro = async (municipiosFinales) => {
    buscarPorEmail(correo_electronico, async (err, usuarioExistente) => {
      if (err) return res.status(500).json({ error: "Error en consulta" });
      if (usuarioExistente) return res.status(400).json({ error: "Correo ya registrado" });

      try {
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        crearUsuario({ nombre_completo, correo_electronico, contrasena: hashedPassword, rol }, (err, result) => {
          if (err) return res.status(500).json({ error: "Error creando usuario" });

          const nuevoUsuarioId = result.insertId;

          // Asignar municipios si rol requiere
          if ((rol === "jefe_grupo" || rol === "tecnico" || rol === "supervisor") && Array.isArray(municipiosFinales) && municipiosFinales.length) {
            const values = municipiosFinales.map(m => [nuevoUsuarioId, m, new Date()]);
            db.query(
              "INSERT INTO Usuario_Municipio (usuario_id, municipio_id, fecha_asignacion) VALUES ?",
              [values],
              err2 => {
                if (err2) return res.status(500).json({ message: "Usuario creado pero error asignando municipios" });
                return res.status(201).json({ message: "Usuario creado y asignado", usuario_id: nuevoUsuarioId });
              }
            );
          } else {
            return res.status(201).json({ message: "Usuario creado", usuario_id: nuevoUsuarioId });
          }
        });
      } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
      }
    });
  };

  // Si es supervisor, validar que solo pueda crear usuarios de su municipio
  if (rolUsuario === 'supervisor' && usuarioId) {
    obtenerMunicipioSupervisor(usuarioId, (err, municipioSupervisor) => {
      if (err || !municipioSupervisor) {
        return res.status(403).json({ error: "Supervisor sin municipio asignado" });
      }

      // Validar que los municipios asignados sean solo el del supervisor
      let municipiosFinales = municipios;
      if (Array.isArray(municipios) && municipios.length > 0) {
        const municipiosInvalidos = municipios.filter(m => m != municipioSupervisor);
        if (municipiosInvalidos.length > 0) {
          return res.status(403).json({
            error: `Solo puede crear usuarios del municipio asignado (ID: ${municipioSupervisor})`
          });
        }
      } else if (rol === "jefe_grupo" || rol === "tecnico" || rol === "supervisor") {
        // Si el rol requiere municipios pero no se proporcionaron, asignar el del supervisor
        municipiosFinales = [municipioSupervisor];
      }

      continuarRegistro(municipiosFinales);
    });
    return;
  }

  // Para administradores, continuar sin restricciones
  continuarRegistro(municipios);
};

// ===================== LOGIN =====================
export const login = async (req, res) => {
  const { correo_electronico, contrasena } = req.body;

  buscarPorEmail(correo_electronico, async (err, usuario) => {
    if (err) return res.status(500).json({ error: "Error en consulta" });
    if (!usuario) return res.status(400).json({ error: "Credenciales inválidas" });

    const match = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!match) return res.status(400).json({ error: "Credenciales inválidas" });

    const token = jwt.sign(
      { usuario_id: usuario.usuario_id, rol: usuario.rol },
      process.env.JWT_SECRET || "tu_clave_secreta",
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login exitoso",
      token,
      usuario: {
        usuario_id: usuario.usuario_id,
        nombre_completo: usuario.nombre_completo,
        correo_electronico: usuario.correo_electronico,
        rol: usuario.rol
      }
    });
  });
};

// ===================== CRUD =====================

// Función auxiliar para obtener el municipio del supervisor
function obtenerMunicipioSupervisor(usuarioId, callback) {
  db.query(
    'SELECT municipio_id FROM Usuario_Municipio WHERE usuario_id = ? LIMIT 1',
    [usuarioId],
    (err, results) => {
      if (err || !results || results.length === 0) {
        return callback(null, null);
      }
      callback(null, results[0].municipio_id);
    }
  );
}

// Obtener todos los usuarios con municipios
export const getUsuarios = (req, res) => {
  const usuarioId = req.user?.usuario_id;
  const rol = req.user?.rol;

  // Si es supervisor, filtrar usuarios por su municipio
  if (rol === 'supervisor' && usuarioId) {
    obtenerMunicipioSupervisor(usuarioId, (err, municipioId) => {
      if (err || !municipioId) {
        return res.status(403).json({ error: "Supervisor sin municipio asignado" });
      }

      // Obtener solo usuarios que tengan el mismo municipio
      const query = `
        SELECT DISTINCT
          u.usuario_id, 
          u.nombre_completo, 
          u.correo_electronico, 
          u.rol, 
          u.estado,
          COALESCE(GROUP_CONCAT(m.nombre_municipio SEPARATOR ', '), '') AS municipios
        FROM Usuarios u
        INNER JOIN Usuario_Municipio um ON u.usuario_id = um.usuario_id
        LEFT JOIN Municipios m ON um.municipio_id = m.municipio_id
        WHERE um.municipio_id = ?
        GROUP BY u.usuario_id
      `;

      db.query(query, [municipioId], (err2, usuarios) => {
        if (err2) return res.status(500).json({ error: "Error obteniendo usuarios" });
        res.json(usuarios);
      });
    });
    return;
  }

  // Para administradores y otros roles, obtener usuarios
  obtenerTodos((err, usuarios) => {
    if (err) return res.status(500).json({ error: "Error obteniendo usuarios" });

    // 🛡️ FILTRO DE VISIBILIDAD: Jefe de Grupo
    if (rol === 'jefe_grupo') {
      const usuariosFiltrados = usuarios.filter(u =>
        u.rol !== 'administrador' && u.rol !== 'supervisor'
      );
      return res.json(usuariosFiltrados);
    }

    res.json(usuarios);
  });
};

// Obtener usuario por ID
export const getUsuarioById = (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user?.usuario_id;
  const rol = req.user?.rol;

  buscarPorId(id, (err, usuario) => {
    if (err) return res.status(500).json({ error: "Error en consulta" });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    db.query(
      "SELECT municipio_id FROM Usuario_Municipio WHERE usuario_id = ?",
      [id],
      (err2, resultados) => {
        if (err2) return res.status(500).json({ error: "Error obteniendo municipios" });
        usuario.municipios = resultados.map(r => r.municipio_id);

        // Si es supervisor, validar que el usuario pertenezca a su municipio
        if (rol === 'supervisor' && usuarioId) {
          obtenerMunicipioSupervisor(usuarioId, (err3, municipioSupervisor) => {
            if (err3 || !municipioSupervisor) {
              return res.status(403).json({ error: "Supervisor sin municipio asignado" });
            }

            // Verificar que el usuario tenga el mismo municipio
            const tieneMunicipio = usuario.municipios.includes(municipioSupervisor);
            if (!tieneMunicipio) {
              return res.status(403).json({ error: "No tiene permiso para ver este usuario" });
            }

            res.json(usuario);
          });
          return;
        }

        res.json(usuario);
      }
    );
  });
};

// Actualizar usuario
export const updateUsuarioController = async (req, res) => {
  const { id } = req.params;
  const { nombre_completo, correo_electronico, contrasena, rol, estado, municipios } = req.body;
  const usuarioId = req.user?.usuario_id;
  const rolUsuario = req.user?.rol;

  try {
    // 🛡️ RESTRICCIÓN DE SEGURIDAD: Jefe de Grupo
    if (rolUsuario === 'jefe_grupo') {
      if (rol === 'administrador' || rol === 'supervisor') {
        console.warn(`⛔ Intento de escalada de privilegios (Update) bloqueado. Jefe ${usuarioId} intentó asignar ${rol}`);
        return res.status(403).json({
          error: "Acceso denegado: Un Jefe de Grupo no tiene permisos para asignar roles de Administrador o Supervisor."
        });
      }
    }

    // Validar campos obligatorios
    if (!nombre_completo || !correo_electronico || !rol) {
      return res.status(400).json({ error: "Nombre, correo y rol son obligatorios" });
    }

    // Función auxiliar para continuar la actualización
    const continuarActualizacion = async (municipiosFinales) => {
      // ✅ SOLUCIÓN: Preparar datos sin el campo contraseña si no se proporciona
      const updateData = {
        nombre_completo: nombre_completo.trim(),
        correo_electronico: correo_electronico.trim(),
        rol,
        estado: estado || 'activo'
      };

      // ✅ SOLUCIÓN: Solo procesar contraseña si se proporciona explícitamente
      if (contrasena && contrasena.trim() !== "") {
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        updateData.contrasena = hashedPassword;
      }

      // Actualizar el usuario
      actualizarUsuario(id, updateData, (err) => {
        if (err) {
          console.error("Error actualizando usuario:", err);
          return res.status(500).json({ error: "Error actualizando usuario en la base de datos" });
        }

        // Manejar municipios
        db.query("DELETE FROM Usuario_Municipio WHERE usuario_id = ?", [id], (err2) => {
          if (err2) {
            console.error("Error limpiando municipios previos:", err2);
            return res.status(500).json({ error: "Error limpiando municipios previos" });
          }

          // Si el rol requiere municipios y se proporcionaron, insertarlos
          if ((rol === "jefe_grupo" || rol === "tecnico" || rol === "supervisor") && Array.isArray(municipiosFinales) && municipiosFinales.length > 0) {
            const values = municipiosFinales.map(m => [id, m, new Date()]);
            db.query(
              "INSERT INTO Usuario_Municipio (usuario_id, municipio_id, fecha_asignacion) VALUES ?",
              [values],
              (err3) => {
                if (err3) {
                  console.error("Error insertando municipios:", err3);
                  return res.status(500).json({
                    message: "Usuario actualizado pero error asignando municipios"
                  });
                }
                return res.status(200).json({
                  message: "Usuario y municipios actualizados correctamente"
                });
              }
            );
          } else {
            return res.status(200).json({
              message: "Usuario actualizado correctamente"
            });
          }
        });
      });
    };

    // Si es supervisor, validar que solo pueda editar usuarios de su municipio
    if (rolUsuario === 'supervisor' && usuarioId) {
      // Primero verificar que el usuario a editar pertenezca al municipio del supervisor
      obtenerMunicipioSupervisor(usuarioId, (err, municipioSupervisor) => {
        if (err || !municipioSupervisor) {
          return res.status(403).json({ error: "Supervisor sin municipio asignado" });
        }

        // Verificar que el usuario a editar tenga el mismo municipio
        db.query(
          "SELECT municipio_id FROM Usuario_Municipio WHERE usuario_id = ?",
          [id],
          (err2, resultados) => {
            if (err2) return res.status(500).json({ error: "Error verificando municipios del usuario" });

            const municipiosUsuario = resultados.map(r => r.municipio_id);
            const tieneMunicipio = municipiosUsuario.includes(municipioSupervisor);

            if (!tieneMunicipio) {
              return res.status(403).json({ error: "No tiene permiso para editar este usuario" });
            }

            // Validar que los municipios asignados sean solo el del supervisor
            let municipiosFinales = municipios;
            if (Array.isArray(municipios) && municipios.length > 0) {
              const municipiosInvalidos = municipios.filter(m => m != municipioSupervisor);
              if (municipiosInvalidos.length > 0) {
                return res.status(403).json({
                  error: `Solo puede asignar el municipio asignado (ID: ${municipioSupervisor})`
                });
              }
            } else if (rol === "jefe_grupo" || rol === "tecnico" || rol === "supervisor") {
              // Si el rol requiere municipios pero no se proporcionaron, asignar el del supervisor
              municipiosFinales = [municipioSupervisor];
            }

            continuarActualizacion(municipiosFinales);
          }
        );
      });
      return;
    }

    // Para administradores, continuar sin restricciones
    continuarActualizacion(municipios);

  } catch (err) {
    console.error("Error en updateUsuarioController:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar usuario
export const deleteUsuarioController = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM Usuario_Municipio WHERE usuario_id=?", [id], err => {
    if (err) return res.status(500).json({ error: "Error eliminando municipios" });
    db.query("DELETE FROM Usuarios WHERE usuario_id=?", [id], err2 => {
      if (err2) return res.status(500).json({ error: "Error eliminando usuario" });
      return res.status(200).json({ message: "Usuario eliminado con municipios" });
    });
  });
};

// Actualizar solo el estado (Soft Delete logic)
export const updateUsuarioEstadoController = (req, res) => {
  const { id } = req.params;
  const { estado } = req.body; // 'activo' | 'inactivo'

  if (!['activo', 'inactivo'].includes(estado)) {
    return res.status(400).json({ error: "Estado inválido. Use 'activo' o 'inactivo'." });
  }

  db.query("UPDATE Usuarios SET estado = ? WHERE usuario_id = ?", [estado, id], (err, result) => {
    if (err) {
      console.error("Error actualizando estado:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json({ message: `Usuario marcado como ${estado}` });
  });
};

// ===================== FUNCIONES NUEVAS =====================
export const getTecnicos = (req, res) => {
  obtenerTecnicos((err, tecnicos) => {
    if (err) return res.status(500).json({ error: "Error al obtener técnicos" });
    res.json(tecnicos);
  });
};

export const getJefesGrupo = (req, res) => {
  obtenerJefesGrupo((err, jefesGrupo) => {
    if (err) return res.status(500).json({ error: "Error al obtener jefes de grupo" });
    res.json(jefesGrupo);
  });
};

// ================== RECUPERACIÓN DE CONTRASEÑA CON MAILJET ==================

export const solicitarRecuperacionContrasena = async (req, res) => {
  try {
    const { correo_electronico } = req.body;

    // Verificar si el correo existe
    buscarPorEmail(correo_electronico, async (err, usuario) => {
      if (err) {
        console.error("Error en consulta:", err);
        return res.status(500).json({ error: "Error en consulta" });
      }

      if (!usuario) {
        return res.status(404).json({ error: "No existe una cuenta con este correo electrónico" });
      }

      // Generar código de 6 dígitos
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const expiracion = Date.now() + 15 * 60 * 1000; // 15 minutos

      // Guardar código en memoria
      codigosRecuperacion.set(correo_electronico, {
        codigo,
        expiracion
      });

      // Configurar el email
      const mailOptions = {
        from: `"Programa Nacional de Chagas" <${process.env.MAILJET_FROM_EMAIL || 'alej.meruviaguerra@gmail.com'}>`,
        to: correo_electronico,
        subject: 'Código de recuperación de contraseña - Programa Nacional de Chagas',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d32f2f;">Programa Nacional de Chagas</h2>
            <h3>Recuperación de Contraseña</h3>
            <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
            <p>Tu código de recuperación es:</p>
            <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${codigo}
            </div>
            <p>Este código expirará en 15 minutos.</p>
            <p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Sistema de Vigilancia, Denuncia y Tratamiento</p>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Código de recuperación enviado a: ${correo_electronico}`);

        res.json({
          message: "Código de recuperación enviado a tu correo electrónico",
          expiracion: "15 minutos"
        });
      } catch (emailError) {
        console.error("❌ Error al enviar email:", emailError);
        res.status(500).json({ error: "Error al enviar el código de recuperación" });
      }
    });

  } catch (error) {
    console.error("Error en recuperación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const resetearContrasena = async (req, res) => {
  try {
    const { correo_electronico, codigo, nueva_contrasena } = req.body;

    // Verificar si existe un código para este email
    const datosRecuperacion = codigosRecuperacion.get(correo_electronico);

    if (!datosRecuperacion) {
      return res.status(400).json({ error: "Código no válido o expirado" });
    }

    // Verificar expiración
    if (Date.now() > datosRecuperacion.expiracion) {
      codigosRecuperacion.delete(correo_electronico);
      return res.status(400).json({ error: "El código ha expirado" });
    }

    // Verificar código
    if (datosRecuperacion.codigo !== codigo) {
      return res.status(400).json({ error: "Código incorrecto" });
    }

    // Buscar usuario
    buscarPorEmail(correo_electronico, async (err, usuario) => {
      if (err) {
        console.error("Error en consulta:", err);
        return res.status(500).json({ error: "Error en consulta" });
      }

      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      try {
        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(nueva_contrasena, 10);

        // Actualizar contraseña en la base de datos usando actualizarUsuario
        actualizarUsuario(
          usuario.usuario_id,
          {
            ...usuario,
            contrasena: hashedPassword
          },
          (err, result) => {
            if (err) {
              console.error("Error al actualizar contraseña:", err);
              return res.status(500).json({ error: "Error al actualizar contraseña" });
            }

            // Eliminar código usado
            codigosRecuperacion.delete(correo_electronico);

            res.json({
              message: "Contraseña actualizada correctamente"
            });
          }
        );

      } catch (hashError) {
        console.error("Error en hash:", hashError);
        res.status(500).json({ error: "Error interno del servidor" });
      }
    });

  } catch (error) {
    console.error("Error en reset de contraseña:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getMunicipiosByUsuarioId = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    console.log(`🔍 Obteniendo municipios para usuario: ${usuarioId}`);

    const [results] = await db.promise().query(`
      SELECT DISTINCT 
        m.municipio_id, 
        m.nombre_municipio
      FROM Usuario_Municipio um
      INNER JOIN Municipios m ON um.municipio_id = m.municipio_id
      WHERE um.usuario_id = ?
      ORDER BY m.nombre_municipio
    `, [usuarioId]);

    console.log(`✅ Municipios encontrados: ${results.length}`);

    res.json(results);
  } catch (err) {
    console.error("❌ Error en getMunicipiosByUsuarioId:", err);
    res.status(500).json({ error: "Error al obtener municipios del usuario" });
  }
};