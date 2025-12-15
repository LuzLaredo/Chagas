// ===========================================================
// controllers/denunciasController.js - VERSIÓN CORREGIDA
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

// 🆕 IMPORTAR MODELO DE NOTIFICACIONES
import { crearNotificacion, obtenerTecnicosPorMunicipio } from "../models/notificacionesModel.js";

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

// Middleware para subida de archivos - ACTUALIZADO CON LÍMITES
export const uploadFiles = upload.fields([
    { name: "foto_vivienda", maxCount: 1 }, // MÁXIMO 1 FOTO
    { name: "fotos_vinchucas", maxCount: 4 }, // MÁXIMO 4 FOTOS
]);

// ========================= CONSTANTES =========================
const ESTADOS = new Set(["recibida", "programada", "realizada", "cancelada", "reprogramada"]);

// ===========================================================
// 🔔 FUNCIÓN AUXILIAR DE NOTIFICACIÓN GRUPAL (Denuncia Creada)
// ===========================================================

const notificarCreacionDenuncia = (municipioIdNum, numeroVivienda, comunidadIdNum) => {
    if (!municipioIdNum || !numeroVivienda) return;

    obtenerTecnicosPorMunicipio(municipioIdNum, (errTecnicos, tecnicos) => {
        if (errTecnicos) {
            return console.error("⚠️ Error al obtener técnicos para notificación:", errTecnicos);
        }

        tecnicos.forEach(tecnico => {
            const mensaje = `Nueva Denuncia Asignada: Vivienda N° ${numeroVivienda} en ${tecnico.nombre_municipio}`;
            crearNotificacion({
                usuario_receptor_id: tecnico.usuario_id,
                tipo_entidad_origen: 'denuncia_nueva',
                id_entidad_origen: numeroVivienda,
                mensaje: mensaje,
                ruta_destino: '/CargaRociado'
            }, (errNoti) => {
                if (errNoti) console.error(`❌ Falló notificación de creación para ${tecnico.usuario_id}:`, errNoti);
            });
        });
        console.log(`✅ Notificaciones grupales de Denuncia Creada enviadas a ${tecnicos.length} técnicos.`);
    });
};

// ===========================================================
// 🔸 CRUD PRINCIPAL
// ===========================================================

// Crear denuncia - ACTUALIZADO CON NOTIFICACIÓN Y TELÉFONO
export const crear = (req, res) => {
    try {
        if (!req.user || !req.user.usuario_id) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }

        const {
            jefe_familia, numero_vivienda, comunidad_id, municipio_id, direccion,
            descripcion, fecha_denuncia, latitud, longitud, altura,
            estado_denuncia, vivienda_id, codigo_pais, numero_telefono
        } = req.body;

        // 🆕 VALIDACIÓN DEL TELÉFONO
        if (numero_telefono && numero_telefono.trim() !== '') {
            if (codigo_pais === '+591') {
                const regexBolivia = /^[0-9]{8}$/;
                if (!regexBolivia.test(numero_telefono.replace(/\s/g, ''))) {
                    return res.status(400).json({
                        error: "El número de teléfono para Bolivia debe tener 8 dígitos"
                    });
                }
            } else if (codigo_pais === '+51') {
                const regexPeru = /^[0-9]{9}$/;
                if (!regexPeru.test(numero_telefono.replace(/\s/g, ''))) {
                    return res.status(400).json({
                        error: "El número de teléfono para Perú debe tener 9 dígitos"
                    });
                }
            }
        }

        // Convertir IDs a número
        const municipioIdNum = municipio_id && municipio_id !== 'null' && municipio_id !== ''
            ? parseInt(municipio_id, 10) : null;

        const comunidadIdNum = comunidad_id && comunidad_id !== 'null' && comunidad_id !== ''
            ? parseInt(comunidad_id, 10) : null;

        let viviendaIdNum = null;
        if (vivienda_id && vivienda_id !== 'null' && vivienda_id !== '' && vivienda_id !== 'undefined') {
            const parsed = typeof vivienda_id === 'string' ? parseInt(vivienda_id, 10) : vivienda_id;
            viviendaIdNum = isNaN(parsed) ? null : parsed;
        }

        let fotos_vinchucas = "";
        let foto_vivienda = "";

        if (req.files) {
            if (req.files.foto_vivienda?.[0]) {
                foto_vivienda = req.files.foto_vivienda[0].filename;
            }

            if (req.files.fotos_vinchucas?.length > 0) {
                const fotosLimitadas = req.files.fotos_vinchucas.slice(0, 4);
                fotos_vinchucas = fotosLimitadas.map((file) => file.filename).join(",");

                if (req.files.fotos_vinchucas.length > 4) {
                    console.log(`Se limitaron las fotos de vinchucas a 4. Se recibieron: ${req.files.fotos_vinchucas.length}`);
                }
            }
        }

        if (!descripcion?.trim()) {
            return res.status(400).json({ error: "La descripción es obligatoria" });
        }

        if (estado_denuncia && !ESTADOS.has(estado_denuncia)) {
            return res.status(400).json({ error: "Estado de denuncia inválido" });
        }

        if (!jefe_familia && !numero_vivienda && !comunidadIdNum && !municipioIdNum && !viviendaIdNum) {
            return res.status(400).json({
                error: "Debe proporcionar información de vivienda (jefe_familia, numero_vivienda, comunidad_id, municipio_id) o vivienda_id"
            });
        }

        // CASO 1: CREAR NUEVA VIVIENDA con comunidad_id y municipio_id
        if (jefe_familia && numero_vivienda && comunidadIdNum && municipioIdNum) {

            const viviendaData = {
                numero_vivienda, jefe_familia, comunidad_id: comunidadIdNum, municipio_id: municipioIdNum,
                direccion: direccion || `Comunidad ID: ${comunidadIdNum}, Municipio ID: ${municipioIdNum}`,
                latitud: latitud || -17.3938, longitud: longitud || -66.157, altura: altura || 2550,
                foto_entrada: foto_vivienda || null,
            };

            Vivienda.create(viviendaData, (err, viviendaResult) => {
                if (err) {
                    console.error("Error al crear vivienda:", err);
                    if (err.code === "ER_DUP_ENTRY") {
                        const queryBuscarVivienda = `
                            SELECT vivienda_id, comunidad_id, municipio_id, numero_vivienda 
                            FROM Viviendas 
                            WHERE comunidad_id = ? AND numero_vivienda = ?
                            LIMIT 1
                        `;
                        db.query(queryBuscarVivienda, [comunidadIdNum, numero_vivienda], (errBuscar, resultBuscar) => {
                            if (errBuscar || !resultBuscar || resultBuscar.length === 0) {
                                return res.status(500).json({ error: "Error al buscar vivienda existente" });
                            }

                            const payload = {
                                usuario_id: req.user?.usuario_id || null,
                                vivienda_id: resultBuscar[0].vivienda_id,
                                municipio_id: municipioIdNum,
                                comunidad_id: comunidadIdNum,
                                direccion: direccion,
                                descripcion,
                                fotos_vinchucas,
                                foto_vivienda,
                                codigo_pais: codigo_pais || '+591',
                                numero_telefono: numero_telefono || null,
                                fecha_denuncia,
                                latitud,
                                longitud,
                                altura,
                                estado_denuncia: estado_denuncia || 'recibida',
                            };

                            crearDenuncia(payload, (err, result) => {
                                if (err) {
                                    console.error("Error al crear denuncia:", err);
                                    return res.status(500).json({ error: "Error en BD" });
                                }

                                const senderName = req.user?.nombre_completo || 'Sistema';
                                const mensaje = `Nueva Denuncia Asignada: Vivienda N° ${resultBuscar[0].numero_vivienda}`;

                                import('../models/notificacionesModel.js').then(({ crearNotificacionMasivaMunicipio }) => {
                                    crearNotificacionMasivaMunicipio(municipioIdNum, {
                                        tipo_entidad_origen: 'denuncia_nueva',
                                        id_entidad_origen: numeroVivienda,
                                        mensaje: mensaje,
                                        ruta_destino: '/CargaRociado',
                                        sender_name: senderName
                                    }, (errMasiva) => {
                                        if (errMasiva) console.error("Error en notificaciones masivas:", errMasiva);
                                    });
                                });

                                res.status(201).json({
                                    message: "Denuncia creada",
                                    denuncia_id: result.insertId,
                                    vivienda_id: resultBuscar[0].vivienda_id
                                });
                            });
                        });
                    } else {
                        return res.status(500).json({ error: "Error al crear vivienda: " + err.message });
                    }
                } else {
                    const payload = {
                        usuario_id: req.user?.usuario_id || null,
                        vivienda_id: viviendaResult.insertId,
                        municipio_id: municipioIdNum,
                        comunidad_id: comunidadIdNum,
                        direccion: direccion,
                        descripcion,
                        fotos_vinchucas,
                        foto_vivienda,
                        codigo_pais: codigo_pais || '+591',
                        numero_telefono: numero_telefono || null,
                        fecha_denuncia,
                        latitud,
                        longitud,
                        altura,
                        estado_denuncia: estado_denuncia || 'recibida',
                    };

                    crearDenuncia(payload, (err, result) => {
                        if (err) {
                            console.error("Error al crear denuncia:", err);
                            return res.status(500).json({ error: "Error en BD" });
                        }

                        notificarCreacionDenuncia(municipioIdNum, numero_vivienda, comunidadIdNum);

                        res.status(201).json({
                            message: "Denuncia creada",
                            denuncia_id: result.insertId,
                            vivienda_id: viviendaResult.insertId
                        });
                    });
                }
            });
        }
        // CASO 2: Usar vivienda_id existente
        else {
            if (!viviendaIdNum) {
                return res.status(400).json({
                    error: "Debe proporcionar vivienda_id o los datos para crear una nueva vivienda"
                });
            }

            const queryViviendaInfo = `
                SELECT v.numero_vivienda, c.municipio_id 
                FROM Viviendas v 
                JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
                WHERE v.vivienda_id = ?
            `;
            db.query(queryViviendaInfo, [viviendaIdNum], (errV, resultV) => {
                if (errV || resultV.length === 0) { return res.status(404).json({ error: "Vivienda existente no encontrada." }); }
                const infoVivienda = resultV[0];

                const payload = {
                    usuario_id: req.user?.usuario_id || null,
                    vivienda_id: viviendaIdNum,
                    municipio_id: municipioIdNum || infoVivienda.municipio_id,
                    comunidad_id: comunidadIdNum,
                    direccion: direccion,
                    descripcion,
                    fotos_vinchucas,
                    foto_vivienda,
                    codigo_pais: codigo_pais || '+591',
                    numero_telefono: numero_telefono || null,
                    fecha_denuncia,
                    latitud,
                    longitud,
                    altura,
                    estado_denuncia: estado_denuncia || 'recibida',
                };

                crearDenuncia(payload, (err, result) => {
                    if (err) {
                        console.error("Error al crear denuncia:", err);
                        return res.status(500).json({ error: "Error en BD" });
                    }

                    notificarCreacionDenuncia(infoVivienda.municipio_id, infoVivienda.numero_vivienda, comunidadIdNum);

                    res.status(201).json({
                        message: "Denuncia creada",
                        denuncia_id: result.insertId
                    });
                });
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

    const usuario_id = req.user?.usuario_id || null;

    const filtros = {
        estado,
        mine: mine === "true",
        usuario_id: usuario_id
    };

    obtenerDenuncias(filtros, (err, denuncias) => {
        if (err) {
            console.error("Error al obtener denuncias:", err);
            return res.status(500).json({ error: "Error en BD" });
        }
        res.json(denuncias);
    });
};

// Obtener denuncia por ID - CORREGIDO
export const obtenerPorId = (req, res) => {
    const { id } = req.params;

    console.log('🔍 Obteniendo denuncia ID:', id);
    console.log('👤 Usuario autenticado:', req.user);

    obtenerDenunciaPorId(id, (err, denuncia) => {
        if (err) {
            console.error("Error al obtener denuncia:", err);
            return res.status(500).json({ error: "Error en BD" });
        }
        if (!denuncia) {
            return res.status(404).json({ error: "Denuncia no encontrada" });
        }

        // 🆕 VERIFICACIÓN DE PERMISOS POR ROL - CORREGIDO
        const userInfo = req.user;
        const rolesConAccesoTotal = ['jefe_grupo', 'administrador', 'tecnico'];

        console.log('🔐 Verificando permisos...');
        console.log('📋 Usuario info:', userInfo);
        console.log('🎯 Denuncia usuario_id:', denuncia.usuario_id);

        // Si el usuario está autenticado y tiene rol especial, permitir acceso
        if (userInfo && userInfo.rol && rolesConAccesoTotal.includes(userInfo.rol)) {
            console.log(`✅ Acceso permitido: Usuario ${userInfo.rol} viendo denuncia ${id}`);
            return res.json(denuncia);
        }

        // Si no está autenticado, denegar acceso
        if (!userInfo) {
            console.log('❌ Usuario no autenticado');
            return res.status(401).json({ error: "Usuario no autenticado" });
        }

        // Si es usuario normal, verificar si es su denuncia
        if (denuncia.usuario_id !== userInfo.usuario_id) {
            console.log('❌ Usuario no autorizado para ver esta denuncia');
            console.log('🔸 Usuario ID:', userInfo.usuario_id);
            console.log('🔸 Denuncia Usuario ID:', denuncia.usuario_id);
            return res.status(403).json({ error: "No tienes permisos para ver esta denuncia" });
        }

        console.log('✅ Acceso permitido: Usuario viendo su propia denuncia');
        res.json(denuncia);
    });
};

// Actualizar denuncia
export const actualizar = (req, res) => {
    const { id } = req.params;
    const {
        descripcion, fotos_vinchucas, latitud, longitud, altura,
        estado_denuncia, fecha_programacion, fecha_ejecucion,
    } = req.body;

    if (estado_denuncia && !ESTADOS.has(estado_denuncia)) {
        return res.status(400).json({ error: "estado inválido" });
    }

    const payload = {
        descripcion, fotos_vinchucas, latitud, longitud, altura,
        estado_denuncia, fecha_programacion, fecha_ejecucion,
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

// Cancelar denuncia - ACTUALIZADO CON NOTIFICACIÓN
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

        const queryDenuncia = `
            SELECT d.usuario_id, v.numero_vivienda, c.municipio_id
            FROM Denuncias d 
            JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
            JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
            WHERE d.denuncia_id = ?
        `;

        db.query(queryDenuncia, [id], (errInfo, resultInfo) => {
            if (errInfo || resultInfo.length === 0) {
                console.error("⚠️ Error al obtener info de denuncia para cancelación:", errInfo || "Denuncia no encontrada.");
            } else {
                const info = resultInfo[0];
                const nroVivienda = info.numero_vivienda;
                const mensaje = `Denuncia CANCELADA para la vivienda N° ${nroVivienda}. Motivo: ${motivo.substring(0, 100)}...`;

                // A. Notificar al Denunciante (individual)
                crearNotificacion({
                    usuario_receptor_id: info.usuario_id,
                    tipo_entidad_origen: 'cancelacion_denunciante',
                    id_entidad_origen: nroVivienda,
                    mensaje: mensaje,
                    ruta_destino: null
                }, (errNoti) => {
                    if (errNoti) console.error(`❌ Falló notificación de cancelación (denunciante):`, errNoti);
                });

                // B. Notificar a Técnicos/Jefes del Municipio (grupal)
                obtenerTecnicosPorMunicipio(info.municipio_id, (errTecnicos, tecnicos) => {
                    if (!errTecnicos) {
                        tecnicos.forEach(tecnico => {
                            crearNotificacion({
                                usuario_receptor_id: tecnico.usuario_id,
                                tipo_entidad_origen: 'cancelacion_grupal',
                                id_entidad_origen: nroVivienda,
                                mensaje: `ATENCIÓN: ${mensaje}`,
                                ruta_destino: null
                            }, (errNoti) => { });
                        });
                        console.log(`✅ Notificaciones de cancelación (grupal) enviadas.`);
                    }
                });
            }
        });

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

// Update Denuncia Programacion - ACTUALIZADO CON NOTIFICACIÓN
export const updateDenunciaProgramacion = (req, res) => {
    const { id } = req.params;
    const { fecha_programacion } = req.body;

    if (!fecha_programacion) {
        return res.status(400).json({ error: "fecha_programacion es obligatoria" });
    }

    let fechaFormateada = fecha_programacion;

    if (fechaFormateada.length === 16) {
        fechaFormateada += ':00';
    }

    const fechaProgramada = new Date(fechaFormateada);
    const fechaActual = new Date();

    if (fechaProgramada <= fechaActual) {
        return res.status(400).json({ error: "No se puede programar una fecha pasada" });
    }

    const query = `
        UPDATE Denuncias 
        SET fecha_programacion = ?, estado_denuncia = 'programada'
        WHERE denuncia_id = ?
    `;

    db.query(query, [fechaFormateada, id], (err, results) => {
        if (err) {
            console.error("Error en consulta:", err);
            return res.status(500).json({ error: "Error en consulta" });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Denuncia no encontrada" });
        }

        const queryDenuncia = `
            SELECT d.usuario_id, v.numero_vivienda, c.municipio_id
            FROM Denuncias d 
            JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
            JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
            WHERE d.denuncia_id = ?
        `;

        db.query(queryDenuncia, [id], (errInfo, resultInfo) => {
            if (errInfo || resultInfo.length === 0) {
                console.error("⚠️ Error al obtener info de denuncia para notificación de programación:", errInfo || "Denuncia no encontrada.");
            } else {
                const info = resultInfo[0];
                const fecha = new Date(fechaFormateada).toLocaleDateString('es-BO', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const mensaje = `¡Su rociado ha sido programado! Fecha: ${fecha} para la vivienda N° ${info.numero_vivienda}. Revise su denuncia.`;

                // 1. Notificar al Denunciante (individual)
                crearNotificacion({
                    usuario_receptor_id: info.usuario_id,
                    tipo_entidad_origen: 'programacion',
                    id_entidad_origen: info.numero_vivienda,
                    mensaje: mensaje,
                    ruta_destino: '/denuncia'
                }, (errNoti) => {
                    if (errNoti) console.error(`❌ Falló notificación de programación (denunciante):`, errNoti);
                });

                // 2. Notificar a Supervisores/Técnicos (grupal)
                obtenerTecnicosPorMunicipio(info.municipio_id, (errTecnicos, tecnicos) => {
                    if (!errTecnicos) {
                        tecnicos.forEach(tecnico => {
                            crearNotificacion({
                                usuario_receptor_id: tecnico.usuario_id,
                                tipo_entidad_origen: 'programacion_grupal',
                                id_entidad_origen: info.numero_vivienda,
                                mensaje: `PROGRAMADO: Visita a la vivienda N° ${info.numero_vivienda} para el ${fecha}.`,
                                ruta_destino: '/CargaRociado'
                            }, () => { });
                        });
                        console.log(`✅ Notificaciones de programación (grupal) enviadas.`);
                    }
                });
            }
        });


        res.json({
            message: "Programación actualizada exitosamente",
            fecha_programada: fechaFormateada
        });
    });
};

// Update Denuncia Reprogramacion - CORREGIDO
export const updateDenunciaReprogramacion = (req, res) => {
    const { id } = req.params;
    const { fecha_programacion, motivo_reprogramacion } = req.body;

    if (!fecha_programacion) {
        return res.status(400).json({ error: "fecha_programacion es obligatoria" });
    }

    if (!motivo_reprogramacion || !motivo_reprogramacion.trim()) {
        return res.status(400).json({ error: "motivo_reprogramacion es obligatorio" });
    }

    if (motivo_reprogramacion.length > 500) {
        return res.status(400).json({ error: "El motivo de reprogramación no puede exceder los 500 caracteres" });
    }

    let fechaFormateada = fecha_programacion;

    if (fechaFormateada.length === 16) {
        fechaFormateada += ':00';
    }

    const fechaProgramada = new Date(fechaFormateada);
    const fechaActual = new Date();

    if (fechaProgramada <= fechaActual) {
        return res.status(400).json({ error: "No se puede programar una fecha pasada" });
    }

    const query = `
        UPDATE Denuncias 
        SET fecha_programacion = ?, 
            motivo_reprogramacion = ?,
            estado_denuncia = 'reprogramada',
            fecha_modificacion = NOW()
        WHERE denuncia_id = ?
    `;

    db.query(query, [fechaFormateada, motivo_reprogramacion.trim(), id], (err, results) => {
        if (err) {
            console.error("Error en consulta:", err);
            return res.status(500).json({ error: "Error en consulta" });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Denuncia no encontrada" });
        }

        const queryDenuncia = `
            SELECT d.usuario_id, v.numero_vivienda
            FROM Denuncias d JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
            WHERE d.denuncia_id = ?
        `;

        db.query(queryDenuncia, [id], (errInfo, resultInfo) => {
            if (errInfo || resultInfo.length === 0) {
                console.error("⚠️ Error al obtener info de denuncia para notificación de reprogramación:", errInfo || "Denuncia no encontrada.");
            } else {
                const info = resultInfo[0];
                const fecha = new Date(fechaFormateada).toLocaleDateString('es-BO', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const mensaje = `¡Su rociado ha sido REPROGRAMADO! Nueva fecha: ${fecha} para la vivienda N° ${info.numero_vivienda}. Motivo: ${motivo_reprogramacion.substring(0, 100)}...`;

                crearNotificacion({
                    usuario_receptor_id: info.usuario_id,
                    tipo_entidad_origen: 'reprogramacion',
                    id_entidad_origen: info.numero_vivienda,
                    mensaje: mensaje,
                    ruta_destino: '/denuncia'
                }, (errNoti) => {
                    if (errNoti) console.error(`❌ Falló notificación de reprogramación:`, errNoti);
                    else console.log(`✅ Notificación de reprogramación enviada al denunciante ${info.usuario_id}.`);
                });
            }
        });

        res.json({
            message: "Reprogramación actualizada exitosamente",
            fecha_programada: fechaFormateada
        });
    });
};