import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../AuthContext";
import { useRouteAccess } from "../AuthContext";
import SinAcceso from "../SinAcceso";
import NavBar from "../NavBar";
import "../../css/RR3.css";
import { baseUrl } from "../../api/BaseUrl";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import LogoChagas from "../../assets/images/LOGOCHAGAS.png"; // 🔹 IMPORTAR LA IMAGEN

function RR3() {
  const { user } = useAuth();

  const { hasAccess, isLoading: accessLoading } = useRouteAccess(["jefe_grupo", "administrador", "supervisor"]);

  const pdfRef = useRef();

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

  const API_URL = import.meta.env.VITE_API_URL || `${baseUrl}/api`;

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

  // Función para generar PDF
  const generarPDF = async () => {
    try {
      setLoading(true);

      const tableElement = document.querySelector('.rr3-table');

      if (!tableElement) {
        throw new Error("No se encontró la tabla de estadísticas");
      }

      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1600px'; // Ancho aumentado
      tempContainer.style.background = 'white';
      tempContainer.style.padding = '20px';
      tempContainer.style.fontFamily = 'Arial, sans-serif';

      // 🔹 AGREGAR EL LOGOTIPO EN LA ESQUINA SUPERIOR IZQUIERDA
      const logoContainer = document.createElement('div');
      logoContainer.style.position = 'absolute';
      logoContainer.style.top = '10px';
      logoContainer.style.left = '10px';
      logoContainer.style.width = '150px'; // Tamaño del logo
      logoContainer.style.height = '120px';
      logoContainer.style.zIndex = '10';

      // Crear imagen para el logo - USAR LA IMAGEN IMPORTADA
      const logoImg = document.createElement('img');
      logoImg.src = LogoChagas; // 🔹 USAR LA VARIABLE IMPORTADA
      logoImg.style.width = '100%';
      logoImg.style.height = '100%';
      logoImg.style.objectFit = 'contain';
      logoImg.style.maxWidth = '100%';
      logoImg.style.maxHeight = '100%';

      logoContainer.appendChild(logoImg);
      tempContainer.appendChild(logoContainer);

      // Agregar encabezado con margen para el logo
      const header = document.createElement('div');
      header.style.textAlign = 'center';
      header.style.marginBottom = '20px';
      header.style.borderBottom = '2px solid #8B0000';
      header.style.paddingBottom = '10px';
      header.style.paddingLeft = '140px'; // Espacio para el logo
      header.style.paddingRight = '20px';
      header.style.paddingTop = '5px';

      header.innerHTML = `
        <h2 style="color: #8B0000; margin: 0; font-size: 20px; font-weight: bold;">
          RR3-CH-MA — Estadísticas de Rociado por Municipio
        </h2>
        <p style="margin: 5px 0; color: #555; font-size: 16px;">
          Reporte de Estadísticas - ${meses[filtros.mes - 1]} ${filtros.año}
        </p>
        <p style="margin: 5px 0; color: #777; font-size: 14px;">
          Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}
        </p>
        ${filtros.municipio ? `
          <p style="margin: 5px 0; color: #777; font-size: 14px;">
            Municipio: ${catalogos.municipios.find(m => m.municipio_id === filtros.municipio)?.nombre || 'Todos'}
          </p>
        ` : ''}
      `;
      tempContainer.appendChild(header);

      // Crear una nueva tabla estructurada correctamente
      const newTable = document.createElement('table');
      newTable.style.width = '100%';
      newTable.style.borderCollapse = 'collapse';
      newTable.style.fontSize = '7px'; // Tamaño reducido para más columnas
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
        th.style.padding = '5px 3px';
        th.style.fontSize = '6.5px';
        th.style.background = '#8B0000';
        th.style.color = 'white';
        th.style.border = '1px solid #700000';
        th.style.textAlign = 'center';
        th.style.fontWeight = 'bold';
      });

      // Aplicar estilos especiales a los headers de sección
      const sectionHeaders = newTable.querySelectorAll('.section-header');
      sectionHeaders.forEach(header => {
        header.style.background = '#700000';
        header.style.fontWeight = 'bold';
      });

      // Aplicar estilos al tbody
      const tdElements = newTable.querySelectorAll('td');
      tdElements.forEach(td => {
        td.style.padding = '4px 3px';
        td.style.fontSize = '6.5px';
        td.style.border = '1px solid #ddd';
        td.style.textAlign = 'center';
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

      // Estilos para las celdas de progreso
      const progressContainers = newTable.querySelectorAll('.progress-container');
      progressContainers.forEach(container => {
        container.style.minWidth = '60px';
      });

      const progressBars = newTable.querySelectorAll('.progress-bar');
      progressBars.forEach(bar => {
        bar.style.height = '8px';
        bar.style.marginTop = '2px';
      });

      const progressFills = newTable.querySelectorAll('.progress-fill');
      progressFills.forEach(fill => {
        fill.style.height = '100%';
        fill.style.background = '#28a745';
      });

      const progressTexts = newTable.querySelectorAll('.progress-text');
      progressTexts.forEach(text => {
        text.style.fontSize = '6px';
        text.style.fontWeight = 'bold';
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

      const fileName = `RR3_Estadisticas_Municipios_${meses[filtros.mes - 1]}_${filtros.año}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error("Error al generar PDF:", error);
      setError("Error al generar el PDF. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // 🆕 NUEVO: Función para convertir ml a litros
  const mlALitros = (ml) => {
    if (ml === null || ml === undefined) return '0.00';
    const litros = parseFloat(ml) / 1000;
    return isNaN(litros) ? '0.00' : litros.toFixed(2);
  };

  // 🆕 NUEVO: Función para obtener la unidad correcta según el insecticida
  const getUnidadInsecticida = (insecticida) => {
    switch (insecticida) {
      case 'BENDIOCARB': return 'Kg';
      case 'LAMBDACIALOTRINA': return 'L';
      case 'ALFACIPERMETRINA': return 'L';
      default: return 'L';
    }
  };

  // 🆕 NUEVO: Función para formatear cantidad según el insecticida
  const formatearCantidadInsecticida = (insecticida, cantidad) => {
    if (cantidad === null || cantidad === undefined) return '0.00';
    const num = parseFloat(cantidad);
    if (isNaN(num)) return '0.00';

    switch (insecticida) {
      case 'BENDIOCARB':
        // Bendiocarb ya está en gramos, convertir a Kg dividiendo entre 1000
        return (num / 1000).toFixed(2);
      case 'LAMBDACIALOTRINA':
        // Lambdacialotrina está en ml, convertir a L dividiendo entre 1000
        return (num / 1000).toFixed(2);
      case 'ALFACIPERMETRINA':
        // Alfacipermetrina está en ml, convertir a L dividiendo entre 1000
        return (num / 1000).toFixed(2);
      default:
        return num.toFixed(2);
    }
  };

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
        <div ref={pdfRef} className="pdf-content">
          <div className="pdf-header">
            <h2>RR3-CH-MA — Estadísticas de Rociado por Municipio</h2>
            <p>Reporte de Estadísticas - {meses[filtros.mes - 1]} {filtros.año}</p>
            <p>Generado el: {new Date().toLocaleDateString('es-ES')} a las {new Date().toLocaleTimeString('es-ES')}</p>
            {filtros.municipio && (
              <p>Municipio: {catalogos.municipios.find(m => m.municipio_id === filtros.municipio)?.nombre || 'Todos'}</p>
            )}
          </div>

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
          <div className="section no-print">
            <h3>Filtros de Búsqueda</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Municipio</label>
                <select
                  name="municipio"
                  value={filtros.municipio}
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
                        <th rowSpan="2">Población</th>{/* VIVIENDAS */}<th colSpan="6" className="section-header">Viviendas</th>{/* HABITACIONES */}<th colSpan="2" className="section-header">Habitaciones</th>{/* PERIDOMICILIO */}<th colSpan="5" className="section-header">Peridomicilio</th>{/* INSECTICIDAS */}<th colSpan="9" className="section-header">Insecticidas Utilizados</th></tr><tr>{/* Subcolumnas de Viviendas */}<th>Existentes</th>
                        <th>Rociadas</th>
                        <th>No Rociadas</th>
                        <th>Progreso</th>
                        <th>Cerradas</th>
                        <th>Renuentes</th>{/* Subcolumnas de Habitaciones */}<th>Rociadas</th>
                        <th>No Rociadas</th>{/* Subcolumnas de Peridomicilio */}<th>Corrales</th>
                        <th>Gallineros</th>
                        <th>Conejeras</th>
                        <th>Zarzos/Trojes</th>
                        <th>Otros</th>{/* 🆕 CAMBIO: Subcolumnas de Insecticidas con unidades correctas */}<th>Alfa Dosis</th>
                        <th>Alfa Cargas</th>
                        <th>Alfa L</th>
                        <th>Bendio Dosis</th>
                        <th>Bendio Cargas</th>
                        <th>Bendio Kg</th> {/* 🆕 CAMBIO: Lts → Kg */}
                        <th>Lambda Dosis</th>
                        <th>Lambda Cargas</th>
                        <th>Lambda L</th> {/* 🆕 CAMBIO: Lts → L */}
                      </tr>
                    </thead>
                    <tbody>
                      {estadisticas.map((item, idx) => (
                        <tr key={idx}>
                          <td className="municipio-cell">{item.municipio || 'N/A'}</td>
                          <td>{formatearFecha(item.fecha_inicio)}</td>
                          <td>{formatearFecha(item.fecha_final)}</td>
                          <td className="numero-cell">{item.total_registros || 0}</td>
                          <td className="numero-cell">{item.poblacion_protegida || 0}</td>{/* VIVIENDAS */}<td className="numero-cell total-cell">{item.viviendas_existentes || 0}</td>
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
                          <td className="numero-cell danger-cell">{item.viviendas_renuentes || 0}</td>{/* HABITACIONES */}<td className="numero-cell">{item.habitaciones_rociadas || 0}</td>
                          <td className="numero-cell">{item.habitaciones_no_rociadas || 0}</td>{/* PERIDOMICILIO */}<td className="numero-cell">{item.corrales || 0}</td>
                          <td className="numero-cell">{item.gallineros || 0}</td>
                          <td className="numero-cell">{item.conejeras || 0}</td>
                          <td className="numero-cell">{item.zarzos_trojes || 0}</td>
                          <td className="numero-cell">{item.otros || 0}</td>{/* 🆕 CAMBIO: INSECTICIDAS con unidades correctas */}<td className="numero-cell">{formatearNumero(item.dosis_alfacipermetrina)}</td>
                          <td className="numero-cell">{item.cargas_alfacipermetrina || 0}</td>
                          <td className="numero-cell">{formatearCantidadInsecticida('ALFACIPERMETRINA', item.litros_alfacipermetrina)}</td>

                          <td className="numero-cell">{formatearNumero(item.dosis_bendiocarb)}</td>
                          <td className="numero-cell">{item.cargas_bendiocarb || 0}</td>
                          <td className="numero-cell">{formatearCantidadInsecticida('BENDIOCARB', item.litros_bendiocarb)}</td> {/* 🆕 Kg */}

                          <td className="numero-cell">{formatearNumero(item.dosis_lambdacialotrina)}</td>
                          <td className="numero-cell">{item.cargas_lambdacialotrina || 0}</td>
                          <td className="numero-cell">{formatearCantidadInsecticida('LAMBDACIALOTRINA', item.litros_lambdacialotrina)}</td> {/* 🆕 L */}
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

export default RR3;