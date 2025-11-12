import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../AuthContext";
import { useRouteAccess } from "../AuthContext"; // Importa el hook de verificación de rutas
import SinAcceso from "../SinAcceso"; // Ajusta la ruta según tu estructura
import NavBar from "../NavBar";
import "../../css/RR3.css";
import { baseUrl } from "../../api/BaseUrl"; 

function RR3() {
  const { user } = useAuth();
  
  // Verificar acceso usando el hook de rutas - SOLO PARA ROLES ESPECÍFICOS
  const { hasAccess, isLoading: accessLoading } = useRouteAccess([ "jefe_grupo", "administrador"]);

  const [estadisticas, setEstadisticas] = useState([]);
  const [totales, setTotales] = useState({});
  const [catalogos, setCatalogos] = useState({
    municipios: []
  });
  const [filtros, setFiltros] = useState({
    municipio: "",
    mes: new Date().getMonth() + 1,
    año: new Date().getFullYear()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);


  
  const API_URL = import.meta.env.VITE_API_URL ||  `${baseUrl}/api`;

  // Cargar catálogos al montar el componente
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        console.log("📋 Cargando catálogos RR3...");
        setError(null);
        
        const response = await fetch(`${API_URL}/rr3/catalogos`);
        
        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }
        
        const catalogosData = await response.json();
        setCatalogos(catalogosData);
        console.log("✅ Catálogos RR3 cargados:", catalogosData.municipios?.length || 0, "municipios");
      } catch (error) {
        console.error("❌ Error al obtener catalogos RR3:", error);
        setError(`Error de conexión: ${error.message}. Verifica que el backend esté ejecutándose.`);
      }
    };

    cargarCatalogos();
  }, [API_URL]);

  // Cargar estadísticas RR3
  const cargarEstadisticas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filtros.municipio) params.append('municipio', filtros.municipio);
      if (filtros.mes) params.append('mes', filtros.mes);
      if (filtros.año) params.append('año', filtros.año);

      const url = `${API_URL}/rr3?${params}`;
      console.log("🔍 Solicitando datos RR3:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      console.log("✅ Datos RR3 recibidos:", {
        estadisticas: responseData.estadisticas?.length || 0,
        totales: responseData.totales
      });
      
      setEstadisticas(responseData.estadisticas || []);
      setTotales(responseData.totales || {});
      setInitialLoad(false);
      
    } catch (error) {
      console.error("❌ Error al obtener datos RR3:", error);
      setError(`Error de conexión: ${error.message}. Asegúrate de que el backend esté ejecutándose en ${baseUrl}`);
      setEstadisticas([]);
      setTotales({});
      setInitialLoad(false);
    } finally {
      setLoading(false);
    }
  }, [filtros.municipio, filtros.mes, filtros.año, API_URL]);

  // Cargar estadísticas cuando cambien los filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      cargarEstadisticas();
    }, 300);

    return () => clearTimeout(timer);
  }, [cargarEstadisticas]);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      municipio: "",
      mes: new Date().getMonth() + 1,
      año: new Date().getFullYear()
    });
  };

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES');
    } catch (error) {
      return 'N/A';
    }
  };

  const formatearNumero = (valor) => {
    if (valor === null || valor === undefined) return '0.00';
    const num = parseFloat(valor);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // CONDICIONALES DE ACCESO MOVIDOS DESPUÉS DE TODOS LOS HOOKS
  if (accessLoading) {
    return (
      <div className="rr3-page">
        <NavBar />
        <div className="rr3-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Verificando acceso...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <SinAcceso />;
  }

  // Mostrar loading solo al inicio
  if (loading && estadisticas.length === 0 && catalogos.municipios.length === 0) {
    return (
      <div className="rr3-page">
        <NavBar />
        <div className="rr3-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando estadísticas por municipio...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rr3-page">
      <NavBar />
      <div className="rr3-container">
        <div className="rr3-header">
          <div>
            <h2 className="rr3-title">RR3-CH-MA — Estadísticas de Rociado por Municipio</h2>
            <p className="rr3-subtitle">Consolidado mensual basado en formularios RR1</p>
          </div>
          <div className="periodo-info">
            <span className="periodo-badge">{meses[filtros.mes - 1]} {filtros.año}</span>
          </div>
        </div>

        {/* Sección de Filtros */}
        <div className="section">
          <h3>Filtros de Búsqueda</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Municipio</label>
              <select name="municipio" value={filtros.municipio} onChange={handleFiltroChange}>
                <option value="">Todos los municipios</option>
                {catalogos.municipios.map(mun => (
                  <option key={mun.municipio_id} value={mun.municipio_id}>{mun.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Mes</label>
              <select name="mes" value={filtros.mes} onChange={handleFiltroChange}>
                {meses.map((mes, index) => (
                  <option key={index + 1} value={index + 1}>{mes}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Año</label>
              <input 
                type="number" 
                name="año" 
                value={filtros.año} 
                onChange={handleFiltroChange}
                min="2020" 
                max="2030" 
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-limpiar" onClick={limpiarFiltros}>
              Limpiar Filtros
            </button>
            <div className="loading-indicator">
              {loading && <span>Actualizando datos...</span>}
            </div>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Sección de Resumen General */}
        {totales && Object.keys(totales).length > 0 && (
          <div className="section">
            <h3>Resumen General</h3>
            <div className="resumen-cards">
              <div className="resumen-card success">
                <div className="resumen-icon">🏠</div>
                <div className="resumen-content">
                  <h3>{totales.viviendas_existentes?.toLocaleString() || 0}</h3>
                  <p>Viviendas Existentes</p>
                </div>
              </div>
              <div className="resumen-card primary">
                <div className="resumen-icon">✅</div>
                <div className="resumen-content">
                  <h3>{totales.viviendas_rociadas?.toLocaleString() || 0}</h3>
                  <p>Viviendas Rociadas</p>
                </div>
              </div>
              <div className="resumen-card warning">
                <div className="resumen-icon">📊</div>
                <div className="resumen-content">
                  <h3>{totales.progreso_viviendas || 0}%</h3>
                  <p>Progreso de Rociado</p>
                </div>
              </div>
              <div className="resumen-card danger">
                <div className="resumen-icon">🚫</div>
                <div className="resumen-content">
                  <h3>{totales.viviendas_no_rociadas?.toLocaleString() || 0}</h3>
                  <p>Viviendas No Rociadas</p>
                </div>
              </div>
              <div className="resumen-card info">
                <div className="resumen-icon">👥</div>
                <div className="resumen-content">
                  <h3>{totales.poblacion_protegida?.toLocaleString() || 0}</h3>
                  <p>Población Protegida</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección de Estadísticas Detalladas por Municipio */}
        <div className="section">
          <div className="section-header">
            <h3>Estadísticas por Municipio</h3>
            <div className="section-actions">
              <span className="resultados-count">
                {estadisticas.length} municipio(s) encontrado(s)
              </span>
              <button 
                onClick={cargarEstadisticas}
                className="btn btn-actualizar"
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Actualizar'}
              </button>
            </div>
          </div>
          
          {loading && estadisticas.length === 0 ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando estadísticas por municipio...</p>
            </div>
          ) : estadisticas.length === 0 ? (
            <div className="no-data">
              <p>No hay datos de RR3 para el período seleccionado</p>
              <button onClick={limpiarFiltros} className="btn btn-actualizar">
                Ver todos los datos
              </button>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="rr3-table">
                  <thead>
                    <tr>
                      <th rowSpan="2">Municipio</th>
                      <th rowSpan="2">Inicio</th>
                      <th rowSpan="2">Final</th>
                      <th rowSpan="2">Registros</th>
                      <th rowSpan="2">Población</th>
                      
                      {/* VIVIENDAS */}
                      <th colSpan="6" className="section-header">Viviendas</th>
                      
                      {/* HABITACIONES */}
                      <th colSpan="2" className="section-header">Habitaciones</th>
                      
                      {/* PERIDOMICILIO */}
                      <th colSpan="5" className="section-header">Peridomicilio</th>
                      
                      {/* INSECTICIDAS */}
                      <th colSpan="9" className="section-header">Insecticidas Utilizados</th>
                      
                      <th rowSpan="2">Rociadores</th>
                    </tr>
                    <tr>
                      {/* Subcolumnas de Viviendas */}
                      <th>Existentes</th>
                      <th>Rociadas</th>
                      <th>No Rociadas</th>
                      <th>Progreso</th>
                      <th>Cerradas</th>
                      <th>Renuentes</th>
                      
                      {/* Subcolumnas de Habitaciones */}
                      <th>Rociadas</th>
                      <th>No Rociadas</th>
                      
                      {/* Subcolumnas de Peridomicilio */}
                      <th>Corrales</th>
                      <th>Gallineros</th>
                      <th>Conejeras</th>
                      <th>Zarzos/Trojes</th>
                      <th>Otros</th>
                      
                      {/* Subcolumnas de Insecticidas */}
                      <th>Alfa Dosis</th>
                      <th>Alfa Cargas</th>
                      <th>Alfa Lts</th>
                      <th>Bendio Dosis</th>
                      <th>Bendio Cargas</th>
                      <th>Bendio Lts</th>
                      <th>Lambda Dosis</th>
                      <th>Lambda Cargas</th>
                      <th>Lambda Lts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estadisticas.map((item, idx) => (
                      <tr key={idx}>
                        <td className="municipio-cell">{item.municipio || 'N/A'}</td>
                        <td>{formatearFecha(item.fecha_inicio)}</td>
                        <td>{formatearFecha(item.fecha_final)}</td>
                        <td className="numero-cell">{item.total_registros || 0}</td>
                        <td className="numero-cell">{item.poblacion_protegida || 0}</td>
                        
                        {/* VIVIENDAS */}
                        <td className="numero-cell total-cell">{item.viviendas_existentes || 0}</td>
                        <td className="numero-cell success-cell">{item.viviendas_rociadas || 0}</td>
                        <td className="numero-cell warning-cell">{item.viviendas_no_rociadas || 0}</td>
                        <td className="numero-cell progress-cell">
                          <div className="progress-container">
                            <span className="progress-text">{item.progreso_viviendas || 0}%</span>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ width: `${item.progreso_viviendas || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="numero-cell danger-cell">{item.viviendas_cerradas || 0}</td>
                        <td className="numero-cell danger-cell">{item.viviendas_renuentes || 0}</td>
                        
                        {/* HABITACIONES */}
                        <td className="numero-cell">{item.habitaciones_rociadas || 0}</td>
                        <td className="numero-cell">{item.habitaciones_no_rociadas || 0}</td>
                        
                        {/* PERIDOMICILIO */}
                        <td className="numero-cell">{item.corrales || 0}</td>
                        <td className="numero-cell">{item.gallineros || 0}</td>
                        <td className="numero-cell">{item.conejeras || 0}</td>
                        <td className="numero-cell">{item.zarzos_trojes || 0}</td>
                        <td className="numero-cell">{item.otros || 0}</td>
                        
                        {/* INSECTICIDAS */}
                        <td className="numero-cell">{formatearNumero(item.dosis_alfacipermetrina)}</td>
                        <td className="numero-cell">{item.cargas_alfacipermetrina || 0}</td>
                        <td className="numero-cell">{formatearNumero(item.litros_alfacipermetrina)}</td>
                        
                        <td className="numero-cell">{formatearNumero(item.dosis_bendiocarb)}</td>
                        <td className="numero-cell">{item.cargas_bendiocarb || 0}</td>
                        <td className="numero-cell">{formatearNumero(item.litros_bendiocarb)}</td>
                        
                        <td className="numero-cell">{formatearNumero(item.dosis_lambdacialotrina)}</td>
                        <td className="numero-cell">{item.cargas_lambdacialotrina || 0}</td>
                        <td className="numero-cell">{formatearNumero(item.litros_lambdacialotrina)}</td>
                        
                        <td className="rociadores-cell">
                          {item.rociadores && item.rociadores !== 'Sin nombre' ? (
                            <span className="rociadores-text" title={item.rociadores}>
                              {item.rociadores.split(',').slice(0, 2).join(', ')}
                              {item.rociadores.split(',').length > 2 && '...'}
                            </span>
                          ) : (
                            <span className="no-especificado">No especificado</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RR3;