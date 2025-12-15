import React, { useState, useEffect } from "react";
import { useRouteAccess } from "../AuthContext";
import SinAcceso from "../SinAcceso";
import "../../css/EE3.css";
import { baseUrl } from "../../api/BaseUrl";
import jsPDF from "jspdf";
import logoChagas from "../../assets/images/LOGOCHAGAS.png";

/* =====================================================
                EE3 - SOLO TABLA + PDF
===================================================== */
export default function EE3() {
  const { hasAccess, isLoading: accessLoading } = useRouteAccess([
    "jefe_grupo",
    "administrador",
    "supervisor",
  ]);

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [evaluaciones, setEvaluaciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generandoPDF, setGenerandoPDF] = useState(false);

  // ================== VERIFICAR ACCESO ==================
  if (accessLoading) {
    return (
      <div className="ee2-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) return <SinAcceso />;

  // ================== CARGA AUTOMÁTICA ==================
  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin]);

  // ================== CARGA DE DATOS ==================
  const cargarDatos = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append("fechaInicio", fechaInicio);
      if (fechaFin) params.append("fechaFin", fechaFin);

      const [statsRes, evalRes] = await Promise.all([
        fetch(`${baseUrl}/api/ee3/estadisticas?${params}`),
        fetch(`${baseUrl}/api/ee3/evaluaciones?${params}`),
      ]);

      const statsJson = await statsRes.json();
      const evalJson = await evalRes.json();

      if (statsJson.success) setEstadisticas(statsJson.data);
      else setEstadisticas(null);

      if (evalJson.success) setEvaluaciones(evalJson.data);
      else setEvaluaciones([]);
    } catch (err) {
      console.error(err);
      setError("Error al conectar con el servidor: " + err.message);
      setEstadisticas(null);
      setEvaluaciones([]);
    } finally {
      setLoading(false);
    }
  };

  // ================== AGRUPAR POR MUNICIPIO ==================
  const municipiosAgrupados = (() => {
    const acc = {};

    evaluaciones.forEach((it) => {
      const nombre = it.municipio || "N/A";

      if (!acc[nombre]) {
        acc[nombre] = {
          municipio: nombre,
          total_habitantes: 0,
          total_habitaciones: 0,
          viv_positivas: 0,
          ejemplares_total: 0,
        };
      }

      const row = acc[nombre];

      row.total_habitantes += Number(it.total_habitantes) || 0;
      row.total_habitaciones += Number(it.total_habitaciones) || 0;
      row.viv_positivas += Number(it.viv_positivas) || 0;
      row.ejemplares_total += Number(it.ejemplares_total) || 0;
    });

    return Object.values(acc).map((m) => {
      return {
        municipio: m.municipio,
        total_habitantes: m.total_habitantes,
        total_habitaciones: m.total_habitaciones,
        viv_positivas: m.viv_positivas,
        ejemplares_total: m.ejemplares_total,
      };
    });
  })();

  // ================== TOTALES GENERALES ==================
  const total = municipiosAgrupados.reduce(
    (acc, it) => {
      acc.habitantes += it.total_habitantes || 0;
      acc.habitaciones += it.total_habitaciones || 0;
      acc.positivas += it.viv_positivas || 0;
      acc.ejemplares += it.ejemplares_total || 0;
      return acc;
    },
    { habitantes: 0, habitaciones: 0, positivas: 0, ejemplares: 0 }
  );

  // ================== EXPORTAR SOLO TABLA PDF ==================
  const exportarTablaPDF = () => {
    setGenerandoPDF(true);
    try {
      const pdf = new jsPDF("landscape", "mm", "a4");

      // ============================
      // ENCABEZADO CON LOGO CHAGAS
      // ============================
      const logoW = 25;
      const logoH = 25;

      // Fondo rojo del encabezado
      pdf.setFillColor(229, 62, 62);
      pdf.rect(0, 0, 297, 22, "F");

      // LOGO CHAGAS (izquierda)
      try {
        pdf.addImage(logoChagas, "PNG", 10, 1, logoW, logoH);
      } catch (e) {
        console.warn("⚠️ No se pudo cargar logo CHAGAS", e);
      }

      // TÍTULO CENTRAL
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        "DETALLE POR MUNICIPIO - EE3",
        148,
        12,
        { align: "center" }
      );

      // SUBTÍTULO
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        `Período: ${fechaInicio || "Todos"} a ${fechaFin || "Todos"} • Registros: ${municipiosAgrupados.length}`,
        15,
        30
      );

      // ============================
      // TABLA SIMPLIFICADA
      // ============================
      const headers = [
        "#",
        "MUNICIPIO",
        "HABITANTES",
        "HABITACIONES",
        "POSITIVAS",
        "EJEMPLARES"
      ];

      const columnWidths = [12, 70, 35, 35, 30, 30];

      let y = 42;

      // Encabezado de la tabla
      pdf.setFillColor(45, 55, 72);
      pdf.rect(10, y, 277, 9, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);

      let x = 14;
      headers.forEach((h, i) => {
        pdf.text(h, x, y + 6);
        x += columnWidths[i];
      });

      y += 10;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);

      // Filas
      municipiosAgrupados.forEach((mun, index) => {
        if (y > 185) {
          // Nueva página
          pdf.addPage();
          y = 20;

          // Repetir encabezado
          pdf.setFillColor(45, 55, 72);
          pdf.rect(10, y, 277, 9, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(9);

          let x2 = 14;
          headers.forEach((h, i) => {
            pdf.text(h, x2, y + 6);
            x2 += columnWidths[i];
          });

          y += 12;
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(8);
        }

        if (index % 2 === 0) {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(10, y - 2, 277, 9, "F");
        }

        const row = [
          index + 1,
          mun.municipio,
          (mun.total_habitantes || 0).toLocaleString(),
          (mun.total_habitaciones || 0).toLocaleString(),
          mun.viv_positivas || 0,
          mun.ejemplares_total || 0
        ];

        let xx = 14;
        row.forEach((cell, i) => {
          pdf.text(String(cell), xx, y + 5);
          xx += columnWidths[i];
        });

        y += 9;
      });

      // ============================
      // TOTALES
      // ============================
      y += 5;
      pdf.setFillColor(229, 62, 62);
      pdf.rect(10, y - 2, 277, 9, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);

      pdf.text("TOTALES", 14, y + 5);
      pdf.text(total.habitantes.toLocaleString(), 96, y + 5);
      pdf.text(total.habitaciones.toLocaleString(), 136, y + 5);
      pdf.text(String(total.positivas), 171, y + 5);
      pdf.text(String(total.ejemplares), 204, y + 5);

      // ============================
      // FOOTER
      // ============================
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(80, 80, 80);
        pdf.text(
          `Página ${i} de ${pageCount} — Sistema de Gestión Entomológica GAMC`,
          148,
          205,
          { align: "center" }
        );
      }

      const fecha = new Date().toLocaleDateString("es-ES");
      pdf.save(`EE3_Tabla_Completa_${fecha.replace(/\//g, "-")}.pdf`);

    } catch (error) {
      console.error("❌ Error generando PDF:", error);
      alert("Error al generar PDF de la tabla.");
    }
    setGenerandoPDF(false);
  };

  // ================== RENDER ==================
  return (
    <div className="ee2-container">
      {/* FILTRO FECHAS */}
      <div className="cabecera-form">
        <div className="fila">
          <div className="campo ancho-2">
            <label>Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div className="campo ancho-2">
            <label>Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>

          <div className="campo ancho-2">
            <label>&nbsp;</label>
            <button
              className="btn-refresh"
              onClick={cargarDatos}
              disabled={loading}
            >
              {loading ? "⏳ Cargando..." : "🔄 Actualizar"}
            </button>
          </div>
        </div>
      </div>

      {/* ÚNICO BOTÓN DE PDF: TABLA COMPLETA */}
      <div className="pdf-buttons">
        <button
          className={`btn-pdf ${generandoPDF ? "loading" : ""}`}
          onClick={exportarTablaPDF}
          disabled={
            generandoPDF || loading || municipiosAgrupados.length === 0
          }
        >
          📋 {generandoPDF ? "Generando PDF..." : "Exportar Tabla PDF"}
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando datos...</p>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="error-banner">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
            <button
              onClick={() => setError("")}
              className="close-btn"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* RESUMEN */}
      {!loading && estadisticas && (
        <section className="resumen-section">
          <h2>RESUMEN EE3 - POR MUNICIPIO</h2>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📌</div>
              <div className="stat-info">
                <div className="stat-value">
                  {estadisticas.total || 0}
                </div>
                <div className="stat-label">Evaluaciones</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🐛</div>
              <div className="stat-info">
                <div className="stat-value">
                  {estadisticas.positivas || 0}
                </div>
                <div className="stat-label">Positivas</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👪</div>
              <div className="stat-info">
                <div className="stat-value">
                  {estadisticas.habitantes || 0}
                </div>
                <div className="stat-label">Habitantes</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🐞</div>
              <div className="stat-info">
                <div className="stat-value">
                  {estadisticas.capturas || 0}
                </div>
                <div className="stat-label">Ejemplares</div>
              </div>
            </div>
          </div>

          <div className="periodo-info">
            <div className="periodo-item">
              <strong>Período:</strong>{" "}
              {fechaInicio || "Todos"} a {fechaFin || "Todos"}
            </div>
            <div className="periodo-item">
              <strong>Municipios:</strong> {municipiosAgrupados.length}
            </div>
            <div className="periodo-item">
              <strong>Registros:</strong> {evaluaciones.length}
            </div>
          </div>
        </section>
      )}

      {/* TABLA COMPLETA POR MUNICIPIO (sin columnas de coordenadas ni mapa) */}
      {!loading && municipiosAgrupados.length > 0 && (
        <section className="tabla-section">
          <h2>DETALLE POR MUNICIPIO - TABLA COMPLETA</h2>

          <div className="table-scroll">
            <table className="data-table wide">
              <thead>
                <tr>
                  <th>#</th>
                  <th>MUNICIPIO</th>
                  <th>TOTAL HABITANTES</th>
                  <th>TOTAL HABITACIONES</th>
                  <th>VIVIENDAS POSITIVAS</th>
                  <th>EJEMPLARES</th>
                </tr>
              </thead>

              <tbody>
                {municipiosAgrupados.map((it, i) => (
                  <tr key={it.municipio || i}>
                    <td>{i + 1}</td>
                    <td className="text-bold">
                      {it.municipio || "N/A"}
                    </td>
                    <td>
                      {it.total_habitantes.toLocaleString()}
                    </td>
                    <td>
                      {it.total_habitaciones.toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          it.viv_positivas > 0
                            ? "badge-danger"
                            : "badge-success"
                        }`}
                      >
                        {it.viv_positivas}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-warning">
                        {it.ejemplares_total}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="table-totales">
                  <td colSpan="2" className="text-bold">
                    TOTALES
                  </td>
                  <td className="text-bold">
                    {total.habitantes.toLocaleString()}
                  </td>
                  <td className="text-bold">
                    {total.habitaciones.toLocaleString()}
                  </td>
                  <td className="text-bold">{total.positivas}</td>
                  <td className="text-bold">{total.ejemplares}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {!loading && !error && municipiosAgrupados.length === 0 && (
        <div className="no-data-message">
          📊 No existen datos para el rango seleccionado.
        </div>
      )}

      {/* LEYENDA */}
      <section className="leyenda-section">
        <div className="leyenda-grid">
          <div className="leyenda-card">
            <h3>🏠 INTRA</h3>
            <div className="leyenda-items">
              <span className="captura-tag">PO = Pared</span>
              <span className="captura-tag">TH = Techo</span>
              <span className="captura-tag">CM = Cama</span>
              <span className="captura-tag">OT = Otros</span>
            </div>
          </div>

          <div className="leyenda-card">
            <h3>🌳 PERI</h3>
            <div className="leyenda-items">
              <span className="captura-tag">CL = Corral</span>
              <span className="captura-tag">GA = Gallinero</span>
              <span className="captura-tag">CJ = Conejera</span>
              <span className="captura-tag">Z/T = Zarzo/Troje</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="report-footer">
        <div className="footer-info">
          <div className="footer-item">
            <strong>Generado:</strong>{" "}
            {new Date().toLocaleDateString("es-ES")}
          </div>
          <div className="footer-item">
            <strong>Período:</strong>{" "}
            {fechaInicio || "todos"} a {fechaFin || "todos"}
          </div>
          <div className="footer-item">
            <strong>Registros:</strong> {evaluaciones.length}
          </div>
          <div className="footer-item">
            <strong>Municipios:</strong> {municipiosAgrupados.length}
          </div>
        </div>
      </footer>
    </div>
  );
}