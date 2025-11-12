import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LogoChagas from "../assets/images/LOGOCHAGAS.png";
import '../css/NavBar.css';

function NavBar({ logoSrc = '/logo-chagas.png' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userType, usuario, logout } = useAuth();

  const handleRegister = () => navigate('/register');
  const handleLogin = () => navigate('/login');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linksByUserType = {
    invitado: [
      { label: 'Inicio', href: '/' },
      { label: 'Sobre Nosotros', href: '/sobreNosotros' },
      { label: 'Denuncia', href: '/denuncia' },
      { label: 'Mapas', href: '/mapas' },
      { label: 'Estadísticas', href: '/estadisticas' },
    ],
    usuario: [
      { label: 'Inicio', href: '/' },
      { label: 'Sobre Nosotros', href: '/sobreNosotros' },
      { label: 'Denuncia', href: '/denuncia' },
      { label: 'Estadísticas', href: '/estadisticas' },
    ],
    tecnico: [
      { label: 'Inicio', href: '/' },
      { label: 'Usuarios', href: '/usuarios' },
      { label: 'Manejo', href: '/admin/manejo' },
    ],
    jefe_grupo: [
      { label: 'Inicio', href: '/' },
      { label: 'Sobre Nosotros', href: '/sobreNosotros' },
      { label: 'Usuarios', href: '/usuarios' },
      { label: 'Manejo', href: '/admin/manejo' },
    ],
    administrador: [
      { label: 'Inicio', href: '/' },
      { label: 'Usuarios', href: '/usuarios' },
      { label: 'Manejo', href: '/admin/manejo' },
      { label: 'Denuncia', href: '/denuncia' },
      { label: 'Mapas', href: '/mapas' },
      { label: 'Estadísticas', href: '/estadisticas' },
    ],
  };

  const links = linksByUserType[userType] || linksByUserType['invitado'];

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
                Hola, {usuario?.nombre_completo || 'Usuario'}
              </span>
              <button className="navbar-logout" onClick={handleLogout}>
                Cerrar Sesión
              </button>
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