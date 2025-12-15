// ===========================================================
// models/notificacionesModel.js - VERSIÓN COMPLETA CORREGIDA
// ===========================================================
import db, { verifyConnection } from "../config/db.js";

const executeQuery = (query, values, callback) => {
    verifyConnection((err) => {
        if (err) return callback(err);
        db.query(query, values, (err, results) => {
            if (err) {
                console.error("❌ Error en query de notificaciones:", err.message);
                return callback(err);
            }
            callback(null, results);
        });
    });
};

/**
 * Inserta una nueva notificación en la base de datos.
 */
export const crearNotificacion = (data, callback) => {
    // Si viene sender_name en la data, lo anteponemos al mensaje
    let mensajeFinal = data.mensaje;
    if (data.sender_name) {
        mensajeFinal = `[${data.sender_name}]: ${data.mensaje}`;
    }

    const query = `
        INSERT INTO Notificaciones (
            usuario_receptor_id, tipo_entidad_origen, id_entidad_origen, 
            mensaje, leida, ruta_destino, fecha_creacion
        ) VALUES (?, ?, ?, ?, 0, ?, NOW())
    `;
    const values = [
        data.usuario_receptor_id,
        data.tipo_entidad_origen,
        data.id_entidad_origen,
        mensajeFinal,
        data.ruta_destino || null
    ];

    executeQuery(query, values, (err, results) => {
        if (err) {
            console.error("❌ Error creando notificación:", err);
            return callback(err);
        }
        console.log(`✅ Notificación creada: ID ${results.insertId} para usuario ${data.usuario_receptor_id}`);
        callback(null, results.insertId);
    });
};

/**
 * Crea notificaciones para TODOS los usuarios de un municipio (Técnicos, Jefes, Supervisores).
 */
export const crearNotificacionMasivaMunicipio = (municipioId, dataBase, callback) => {
    obtenerTecnicosPorMunicipio(municipioId, (err, usuarios) => {
        if (err) return callback(err);

        if (!usuarios || usuarios.length === 0) {
            console.log("ℹ️ No hay usuarios asignados al municipio para notificar.");
            return callback(null, { count: 0 });
        }

        let completed = 0;
        let errors = 0;

        usuarios.forEach(user => {
            const notiData = { ...dataBase, usuario_receptor_id: user.usuario_id };
            crearNotificacion(notiData, (err) => {
                if (err) errors++;
                completed++;

                if (completed === usuarios.length) {
                    console.log(`📢 Notificación masiva completada enviada a ${usuarios.length - errors}/${usuarios.length} usuarios.`);
                    callback(null, { sent: usuarios.length - errors, total: usuarios.length });
                }
            });
        });
    });
};

/**
 * Obtiene los IDs de los técnicos/jefes asignados a un municipio.
 */
export const obtenerTecnicosPorMunicipio = (municipioId, callback) => {
    const query = `
        SELECT u.usuario_id, u.rol, m.nombre_municipio
        FROM Usuario_Municipio um
        JOIN Usuarios u ON um.usuario_id = u.usuario_id
        JOIN Municipios m ON um.municipio_id = m.municipio_id
        WHERE um.municipio_id = ?
          AND u.rol IN ('tecnico', 'jefe_grupo', 'supervisor')
          AND u.estado = 'activo'
    `;
    executeQuery(query, [municipioId], callback);
};

/**
 * Obtiene la lista completa de notificaciones de un usuario específico.
 * @param {number} usuarioId - ID del usuario receptor.
 * @param {Function} callback
 */
export const obtenerNotificacionesPorUsuario = (usuarioId, callback) => {
    const query = `
        SELECT 
            notificacion_id, 
            usuario_receptor_id, 
            tipo_entidad_origen, 
            id_entidad_origen, 
            mensaje, 
            leida, 
            ruta_destino, 
            fecha_creacion
        FROM Notificaciones
        WHERE usuario_receptor_id = ?
        ORDER BY fecha_creacion DESC
    `;
    executeQuery(query, [usuarioId], callback);
};

/**
 * Obtiene el conteo de notificaciones no leídas de un usuario.
 * @param {number} usuarioId - ID del usuario.
 * @param {Function} callback
 */
export const obtenerConteoNoLeidas = (usuarioId, callback) => {
    const query = `
        SELECT COUNT(*) as conteo
        FROM Notificaciones
        WHERE usuario_receptor_id = ? AND leida = 0
    `;
    executeQuery(query, [usuarioId], callback);
};

/**
 * Marca UNA notificación específica como leída.
 * SOLO actualiza la notificación si pertenece al usuario especificado.
 * @param {number} notificacionId - ID de la notificación.
 * @param {number} usuarioId - ID del usuario que marca como leída.
 * @param {Function} callback
 */
export const actualizarEstadoLeido = (notificacionId, usuarioId, callback) => {
    // ✅ CORRECCIÓN CRÍTICA: Verificar que la notificación pertenece al usuario
    const query = `
        UPDATE Notificaciones 
        SET leida = 1 
        WHERE notificacion_id = ? 
        AND usuario_receptor_id = ? 
        AND leida = 0
    `;

    console.log(`📝 Intentando marcar notificación ${notificacionId} como leída por usuario ${usuarioId}`);

    executeQuery(query, [notificacionId, usuarioId], (err, result) => {
        if (err) {
            console.error("❌ Error en actualizarEstadoLeido:", err);
            return callback(err);
        }

        if (result.affectedRows === 1) {
            console.log(`✅ Notificación ${notificacionId} marcada como leída por usuario ${usuarioId}`);
        } else {
            console.log(`⚠️ No se pudo marcar notificación ${notificacionId}. Filas afectadas: ${result.affectedRows}`);
        }

        callback(null, result);
    });
};

/**
 * Marca TODAS las notificaciones NO LEÍDAS de un usuario como leídas.
 * @param {number} usuarioId - ID del usuario.
 * @param {Function} callback
 */
export const marcarTodasComoLeidas = (usuarioId, callback) => {
    const query = `
        UPDATE Notificaciones 
        SET leida = 1 
        WHERE usuario_receptor_id = ? 
        AND leida = 0
    `;

    console.log(`📝 Marcando TODAS las notificaciones como leídas para usuario ${usuarioId}`);

    executeQuery(query, [usuarioId], (err, result) => {
        if (err) {
            console.error("❌ Error en marcarTodasComoLeidas:", err);
            return callback(err);
        }

        if (result.affectedRows > 0) {
            console.log(`✅ ${result.affectedRows} notificaciones marcadas como leídas para usuario ${usuarioId}`);
        } else {
            console.log(`ℹ️ No había notificaciones pendientes para usuario ${usuarioId}`);
        }

        callback(null, result);
    });
};

/**
 * Obtiene notificaciones recientes (últimas 10) para mostrar en el NavBar.
 * @param {number} usuarioId - ID del usuario.
 * @param {Function} callback
 */
export const obtenerNotificacionesRecientes = (usuarioId, callback) => {
    const query = `
        SELECT 
            notificacion_id, 
            tipo_entidad_origen, 
            mensaje, 
            leida, 
            fecha_creacion,
            ruta_destino
        FROM Notificaciones
        WHERE usuario_receptor_id = ?
        ORDER BY fecha_creacion DESC
        LIMIT 10
    `;
    executeQuery(query, [usuarioId], callback);
};

export default {
    crearNotificacion,
    obtenerTecnicosPorMunicipio,
    obtenerNotificacionesPorUsuario,
    obtenerConteoNoLeidas,
    actualizarEstadoLeido,
    marcarTodasComoLeidas,
    obtenerNotificacionesRecientes
};