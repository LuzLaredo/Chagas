import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useRouteAccess } from "../AuthContext";
import SinAcceso from "../SinAcceso"; // Importa SinAcceso
import NavBar from "../NavBar";
import "../../css/Manejo.css";

function Manejo() {
  const navigate = useNavigate();
  const { user, hasRole, isAuthenticated } = useAuth();

  // Verificar acceso general a la página
  const { hasAccess, isLoading } = useRouteAccess(['tecnico', 'jefe_grupo', 'administrador', 'supervisor']);

  if (isLoading) {
    return (
      <div className="manejo-page">
        <NavBar />
        <div className="manejo-container">
          <div className="loading">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <SinAcceso />;
  }

  const opciones = [
    {
      id: 'rr1',
      titulo: 'Formulario RR1',
      descripcion: 'Registro de actividades de rociado por vivienda',
      icono: '📝',
      ruta: '../CargaRociado',
      roles: ['tecnico', 'jefe_grupo', 'administrador', 'supervisor']
    },
    {
      id: 'rr2',
      titulo: 'RR2 - Estadísticas por Comunidad',
      descripcion: 'Consolidado mensual de rociado por comunidad',
      icono: '📊',
      ruta: '/admin/RR2',
      roles: ['jefe_grupo', 'administrador', 'supervisor']
    },
    {
      id: 'rr3',
      titulo: 'RR3 - Estadísticas por Municipio',
      descripcion: 'Consolidado mensual de rociado por municipio',
      icono: '🏢',
      ruta: '/admin/RR3',
      roles: ['jefe_grupo', 'administrador', 'supervisor']
    },
    {
      id: 'ee1',
      titulo: 'EE1 - Evaluaciones Entomológicas',
      descripcion: 'Registro de evaluaciones entomológicas',
      icono: '🔍',
      ruta: '/admin/EE1',
      roles: ['tecnico', 'jefe_grupo', 'administrador', 'supervisor']
    },
    {
      id: 'ee2',
      titulo: 'EE2 - Evaluaciones Entomológicas',
      descripcion: 'Consolidado mensual de evaluacion por comunidad',
      icono: '📊',
      ruta: '/admin/EE2',
      roles: ['jefe_grupo', 'administrador', 'supervisor']
    },
    {
      id: 'ee3',
      titulo: 'EE3 - Evaluaciones Entomológicas',
      descripcion: 'Consolidado mensual de evaluacion por municipio',
      icono: '🏢',
      ruta: '/admin/EE3',
      roles: ['jefe_grupo', 'administrador', 'supervisor']
    }
  ];

  const handleNavegar = (ruta) => {
    navigate(ruta);
  };

  return (
    <div className="manejo-page">
      <NavBar />
      <div className="manejo-container">
        <div className="manejo-header">
          <h1 className="manejo-title">Panel de Monitoreo</h1>
          <p className="manejo-subtitle">
            Sistema de Gestión de Actividades de Control de Chagas
          </p>
          <div className="user-info">
            <span className="user-role">Rol: {user?.rol}</span>
            <span className="user-name">Usuario: {user?.nombre_completo || 'Usuario'}</span>
          </div>
        </div>

        <div className="manejo-content">
          <div className="opciones-grid">
            {opciones.map((opcion) => {
              const tieneAcceso = hasRole(opcion.roles);

              return (
                <div
                  key={opcion.id}
                  className={`opcion-card ${tieneAcceso ? '' : 'opcion-bloqueada'}`}
                  onClick={() => tieneAcceso && handleNavegar(opcion.ruta)}
                  style={{ cursor: tieneAcceso ? 'pointer' : 'not-allowed' }}
                >
                  <div className="opcion-icon">{opcion.icono}</div>
                  <div className="opcion-content">
                    <h3 className="opcion-titulo">{opcion.titulo}</h3>
                    <p className="opcion-descripcion">{opcion.descripcion}</p>
                    <div className="opcion-metadata">
                      {!tieneAcceso && (
                        <span className="acceso-denegado">❌ Sin acceso</span>
                      )}
                    </div>
                  </div>
                  {tieneAcceso && (
                    <div className="opcion-accion">
                      <button className="btn btn-acceder">
                        Acceder →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Información de permisos */}
          <div className="permisos-info">
            <h3>Información de Permisos</h3>
            <div className="permisos-grid">
              <div className="permiso-item">
                <span className="permiso-rol">👨‍💼 Técnico</span>
                <span className="permiso-desc">Puede: RR1, EE1</span>
              </div>
              <div className="permiso-item">
                <span className="permiso-rol">👔 Jefe de Grupo</span>
                <span className="permiso-desc">Puede: RR1, RR2, RR3, EE1, EE2, EE3</span>
              </div>
              <div className="permiso-item">
                <span className="permiso-rol">🔧 Administrador</span>
                <span className="permiso-desc">Puede: RR1, RR2, RR3, EE1, EE2, EE3</span>
              </div>
              <div className="permiso-item">
                <span className="permiso-rol">👮 Supervisor</span>
                <span className="permiso-desc">Puede: RR1, RR2, RR3, EE1, EE2, EE3 (solo su municipio)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Manejo;