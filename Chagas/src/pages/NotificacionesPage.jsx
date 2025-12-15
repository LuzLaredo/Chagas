// 📁 src/pages/NotificacionesPage.jsx - CORREGIDO
// ===========================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { notificacionesService } from '../services/notificacionesService';
import '../css/NotificacionesPage.css';

const NotificacionesPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, logout, userType } = useAuth();

    const [notificaciones, setNotificaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const unreadCount = notificaciones.filter(n => n.leida === 0).length;

    /**
     * Carga la lista completa de notificaciones.
     */
    const loadNotificaciones = useCallback(async () => {
        if (!isAuthenticated || userType === 'invitado') {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await notificacionesService.listarMisNotificaciones();
            setNotificaciones(data);
        } catch (err) {
            console.error("Error al cargar notificaciones:", err);

            if (err.message && (err.message.includes('401') || err.message.includes('autenticado'))) {
                setError("Su sesión ha expirado. Por favor, vuelva a iniciar sesión.");
                logout();
                navigate('/login');
            } else {
                setError("Error al cargar las notificaciones. Intente de nuevo.");
            }
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, userType, logout, navigate]);

    /**
     * Maneja el clic en una notificación. 
     * SOLO la marca como leída si actualmente no lo está, y luego navega o muestra el mensaje.
     */
    const handleNotificationClick = async (notificacion) => {
        const alreadyRead = notificacion.leida !== 0;

        try {
            // 1. Marcar como leída en el backend SOLO si es PENDIENTE
            if (!alreadyRead) {
                await notificacionesService.marcarComoLeida(notificacion.notificacion_id);

                // ✅ ACTUALIZAR EL ESTADO LOCAL INMEDIATAMENTE
                setNotificaciones(prevNotificaciones =>
                    prevNotificaciones.map(n =>
                        n.notificacion_id === notificacion.notificacion_id
                            ? { ...n, leida: 1 }  // Marcar como leída
                            : n
                    )
                );
            }

            // 2. Redirigir si existe ruta_destino, o mostrar alerta
            if (notificacion.ruta_destino) {
                navigate(notificacion.ruta_destino);
            } else {
                alert(`Notificación: ${notificacion.mensaje}`);
            }

        } catch (err) {
            console.error("Error al procesar notificación:", err);
            alert("Hubo un error al procesar la notificación. Intente de nuevo.");
        }
    };

    /**
     * Marca TODAS las notificaciones NO LEÍDAS como leídas.
     */
    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) {
            alert("No hay notificaciones pendientes por leer.");
            return;
        }

        try {
            // ✅ USAR LA NUEVA FUNCIÓN QUE MARCA TODAS DE UNA VEZ
            await notificacionesService.marcarTodasComoLeidas();
            alert(`Se marcaron ${unreadCount} notificaciones como leídas.`);

            // ✅ ACTUALIZAR EL ESTADO LOCAL INMEDIATAMENTE
            setNotificaciones(prevNotificaciones =>
                prevNotificaciones.map(n =>
                    n.leida === 0 ? { ...n, leida: 1 } : n
                )
            );

        } catch (error) {
            console.error("Error al marcar todas como leídas:", error);
            alert("Ocurrió un error al intentar marcar todas las notificaciones.");
        }
    };

    // Efecto para cargar notificaciones al montar
    useEffect(() => {
        loadNotificaciones();
    }, [loadNotificaciones]);

    // Si quieres una recarga completa real (no recomendado para SPA):
    // const handleFullReload = () => {
    //     window.location.reload();
    // };

    if (loading) {
        return <div className="notifications-container">Cargando notificaciones...</div>;
    }

    if (error) {
        return <div className="notifications-container error-message">Error: {error}</div>;
    }

    if (notificaciones.length === 0) {
        return <div className="notifications-container">No tienes notificaciones en tu historial.</div>;
    }

    return (
        <div className="notifications-container">
            <header className="notifications-header">
                <h2>Historial de Notificaciones ({notificaciones.length})</h2>
                {unreadCount > 0 && (
                    <>
                        <span className="unread-badge">{unreadCount} no leídas</span>
                        <button
                            className="mark-all-read-button"
                            onClick={handleMarkAllAsRead}
                        >
                            Marcar todas como leídas
                        </button>
                    </>
                )}
            </header>

            <div className="notifications-list">
                {notificaciones.map((n) => (
                    <div
                        key={n.notificacion_id}
                        className={`notification-card ${n.leida === 0 ? 'unread' : 'read'}`}
                        onClick={() => handleNotificationClick(n)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(n);
                        }}
                    >
                        <div className="notification-content-main">
                            <span className="notification-type">[{n.tipo_entidad_origen?.toUpperCase() || 'NOTIFICACIÓN'}]</span>
                            <p className="notification-message">{n.mensaje}</p>
                        </div>
                        <div className="notification-meta">
                            <span className="notification-time">
                                {new Date(String(n.fecha_creacion).includes('Z') ? n.fecha_creacion : String(n.fecha_creacion) + 'Z').toLocaleString('es-BO', {
                                    timeZone: 'America/La_Paz',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                            <span className={`notification-status ${n.leida === 0 ? 'status-unread' : 'status-read'}`}>
                                {n.leida === 0 ? 'PENDIENTE' : 'LEÍDA'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {notificaciones.length > 10 && (
                <div className="notifications-footer">
                    <p>Mostrando {notificaciones.length} notificaciones en total</p>
                </div>
            )}
        </div>
    );
};

export default NotificacionesPage;