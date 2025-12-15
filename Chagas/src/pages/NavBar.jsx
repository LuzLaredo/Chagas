// ===========================================================
// 📁 NavBar.jsx - CÓDIGO COMPLETO Y FUNCIONAL
// ===========================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { notificacionesService } from "../services/notificacionesService";

import LogoChagas from "../assets/images/LOGOCHAGAS.png";
import '../css/NavBar.css';

// Importar íconos
import { BsBell } from 'react-icons/bs';
import { FaUserCircle } from 'react-icons/fa';


function NavBar({ logoSrc = '/logo-chagas.png' }) {
    const navigate = useNavigate();
    const location = useLocation();
    // Obtiene el estado y las funciones del contexto
    const { userType, usuario, logout, isAuthenticated } = useAuth();

    // ESTADOS REALES PARA NOTIFICACIONES
    const [notificaciones, setNotificaciones] = useState([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);

    // ESTADOS PARA CONTROLAR LOS DESPLEGABLES
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    // Referencia para el intervalo
    const intervalRef = useRef(null);

    // Funciones de navegación con validación (se mantienen igual)
    const handleRegister = () => {
        if (userType !== 'invitado') {
            alert("Usted ya inició sesión con una cuenta. Cierre sesión para tener acceso a la página.");
            return;
        }
        navigate('/register');
    };

    const handleLogin = () => {
        if (userType !== 'invitado') {
            alert("Usted ya inició sesión con una cuenta. Cierre sesión para tener acceso a la página.");
            return;
        }
        navigate('/login');
    };

    const handleGoToProfile = () => {
        setShowProfileDropdown(false);
        navigate('/perfil');
    };

    const toggleNotifications = () => {
        if (!showNotifications) {
            loadNotificaciones();
        }
        setShowProfileDropdown(false);
        setShowNotifications(prev => !prev);
    };

    const toggleProfileDropdown = () => {
        setShowNotifications(false);
        setShowProfileDropdown(prev => !prev);
    };

    const handleLogout = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        setShowProfileDropdown(false);
        logout();
        navigate('/login');
    };

    // FUNCIÓN CLAVE 1: Carga de notificaciones con manejo de error 401 (se mantiene igual)
    const loadNotificaciones = useCallback(async () => {
        if (!isAuthenticated || userType === 'invitado') {
            setNotificaciones([]);
            return;
        }

        setLoadingNotifs(true);
        try {
            const data = await notificacionesService.listarMisNotificaciones();
            setNotificaciones(data);
        } catch (err) {
            console.error("Error al cargar notificaciones:", err);

            if (err.message && (err.message.includes('401') || err.message.includes('autenticado'))) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                alert("Su sesión ha expirado o no está autorizada. Por favor, vuelva a iniciar sesión.");
                logout();
                navigate('/login');
            }
        } finally {
            setLoadingNotifs(false);
        }
    }, [isAuthenticated, userType, logout, navigate]);

    // 🚨 FUNCIÓN CLAVE 2 MODIFICADA: Manejo de clic en notificación (se mantiene igual)
    const handleNotificationClick = async (notificacion) => {
        setShowNotifications(false);

        const alreadyRead = notificacion.leida !== 0;

        try {
            if (!alreadyRead) {
                await notificacionesService.marcarComoLeida(notificacion.notificacion_id);
            }

            if (!alreadyRead) {
                loadNotificaciones();
            }

            if (notificacion.ruta_destino) {
                navigate(notificacion.ruta_destino);
            } else {
                alert(notificacion.mensaje);
            }

        } catch (err) {
            console.error("Error al procesar notificación:", err);
            alert("Hubo un error al procesar la notificación. Intente de nuevo.");
        }
    };


    // EFECTO para cargar notificaciones al montar y al cambiar el estado de autenticación (se mantiene igual)
    useEffect(() => {
        loadNotificaciones();
    }, [loadNotificaciones]);

    // 🆕 EFECTO PARA ACTUALIZAR NOTIFICACIONES CADA 10 SEGUNDOS (se mantiene igual)
    useEffect(() => {
        if (isAuthenticated && userType !== 'invitado') {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            intervalRef.current = setInterval(() => {
                console.log('Actualizando notificaciones automáticamente...');
                loadNotificaciones();
            }, 10000);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
    }, [isAuthenticated, userType, loadNotificaciones]);

    // 🆕 EFECTO PARA CERRAR MODALES AL CAMBIAR DE PÁGINA (se mantiene igual)
    useEffect(() => {
        setShowNotifications(false);
        setShowProfileDropdown(false);
    }, [location.pathname]);

    // 🛑 Definición del menú completo de administración
    const adminRoutes = [
        { label: 'Inicio', href: '/' },
        { label: 'Sobre Nosotros', href: '/sobreNosotros' },
        { label: 'Usuarios', href: '/usuarios' },
        { label: 'Denuncia', href: '/denuncia' },
        { label: 'Manejo', href: '/admin/manejo' }, // MANEJO
        { label: 'Mapa EE1', href: '/mapaee1' },
        { label: 'Mapa Denuncia', href: '/mapas' },
        { label: 'Estadísticas', href: '/estadisticas' },
    ];

    // 🛑 Definición del menú de Jefe de Grupo (con usuarios)
    const jefeGrupoRoutes = [
        { label: 'Inicio', href: '/' },
        { label: 'Sobre Nosotros', href: '/sobreNosotros' },
        { label: 'Usuarios', href: '/usuarios' }, // ✅ Agregado para Jefes de Grupo
        { label: 'Denuncia', href: '/denuncia' },
        { label: 'Manejo', href: '/admin/manejo' },
        { label: 'Mapa EE1', href: '/mapaee1' },
        { label: 'Mapa Denuncia', href: '/mapas' },
        { label: 'Estadísticas', href: '/estadisticas' },
    ];

    // 🛑 Definición del menú de Técnico (más limitado)
    const tecnicoRoutes = [
        { label: 'Inicio', href: '/' },
        { label: 'Sobre Nosotros', href: '/sobreNosotros' },
        { label: 'Denuncia', href: '/denuncia' },
        { label: 'Manejo', href: '/admin/manejo' },
        { label: 'Estadísticas', href: '/estadisticas' },
    ];

    // Lista de enlaces por tipo de usuario
    const linksByUserType = {
        invitado: [
            { label: 'Inicio', href: '/' },
            { label: 'Sobre Nosotros', href: '/sobreNosotros' },
            { label: 'Denuncia', href: '/denuncia' },
            { label: 'Estadísticas', href: '/estadisticas-basicas' },

        ],
        usuario: [
            { label: 'Inicio', href: '/' },
            { label: 'Sobre Nosotros', href: '/sobreNosotros' },
            { label: 'Denuncia', href: '/denuncia' },
            { label: 'Estadísticas', href: '/estadisticas-basicas' },

        ],
        tecnico: tecnicoRoutes,
        jefe_grupo: jefeGrupoRoutes,
        administrador: adminRoutes, // Rutas completas del administrador
        supervisor: adminRoutes, // ⬅️ ASIGNACIÓN IDÉNTICA
    };

    const links = linksByUserType[userType] || linksByUserType['invitado'];

    // Usar el estado real para determinar si hay no leídas y contar
    const unreadNotifications = notificaciones.filter(n => n.leida === 0);
    const hasUnread = unreadNotifications.length > 0;
    const unreadCount = unreadNotifications.length;

    return (
        <header className="navbar-header">
            <div className="navbar-gradient">
                <div className="navbar-brand">
                    <img src={LogoChagas} alt="Programa Nacional de Chagas" className="navbar-logo" />
                </div>
                <div className="navbar-actions">
                    {userType === 'invitado' ? (
                        <>
                            <button className="navbar-register" onClick={handleRegister}>Registrarse</button>
                            <button className="navbar-login" onClick={handleLogin}>Inicio Sesión</button>
                        </>
                    ) : (
                        <div className="user-session">
                            <span className="user-welcome">
                                Hola, {usuario?.nombre_completo || usuario?.nombre || 'Usuario'}
                            </span>

                            <div className="icon-actions">

                                {/* Botón de Campana / Notificaciones */}
                                <button
                                    className="navbar-icon-button bell-button"
                                    onClick={toggleNotifications}
                                    aria-label={`Notificaciones. Tienes ${unreadCount} no leídas.`}
                                    aria-expanded={showNotifications}
                                >
                                    <BsBell size={24} />
                                    {hasUnread && (<span className="notification-dot">{unreadCount}</span>)}
                                </button>

                                {/* DROPDOWN DE NOTIFICACIONES */}
                                {showNotifications && (
                                    <div className="notifications-dropdown">
                                        {/* 🚨 MODIFICACIÓN: Enlace "Ver todas" movido al header */}
                                        <div className="dropdown-header">
                                            <h3>Notificaciones</h3>
                                            <Link to="/notificaciones" className="view-all-link">
                                                Ver todas las ({notificaciones.length})
                                            </Link>
                                        </div>
                                        {loadingNotifs ? (
                                            <div className="dropdown-loading">Cargando...</div>
                                        ) : (
                                            <ul className="dropdown-list">
                                                {notificaciones.length === 0 ? (
                                                    <li className="no-notifications">No hay notificaciones.</li>
                                                ) : (
                                                    notificaciones
                                                        .slice(0, 5)
                                                        .map(n => (
                                                            <li
                                                                key={n.notificacion_id}
                                                                className={`notification-item ${n.leida === 0 ? 'unread' : ''}`}
                                                                onClick={() => handleNotificationClick(n)}
                                                                role="button"
                                                                tabIndex="0"
                                                            >
                                                                <div className="notification-content">
                                                                    <p>{n.mensaje || 'Nueva notificación'}</p>
                                                                    <span>
                                                                        {new Date(n.fecha_creacion).toLocaleString('es-BO', {
                                                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                                        })}
                                                                    </span>
                                                                </div>
                                                            </li>
                                                        ))
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                )}

                                {/* Contenedor del Botón de Perfil y su Dropdown */}
                                <div className="profile-container">
                                    <button
                                        className="navbar-icon-button profile-button"
                                        onClick={toggleProfileDropdown}
                                        aria-label="Menú de Perfil"
                                        aria-expanded={showProfileDropdown}
                                    >
                                        <FaUserCircle size={24} />
                                    </button>

                                    {/* --- DROPDOWN DE PERFIL COMPLETO --- */}
                                    {showProfileDropdown && (
                                        <div className="profile-dropdown">
                                            <div className="user-info-header expanded">
                                                <p className="username">
                                                    {usuario?.nombre_completo || usuario?.nombre || 'Usuario'}
                                                </p>
                                                <p className="user-type">({userType})</p>
                                            </div>
                                            <ul className="dropdown-list">
                                                <li onClick={handleLogout} className="dropdown-item logout-option">
                                                    Cerrar Sesión
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
            <nav className="navbar-subnav" role="navigation" aria-label="Navegación secundaria">
                <ul className="navbar-subnav-list">
                    {links.map(link => (
                        <li
                            key={link.label}
                            className={`navbar-subnav-item${location.pathname === link.href ? ' active' : ''}`}
                        >
                            <Link to={link.href}>{link.label}</Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </header>
    );
}

NavBar.propTypes = {
    logoSrc: PropTypes.string,
};

export default NavBar;