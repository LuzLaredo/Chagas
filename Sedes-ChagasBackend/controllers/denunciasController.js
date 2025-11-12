// ===========================================================
// controllers/denunciasController.js
// ===========================================================

import {
  crearDenuncia,
  obtenerDenuncias,
  obtenerDenunciaPorId,
  actualizarDenuncia,
  eliminarDenuncia
} from "../models/denunciasModel.js";
import Vivienda from "../models/viviendasModel.js";
import db from "../config/db.js";

import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================= MULTER CONFIG =========================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads");
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos de imagen"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});

// Middleware para subida de archivos
export const uploadFiles = upload.fields([
  { name: "foto_vivienda", maxCount: 1 },
  { name: "fotos_vinchucas", maxCount: 10 },
]);

// ========================= CONSTANTES =========================
const ESTADOS = new Set(["recibida", "programada", "realizada", "cancelada"]);

// ===========================================================
// 🔸 CRUD PRINCIPAL (usado en panel admin / autenticado)
// ===========================================================

// Crear denuncia
export const crear = (req, res) => {
  try {
    if (!req.user || !req.user.usuario_id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const {
      jefe_familia,
      numero_vivienda,
      comunidad,
      descripcion,
      fecha_denuncia,
      latitud,
      longitud,
      altura,
      estado_denuncia,
      vivienda_id,
    } = req.body;

    let fotos_vinchucas = "";
    let foto_vivienda = "";

    if (req.files) {
      if (req.files.foto_vivienda?.[0]) {
        foto_vivienda = req.files.foto_vivienda[0].filename;
      }
      if (req.files.fotos_vinchucas?.length > 0) {
        fotos_vinchucas = req.files.fotos_vinchucas
          .map((file) => file.filename)
          .join(",");
      }
    }

    if (!descripcion?.trim()) {
      return res.status(400).json({ error: "La descripción es obligatoria" });
    }

    if (estado_denuncia && !ESTADOS.has(estado_denuncia)) {
      return res.status(400).json({ error: "Estado de denuncia inválido" });
    }

    if (!jefe_familia && !numero_vivienda && !comunidad && !vivienda_id) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar información de vivienda o vivienda_id" });
    }

    // Si se proporcionan datos de vivienda → crear nueva
    if (jefe_familia && numero_vivienda && comunidad) {
      const viviendaData = {
        numero_vivienda,
        jefe_familia,
        direccion: comunidad,
        latitud: latitud || -17.3938,
        longitud: longitud || -66.157,
        altura: altura || 2550,
        comunidad_id: 1,
      };

      Vivienda.create(viviendaData, (err, viviendaResult) => {
        if (err) {
          console.error("Error al crear vivienda:", err);
          if (err.code === "ER_DUP_ENTRY") {
            const payload = {
              usuario_id: req.user?.usuario_id || null,
              vivienda_id: 1,
              descripcion,
              fotos_vinchucas,
              foto_vivienda,
              fecha_denuncia,
              latitud,
              longitud,
              altura,
              estado_denuncia,
            };
            crearDenuncia(payload, (err, result) => {
              if (err) {
                console.error("Error al crear denuncia:", err);
                return res.status(500).json({ error: "Error en BD" });
              }
              res
                .status(201)
                .json({ message: "Denuncia creada", denuncia_id: result.insertId });
            });
          } else {
            return res
              .status(500)
              .json({ error: "Error al crear vivienda: " + err.message });
          }
        } else {
          const payload = {
            usuario_id: req.user?.usuario_id || null,
            vivienda_id: viviendaResult.insertId,
            descripcion,
            fotos_vinchucas,
            foto_vivienda,
            fecha_denuncia,
            latitud,
            longitud,
            altura,
            estado_denuncia,
          };

          crearDenuncia(payload, (err, result) => {
            if (err) {
              console.error("Error al crear denuncia:", err);
              return res.status(500).json({ error: "Error en BD" });
            }
            res
              .status(201)
              .json({ message: "Denuncia creada", denuncia_id: result.insertId });
          });
        }
      });
    } else {
      // Si no hay datos de vivienda → usar vivienda_id
      const payload = {
        usuario_id: req.user?.usuario_id || null,
        vivienda_id: vivienda_id || 1,
        descripcion,
        fotos_vinchucas,
        foto_vivienda,
        fecha_denuncia,
        latitud,
        longitud,
        altura,
        estado_denuncia,
      };

      crearDenuncia(payload, (err, result) => {
        if (err) {
          console.error("Error al crear denuncia:", err);
          return res.status(500).json({ error: "Error en BD" });
        }
        res
          .status(201)
          .json({ message: "Denuncia creada", denuncia_id: result.insertId });
      });
    }
  } catch (error) {
    console.error("Error general en crear denuncia:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Listar denuncias
export const listar = (req, res) => {
  const { estado, mine } = req.query;
  const filtros = { estado, mine: mine === "true", usuario_id: req.user?.usuario_id };

  obtenerDenuncias(filtros, (err, denuncias) => {
    if (err) {
      console.error("Error al obtener denuncias:", err);
      return res.status(500).json({ error: "Error en BD" });
    }
    res.json(denuncias);
  });
};

// Obtener denuncia por ID
export const obtenerPorId = (req, res) => {
  const { id } = req.params;

  obtenerDenunciaPorId(id, (err, denuncia) => {
    if (err) {
      console.error("Error al obtener denuncia:", err);
      return res.status(500).json({ error: "Error en BD" });
    }
    if (!denuncia) {
      return res.status(404).json({ error: "Denuncia no encontrada" });
    }
    res.json(denuncia);
  });
};

// Actualizar denuncia
export const actualizar = (req, res) => {
  const { id } = req.params;
  const {
    descripcion,
    fotos_vinchucas,
    latitud,
    longitud,
    altura,
    estado_denuncia,
    fecha_programacion,
    fecha_ejecucion,
  } = req.body;

  if (estado_denuncia && !ESTADOS.has(estado_denuncia)) {
    return res.status(400).json({ error: "estado inválido" });
  }

  const payload = {
    descripcion,
    fotos_vinchucas,
    latitud,
    longitud,
    altura,
    estado_denuncia,
    fecha_programacion,
    fecha_ejecucion,
  };

  actualizarDenuncia(id, payload, (err, result) => {
    if (err) {
      console.error("Error al actualizar denuncia:", err);
      return res.status(500).json({ error: "Error en BD" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Denuncia no encontrada" });
    }
    res.json({ message: "Denuncia actualizada" });
  });
};

// Eliminar denuncia
export const eliminar = (req, res) => {
  const { id } = req.params;

  eliminarDenuncia(id, (err, result) => {
    if (err) {
      console.error("Error al eliminar denuncia:", err);
      return res.status(500).json({ error: "Error en BD" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Denuncia no encontrada" });
    }
    res.json({ message: "Denuncia eliminada" });
  });
};

// Cancelar denuncia
export const cancelar = (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  if (!motivo) {
    return res.status(400).json({ error: "motivo es obligatorio" });
  }

  const payload = { estado_denuncia: "cancelada" };

  actualizarDenuncia(id, payload, (err, result) => {
    if (err) {
      console.error("Error al cancelar denuncia:", err);
      return res.status(500).json({ error: "Error en BD" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Denuncia no encontrada" });
    }
    res.json({ message: "Denuncia cancelada" });
  });
};

// ===========================================================
// 🟢 ENDPOINTS EXTRA (usados por CargaRociado.jsx)
// ===========================================================

export const getDenunciaByViviendaId = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT d.*, u.nombre_completo as usuario_nombre
    FROM Denuncias d
    LEFT JOIN Usuarios u ON d.usuario_id = u.usuario_id
    WHERE d.vivienda_id = ? 
    ORDER BY d.fecha_denuncia DESC
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error en consulta:", err);
      return res.status(500).json({ error: "Error en consulta" });
    }

    // ✅ Devolver [] si no hay denuncias, para evitar errores en frontend
    res.json(results || []);
  });
};

export const createDenuncia = (req, res) => {
  const { vivienda_id, descripcion, fotos_vinchucas, usuario_id, latitud, longitud, altura } = req.body;

  const query = `
    INSERT INTO Denuncias (vivienda_id, descripcion, fotos_vinchucas, usuario_id, fecha_denuncia, latitud, longitud, altura, estado_denuncia)
    VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, 'recibida')
  `;

  db.query(query, [vivienda_id, descripcion, fotos_vinchucas, usuario_id, latitud, longitud, altura], (err, results) => {
    if (err) {
      console.error("Error en consulta:", err);
      return res.status(500).json({ error: "Error en consulta" });
    }

    res.json({
      message: "Denuncia creada exitosamente",
      denuncia_id: results.insertId
    });
  });
};

export const updateDenunciaProgramacion = (req, res) => {
  const { id } = req.params;
  const { fecha_programacion } = req.body;

  const query = `
    UPDATE Denuncias 
    SET fecha_programacion = ?, estado_denuncia = 'programada'
    WHERE denuncia_id = ?
  `;

  db.query(query, [fecha_programacion, id], (err, results) => {
    if (err) {
      console.error("Error en consulta:", err);
      return res.status(500).json({ error: "Error en consulta" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Denuncia no encontrada" });
    }

    res.json({ message: "Programación actualizada exitosamente" });
  });
};
