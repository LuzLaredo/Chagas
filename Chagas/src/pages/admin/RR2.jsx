import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { useRouteAccess } from "../AuthContext"; // Importa el hook de verificación de rutas
import SinAcceso from "../SinAcceso"; // Ajusta la ruta según tu estructura
import NavBar from "../NavBar";
import "../../css/RR2.css";
import { baseUrl } from "../../api/BaseUrl"; 

function RR2() {
  const { user } = useAuth();
  
  // Verificar acceso usando el hook de rutas - SOLO PARA ROLES ESPECÍFICOS
  const { hasAccess, isLoading: accessLoading } = useRouteAccess([ "jefe_grupo", "administrador"]);

  const [estadisticas, setEstadisticas] = useState([]);
  const [totales, setTotales] = useState({});
  const [catalogos, setCatalogos] = useState({
    municipios: [],
    redesSalud: [],
    establecimientos: []
  });
  const [filtros, setFiltros] = useState({
    municipio: "",
    mes: new Date().getMonth() + 1,
    año: new Date().getFullYear()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL ||  `${baseUrl}/api`;


  
  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // Cargar estadísticas automáticamente cuando cambien los filtros
  useEffect(() => {
    cargarEstadisticas();
  }, [filtros.municipio, filtros.mes, filtros.año]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      await cargarCatalogos();
      await cargarEstadisticas();
    } catch (error) {
      console.error("Error inicial:", error);
      setError("Error al cargar datos iniciales");
    } finally {
      setLoading(false);
    }
  };

  const cargarCatalogos = async () => {
    try {
      console.log("📋 Cargando catálogos...");
      const response = await fetch(`${API_URL}/rr2/catalogos`);
      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
      const catalogosData = await response.json();
      setCatalogos(catalogosData);
      console.log("✅ Catálogos cargados:", catalogosData.municipios?.length || 0, "municipios");
    } catch (error) {
      console.error("Error al obtener catalogos:", error);
      setError("Error al cargar los catalogos");
    }
  };

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filtros.municipio) params.append('municipio', filtros.municipio);
      if (filtros.mes) params.append('mes', filtros.mes);
      if (filtros.año) params.append('año', filtros.año);

      const url = `${API_URL}/rr2?${params}`;
      console.log("🔍 Solicitando datos RR2:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      
      console.log("✅ Datos RR2 recibidos:", {
        estadisticas: responseData.estadisticas?.length || 0,
        totales: responseData.totales
      });
      
      setEstadisticas(responseData.estadisticas || []);
      setTotales(responseData.totales || {});
      
    } catch (error) {
      console.error("❌ Error al obtener datos RR2:", error);
      setError(`No se pudieron cargar las estadísticas: ${error.message}`);
      setEstadisticas([]);
      setTotales({});
    } finally {
      setLoading(false);
    }
  };

  // Función para calcular totales desde las estadísticas
  const calcularTotalesDesdeEstadisticas = (estadisticas) => {
    return estadisticas.reduce((acc, item) => ({
      viviendas_existentes: acc.viviendas_existentes + (parseInt(item.viviendas_existentes) || 0),
      viviendas_rociadas: acc.viviendas_rociadas + (parseInt(item.viviendas_rociadas) || 0),
      viviendas_no_rociadas: acc.viviendas_no_rociadas + (parseInt(item.viviendas_no_rociadas) || 0),
      viviendas_cerradas: acc.viviendas_cerradas + (parseInt(item.viviendas_cerradas) || 0),
      viviendas_renuentes: acc.viviendas_renuentes + (parseInt(item.viviendas_renuentes) || 0),
      habitaciones_rociadas: acc.habitaciones_rociadas + (parseInt(item.habitaciones_rociadas) || 0),
      habitaciones_no_rociadas: acc.habitaciones_no_rociadas + (parseInt(item.habitaciones_no_rociadas) || 0),
      total_registros: acc.total_registros + (parseInt(item.total_registros) || 0),
      total_cargas: acc.total_cargas + (parseInt(item.total_cargas) || 0),
      total_litros_kg: parseFloat((acc.total_litros_kg + (parseFloat(item.total_litros_kg) || 0)).toFixed(2)),
      dosis: acc.dosis + (parseFloat(item.dosis) || 0),
      corrales: acc.corrales + (parseInt(item.corrales) || 0),
      gallineros: acc.gallineros + (parseInt(item.gallineros) || 0),
      conejeras: acc.conejeras + (parseInt(item.conejeras) || 0),
      zarzos_trojes: acc.zarzos_trojes + (parseInt(item.zarzos_trojes) || 0),
      otros: acc.otros + (parseInt(item.otros) || 0),
      total_rociadores: acc.total_rociadores + (parseInt(item.total_rociadores) || 0)
    }), {
      viviendas_existentes: 0,
      viviendas_rociadas: 0,
      viviendas_no_rociadas: 0,
      viviendas_cerradas: 0,
      viviendas_renuentes: 0,
      habitaciones_rociadas: 0,
      habitaciones_no_rociadas: 0,
      total_registros: 0,
      total_cargas: 0,
      total_litros_kg: 0,
      dosis: 0,
      corrales: 0,
      gallineros: 0,
      conejeras: 0,
      zarzos_trojes: 0,
      otros: 0,
      total_rociadores: 0
    });
  };

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

  // Función segura para formatear números
  const formatearNumero = (valor) => {
    if (valor === null || valor === undefined) return '0.00';
    const num = parseFloat(valor);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Calcular totales desde las estadísticas actuales
  const totalesCalculados = estadisticas.length > 0 ? calcularTotalesDesdeEstadisticas(estadisticas) : null;

  // Usar totales del backend si están disponibles, de lo contrario usar los calculados
  const totalesParaMostrar = totales && Object.keys(totales).length > 0 ? totales : totalesCalculados;

  // CONDICIONALES DE ACCESO MOVIDOS DESPUÉS DE TODOS LOS HOOKS
  if (accessLoading) {
    return (
      <div className="rr2-page">
        <NavBar />
        <div className="rr2-container">
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
      <div className="rr2-page">
        <NavBar />
        <div className="rr2-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando datos estadísticos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rr2-page">
      <NavBar />
      <div className="rr2-container">
        <div className="rr2-header">
          <div>
            <h2 className="rr2-title">RR2-CH-MA — Consolidado Mensual de Rociado Residual</h2>
            <p className="rr2-subtitle">Dashboard de Estadísticas</p>
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
        {totalesParaMostrar && (
          <div className="section">
            <h3>Resumen General</h3>
            <div className="resumen-cards">
              <div className="resumen-card success">
                <div className="resumen-icon">🏠</div>
                <div className="resumen-content">
                  <h3>{totalesParaMostrar.viviendas_existentes?.toLocaleString() || 0}</h3>
                  <p>Viviendas Existentes</p>
                </div>
              </div>
              <div className="resumen-card primary">
                <div className="resumen-icon">✅</div>
                <div className="resumen-content">
                  <h3>{totalesParaMostrar.viviendas_rociadas?.toLocaleString() || 0}</h3>
                  <p>Viviendas Rociadas</p>
                </div>
              </div>
              <div className="resumen-card warning">
                <div className="resumen-icon">🚫</div>
                <div className="resumen-content">
                  <h3>{totalesParaMostrar.viviendas_no_rociadas?.toLocaleString() || 0}</h3>
                  <p>Viviendas No Rociadas</p>
                </div>
              </div>
              <div className="resumen-card danger">
                <div className="resumen-icon">🔒</div>
                <div className="resumen-content">
                  <h3>{totalesParaMostrar.viviendas_cerradas?.toLocaleString() || 0}</h3>
                  <p>Viviendas Cerradas</p>
                </div>
              </div>
              <div className="resumen-card danger">
                <div className="resumen-icon">⏸️</div>
                <div className="resumen-content">
                  <h3>{totalesParaMostrar.viviendas_renuentes?.toLocaleString() || 0}</h3>
                  <p>Viviendas Renuentes</p>
                </div>
              </div>
            </div>
            
            {/* Totales adicionales */}
            <div className="totales-adicionales">
              <div className="total-item">
                <span className="total-label">Habitaciones Rociadas:</span>
                <span className="total-value success">{totalesParaMostrar.habitaciones_rociadas || 0}</span>
              </div>
              <div className="total-item">
                <span className="total-label">Habitaciones No Rociadas:</span>
                <span className="total-value warning">{totalesParaMostrar.habitaciones_no_rociadas || 0}</span>
              </div>
              <div className="total-item">
                <span className="total-label">Total Cargas:</span>
                <span className="total-value">{totalesParaMostrar.total_cargas || 0}</span>
              </div>
              <div className="total-item">
                <span className="total-label">Total Litros (Kg):</span>
                <span className="total-value">{formatearNumero(totalesParaMostrar.total_litros_kg)}</span>
              </div>
              <div className="total-item">
                <span className="total-label">Dosis Total:</span>
                <span className="total-value">{formatearNumero(totalesParaMostrar.dosis)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Sección de Estadísticas Detalladas */}
        <div className="section">
          <div className="section-header">
            <h3>Estadísticas por Comunidad</h3>
            <div className="section-actions">
              <span className="resultados-count">
                {estadisticas.length} comunidad(es) encontrada(s)
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
              <p>Cargando datos estadísticos...</p>
            </div>
          ) : estadisticas.length === 0 ? (
            <div className="no-data">
              <p>No hay datos de RR2 para el período seleccionado</p>
              <button onClick={limpiarFiltros} className="btn btn-actualizar">
                Ver todos los datos
              </button>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="rr2-table">
                  <thead>
                    <tr>
                      <th>Comunidad</th>
                      <th>Inicio</th>
                      <th>Final</th>
                      <th>Registros</th>
                      <th>Población</th>
                      {/* NUEVAS COLUMNAS DE VIVIENDAS */}
                      <th>V. Existentes</th>
                      <th>V. Rociadas</th>
                      <th>V. No Rociadas</th>
                      <th>V. Cerradas</th>
                      <th>V. Renuentes</th>
                      {/* FIN NUEVAS COLUMNAS */}
                      <th>Hab. Rociadas</th>
                      <th>Hab. No Rociadas</th>
                      <th>Corrales</th>
                      <th>Gallineros</th>
                      <th>Conejeras</th>
                      <th>Zarzos/Trojes</th>
                      <th>Otros</th>
                      <th>Dosis</th>
                      <th>Total Cargas</th>
                      <th>Total Kg</th>
                      <th>Rociadores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estadisticas.map((item, idx) => (
                      <tr key={idx}>
                        <td className="comunidad-cell">{item.comunidad || 'N/A'}</td>
                        <td>{formatearFecha(item.fecha_inicio)}</td>
                        <td>{formatearFecha(item.fecha_final)}</td>
                        <td className="numero-cell">{item.total_registros || 0}</td>
                        <td className="numero-cell">{item.poblacion_protegida || 0}</td>
                        
                        {/* NUEVAS CELDAS DE VIVIENDAS */}
                        <td className="numero-cell total-cell">{item.viviendas_existentes || 0}</td>
                        <td className="numero-cell success-cell">{item.viviendas_rociadas || 0}</td>
                        <td className="numero-cell warning-cell">{item.viviendas_no_rociadas || 0}</td>
                        <td className="numero-cell danger-cell">{item.viviendas_cerradas || 0}</td>
                        <td className="numero-cell danger-cell">{item.viviendas_renuentes || 0}</td>
                        {/* FIN NUEVAS CELDAS */}
                        
                        <td className="numero-cell">{item.habitaciones_rociadas || 0}</td>
                        <td className="numero-cell">{item.habitaciones_no_rociadas || 0}</td>
                        <td className="numero-cell">{item.corrales || 0}</td>
                        <td className="numero-cell">{item.gallineros || 0}</td>
                        <td className="numero-cell">{item.conejeras || 0}</td>
                        <td className="numero-cell">{item.zarzos_trojes || 0}</td>
                        <td className="numero-cell">{item.otros || 0}</td>
                        <td className="numero-cell">{formatearNumero(item.dosis)}</td>
                        <td className="numero-cell">{item.total_cargas || 0}</td>
                        <td className="numero-cell">{formatearNumero(item.total_litros_kg)}</td>
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

export default RR2;