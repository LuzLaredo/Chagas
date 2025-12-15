import React, { useState, useEffect } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { estadisticasService } from '../services/estadisticasService';
import { useAuth } from './AuthContext';
import { createPortal } from 'react-dom';
import { baseUrl } from '../api/BaseUrl';
import '../css/Estadisticas.css';

// Componente de tooltip informativo
const InfoTooltip = ({ text }) => (
  <div className="tooltip-container">
    <span className="info-icon">ℹ️</span>
    <span className="tooltip-text">{text}</span>
  </div>
);

// Componente de dropdown para municipios
const MunicipioDropdown = ({ isOpen, position, municipios, onSelect, onClose }) => {
  if (!isOpen) return null;

  const handleSelect = (municipioId, nombre) => {
    onSelect(municipioId);
    onClose();
  };

  return createPortal(
    <div
      data-dropdown="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        background: 'rgba(0,0,0,0.3)'
      }}
      onClick={(e) => {
        onClose();
      }}
    >
      <div
        data-dropdown="true"
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          zIndex: 1000000,
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          minWidth: '200px',
          maxHeight: '300px',
          overflowY: 'auto',
          border: '2px solid #3498db'
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {municipios.length > 0 ? (
          <>
            <div
              data-dropdown="true"
              style={{
                padding: '12px 20px',
                cursor: 'pointer',
                color: '#333',
                fontSize: '14px',
                fontWeight: '500',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: '#f8f9fa'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect('', 'Todos los municipios');
              }}
            >
              🌍 Todos los municipios
            </div>
            {municipios.map(municipio => (
              <div
                key={municipio.municipio_id}
                data-dropdown="true"
                style={{
                  padding: '12px 20px',
                  cursor: 'pointer',
                  color: '#333',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderBottom: '1px solid #f0f0f0'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(municipio.municipio_id, municipio.nombre_municipio);
                }}
              >
                🏛️ {municipio.nombre_municipio}
              </div>
            ))}
          </>
        ) : (
          <div style={{
            color: '#666',
            fontStyle: 'italic',
            padding: '12px 20px',
            fontSize: '14px'
          }}>
            ⏳ Cargando municipios...
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// Componente de dropdown para comunidades
const ComunidadDropdown = ({ isOpen, position, comunidades, onSelect, onClose }) => {
  if (!isOpen) return null;

  const handleSelect = (comunidadId, nombre) => {
    onSelect(comunidadId);
    onClose();
  };

  return createPortal(
    <div
      data-dropdown="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        background: 'rgba(0,0,0,0.3)'
      }}
      onClick={(e) => {
        onClose();
      }}
    >
      <div
        data-dropdown="true"
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          zIndex: 1000000,
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          minWidth: '200px',
          maxHeight: '300px',
          overflowY: 'auto',
          border: '2px solid #2ecc71'
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {comunidades.length > 0 ? (
          <>
            <div
              data-dropdown="true"
              style={{
                padding: '12px 20px',
                cursor: 'pointer',
                color: '#333',
                fontSize: '14px',
                fontWeight: '500',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: '#f8f9fa'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect('', 'Todas las comunidades');
              }}
            >
              🏘️ Todas las comunidades
            </div>
            {comunidades.map(comunidad => (
              <div
                key={comunidad.comunidad_id}
                data-dropdown="true"
                style={{
                  padding: '12px 20px',
                  cursor: 'pointer',
                  color: '#333',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderBottom: '1px solid #f0f0f0'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(comunidad.comunidad_id, comunidad.nombre_comunidad);
                }}
              >
                🏘️ {comunidad.nombre_comunidad}
              </div>
            ))}
          </>
        ) : (
          <div style={{
            color: '#666',
            fontStyle: 'italic',
            padding: '12px 20px',
            fontSize: '14px'
          }}>
            ⏳ Cargando comunidades...
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// Componente auxiliar para mostrar mensaje de no datos
const NoDataMessage = ({ message = "No hay datos disponibles" }) => (
  <div style={{
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#95a5a6',
    fontStyle: 'italic',
    flexDirection: 'column',
    gap: '10px'
  }}>
    <span style={{ fontSize: '24px' }}>📉</span>
    <span>{message}</span>
  </div>
);

const EstadisticasNivo = () => {
  const { usuario, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [municipioActual, setMunicipioActual] = useState('');
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    viviendasRegistradas: 0,
    habitantesProtegidos: 0,
    viviendasEvaluadas: 0,
    viviendasPositivas: 0,
    tasaInfestacion: 0,
    ejemplaresCapturados: 0,
    ejemplaresIntra: 0,
    ejemplaresPeri: 0,
    viviendasRociadas: 0,
    coberturaRociado: 0,
    totalInsecticida: 0,
    habitacionesNoRociadas: 0
  });

  // Estados para las métricas - Solo las que se usan en las gráficas
  const [metricasProgreso, setMetricasProgreso] = useState([]);
  const [estadisticasDenuncias, setEstadisticasDenuncias] = useState([]);
  const [eficienciaRociado, setEficienciaRociado] = useState([]);
  const [evolucionTemporal, setEvolucionTemporal] = useState([]);
  const [distribucionGeografica, setDistribucionGeografica] = useState([]);

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState('');
  const [comunidadSeleccionada, setComunidadSeleccionada] = useState('');
  const [municipios, setMunicipios] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [showMunicipioDropdown, setShowMunicipioDropdown] = useState(false);
  const [showComunidadDropdown, setShowComunidadDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [comunidadDropdownPosition, setComunidadDropdownPosition] = useState({ top: 0, left: 0 });
  const [comunidadActual, setComunidadActual] = useState('');

  useEffect(() => {
    // Establecer fechas por defecto (último mes)
    const hoy = new Date();
    const haceUnMes = new Date();
    haceUnMes.setMonth(hoy.getMonth() - 1);

    setFechaInicio(haceUnMes.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);

    // Cargar municipios disponibles
    loadMunicipios();
  }, [usuario, token]);
  
  const loadMunicipios = async () => {
    try {
      // Si es supervisor, cargar solo su municipio
      if (usuario?.rol === 'supervisor' && (usuario?.usuario_id || usuario?.id)) {
        const usuarioId = usuario.usuario_id || usuario.id;
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};
        
        const municipioRes = await fetch(`${baseUrl}/api/usuarios/${usuarioId}/municipios`, {
          headers: headers
        });
        
        if (!municipioRes.ok) {
          console.error(`Error ${municipioRes.status} al obtener municipios:`, municipioRes.statusText);
          if (municipioRes.status === 401) {
            console.error('Token inválido o expirado. Por favor, inicia sesión nuevamente.');
          }
        } else {
          const municipiosData = await municipioRes.json();
          setMunicipios(municipiosData || []);
          
          // Si solo hay un municipio, seleccionarlo automáticamente
          if (municipiosData.length === 1) {
            const municipioId = municipiosData[0].municipio_id.toString();
            setMunicipioSeleccionado(municipioId);
            setMunicipioActual(municipioId);
            // Cargar estadísticas con el municipio del supervisor
            loadEstadisticas(fechaInicio, fechaFin, municipioId, '');
            return;
          }
        }
      } else {
        // Para otros roles, cargar todos los municipios
        const municipiosData = await estadisticasService.getMunicipios();
        setMunicipios(municipiosData);
      }
    } catch (err) {
      console.error("Error cargando municipios:", err);
    }
  };

  // Cargar comunidades cuando se seleccione un municipio
  useEffect(() => {
    const loadComunidades = async () => {
      if (municipioSeleccionado && municipioSeleccionado !== '') {
        try {
          const comunidadesData = await estadisticasService.getComunidadesByMunicipio(parseInt(municipioSeleccionado));
          setComunidades(comunidadesData || []);
        } catch (error) {
          console.error('❌ Error al cargar comunidades:', error);
          setComunidades([]);
        }
      } else {
        setComunidades([]);
        setComunidadSeleccionada('');
        setComunidadActual('');
      }
    };
    loadComunidades();
  }, [municipioSeleccionado]);

  // Cargar estadísticas cuando cambien las fechas, municipio o comunidad
  useEffect(() => {
    loadEstadisticas(fechaInicio, fechaFin, municipioSeleccionado, comunidadSeleccionada);
  }, [fechaInicio, fechaFin, municipioSeleccionado, comunidadSeleccionada]);

  // loadMunicipios ya está definida arriba

  const loadEstadisticas = async (inicio, fin, municipio, comunidad) => {
    try {
      setLoading(true);
      setError(null);

      const municipioId = municipio && municipio !== '' && municipio !== 'todos' ? parseInt(municipio) : undefined;
      const comunidadId = comunidad && comunidad !== '' && comunidad !== 'todos' ? parseInt(comunidad) : undefined;

      let data;
      if (inicio && fin) {
        data = await estadisticasService.getEstadisticasFiltradas(inicio, fin, municipioId, comunidadId);
        data = { generales: data };
      } else if (municipioId || comunidadId) {
        data = await estadisticasService.getEstadisticasFiltradas(null, null, municipioId, comunidadId);
        data = { generales: data };
      } else {
        data = await estadisticasService.getAllEstadisticas();
      }

      setStats(data.generales || {
        viviendasRegistradas: 0,
        habitantesProtegidos: 0,
        viviendasEvaluadas: 0,
        viviendasPositivas: 0,
        tasaInfestacion: 0,
        ejemplaresCapturados: 0,
        ejemplaresIntra: 0,
        ejemplaresPeri: 0,
        viviendasRociadas: 0,
        coberturaRociado: 0,
        totalInsecticida: 0,
        habitacionesNoRociadas: 0
      });

      const [metricasData, denunciasData, eficienciaData, evolucionData, distribucionGeoData] = await Promise.all([
        estadisticasService.getMetricasProgreso(inicio || '', fin || '', municipioId, comunidadId),
        estadisticasService.getEstadisticasDenuncias(inicio || '', fin || '', municipioId, comunidadId),
        estadisticasService.getEficienciaRociado(inicio || '', fin || '', municipioId, comunidadId),
        estadisticasService.getEvolucionTemporal(inicio || '', fin || '', municipioId, comunidadId),
        estadisticasService.getDistribucionGeografica(inicio || '', fin || '', municipioId, comunidadId)
      ]);

      setMetricasProgreso(metricasData || []);
      setEstadisticasDenuncias(denunciasData || []);
      setEficienciaRociado(eficienciaData || []);
      setEvolucionTemporal(evolucionData || []);
      setDistribucionGeografica(distribucionGeoData || []);

      setLoading(false);
    } catch (err) {
      console.error('❌ Error al cargar estadísticas:', err);
      setError(`Error al cargar las estadísticas: ${err.message || 'Error desconocido'}`);
      setLoading(false);
    }
  };

  // Cerrar dropdown al hacer clic fuera, scroll o redimensionar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMunicipioDropdown && !event.target.closest('.municipio-selector') && !event.target.closest('[data-dropdown="true"]')) {
        setShowMunicipioDropdown(false);
      }
      if (showComunidadDropdown && !event.target.closest('.comunidad-selector') && !event.target.closest('[data-dropdown="true"]')) {
        setShowComunidadDropdown(false);
      }
    };

    const handleScroll = () => {
      if (showMunicipioDropdown) setShowMunicipioDropdown(false);
      if (showComunidadDropdown) setShowComunidadDropdown(false);
    };

    const handleResize = () => {
      if (showMunicipioDropdown) setShowMunicipioDropdown(false);
      if (showComunidadDropdown) setShowComunidadDropdown(false);
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [showMunicipioDropdown, showComunidadDropdown]);

  const handleFechaChange = () => {
    loadEstadisticas(fechaInicio, fechaFin, municipioSeleccionado, comunidadSeleccionada);
  };

  const handleMunicipioChange = async (municipioId) => {
    setMunicipioSeleccionado(municipioId);
    setMunicipioActual(municipioId);
    setShowMunicipioDropdown(false);
    setFilterLoading(true);
    setComunidadSeleccionada('');
    setComunidadActual('');

    try {
      if (fechaInicio && fechaFin) {
        await loadEstadisticas(fechaInicio, fechaFin, municipioId, '');
      } else if (municipioId && municipioId !== '') {
        await loadEstadisticas('', '', municipioId, '');
      } else {
        await loadEstadisticas('', '', '', '');
      }
    } catch (error) {
      console.error('❌ Error en handleMunicipioChange:', error);
    } finally {
      setFilterLoading(false);
    }
  };

  const handleComunidadChange = async (comunidadId) => {
    setComunidadSeleccionada(comunidadId);
    setComunidadActual(comunidadId);
    setShowComunidadDropdown(false);
    setFilterLoading(true);

    try {
      if (fechaInicio && fechaFin) {
        await loadEstadisticas(fechaInicio, fechaFin, municipioSeleccionado, comunidadId);
      } else if (municipioSeleccionado && municipioSeleccionado !== '') {
        await loadEstadisticas('', '', municipioSeleccionado, comunidadId);
      } else {
        await loadEstadisticas('', '', '', comunidadId);
      }
    } catch (error) {
      console.error('❌ Error en handleComunidadChange:', error);
    } finally {
      setFilterLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Configuración de colores para los gráficos
  const colors = {
    primary: '#3498db',
    secondary: '#2ecc71',
    accent: '#e74c3c',
    warning: '#f39c12',
    info: '#9b59b6',
    success: '#27ae60',
    danger: '#e74c3c',
    light: '#ecf0f1',
    dark: '#2c3e50'
  };

  // Configuración común para gráficos
  const commonProps = {
    margin: { top: 20, right: 20, bottom: 40, left: 40 },
    animate: true,
    motionConfig: "gentle"
  };

  if (loading) {
    return (
      <div className="estadisticas-container">
        <div className="loading-message">
          <h2>📊 Cargando Estadísticas...</h2>
          <p>Obteniendo datos del sistema</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="estadisticas-container">
        <div className="error-message" style={{
          background: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          padding: '12px 16px',
          margin: '20px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>❌ Error al cargar estadísticas</h2>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#721c24'
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  // Log del estado actual para debugging

  return (
    <div className="estadisticas-container">
      {/* Header */}
      <div className="estadisticas-header">
        <div>
          <h1>📊 ESTADÍSTICAS DEL PROGRAMA</h1>
        </div>
        {/* Filtros */}
        <div className="filtros-container">

          <div className="municipio-selector" style={{ position: 'relative' }}>
            <button
              type="button"
              className={`filtro-button municipio-button ${municipioActual && municipioActual !== '' ? 'municipio-selected' : ''}`}
              onClick={(e) => {
                // Si es supervisor con un solo municipio, no permitir cambiar
                if (usuario?.rol === 'supervisor' && municipios.length === 1) {
                  return;
                }
                const rect = e.target.getBoundingClientRect();
                setDropdownPosition({
                  top: rect.bottom + window.scrollY + 5,
                  left: rect.left + window.scrollX
                });
                setShowMunicipioDropdown(!showMunicipioDropdown);
              }}
              disabled={loading || filterLoading || (usuario?.rol === 'supervisor' && municipios.length === 1)}
              style={{ 
                opacity: usuario?.rol === 'supervisor' && municipios.length === 1 ? 0.7 : 1,
                cursor: usuario?.rol === 'supervisor' && municipios.length === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              {loading || filterLoading ? (
                '⏳ Cargando...'
              ) : municipioActual && municipioActual !== '' ? (
                `🏛️ ${municipios.find(m => m.municipio_id == municipioActual)?.nombre_municipio || 'Municipio seleccionado'}`
              ) : (
                '🌍 Todos los municipios'
              )}
              {!(usuario?.rol === 'supervisor' && municipios.length === 1) && <span className="dropdown-arrow">▼</span>}
            </button>
            {!(usuario?.rol === 'supervisor' && municipios.length === 1) && (
              <MunicipioDropdown
                isOpen={showMunicipioDropdown}
                position={dropdownPosition}
                municipios={municipios}
                onSelect={handleMunicipioChange}
                onClose={() => setShowMunicipioDropdown(false)}
              />
            )}
            {usuario?.rol === 'supervisor' && municipios.length === 1 && (
              <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                (Solo su municipio asignado)
              </span>
            )}
          </div>

          <div className="comunidad-selector" style={{ position: 'relative' }}>
            <button
              type="button"
              className={`filtro-button comunidad-button ${comunidadActual && comunidadActual !== '' ? 'comunidad-selected' : ''}`}
              onClick={(e) => {
                const rect = e.target.getBoundingClientRect();
                setComunidadDropdownPosition({
                  top: rect.bottom + window.scrollY + 5,
                  left: rect.left + window.scrollX
                });
                setShowComunidadDropdown(!showComunidadDropdown);
              }}
              disabled={loading || filterLoading || !municipioSeleccionado || municipioSeleccionado === ''}
            >
              {loading || filterLoading ? (
                '⏳ Cargando...'
              ) : !municipioSeleccionado || municipioSeleccionado === '' ? (
                '🏘️ Seleccione municipio primero'
              ) : comunidadActual && comunidadActual !== '' ? (
                `🏘️ ${comunidades.find(c => c.comunidad_id == comunidadActual)?.nombre_comunidad || 'Comunidad seleccionada'}`
              ) : (
                '🏘️ Todas las comunidades'
              )}
              <span className="dropdown-arrow">▼</span>
            </button>
            <ComunidadDropdown
              isOpen={showComunidadDropdown}
              position={comunidadDropdownPosition}
              comunidades={comunidades}
              onSelect={handleComunidadChange}
              onClose={() => setShowComunidadDropdown(false)}
            />
          </div>

          <input
            type="date"
            className="filtro-button fecha-input"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />

          <input
            type="date"
            className="filtro-button fecha-input"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />

          <button
            onClick={handleFechaChange}
            className="filtro-button actualizar-button"
            disabled={loading}
          >
            {loading ? '⏳' : '🔄'} Actualizar
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="estadisticas-main">
        {/* Panel izquierdo - Métricas */}
        <div className="metrics-panel">
          <div className="metrics-header">
            <h3>📈 Métricas Principales {filterLoading && <span style={{ fontSize: '0.8rem', color: '#28a745' }}>⏳ Aplicando filtro...</span>}</h3>
            <div className="periodo-info">
              <span className="periodo-label">Período:</span>
              <span className="periodo-fechas">
                {fechaInicio && fechaFin
                  ? `${new Date(fechaInicio).toLocaleDateString('es-BO')} - ${new Date(fechaFin).toLocaleDateString('es-BO')}`
                  : 'Todos los datos'
                }
              </span>
              {municipioActual && municipioActual !== '' ? (
                <span className="periodo-municipio">
                  | 🏛️ Municipio: {municipios.find(m => m.municipio_id == municipioActual)?.nombre_municipio || 'Seleccionado'}
                </span>
              ) : (
                <span className="periodo-municipio">
                  | 🌍 Todos los municipios
                </span>
              )}
              {comunidadActual && comunidadActual !== '' ? (
                <span className="periodo-comunidad">
                  | 🏘️ Comunidad: {comunidades.find(c => c.comunidad_id == comunidadActual)?.nombre_comunidad || 'Seleccionada'}
                </span>
              ) : municipioActual && municipioActual !== '' ? (
                <span className="periodo-comunidad">
                  | 🏘️ Todas las comunidades
                </span>
              ) : null}
            </div>
          </div>
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">
                Viviendas registradas:
                <InfoTooltip text="Número total de viviendas que han sido registradas en el sistema." />
              </span>
              <span className="metric-value">{stats.viviendasRegistradas}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">
                Habitantes protegidos:
                <InfoTooltip text="Cantidad estimada de personas que viven en las viviendas tratadas o evaluadas." />
              </span>
              <span className="metric-value">{stats.habitantesProtegidos}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">
                Viviendas evaluadas:
                <InfoTooltip text="Número de viviendas que han sido inspeccionadas por técnicos." />
              </span>
              <span className="metric-value">{stats.viviendasEvaluadas}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">
                Viviendas positivas:
                <InfoTooltip text="Viviendas donde se encontraron vinchucas durante la evaluación." />
              </span>
              <span className="metric-value">{stats.viviendasPositivas}</span>
              <span className="metric-percentage">
                → Tasa de infestación: {stats.tasaInfestacion}%
                <InfoTooltip text="Porcentaje de viviendas evaluadas que resultaron positivas (Positivas / Evaluadas)." />
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">
                Ejemplares capturados:
                <InfoTooltip text="Total de vinchucas (ninfas y adultas) encontradas en las evaluaciones." />
              </span>
              <span className="metric-value">{stats.ejemplaresCapturados}</span>
              <span className="metric-detail">({stats.ejemplaresIntra} intra / {stats.ejemplaresPeri} peri)</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">
                Viviendas rociadas:
                <InfoTooltip text="Número de viviendas que han sido rociadas con insecticida." />
              </span>
              <span className="metric-value">{stats.viviendasRociadas}</span>
              <span className="metric-percentage">
                → Cobertura de rociado: {stats.coberturaRociado}%
                <InfoTooltip text="Porcentaje de viviendas rociadas respecto al total de viviendas evaluadas o programadas." />
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">
                Total insecticida aplicado:
                <InfoTooltip text="Cantidad total de insecticida utilizado en litros." />
              </span>
              <span className="metric-value">{stats.totalInsecticida} L</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">
                Habitaciones no rociadas:
                <InfoTooltip text="Número de habitaciones que no pudieron ser rociadas por diversas razones." />
              </span>
              <span className="metric-value">{stats.habitacionesNoRociadas}</span>
            </div>
          </div>
        </div>

        {/* Panel derecho - Gráficos */}
        <div className="charts-panel">
          {/* Gráfico de Barras - Métricas de Progreso (Mejorado) */}
          <div className="chart-container large">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 Actividades del Programa
              <InfoTooltip text="Comparativa general de las principales actividades realizadas: denuncias, viviendas tratadas, habitantes protegidos, etc." />
            </h3>
            <div style={{ height: '300px' }}>
              {metricasProgreso && metricasProgreso.length > 0 && metricasProgreso.some(item => item.valor > 0) ? (
                <ResponsiveBar
                  data={(metricasProgreso || []).map(item => ({
                    ...item,
                    metrica: item?.metrica || 'Sin nombre',
                    valor: item?.valor || 0
                  }))}
                  keys={['valor']}
                  indexBy="metrica"
                  colors={(d) => {
                    const metrica = d.data.metrica;
                    if (metrica?.includes('Denuncias')) return '#e74c3c';
                    if (metrica?.includes('Viviendas')) return '#3498db';
                    if (metrica?.includes('Habitantes')) return '#2ecc71';
                    if (metrica?.includes('Comunidades')) return '#9b59b6';
                    if (metrica?.includes('Evaluaciones')) return '#f39c12';
                    if (metrica?.includes('Insecticida')) return '#e67e22';
                    return '#95a5a6';
                  }}
                  margin={{ top: 20, right: 20, bottom: 120, left: 70 }}
                  padding={0.4}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: 'Tipo de Actividad',
                    legendPosition: 'middle',
                    legendOffset: 100
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Cantidad',
                    legendPosition: 'middle',
                    legendOffset: -60
                  }}
                  tooltip={({ id, value, indexValue }) => (
                    <div style={{
                      background: 'white',
                      padding: '12px 16px',
                      border: '2px solid #3498db',
                      borderRadius: '6px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      fontSize: '14px'
                    }}>
                      <strong style={{ color: '#2c3e50' }}>{indexValue}</strong>
                      <div style={{ marginTop: '4px', color: '#7f8c8d' }}>
                        Total: <strong style={{ color: '#3498db', fontSize: '16px' }}>{value.toLocaleString()}</strong>
                      </div>
                    </div>
                  )}
                />
              ) : (
                <NoDataMessage />
              )}
            </div>
          </div>

          {/* Gráficos inferiores */}
          <div className="charts-row">
            {/* Gráfico de Donut - Estados de Denuncias (Mejorado) */}
            <div className="chart-container medium">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                📋 Estados de Denuncias
                <InfoTooltip text="Distribución de las denuncias según su estado actual (Recibidas, Programadas, Realizadas, Canceladas)." />
              </h3>
              <div style={{ height: '250px' }}>
                {estadisticasDenuncias && estadisticasDenuncias.length > 0 && estadisticasDenuncias.some(item => item.cantidad > 0) ? (
                  <ResponsivePie
                    data={(estadisticasDenuncias || []).map(item => ({
                      id: item?.estado || 'Sin estado',
                      label: item?.estado || 'Sin estado',
                      value: item?.cantidad || 0,
                      color: item?.color || '#cccccc'
                    }))}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    innerRadius={0.6}
                    padAngle={1}
                    cornerRadius={4}
                    activeOuterRadiusOffset={10}
                    colors={(d) => d.data.color}
                    borderWidth={2}
                    borderColor="#ffffff"
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#2c3e50"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor="#ffffff"
                    tooltip={({ datum }) => (
                      <div style={{
                        background: 'white',
                        padding: '12px 16px',
                        border: '2px solid ' + datum.color,
                        borderRadius: '6px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        fontSize: '14px'
                      }}>
                        <strong style={{ color: '#2c3e50' }}>{datum.label}</strong>
                        <div style={{ marginTop: '4px', color: '#7f8c8d' }}>
                          Cantidad: <strong style={{ color: datum.color, fontSize: '16px' }}>{datum.value}</strong>
                        </div>
                      </div>
                    )}
                  />
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>

            {/* Gráfico de Líneas - Evolución Temporal (Mejorado) */}
            <div className="chart-container medium">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                📈 Evolución de Evaluaciones
                <InfoTooltip text="Tendencia temporal de las evaluaciones realizadas y cuántas resultaron positivas a lo largo de los meses." />
              </h3>
              <div style={{ height: '250px' }}>
                {evolucionTemporal && evolucionTemporal.length > 0 ? (
                  <ResponsiveLine
                    data={[
                      {
                        id: 'Total Evaluaciones',
                        color: '#3498db',
                        data: (evolucionTemporal || []).map((item, index) => ({
                          x: item?.mes || `Mes ${index + 1}`,
                          y: item?.total_evaluaciones || 0,
                          key: `total-${index}`
                        }))
                      },
                      {
                        id: 'Evaluaciones Positivas',
                        color: '#e74c3c',
                        data: (evolucionTemporal || []).map((item, index) => ({
                          x: item?.mes || `Mes ${index + 1}`,
                          y: item?.evaluaciones_positivas || 0,
                          key: `positivas-${index}`
                        }))
                      }
                    ]}
                    margin={{ top: 20, right: 20, bottom: 60, left: 50 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false }}
                    curve="monotoneX"
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      orient: 'bottom',
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: 'Mes',
                      legendOffset: 40,
                      legendPosition: 'middle'
                    }}
                    axisLeft={{
                      orient: 'left',
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Cantidad',
                      legendOffset: -45,
                      legendPosition: 'middle'
                    }}
                    colors={['#3498db', '#e74c3c']}
                    lineWidth={3}
                    pointSize={10}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    pointLabelYOffset={-12}
                    useMesh={true}
                    legends={[
                      {
                        anchor: 'top-right',
                        direction: 'column',
                        justify: false,
                        translateX: 0,
                        translateY: 0,
                        itemsSpacing: 5,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 20,
                        symbolSize: 12,
                        symbolShape: 'circle'
                      }
                    ]}
                    tooltip={({ point }) => (
                      <div style={{
                        background: 'white',
                        padding: '12px 16px',
                        border: '2px solid ' + point.serieColor,
                        borderRadius: '6px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        fontSize: '14px'
                      }}>
                        <strong style={{ color: point.serieColor }}>{point.serieId}</strong>
                        <div style={{ marginTop: '4px', color: '#7f8c8d' }}>
                          {point.data.x}: <strong style={{ color: '#2c3e50', fontSize: '16px' }}>{point.data.y}</strong>
                        </div>
                      </div>
                    )}
                  />
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>

            {/* Gráfico de Barras Verticales - Top Municipios (Mejorado) */}
            <div className="chart-container small">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                🗺️ Top 5 Municipios
                <InfoTooltip text="Los 5 municipios con mayor cantidad de denuncias registradas en el período seleccionado." />
              </h3>
              <div style={{ height: '200px' }}>
                {distribucionGeografica && distribucionGeografica.length > 0 && distribucionGeografica.some(item => item.denuncias > 0) ? (
                  <ResponsiveBar
                    data={(distribucionGeografica || []).slice(0, 5).map(item => ({
                      ...item,
                      nombre_municipio: item?.nombre_municipio || 'Sin nombre',
                      denuncias: item?.denuncias || 0
                    }))}
                    keys={['denuncias']}
                    indexBy="nombre_municipio"
                    colors="#2ecc71"
                    margin={{ top: 20, right: 20, bottom: 80, left: 50 }}
                    padding={0.5}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: 'Municipio',
                      legendPosition: 'middle',
                      legendOffset: 70
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Denuncias',
                      legendPosition: 'middle',
                      legendOffset: -40
                    }}
                    tooltip={({ id, value, indexValue }) => (
                      <div style={{
                        background: 'white',
                        padding: '12px 16px',
                        border: '2px solid #2ecc71',
                        borderRadius: '6px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        fontSize: '14px'
                      }}>
                        <strong style={{ color: '#2c3e50' }}>{indexValue}</strong>
                        <div style={{ marginTop: '4px', color: '#7f8c8d' }}>
                          Denuncias: <strong style={{ color: '#2ecc71', fontSize: '16px' }}>{value}</strong>
                        </div>
                      </div>
                    )}
                  />
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>
          </div>

          {/* Segunda fila de gráficos - Gráficas mejoradas e intuitivas */}
          <div className="charts-row">
            {/* Gráfico de Barras - Eficiencia de Rociado (más claro que Waffle) */}
            <div className="chart-container medium">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                💧 Eficiencia de Rociado
                <InfoTooltip text="Desglose de la eficiencia del rociado por tipo de vivienda o categoría." />
              </h3>
              <div style={{ height: '250px' }}>
                {eficienciaRociado && eficienciaRociado.length > 0 && eficienciaRociado.some(item => item.cantidad > 0) ? (
                  <ResponsiveBar
                    data={(eficienciaRociado || []).map(item => ({
                      tipo: item?.tipo || 'Sin tipo',
                      cantidad: item?.cantidad || 0,
                      color: item?.color || '#3498db'
                    }))}
                    keys={['cantidad']}
                    indexBy="tipo"
                    colors={(d) => d.data.color}
                    margin={{ top: 20, right: 20, bottom: 80, left: 60 }}
                    padding={0.3}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: 'Tipo de Vivienda',
                      legendPosition: 'middle',
                      legendOffset: 70
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Cantidad',
                      legendPosition: 'middle',
                      legendOffset: -50
                    }}
                    tooltip={({ id, value, indexValue }) => (
                      <div style={{
                        background: 'white',
                        padding: '9px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <strong>{indexValue}</strong>: {value} viviendas
                      </div>
                    )}
                  />
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>

            {/* Gráfico de Pie - Distribución de Ejemplares (más claro que TreeMap) */}
            <div className="chart-container medium">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                🐛 Distribución de Ejemplares
                <InfoTooltip text="Proporción de vinchucas encontradas dentro de la vivienda (Intra) vs. fuera de la vivienda (Peri)." />
              </h3>
              <div style={{ height: '250px' }}>
                {(stats.ejemplaresIntra > 0 || stats.ejemplaresPeri > 0) ? (
                  <ResponsivePie
                    data={[
                      {
                        id: 'Intra-domiciliarios',
                        label: 'Intra-domiciliarios',
                        value: stats.ejemplaresIntra || 0,
                        color: '#3498db'
                      },
                      {
                        id: 'Peri-domiciliarios',
                        label: 'Peri-domiciliarios',
                        value: stats.ejemplaresPeri || 0,
                        color: '#2ecc71'
                      }
                    ]}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    colors={['#3498db', '#2ecc71']}
                    borderWidth={2}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#333333"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor="#ffffff"
                    tooltip={({ datum }) => (
                      <div style={{
                        background: 'white',
                        padding: '9px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <strong>{datum.label}</strong>: {datum.value} ejemplares
                      </div>
                    )}
                  />
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>

            {/* Gráfico de Barras - Indicadores Clave (más claro que Radar) */}
            <div className="chart-container small">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                📊 Indicadores Clave
                <InfoTooltip text="Comparación porcentual de la Tasa de Infestación y la Cobertura de Rociado." />
              </h3>
              <div style={{ height: '200px' }}>
                {(stats.tasaInfestacion > 0 || stats.coberturaRociado > 0) ? (
                  <ResponsiveBar
                    data={[
                      {
                        indicador: 'Tasa Infestación',
                        valor: parseFloat(stats.tasaInfestacion) || 0
                      },
                      {
                        indicador: 'Cobertura Rociado',
                        valor: parseFloat(stats.coberturaRociado) || 0
                      }
                    ]}
                    keys={['valor']}
                    indexBy="indicador"
                    colors={['#e74c3c', '#27ae60']}
                    margin={{ top: 20, right: 20, bottom: 60, left: 50 }}
                    padding={0.4}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: 'Indicador',
                      legendPosition: 'middle',
                      legendOffset: 50
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: '%',
                      legendPosition: 'middle',
                      legendOffset: -40
                    }}
                    maxValue={100}
                    tooltip={({ id, value, indexValue }) => (
                      <div style={{
                        background: 'white',
                        padding: '9px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <strong>{indexValue}</strong>: {value}%
                      </div>
                    )}
                  />
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstadisticasNivo;