// =======================================================
// controllers/notificacionesController.js - COMPLETO CORREGIDO
// =======================================================
import { 
    obtenerNotificacionesPorUsuario, 
    obtenerConteoNoLeidas as obtenerConteoNoLeidasModel,
    actualizarEstadoLeido,
    marcarTodasComoLeidas as marcarTodasComoLeidasModel,
    obtenerNotificacionesRecientes
} from "../models/notificacionesModel.js";

// 1. Obtiene las notificaciones del usuario actual
export const listarMisNotificaciones = (req, res) => {
    const usuarioId = req.user.usuario_id;
    
    obtenerNotificacionesPorUsuario(usuarioId, (err, notificaciones) => {
        if (err) {
            console.error("❌ Error en BD al listar notificaciones:", err);
            return res.status(500).json({ error: "Error al listar notificaciones" });
        }
        res.json(notificaciones);
    });
};

// 2. Obtiene notificaciones recientes para el NavBar
export const obtenerRecientes = (req, res) => {
    const usuarioId = req.user.usuario_id;
    
    obtenerNotificacionesRecientes(usuarioId, (err, notificaciones) => {
        if (err) {
            console.error("❌ Error al obtener notificaciones recientes:", err);
            return res.status(500).json({ error: "Error al obtener notificaciones recientes" });
        }
        res.json(notificaciones);
    });
};

// 3. Obtiene conteo de no leídas
export const obtenerConteoNoLeidas = (req, res) => {
    const usuarioId = req.user.usuario_id;
    
    obtenerConteoNoLeidasModel(usuarioId, (err, resultado) => {
        if (err) {
            console.error("❌ Error al obtener conteo de no leídas:", err);
            return res.status(500).json({ error: "Error al obtener conteo" });
        }
        res.json({ count: resultado[0]?.conteo || 0 });
    });
};

// 4. Marca UNA notificación como leída (SOLO para el usuario actual)
export const marcarComoLeida = (req, res) => {
    const { id } = req.params;
    const usuarioId = req.user.usuario_id;
    
    console.log(`🔄 Usuario ${usuarioId} quiere marcar notificación ${id} como leída`);
    
    actualizarEstadoLeido(id, usuarioId, (err, result) => {
        if (err) {
            console.error("❌ Error en BD al marcar como leída:", err);
            return res.status(500).json({ error: "Error al marcar como leída" });
        }
        
        if (result.affectedRows === 0) {
            console.log(`⚠️ Notificación ${id} no encontrada o ya está leída para usuario ${usuarioId}`);
            return res.status(404).json({ 
                error: "Notificación no encontrada, ya está leída o no pertenece a este usuario" 
            });
        }
        
        console.log(`✅ Notificación ${id} marcada como leída para usuario ${usuarioId}`);
        res.json({ 
            message: "Notificación marcada como leída.",
            affectedRows: result.affectedRows
        });
    });
};

// 5. Marca TODAS las notificaciones del usuario como leídas
export const marcarTodasComoLeidas = (req, res) => {
    const usuarioId = req.user.usuario_id;
    
    console.log(`🔄 Usuario ${usuarioId} quiere marcar TODAS sus notificaciones como leídas`);
    
    marcarTodasComoLeidasModel(usuarioId, (err, result) => {
        if (err) {
            console.error("❌ Error al marcar todas como leídas:", err);
            return res.status(500).json({ error: "Error al marcar todas como leídas" });
        }
        
        res.json({ 
            message: `Se marcaron ${result.affectedRows} notificaciones como leídas.`,
            affectedRows: result.affectedRows
        });
    });
};