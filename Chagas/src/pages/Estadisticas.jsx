import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import EstadisticasCard from "../components/estadisticas-card";
import GraficosEstadisticas from "../components/graficos-estadisticas";
import { Icon } from "@iconify/react";
import { useAuth } from './AuthContext';
import '../css/Estadisticas1.css';
import { baseUrl } from "../api/BaseUrl";
import { estadisticasService } from '../services/estadisticasService';
import InfoTooltip from "../components/InfoTooltip";
import { createPortal } from 'react-dom';

// ====================================================================
// --- 1. COMPONENTE GENÉRICO DE DROPDOWN (GenericDropdown) ---
// ====================================================================

const GenericDropdown = ({
  isOpen,
  position,
  items, // Array de objetos { id, nombre }
  onSelect,
  onClose,
  defaultLabel,
  defaultIcon,
  itemIcon,
  accentColor
}) => {
  if (!isOpen) return null;

  const handleSelect = (itemId, nombre) => {
    onSelect(itemId);
    onClose();
  };

  return createPortal(
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 999999, background: 'rgba(0,0,0,0.3)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'fixed', top: position.top, left: position.left,
          zIndex: 1000000, background: 'white', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)', minWidth: '200px',
          maxHeight: '300px', overflowY: 'auto', border: `2px solid ${accentColor}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Opción 'Todos' */}
        <div
          style={{ padding: '12px 20px', cursor: 'pointer', color: '#333', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #f0f0f0', backgroundColor: '#f8f9fa' }}
          onClick={() => handleSelect('', defaultLabel)}
        >
          {defaultIcon} {defaultLabel}
        </div>

        {/* Lista de ítems */}
        {items.length > 0 ? (
          items.map(item => (
            <div
              key={item.id}
              style={{ padding: '12px 20px', cursor: 'pointer', color: '#333', fontSize: '14px', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}
              onClick={() => handleSelect(item.id, item.nombre)}
            >
              {itemIcon} {item.nombre}
            </div>
          ))
        ) : (
          <div style={{ color: '#666', fontStyle: 'italic', padding: '12px 20px', fontSize: '14px' }}>
            ⏳ Cargando datos...
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// ====================================================================
// --- 2. COMPONENTE DE MÉTRICAS CLAVE (KeyMetrics) ---
// ====================================================================

const KeyMetrics = ({ estadisticas, tooltips }) => {
  const metrics = [
    {
      label: "Viviendas Evaluadas",
      value: estadisticas.viviendasEvaluadas || 0,
      icon: "mdi:home-search-outline",
      color: "#007bff", // Azul
      tooltip: tooltips.viviendasEvaluadas,
    },
    {
      label: "Tasa de Infestación",
      value: `${estadisticas.tasaInfestacion || 0}%`,
      icon: "mdi:bug",
      color: "#dc3545", // Rojo (Alerta)
      tooltip: tooltips.tasaInfestacion,
      subtext: `${estadisticas.viviendasPositivas || 0} positivas`
    },
    {
      label: "Viviendas Rociadas",
      value: estadisticas.viviendasRociadas || 0,
      icon: "mdi:spray-bottle",
      color: "#28a745", // Verde
      tooltip: tooltips.viviendasRociadas,
      subtext: `Cobertura: ${estadisticas.coberturaRociado || 0}%`
    },
    {
      label: "Ejemplares Capturados",
      value: estadisticas.ejemplaresCapturados || 0,
      icon: "mdi:spider-web",
      color: "#ffc107", // Amarillo/Naranja
      tooltip: tooltips.ejemplaresCapturados,
      subtext: `${estadisticas.ejemplaresIntra || 0} intra / ${estadisticas.ejemplaresPeri || 0} peri`
    },
  ];

  return (
    // Usa clases CSS definidas en Estadisticas1.css
    <div className="key-metrics-grid">
      {metrics.map((metric, index) => (
        <div key={index} className="key-metric-card" style={{ '--metric-color': metric.color }}>
          <div className="metric-header">
            <Icon icon={metric.icon} className="metric-icon" style={{ color: metric.color }} />
            <span className="metric-label">{metric.label}</span>
            <InfoTooltip text={metric.tooltip} />
          </div>
          <div className="metric-value">{metric.value}</div>
          {metric.subtext && <div className="metric-subtext">{metric.subtext}</div>}
        </div>
      ))}
    </div>
  );
};


// ====================================================================
// --- 3. COMPONENTE PRINCIPAL (Estadisticas) ---
// ====================================================================

const Estadisticas = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { hasRole, usuario, token } = useAuth();
  const navigate = useNavigate();

  // ESTADO CONSOLIDADO PARA FILTROS
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    municipioId: '',
    comunidadId: ''
  });

  const [municipios, setMunicipios] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [dropdowns, setDropdowns] = useState({ municipio: false, comunidad: false });
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const municipioButtonRef = useRef(null);
  const comunidadButtonRef = useRef(null);

  const getNombreById = (arr, id) => {
    const item = arr.find(m => m.id.toString() === id.toString());
    return item ? item.nombre : '';
  };

  // --- EFECTOS Y SERVICIOS ---

  // Lógica de carga inicial y manejo de supervisor
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Lógica para cargar municipios
        if (usuario?.rol === 'supervisor' && (usuario?.usuario_id || usuario?.id)) {
          const usuarioId = usuario.usuario_id || usuario.id;
          const headers = token ? { "Authorization": `Bearer ${token}` } : {};

          const municipioRes = await fetch(`${baseUrl}/api/usuarios/${usuarioId}/municipios`, {
            headers: headers
          });

          if (municipioRes.ok) {
            const municipiosData = await municipioRes.json();
            setMunicipios(municipiosData || []);

            if (municipiosData.length === 1) {
              const municipioId = municipiosData[0].municipio_id.toString();
              setFiltros(prev => ({ ...prev, municipioId }));
              fetchEstadisticas('', '', municipioId, '');
              return;
            }
          } else {
            console.error(`Error ${municipioRes.status} al obtener municipios:`, municipioRes.statusText);
          }
        } else {
          const municipiosData = await estadisticasService.getMunicipios();
          setMunicipios(municipiosData);
        }
        fetchEstadisticas();
      } catch (err) {
        console.error("Error cargando datos iniciales:", err);
        setError("Error al cargar datos iniciales.");
      }
    };
    loadInitialData();
  }, [usuario, token]);

  // Cargar comunidades cuando cambia municipio
  useEffect(() => {
    const loadComunidades = async () => {
      if (filtros.municipioId && filtros.municipioId !== '') {
        try {
          const comunidadesData = await estadisticasService.getComunidadesByMunicipio(parseInt(filtros.municipioId));
          const formattedComunidades = comunidadesData.map(c => ({
            id: c.comunidad_id.toString(),
            nombre: c.nombre_comunidad
          }));
          setComunidades(formattedComunidades || []);
        } catch (error) {
          console.error('Error al cargar comunidades:', error);
          setComunidades([]);
        }
      } else {
        setComunidades([]);
        setFiltros(prev => ({ ...prev, comunidadId: '' }));
      }
    };
    loadComunidades();
  }, [filtros.municipioId]);

  const [evolucionData, setEvolucionData] = useState([]);
  const [denunciasData, setDenunciasData] = useState([]);

  // Función principal para obtener estadísticas
  const fetchEstadisticas = async (inicio, fin, municipio, comunidad) => {
    try {
      setLoading(true);
      setError(null);
      const municipioId = municipio && municipio !== '' ? parseInt(municipio) : undefined;
      const comunidadId = comunidad && comunidad !== '' ? parseInt(comunidad) : undefined;
      const fechaInicio = inicio || '';
      const fechaFin = fin || '';

      const [data, evolucion, denunciasStats] = await Promise.all([
        estadisticasService.getEstadisticasFiltradas(inicio || null, fin || null, municipioId, comunidadId),
        estadisticasService.getEvolucionTemporal(fechaInicio, fechaFin, municipioId, comunidadId),
        estadisticasService.getEstadisticasDenuncias(fechaInicio, fechaFin, municipioId, comunidadId)
      ]);

      setEstadisticas(data);
      setEvolucionData(evolucion || []);
      setDenunciasData(denunciasStats || []);
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el backend.");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---

  const handleFilterChange = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectMunicipio = (id) => {
    setFiltros(prev => ({ ...prev, municipioId: id, comunidadId: '' }));
    fetchEstadisticas(filtros.fechaInicio, filtros.fechaFin, id, '');
  };

  const handleSelectComunidad = (id) => {
    setFiltros(prev => ({ ...prev, comunidadId: id }));
    fetchEstadisticas(filtros.fechaInicio, filtros.fechaFin, filtros.municipioId, id);
  };

  const handleUpdate = () => {
    fetchEstadisticas(filtros.fechaInicio, filtros.fechaFin, filtros.municipioId, filtros.comunidadId);
  };

  const toggleDropdown = (name, ref) => {
    const newDropdownState = { municipio: false, comunidad: false, [name]: !dropdowns[name] };
    setDropdowns(newDropdownState);
    if (newDropdownState[name] && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX
      });
    }
  };

  const handleEstadisticasAvanzadas = () => {
    navigate("/estadisticas-avanzadas");
  };

  // --- DATOS Y VISTAS ---

  const tooltips = {
    viviendasRegistradas: "Número total de viviendas que han sido registradas en el sistema.",
    habitantesProtegidos: "Cantidad estimada de personas que viven en las viviendas tratadas o evaluadas.",
    viviendasEvaluadas: "Número de viviendas que han sido inspeccionadas por técnicos.",
    viviendasPositivas: "Viviendas donde se encontraron vinchucas durante la evaluación.",
    tasaInfestacion: "Porcentaje de viviendas evaluadas que resultaron positivas (Positivas / Evaluadas).",
    ejemplaresCapturados: "Total de vinchucas (ninfas y adultas) encontradas en las evaluaciones.",
    viviendasRociadas: "Número de viviendas que han sido rociadas con insecticida.",
    coberturaRociado: "Porcentaje de viviendas rociadas respecto al total de viviendas evaluadas o programadas.",
    totalInsecticida: "Cantidad total de insecticida utilizado en litros.",
    habitacionesNoRociadas: "Número de habitaciones que no pudieron ser rociadas por diversas razones.",
    denunciasVinchucas: "Número de denuncias realizadas por la población sobre presencia de vinchucas."
  };

  const estadisticasItems = estadisticas ? [
    {
      label: "Viviendas registradas:",
      value: estadisticas.viviendasRegistradas || 0,
      icon: "mdi:home-group",
      tooltip: tooltips.viviendasRegistradas
    },
    {
      label: "Habitantes protegidos:",
      value: estadisticas.habitantesProtegidos || 0,
      icon: "mdi:account-group",
      tooltip: tooltips.habitantesProtegidos
    },
    {
      label: "Total insecticida aplicado:",
      value: `${estadisticas.totalInsecticida || 0} L`,
      icon: "mdi:bucket-outline",
      tooltip: tooltips.totalInsecticida
    },
    {
      label: "Habitaciones no rociadas:",
      value: estadisticas.habitacionesNoRociadas || 0,
      icon: "mdi:door-closed-lock",
      tooltip: tooltips.habitacionesNoRociadas
    },
    {
      label: "Denuncias vinchucas:",
      value: estadisticas.denunciasVinchucas || 0,
      icon: "mdi:alert-decagram",
      tooltip: tooltips.denunciasVinchucas
    }
  ] : [];

  const nombreMunicipioActual = getNombreById(municipios.map(m => ({ id: m.municipio_id.toString(), nombre: m.nombre_municipio })), filtros.municipioId);
  const nombreComunidadActual = getNombreById(comunidades, filtros.comunidadId);

  const showAdvancedButton = hasRole(["tecnico", "administrador", "jefe_grupo"]);

  // --- RENDERIZADO ---
  return (
    <div className="estadisticas-container">
      <div className="estadisticas-header">
        <div>
          <h1>📊 ESTADÍSTICAS DE VIGILANCIA</h1>
        </div>

        {/* Filtros */}
        <div className="filtros-container">
          {/* Selector de Municipio */}
          <div className="municipio-selector" style={{ position: 'relative' }}>
            <button
              type="button"
              ref={municipioButtonRef}
              className={`filtro-button municipio-button ${filtros.municipioId ? 'municipio-selected' : ''}`}
              onClick={() => toggleDropdown('municipio', municipioButtonRef)}
              disabled={usuario?.rol === 'supervisor' && municipios.length === 1}
              style={{
                opacity: usuario?.rol === 'supervisor' && municipios.length === 1 ? 0.7 : 1,
                cursor: usuario?.rol === 'supervisor' && municipios.length === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              {filtros.municipioId ? `🏛️ ${nombreMunicipioActual}` : '🌍 Todos los municipios'}
              {!(usuario?.rol === 'supervisor' && municipios.length === 1) && <span className="dropdown-arrow">▼</span>}
            </button>

            <GenericDropdown
              isOpen={dropdowns.municipio}
              position={dropdownPosition}
              items={municipios.map(m => ({ id: m.municipio_id.toString(), nombre: m.nombre_municipio }))}
              onSelect={handleSelectMunicipio}
              onClose={() => setDropdowns(prev => ({ ...prev, municipio: false }))}
              defaultLabel="Todos los municipios"
              defaultIcon="🌍"
              itemIcon="🏛️"
              accentColor="#dc3545"
            />
          </div>

          {/* Selector de Comunidad */}
          <div className="comunidad-selector" style={{ position: 'relative' }}>
            <button
              type="button"
              ref={comunidadButtonRef}
              className={`filtro-button comunidad-button ${filtros.comunidadId ? 'comunidad-selected' : ''}`}
              onClick={() => toggleDropdown('comunidad', comunidadButtonRef)}
              disabled={!filtros.municipioId}
            >
              {!filtros.municipioId ? '🏘️ Seleccione municipio' : filtros.comunidadId ? `🏘️ ${nombreComunidadActual}` : '🏘️ Todas las comunidades'}
              <span className="dropdown-arrow">▼</span>
            </button>
            <GenericDropdown
              isOpen={dropdowns.comunidad}
              position={dropdownPosition}
              items={comunidades}
              onSelect={handleSelectComunidad}
              onClose={() => setDropdowns(prev => ({ ...prev, comunidad: false }))}
              defaultLabel="Todas las comunidades"
              defaultIcon="🏘️"
              itemIcon="🏘️"
              accentColor="#2ecc71"
            />
          </div>

          {/* Filtros de Fecha */}
          <input type="date" className="filtro-button fecha-input" value={filtros.fechaInicio} onChange={(e) => handleFilterChange('fechaInicio', e.target.value)} />
          <input type="date" className="filtro-button fecha-input" value={filtros.fechaFin} onChange={(e) => handleFilterChange('fechaFin', e.target.value)} />

          <button onClick={handleUpdate} className="filtro-button actualizar-button" disabled={loading}>
            {loading ? '⏳' : '🔄'} Actualizar
          </button>
        </div>
      </div>

      {/* Botón de estadísticas avanzadas */}
      {showAdvancedButton && (
        <div className="advanced-stats-button-container">
          <button className="advanced-stats-button" onClick={handleEstadisticasAvanzadas} title="Ir a Estadísticas Avanzadas">
            <Icon icon="mdi:chart-box" className="button-icon" />
            Ir a Estadísticas Avanzadas
          </button>
        </div>
      )}

      <main className="estadisticas-main">
        {loading ? (
          <div className="loading-container">
            <Icon icon="eos-icons:loading" className="loading-icon" />
            <p>Cargando estadísticas...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <KeyMetrics estadisticas={estadisticas} tooltips={tooltips} />

            <EstadisticasCard
              title="Otras Métricas Operacionales"
              items={estadisticasItems.map(item => ({
                ...item,
                label: (
                  <span className="card-item-label">
                    <Icon icon={item.icon} className="item-icon" />
                    {item.label}
                    <InfoTooltip text={item.tooltip} />
                  </span>
                )
              }))}
            />
            <GraficosEstadisticas
              estadisticas={estadisticas}
              evolucionData={evolucionData}
              denunciasData={denunciasData}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default Estadisticas;