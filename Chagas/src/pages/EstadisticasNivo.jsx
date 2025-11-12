import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { estadisticasService } from '../services/estadisticasService';
import '../css/Estadisticas.css';


// Importar componentes de Nivo
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveRadar } from '@nivo/radar';
import { ResponsiveTreeMap } from '@nivo/treemap';
import { ResponsiveWaffle } from '@nivo/waffle';
import { ResponsiveStream } from '@nivo/stream';

// Componente de dropdown ultra simplificado
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
          border: '2px solid #dc3545'
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

const EstadisticasNivo = () => {
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

  // Estados para las nuevas métricas
  const [metricasProgreso, setMetricasProgreso] = useState([]);
  const [estadisticasDenuncias, setEstadisticasDenuncias] = useState([]);
  const [eficienciaRociado, setEficienciaRociado] = useState([]);
  const [evolucionTemporal, setEvolucionTemporal] = useState([]);
  const [distribucionEjemplares, setDistribucionEjemplares] = useState([]);
  const [comparacionFechas, setComparacionFechas] = useState([]);
  const [analisisTemporal, setAnalisisTemporal] = useState([]);
  const [distribucionGeografica, setDistribucionGeografica] = useState([]);
  const [analisisEjemplares, setAnalisisEjemplares] = useState([]);
  const [indicadoresRendimiento, setIndicadoresRendimiento] = useState([]);

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState('');
  const [municipios, setMunicipios] = useState([]);
  const [showMunicipioDropdown, setShowMunicipioDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Establecer fechas por defecto (último mes)
    const hoy = new Date();
    const haceUnMes = new Date();
    haceUnMes.setMonth(hoy.getMonth() - 1);
    
    setFechaInicio(haceUnMes.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
    
    // Cargar municipios disponibles
    loadMunicipios();
  }, []);

  // Cargar estadísticas cuando cambien las fechas o municipio
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      loadEstadisticas(fechaInicio, fechaFin, municipioSeleccionado);
    }
  }, [fechaInicio, fechaFin, municipioSeleccionado]);

  const loadMunicipios = async () => {
    try {
      const municipiosData = await estadisticasService.getMunicipios();
      setMunicipios(municipiosData);
    } catch (error) {
      console.error('❌ Error al cargar municipios:', error);
      // Fallback a municipios por defecto
      const municipiosData = [
        { municipio_id: 1, nombre_municipio: 'Cochabamba' },
        { municipio_id: 2, nombre_municipio: 'Sacaba' },
        { municipio_id: 3, nombre_municipio: 'Quillacollo' },
        { municipio_id: 4, nombre_municipio: 'Tiquipaya' },
        { municipio_id: 5, nombre_municipio: 'Colcapirhua' }
      ];
      setMunicipios(municipiosData);
      setError(`Error al cargar municipios: ${error.message || 'Error de conexión'}`);
    }
  };

  const loadEstadisticas = async (inicio, fin, municipio) => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (inicio && fin && municipio && municipio !== '') {
        data = await estadisticasService.getEstadisticasPorFechasYMunicipio(inicio, fin, municipio);
      } else if (inicio && fin) {
        data = await estadisticasService.getEstadisticasPorFechas(inicio, fin);
      } else if (municipio && municipio !== '') {
        data = await estadisticasService.getEstadisticasPorMunicipio(municipio);
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
      
      // Cargar métricas adicionales
      const municipioId = municipio && municipio !== '' && municipio !== 'todos' 
        ? parseInt(municipio) 
        : undefined;

      const [
        metricasData,
        denunciasData,
        eficienciaData,
        evolucionData,
        ejemplaresData,
        comparacionData,
        analisisTemporalData,
        distribucionGeoData,
        analisisEjemplaresData,
        indicadoresData
      ] = await Promise.all([
        estadisticasService.getMetricasProgreso(inicio, fin, municipioId),
        estadisticasService.getEstadisticasDenuncias(inicio, fin, municipioId),
        estadisticasService.getEficienciaRociado(inicio, fin, municipioId),
        estadisticasService.getEvolucionTemporal(inicio, fin, municipioId),
        estadisticasService.getDistribucionEjemplares(inicio, fin, municipioId),
        estadisticasService.getComparacionFechas(inicio, fin, municipioId),
        estadisticasService.getAnalisisTemporal(inicio, fin, municipioId),
        estadisticasService.getDistribucionGeografica(inicio, fin, municipioId),
        estadisticasService.getAnalisisEjemplares(inicio, fin, municipioId),
        estadisticasService.getIndicadoresRendimiento(inicio, fin, municipioId)
      ]);

      setMetricasProgreso(metricasData || []);
      setEstadisticasDenuncias(denunciasData || []);
      setEficienciaRociado(eficienciaData || []);
      setEvolucionTemporal(evolucionData || []);
      setDistribucionEjemplares(ejemplaresData || []);
      setComparacionFechas(comparacionData || []);
      setAnalisisTemporal(analisisTemporalData || []);
      setDistribucionGeografica(distribucionGeoData || []);
      setAnalisisEjemplares(analisisEjemplaresData || []);
      setIndicadoresRendimiento(indicadoresData || []);
      
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
      // Solo cerrar si no es un clic en el dropdown o en el botón
      if (showMunicipioDropdown && 
          !event.target.closest('.municipio-selector') && 
          !event.target.closest('[data-dropdown="true"]')) {
        setShowMunicipioDropdown(false);
      }
    };

    const handleScroll = () => {
      if (showMunicipioDropdown) {
        setShowMunicipioDropdown(false);
      }
    };

    const handleResize = () => {
      if (showMunicipioDropdown) {
        setShowMunicipioDropdown(false);
      }
    };

    // Usar un pequeño delay para evitar conflictos con el clic
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
  }, [showMunicipioDropdown]);

  const handleFechaChange = () => {
    if (fechaInicio && fechaFin) {
      loadEstadisticas(fechaInicio, fechaFin, municipioSeleccionado);
    }
  };

  const handleMunicipioChange = async (municipioId) => {
    
    setMunicipioSeleccionado(municipioId);
    setMunicipioActual(municipioId);
    setShowMunicipioDropdown(false);
    setFilterLoading(true);
    
    
    try {
      // Recargar estadísticas inmediatamente cuando se selecciona un municipio
      if (fechaInicio && fechaFin) {
        await loadEstadisticas(fechaInicio, fechaFin, municipioId);
      } else if (municipioId && municipioId !== '') {
        await loadEstadisticas('', '', municipioId);
      } else {
        await loadEstadisticas('', '', '');
      }
    } catch (error) {
      console.error('❌ Error en handleMunicipioChange:', error);
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
                const rect = e.target.getBoundingClientRect();
                setDropdownPosition({
                  top: rect.bottom + window.scrollY + 5,
                  left: rect.left + window.scrollX
                });
                setShowMunicipioDropdown(!showMunicipioDropdown);
              }}
              disabled={loading || filterLoading}
            >
              {loading || filterLoading ? (
                '⏳ Cargando...'
              ) : municipioActual && municipioActual !== '' ? (
                `🏛️ ${municipios.find(m => m.municipio_id == municipioActual)?.nombre_municipio || 'Municipio seleccionado'}`
              ) : (
                '🌍 Todos los municipios'
              )}
              <span className="dropdown-arrow">▼</span>
            </button>
            <MunicipioDropdown
              isOpen={showMunicipioDropdown}
              position={dropdownPosition}
              municipios={municipios}
              onSelect={handleMunicipioChange}
              onClose={() => setShowMunicipioDropdown(false)}
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
            </div>
          </div>
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">Viviendas registradas:</span>
              <span className="metric-value">{stats.viviendasRegistradas}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Habitantes protegidos:</span>
              <span className="metric-value">{stats.habitantesProtegidos}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Viviendas evaluadas:</span>
              <span className="metric-value">{stats.viviendasEvaluadas}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Viviendas positivas:</span>
              <span className="metric-value">{stats.viviendasPositivas}</span>
              <span className="metric-percentage">→ Tasa de infestación: {stats.tasaInfestacion}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Ejemplares capturados:</span>
              <span className="metric-value">{stats.ejemplaresCapturados}</span>
              <span className="metric-detail">({stats.ejemplaresIntra} intra / {stats.ejemplaresPeri} peri)</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Viviendas rociadas:</span>
              <span className="metric-value">{stats.viviendasRociadas}</span>
              <span className="metric-percentage">→ Cobertura de rociado: {stats.coberturaRociado}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Total insecticida aplicado:</span>
              <span className="metric-value">{stats.totalInsecticida} L</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Habitaciones no rociadas:</span>
              <span className="metric-value">{stats.habitacionesNoRociadas}</span>
            </div>
          </div>
        </div>

        {/* Panel derecho - Gráficos */}
        <div className="charts-panel">
          {/* Gráfico de Barras - Métricas de Progreso */}
          <div className="chart-container large">
            <h3>📊 Métricas de Progreso</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveBar
                data={(metricasProgreso || []).map(item => ({
                  ...item,
                  metrica: item?.metrica || 'Sin nombre',
                  valor: item?.valor || 0
                }))}
                keys={['valor']}
                indexBy="metrica"
                colors={colors.primary}
                {...commonProps}
                margin={{ top: 20, right: 20, bottom: 120, left: 60 }}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Métricas',
                  legendPosition: 'middle',
                  legendOffset: 100
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
                    <strong>{indexValue}</strong>: {value}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Gráficos inferiores */}
          <div className="charts-row">
            {/* Gráfico de Donut - Estados de Denuncias */}
            <div className="chart-container medium">
              <h3>📋 Estados de Denuncias</h3>
              <div style={{ height: '250px' }}>
                <ResponsivePie
                  data={(estadisticasDenuncias || []).map(item => ({
                    id: item?.estado || 'Sin estado',
                    label: item?.estado || 'Sin estado',
                    value: item?.cantidad || 0,
                    color: item?.color || '#cccccc'
                  }))}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={{ scheme: 'nivo' }}
                  borderWidth={1}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor="#333333"
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={{ from: 'color' }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                  tooltip={({ datum }) => (
                    <div style={{
                      background: 'white',
                      padding: '9px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <strong>{datum.label}</strong>: {datum.value} ({datum.formattedValue})
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Gráfico de Líneas - Evolución Temporal */}
            <div className="chart-container medium">
              <h3>📈 Evolución Temporal</h3>
              <div style={{ height: '250px' }}>
                <ResponsiveLine
                  data={[
                    {
                      id: 'Denuncias',
                      data: (evolucionTemporal || []).map((item, index) => ({
                        x: item?.mes || `Mes ${index + 1}`,
                        y: item?.total_evaluaciones || 0,
                        key: `denuncias-${index}`
                      }))
                    },
                    {
                      id: 'Positivas',
                      data: (evolucionTemporal || []).map((item, index) => ({
                        x: item?.mes || `Mes ${index + 1}`,
                        y: item?.evaluaciones_positivas || 0,
                        key: `positivas-${index}`
                      }))
                    }
                  ]}
                  margin={{ top: 20, right: 20, bottom: 60, left: 40 }}
                  xScale={{ type: 'point' }}
                  yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                  curve="catmullRom"
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    orient: 'bottom',
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: 'Mes',
                    legendOffset: 36,
                    legendPosition: 'middle'
                  }}
                  axisLeft={{
                    orient: 'left',
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Cantidad',
                    legendOffset: -40,
                    legendPosition: 'middle'
                  }}
                  colors={{ scheme: 'nivo' }}
                  pointSize={8}
                  pointColor={{ theme: 'background' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  pointLabelYOffset={-12}
                  useMesh={true}
                  tooltip={({ point }) => (
                    <div style={{
                      background: 'white',
                      padding: '9px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <strong>{point.serieId}</strong><br/>
                      {point.data.x}: {point.data.y}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Gráfico de Barras Verticales - Distribución Geográfica */}
            <div className="chart-container small">
              <h3>🗺️ Distribución por Municipio</h3>
              <div style={{ height: '200px' }}>
                <ResponsiveBar
                  data={(distribucionGeografica || []).slice(0, 5).map(item => ({
                    ...item,
                    nombre_municipio: item?.nombre_municipio || 'Sin nombre',
                    denuncias: item?.denuncias || 0
                  }))}
                  keys={['denuncias']}
                  indexBy="nombre_municipio"
                  colors={colors.secondary}
                  margin={{ top: 20, right: 20, bottom: 80, left: 40 }}
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
                    legendOffset: -35
                  }}
                  tooltip={({ id, value, indexValue }) => (
                    <div style={{
                      background: 'white',
                      padding: '9px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <strong>{indexValue}</strong>: {value} denuncias
                    </div>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Segunda fila de gráficos */}
          <div className="charts-row">
            {/* Gráfico de Waffle - Eficiencia de Rociado */}
            <div className="chart-container medium">
              <h3>💧 Eficiencia de Rociado</h3>
              <div style={{ height: '250px' }}>
                <ResponsiveWaffle
                  data={(eficienciaRociado || []).map((item, index) => ({
                    id: item?.tipo || 'Sin tipo',
                    label: item?.tipo || 'Sin tipo',
                    value: item?.cantidad || 0,
                    color: item?.color || '#cccccc',
                    key: `eficiencia-${index}`
                  }))}
                  total={100}
                  rows={10}
                  columns={10}
                  fillDirection="top"
                  padding={1}
                  valueFormat=".2f"
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  colors={{ scheme: 'nivo' }}
                  borderRadius={3}
                  borderWidth={1}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
                  animate={true}
                  motionStiffness={90}
                  motionDamping={11}
                  tooltip={({ data }) => (
                    <div style={{
                      background: 'white',
                      padding: '9px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <strong>{data.label}</strong>: {data.value}%
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Gráfico de Radar - Indicadores de Rendimiento */}
            <div className="chart-container medium">
              <h3>🎯 Indicadores de Rendimiento</h3>
              <div style={{ height: '250px' }}>
                <ResponsiveRadar
                  data={[
                    {
                      indicador: 'Atención',
                      valor: (indicadoresRendimiento || []).find(i => i?.indicador === 'Tiempo Promedio de Atención')?.valor || 0
                    },
                    {
                      indicador: 'Evaluación',
                      valor: (indicadoresRendimiento || []).find(i => i?.indicador === 'Eficiencia de Evaluación')?.valor || 0
                    },
                    {
                      indicador: 'Rociado',
                      valor: (indicadoresRendimiento || []).find(i => i?.indicador === 'Cobertura de Rociado')?.valor || 0
                    },
                    {
                      indicador: 'Eficiencia',
                      valor: (indicadoresRendimiento || []).find(i => i?.indicador === 'Habitantes Protegidos por Litro')?.valor || 0
                    }
                  ]}
                  keys={['valor']}
                  indexBy="indicador"
                  valueFormat=".2f"
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  borderColor={{ from: 'color' }}
                  gridLabelOffset={36}
                  dotSize={8}
                  dotColor={{ theme: 'background' }}
                  dotBorderWidth={2}
                  dotBorderColor={{ from: 'color' }}
                  colors={{ scheme: 'nivo' }}
                  blendMode="multiply"
                  motionConfig="wobbly"
                  tooltip={({ data }) => (
                    <div style={{
                      background: 'white',
                      padding: '9px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <strong>{data.indexValue}</strong>: {data.value}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Gráfico de TreeMap - Análisis de Ejemplares */}
            <div className="chart-container small">
              <h3>🐛 Análisis de Ejemplares</h3>
              <div style={{ height: '200px' }}>
                <ResponsiveTreeMap
                  data={{
                    name: 'Ejemplares',
                    children: (analisisEjemplares || []).map((item, index) => ({
                      name: item?.resultado || 'Sin resultado',
                      loc: item?.total_ejemplares || 0,
                      key: `ejemplar-${index}`
                    }))
                  }}
                  identity="name"
                  value="loc"
                  valueFormat=".0f"
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  label="id"
                  labelFormat=".0f"
                  labelSkipSize={12}
                  labelTextColor={{ from: 'color', modifiers: [['darker', 1.2]] }}
                  colors={{ scheme: 'nivo' }}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.1]] }}
                  animate={true}
                  motionConfig="wobbly"
                  tooltip={({ node }) => (
                    <div style={{
                      background: 'white',
                      padding: '9px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <strong>{node.id}</strong>: {node.value} ejemplares
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstadisticasNivo;