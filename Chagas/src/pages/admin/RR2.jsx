import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../AuthContext";
import { useRouteAccess } from "../AuthContext";
import SinAcceso from "../SinAcceso";
import NavBar from "../NavBar";
import "../../css/RR2.css";
import { baseUrl } from "../../api/BaseUrl";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FaChevronDown, FaCheck } from 'react-icons/fa';
// Alternativa: Si tienes la imagen importada en tu componente
import LogoChagas from "../../assets/images/LOGOCHAGAS.png";

// En la función generarPDF, usar

function RR2() {
  const { user } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useRouteAccess(["jefe_grupo", "administrador", "supervisor"]);

  const pdfRef = useRef();

  const [estadisticas, setEstadisticas] = useState([]);
  const [totales, setTotales] = useState({});
  const [catalogos, setCatalogos] = useState({
    municipios: [],
    redesSalud: [],
    establecimientos: []
  });
  const [filtros, setFiltros] = useState({
    municipio: [], // 🆕 CAMBIO: Array para múltiple selección
    mes: new Date().getMonth() + 1,
    año: new Date().getFullYear()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // 🆕 Estado para el dropdown personalizado
  const [showMuniDropdown, setShowMuniDropdown] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || `${baseUrl}/api`;

  // 🆕 Handlers para selección múltiple
  const toggleMunicipio = (id) => {
    setFiltros(prev => {
      const current = prev.municipio;
      if (current.includes(id)) {
        return { ...prev, municipio: current.filter(m => m !== id) };
      } else {
        return { ...prev, municipio: [...current, id] };
      }
    });
  };

  const toggleAllMunicipios = () => {
    setFiltros(prev => ({ ...prev, municipio: [] })); // Vacío = Todos
    setShowMuniDropdown(false);
  };

  // 🔄 POLLING: Actualizar automáticamente cada 30 segundos
  useEffect(() => {
    const intervalo = setInterval(() => {
      if (!loading) {
        console.log("🔄 Actualización automática de datos RR2");
        cargarEstadisticas();
      }
    }, 30000);

    return () => clearInterval(intervalo);
  }, [loading, filtros]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // Cargar estadísticas cuando cambien los filtros
  useEffect(() => {
    cargarEstadisticas();
  }, [filtros.municipio.join(','), filtros.mes, filtros.año]); // Dependencia stringificada para evitar loops

  // 🆕 EFECTO: Auto-seleccionar municipio si es supervisor con asignación única
  useEffect(() => {
    if (user?.rol === 'supervisor' && catalogos.municipios.length === 1 && filtros.municipio.length === 0) {
      console.log("🔒 Supervisor: Auto-seleccionando municipio único:", catalogos.municipios[0].municipio_id);
      setFiltros(prev => ({
        ...prev,
        municipio: [catalogos.municipios[0].municipio_id] // Array con 1 ID
      }));
    }
  }, [user, catalogos.municipios, filtros.municipio]);

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

      const token = localStorage.getItem('token');
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};

      // Usar SIEMPRE el endpoint centralizado que ya maneja la lógica de roles en el backend
      const response = await fetch(`${API_URL}/rr2/catalogos`, { headers });

      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

      const catalogosData = await response.json();

      // Asegurar que la data tenga el formato esperado
      const municipiosList = catalogosData.municipios || [];

      setCatalogos({
        municipios: municipiosList,
        redesSalud: catalogosData.redesSalud || [],
        establecimientos: catalogosData.establecimientos || []
      });

      console.log("✅ Catálogos cargados:", municipiosList.length, "municipios");

    } catch (error) {
      console.error("Error al obtener catalogos:", error);
      setError("Error al cargar los catalogos (Backend)");
    }
  };

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      // 🆕 Enviar string separado por comas si hay seleccionados
      if (filtros.municipio.length > 0) {
        params.append('municipio', filtros.municipio.join(','));
      }
      if (filtros.mes) params.append('mes', filtros.mes);
      if (filtros.año) params.append('año', filtros.año);
      params.append('_t', Date.now());

      const url = `${API_URL}/rr2?${params}`;
      console.log("🔍 Solicitando datos RR2:", url);

      const token = localStorage.getItem('token');
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};

      const response = await fetch(url, { headers });

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
        totales: responseData.totales,
        timestamp: new Date().toLocaleTimeString()
      });

      setEstadisticas(responseData.estadisticas || []);
      setTotales(responseData.totales || {});
      setUltimaActualizacion(new Date());

    } catch (error) {
      console.error("❌ Error al obtener datos RR2:", error);
      setError(`No se pudieron cargar las estadísticas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para generar PDF
  const generarPDF = async () => {
    try {
      setLoading(true);

      const tableElement = document.querySelector('.rr2-table');

      if (!tableElement) {
        throw new Error("No se encontró la tabla de estadísticas");
      }

      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1600px';
      tempContainer.style.background = '#ffffff'; // Forzar blanco
      tempContainer.style.backgroundColor = '#ffffff'; // Redundancia para asegurar
      tempContainer.style.padding = '30px';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.color = '#000000'; // Texto negro por defecto

      // 🔹 AGREGAR EL LOGOTIPO EN LA ESQUINA SUPERIOR IZQUIERDA
      const logoContainer = document.createElement('div');
      logoContainer.style.position = 'absolute';
      logoContainer.style.top = '10px';
      logoContainer.style.left = '10px';
      logoContainer.style.width = '140px';
      logoContainer.style.height = '90px';
      logoContainer.style.zIndex = '10';

      // Crear imagen para el logo
      const logoImg = document.createElement('img');
      logoImg.src = LogoChagas; // Ruta del logo
      logoImg.style.width = '100%';
      logoImg.style.height = '100%';
      logoImg.style.objectFit = 'contain';

      logoContainer.appendChild(logoImg);
      tempContainer.appendChild(logoContainer);

      // Agregar encabezado con margen para el logo
      const header = document.createElement('div');
      header.style.textAlign = 'center';
      header.style.marginBottom = '30px';
      header.style.borderBottom = '3px solid #8B0000';
      header.style.paddingBottom = '15px';
      header.style.paddingLeft = '150px'; // Espacio para el logo
      header.style.paddingRight = '20px';
      header.style.paddingTop = '10px';
      header.style.backgroundColor = '#fff';

      header.innerHTML = `
      <h2 style="color: #8B0000; margin: 0 0 10px 0; font-size: 22px; font-weight: bold;">
        RR2-CH-MA — Consolidado Mensual de Rociado Residual
      </h2>
      <p style="margin: 8px 0; color: #333; font-size: 16px; font-weight: 600;">
        Estadísticas por Comunidad - ${meses[filtros.mes - 1]} ${filtros.año}
      </p>
      <p style="margin: 5px 0; color: #555; font-size: 14px;">
        Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}
      </p>
      ${filtros.municipio.length > 0 ? `
        <p style="margin: 5px 0; color: #666; font-size: 14px;">
          Municipio${filtros.municipio.length > 1 ? 's' : ''}: ${filtros.municipio.length <= 3
            ? catalogos.municipios.filter(m => filtros.municipio.includes(m.municipio_id)).map(m => m.nombre).join(", ")
            : `${filtros.municipio.length} seleccionados`
          }
        </p>
      ` : '<p style="margin: 5px 0; color: #666; font-size: 14px;">Municipio: Todos</p>'}
    `;
      tempContainer.appendChild(header);

      // Crear una nueva tabla estructurada correctamente
      const newTable = document.createElement('table');
      newTable.style.width = '100%';
      newTable.style.borderCollapse = 'collapse';
      newTable.style.fontSize = '10px'; // Aumentado de 8px
      newTable.style.marginTop = '15px';

      // Clonar y agregar el thead (encabezados)
      const theadClone = tableElement.querySelector('thead').cloneNode(true);
      newTable.appendChild(theadClone);

      // Clonar y agregar el tbody (datos)
      const tbodyClone = tableElement.querySelector('tbody').cloneNode(true);
      newTable.appendChild(tbodyClone);

      // Aplicar estilos al thead
      const thElements = newTable.querySelectorAll('th');
      thElements.forEach(th => {
        th.style.padding = '8px 4px'; // Aumentado padding
        th.style.fontSize = '9px'; // Aumentado de 7px
        th.style.background = '#8B0000';
        th.style.color = 'white';
        th.style.border = '1px solid #700000';
        th.style.textAlign = 'center';
        th.style.fontWeight = 'bold';
      });

      // Aplicar estilos al tbody
      const tdElements = newTable.querySelectorAll('td');
      tdElements.forEach(td => {
        td.style.padding = '6px 4px'; // Aumentado padding
        td.style.fontSize = '9px'; // Aumentado de 7px
        td.style.border = '1px solid #ddd';
        td.style.textAlign = 'center';
        td.style.color = '#000'; // Asegurar texto negro
      });

      // Aplicar estilos específicos a celdas especiales
      const successCells = newTable.querySelectorAll('.success-cell');
      successCells.forEach(cell => {
        cell.style.background = '#f0fff4';
        cell.style.color = '#28a745';
        cell.style.fontWeight = '600';
      });

      const warningCells = newTable.querySelectorAll('.warning-cell');
      warningCells.forEach(cell => {
        cell.style.background = '#fffaf0';
        cell.style.color = '#ffc107';
        cell.style.fontWeight = '600';
      });

      const dangerCells = newTable.querySelectorAll('.danger-cell');
      dangerCells.forEach(cell => {
        cell.style.background = '#fff5f5';
        cell.style.color = '#dc3545';
        cell.style.fontWeight = '600';
      });

      const totalCells = newTable.querySelectorAll('.total-cell');
      totalCells.forEach(cell => {
        cell.style.background = '#f0fff4';
        cell.style.color = '#2f855a';
        cell.style.fontWeight = '600';
      });

      tempContainer.appendChild(newTable);
      document.body.appendChild(tempContainer);

      const canvas = await html2canvas(tempContainer, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: tempContainer.scrollWidth,
        height: tempContainer.scrollHeight
      });

      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png');

      // Crear PDF en ORIENTACIÓN HORIZONTAL
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

      const fileName = `RR2_Estadisticas_Comunidades_${meses[filtros.mes - 1]}_${filtros.año}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error("Error al generar PDF:", error);
      setError("Error al generar el PDF. Intente nuevamente.");
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
      total_litros_ml: parseFloat((acc.total_litros_ml + (parseFloat(item.total_litros_ml) || 0)).toFixed(2)),
      total_litros_l: parseFloat((acc.total_litros_l + (parseFloat(item.total_litros_l) || 0)).toFixed(2)),
      total_litros_kg: parseFloat((acc.total_litros_kg + (parseFloat(item.total_litros_kg) || 0)).toFixed(2)),
      dosis_ml: parseFloat((acc.dosis_ml + (parseFloat(item.dosis_ml) || 0)).toFixed(2)),
      dosis_gr: parseFloat((acc.dosis_gr + (parseFloat(item.dosis_gr) || 0)).toFixed(2)),
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
      total_litros_ml: 0,
      total_litros_l: 0,
      total_litros_kg: 0,
      dosis_ml: 0,
      dosis_gr: 0,
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

    // CORRECCIÓN: Si es el filtro de municipio, asegurar que sea un array
    if (name === 'municipio') {
      setFiltros(prev => ({
        ...prev,
        municipio: value ? [value] : [] // Si hay valor, array con ese valor. Si es "" (Todos), array vacío.
      }));
      return;
    }

    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      municipio: [], // Reset a array vacío
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

  // 🆕 NUEVO: Función para convertir ml a litros
  const mlALitros = (ml) => {
    if (ml === null || ml === undefined) return '0.00';
    const litros = parseFloat(ml) / 1000;
    return isNaN(litros) ? '0.00' : litros.toFixed(2);
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
        {/* Contenido que se incluirá en el PDF */}
        <div ref={pdfRef} className="pdf-content">
          {/* Header para PDF */}
          <div className="pdf-header">
            <h2>RR2-CH-MA — Consolidado Mensual de Rociado Residual</h2>
            <p>Reporte de Estadísticas - {meses[filtros.mes - 1]} {filtros.año}</p>
            <p>Generado el: {new Date().toLocaleDateString('es-ES')} a las {new Date().toLocaleTimeString('es-ES')}</p>
            {filtros.municipio.length > 0 ? (
              <p>Municipios: {filtros.municipio.length <= 3
                ? catalogos.municipios.filter(m => filtros.municipio.includes(m.municipio_id)).map(m => m.nombre).join(", ")
                : `${filtros.municipio.length} seleccionados`
              }</p>
            ) : (
              <p>Municipio: Todos</p>
            )}
          </div>

          <div className="rr2-header">
            <div>
              <h2 className="rr2-title">RR2-CH-MA — Consolidado Mensual de Rociado Residual</h2>
              <p className="rr2-subtitle">Dashboard de Estadísticas</p>
            </div>
            <div className="periodo-info">
              <span className="periodo-badge">{meses[filtros.mes - 1]} {filtros.año}</span>
              {ultimaActualizacion && (
                <span className="actualizacion-badge">
                  Última actualización: {ultimaActualizacion.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* Sección de Filtros */}
          <div className="section no-print">
            <h3>Filtros de Búsqueda</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Municipio</label>
                <select
                  name="municipio"
                  value={filtros.municipio[0] || ''}
                  onChange={handleFiltroChange}
                  disabled={user?.rol === 'supervisor' && catalogos.municipios.length === 1}
                >
                  {user?.rol === 'supervisor' && catalogos.municipios.length === 1 ? (
                    catalogos.municipios.map(mun => (
                      <option key={mun.municipio_id} value={mun.municipio_id}>{mun.nombre}</option>
                    ))
                  ) : (
                    <>
                      <option value="">Todos los municipios</option>
                      {catalogos.municipios.map(mun => (
                        <option key={mun.municipio_id} value={mun.municipio_id}>{mun.nombre}</option>
                      ))}
                    </>
                  )}
                </select>
                {user?.rol === 'supervisor' && catalogos.municipios.length === 1 && (
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                    (Solo su municipio asignado)
                  </span>
                )}
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
                  <span className="total-label">Total L:</span>
                  <span className="total-value">{mlALitros(totalesParaMostrar.total_litros_ml)}</span>
                </div>
                <div className="total-item">
                  <span className="total-label">Total Kg:</span>
                  <span className="total-value">{formatearNumero(totalesParaMostrar.total_litros_kg)}</span>
                </div>
                <div className="total-item">
                  <span className="total-label">Dosis ml:</span>
                  <span className="total-value">{formatearNumero(totalesParaMostrar.dosis_ml)}</span>
                </div>
                <div className="total-item">
                  <span className="total-label">Dosis gr:</span>
                  <span className="total-value">{formatearNumero(totalesParaMostrar.dosis_gr)}</span>
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
                <div className="action-buttons">
                  <button
                    onClick={generarPDF}
                    className="btn btn-descargar"
                    disabled={loading || estadisticas.length === 0}
                  >
                    {loading ? 'Generando...' : 'Descargar PDF'}
                  </button>
                  <button
                    onClick={cargarEstadisticas}
                    className="btn btn-actualizar"
                    disabled={loading}
                  >
                    {loading ? 'Cargando...' : 'Actualizar'}
                  </button>
                </div>
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
                {/* Mensaje informativo sobre el scroll */}
                <div className="scroll-info">
                  💡 Desliza horizontalmente para ver todas las columnas
                </div>

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
                        {/* 🆕 NUEVAS COLUMNAS DE DOSIS */}
                        <th>Dosis ml</th>
                        <th>Dosis gr</th>
                        {/* 🆕 NUEVAS COLUMNAS DE TOTAL CARGAS */}
                        <th>Total Cargas ml</th>
                        <th>Total Cargas gr</th>
                        {/* 🆕 NUEVAS COLUMNAS DE TOTALES */}
                        <th>Total Kg</th>
                        <th>Total L</th> {/* 🆕 CAMBIO: Total ml → Total L */}
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

                          {/* 🆕 NUEVAS CELDAS DE DOSIS */}
                          <td className="numero-cell">{formatearNumero(item.dosis_ml)}</td>
                          <td className="numero-cell">{formatearNumero(item.dosis_gr)}</td>

                          {/* 🆕 NUEVAS CELDAS DE TOTAL CARGAS */}
                          <td className="numero-cell">{formatearNumero(item.total_cargas_ml)}</td>
                          <td className="numero-cell">{formatearNumero(item.total_cargas_gr)}</td>

                          {/* 🆕 NUEVAS CELDAS DE TOTALES */}
                          <td className="numero-cell">{formatearNumero(item.total_litros_kg)}</td>
                          <td className="numero-cell">{mlALitros(item.total_litros_ml)}</td> {/* 🆕 CAMBIO: ml → L */}
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
    </div>
  );
}

export default RR2;