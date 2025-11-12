import { 
  crearUsuario, 
  buscarPorEmail, 
  buscarPorId, 
  obtenerTodos,
  actualizarUsuario,
  eliminarUsuario,
  obtenerTecnicos,
  obtenerJefesGrupo
} from "../models/usuarioModel.js";
import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ===================== REGISTRO =====================
export const register = async (req, res) => {
  const { nombre_completo, correo_electronico, contrasena, rol, municipios } = req.body;

  buscarPorEmail(correo_electronico, async (err, usuarioExistente) => {
    if (err) return res.status(500).json({ error: "Error en consulta" });
    if (usuarioExistente) return res.status(400).json({ error: "Correo ya registrado" });

    try {
      const hashedPassword = await bcrypt.hash(contrasena, 10);
      crearUsuario({ nombre_completo, correo_electronico, contrasena: hashedPassword, rol }, (err, result) => {
        if (err) return res.status(500).json({ error: "Error creando usuario" });

        const nuevoUsuarioId = result.insertId;

        // Asignar municipios si rol requiere
        if ((rol === "jefe_grupo" || rol === "tecnico") && Array.isArray(municipios) && municipios.length) {
          const values = municipios.map(m => [nuevoUsuarioId, m, new Date()]);
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

// Obtener todos los usuarios con municipios
export const getUsuarios = (req, res) => {
  obtenerTodos((err, usuarios) => {
    if (err) return res.status(500).json({ error: "Error obteniendo usuarios" });
    res.json(usuarios);
  });
};

// Obtener usuario por ID
export const getUsuarioById = (req, res) => {
  const { id } = req.params;

  buscarPorId(id, (err, usuario) => {
    if (err) return res.status(500).json({ error: "Error en consulta" });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    db.query(
      "SELECT municipio_id FROM Usuario_Municipio WHERE usuario_id = ?",
      [id],
      (err2, resultados) => {
        if (err2) return res.status(500).json({ error: "Error obteniendo municipios" });
        usuario.municipios = resultados.map(r => r.municipio_id);
        res.json(usuario);
      }
    );
  });
};

// Actualizar usuario
export const updateUsuarioController = async (req, res) => {
  const { id } = req.params;
  let { nombre_completo, correo_electronico, contrasena, rol, estado, municipios } = req.body;

  try {
    if (contrasena) {
      contrasena = await bcrypt.hash(contrasena, 10);
    } else {
      const usuarioActual = await new Promise((resolve, reject) =>
        buscarPorId(id, (err, user) => err ? reject(err) : resolve(user))
      );
      contrasena = usuarioActual.contrasena;
    }

    actualizarUsuario(id, { nombre_completo, correo_electronico, contrasena, rol, estado }, (err) => {
      if (err) return res.status(500).json({ error: "Error actualizando usuario" });

      db.query("DELETE FROM Usuario_Municipio WHERE usuario_id=?", [id], err2 => {
        if (err2) return res.status(500).json({ error: "Error limpiando municipios previos" });

        if ((rol === "jefe_grupo" || rol === "tecnico") && Array.isArray(municipios) && municipios.length) {
          const values = municipios.map(m => [id, m, new Date()]);
          db.query("INSERT INTO Usuario_Municipio (usuario_id, municipio_id, fecha_asignacion) VALUES ?", [values], err3 => {
            if (err3) return res.status(500).json({ message: "Usuario actualizado pero error en municipios" });
            return res.status(200).json({ message: "Usuario y municipios actualizados" });
          });
        } else {
          return res.status(200).json({ message: "Usuario actualizado sin municipios" });
        }
      });
    });
  } catch (err) {
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
