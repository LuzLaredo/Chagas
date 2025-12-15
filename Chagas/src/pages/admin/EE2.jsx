import React, { useState, useEffect, useRef } from "react";
import { useRouteAccess, useAuth } from "../AuthContext";
import SinAcceso from "../SinAcceso";
import "../../css/EE2.css";
import { baseUrl } from "../../api/BaseUrl";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoChagas from "../../assets/images/LOGOCHAGAS.png";

// =====================================================
// FUNCIÓN PARA BLINDAR TODAS LAS SUMAS NUMÉRICAS
// =====================================================
const toNum = (v) => {
  const n = parseInt(String(v ?? "").trim(), 10);
  return isNaN(n) ? 0 : n;
};

// =====================================================
//   COMPONENTE DE MAPA (MODAL)
// =====================================================
const MapaModal = ({ coordenadas = "", comunidad = "Ubicación", onClose }) => {
  const [leafletReady, setLeafletReady] = useState(!!window.L);
  const [navOn, setNavOn] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (window.L) {
      setLeafletReady(true);
      return;
    }
    const cssId = "leaflet-css-ee2";
    const jsId = "leaflet-js-ee2";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity =
        "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }
    if (!document.getElementById(jsId)) {
      const script = document.createElement("script");
      script.id = jsId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity =
        "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      script.onload = () => setLeafletReady(true);
      script.onerror = () => setLeafletReady(false);
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    document.body.classList.add("modal-open");
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [onClose]);

  const parsed = String(coordenadas)
    .split(",")
    .map((c) => parseFloat(String(c).trim()));
  const valid =
    parsed.length >= 2 && !isNaN(parsed[0]) && !isNaN(parsed[1]);
  const [lat, lng, alt] = valid ? parsed : [null, null, null];

  const setMapInteractions = (enabled) => {
    if (!mapRef.current) return;
    const m = mapRef.current;
    if (enabled) {
      m.dragging.enable();
      m.scrollWheelZoom.enable();
      m.doubleClickZoom.enable();
      m.boxZoom.enable();
      m.keyboard.enable();
      m.touchZoom?.enable();
      m.tap?.enable?.();
    } else {
      m.dragging.disable();
      m.scrollWheelZoom.disable();
      m.doubleClickZoom.disable();
      m.boxZoom.disable();
      m.keyboard.disable();
      m.touchZoom?.disable();
      m.tap?.disable?.();
    }
  };

  useEffect(() => {
    if (!leafletReady || !valid) return;
    const L = window.L;

    if (!mapRef.current) {
      mapRef.current = L.map("mapa-modal", {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        preferCanvas: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapRef.current);

      const cont = mapRef.current.getContainer();
      [
        "mousedown",
        "mouseup",
        "click",
        "dblclick",
        "contextmenu",
        "touchstart",
        "touchend",
      ].forEach((evt) =>
        cont.addEventListener(
          evt,
          (e) => e.stopPropagation(),
          { passive: true }
        )
      );

      setMapInteractions(false);
    }

    const popupHTML = `<div style="text-align:center;min-width:200px;">
        <h3 style="color:#e53e3e;margin:0 0 8px;font-size:16px;font-weight:700">📍 ${comunidad}</h3>
        <hr style="border:none;height:2px;background:linear-gradient(135deg,#e53e3e 0%,#c53030 100%);margin:8px 0;border-radius:1px;">
        <div style="text-align:left;font-size:13px;">
          <strong>Coordenadas:</strong><br/>
          📍 Lat: ${lat.toFixed(6)}<br/>
          📍 Lon: ${lng.toFixed(6)}<br/>
          ${!isNaN(alt) ? `<strong>Altura:</strong> ${alt} m` : ""}
        </div>
      </div>`;

    if (!markerRef.current) {
      markerRef.current = window.L
        .marker([lat, lng])
        .addTo(mapRef.current)
        .bindPopup(popupHTML)
        .openPopup();
    } else {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setPopupContent(popupHTML);
    }

    const fixSize = () => {
      if (!mapRef.current) return;
      mapRef.current.invalidateSize();
      mapRef.current.setView([lat, lng], 15, { animate: false });
    };
    requestAnimationFrame(() => requestAnimationFrame(fixSize));
  }, [leafletReady, valid, lat, lng, alt, comunidad]);

  useEffect(() => setMapInteractions(navOn), [navOn]);
  useEffect(
    () => () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    },
    []
  );

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };
  const stopPointer = (e) => e.stopPropagation();

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
      onMouseDown={stopPointer}
      onTouchStart={stopPointer}
    >
      <div
        className="modal-content"
        onClick={stopPointer}
        onMouseDown={stopPointer}
        onTouchStart={stopPointer}
      >
        <div className="modal-header">
          <h2>🗺️ Mapa de Ubicación - {comunidad}</h2>
          <div className="modal-actions">
            <button
              className={`toggle-nav-btn ${navOn ? "on" : "off"}`}
              onClick={() => setNavOn((v) => !v)}
              title={
                navOn
                  ? "Bloquear navegación del mapa"
                  : "Permitir mover/zoom del mapa"
              }
            >
              {navOn ? "🔓 Navegar" : "🔒 Bloquear"}
            </button>
            <button
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="modal-body">
          {valid ? (
            <>
              <div className="coordenadas-info">
                <div className="coordenadas-item">
                  <strong>📍 Latitud:</strong> {lat.toFixed(6)}
                </div>
                <div className="coordenadas-item">
                  <strong>📍 Longitud:</strong> {lng.toFixed(6)}
                </div>
                {!isNaN(alt) && (
                  <div className="coordenadas-item">
                    <strong>📏 Altura:</strong> {alt} m
                  </div>
                )}
              </div>
              <div className="mapa-container-full">
                {!leafletReady && (
                  <div className="mapa-loading-full">
                    <div className="loading-spinner-large"></div>
                    <p>Cargando mapa...</p>
                  </div>
                )}
                <div id="mapa-modal" className="mapa-full" />
              </div>
            </>
          ) : (
            <div className="error-coordenadas">
              <div className="error-icon">⚠️</div>
              <h3>Coordenadas no válidas</h3>
              <p>
                Las coordenadas proporcionadas no son válidas para mostrar en
                el mapa.
              </p>
              <div className="coordenadas-raw">
                <strong>Datos crudos:</strong> {coordenadas}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cerrar" onClick={onClose}>
            Cerrar Mapa
          </button>
        </div>
      </div>
    </div>
  );
};

const BotonVerMapa = ({ coordenadas, comunidad }) => {
  const [showModal, setShowModal] = useState(false);
  if (!coordenadas || coordenadas.trim() === "")
    return <span className="badge badge-muted">N/A</span>;
  const coords = coordenadas
    .split(",")
    .map((c) => parseFloat(String(c).trim()));
  const ok = coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1]);
  if (!ok) return <span className="badge badge-danger">Inválidas</span>;
  return (
    <>
      <button
        className="btn-ver-mapa-modal"
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        title={`Ver mapa de ${comunidad}`}
      >
        🗺️ Ver
      </button>
      {showModal && (
        <MapaModal
          coordenadas={coordenadas}
          comunidad={comunidad || "Ubicación"}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default function EE2() {
  const { hasAccess, isLoading: accessLoading } = useRouteAccess([
    "jefe_grupo",
    "administrador",
    "supervisor",
  ]);
  const { usuario } = useAuth();

  // =====================================================
  // HOOKS
  // =====================================================
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [verTodos, setVerTodos] = useState(false);
  const [municipioFiltro, setMunicipioFiltro] = useState("");
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cargandoMunicipios, setCargandoMunicipios] = useState(true);
  const [error, setError] = useState("");
  const [generandoPDF, setGenerandoPDF] = useState(false);

  // =====================================================
  // FUNCIONES AUXILIARES
  // =====================================================
  const getFirst = (obj, names, def = 0) => {
    if (!obj) return def;
    for (const n of names) {
      if (obj[n] !== undefined && obj[n] !== null) return obj[n];
    }
    return def;
  };

  // =====================================================
  // EFFECTS - CARGA INICIAL
  // =====================================================
  useEffect(() => {
    const hoy = new Date();
    const hace30 = new Date(hoy);
    hace30.setDate(hoy.getDate() - 30);
    setFechaInicio(hace30.toISOString().split("T")[0]);
    setFechaFin(hoy.toISOString().split("T")[0]);
  }, []);

  // =====================================================
  // EFFECT - CARGAR MUNICIPIOS UNA SOLA VEZ AL INICIO
  // =====================================================
  useEffect(() => {
    const cargarMunicipiosSistema = async () => {
      try {
        setCargandoMunicipios(true);

        // Si es supervisor, cargar solo sus municipios asignados
        if (usuario?.rol === 'supervisor' && (usuario?.usuario_id || usuario?.id)) {
          const usuarioId = usuario.usuario_id || usuario.id;
          const token = localStorage.getItem('token');
          const headers = token ? { "Authorization": `Bearer ${token}` } : {};

          const municipioRes = await fetch(`${baseUrl}/api/usuarios/${usuarioId}/municipios`, {
            headers: headers
          });

          if (!municipioRes.ok) {
            console.error(`Error ${municipioRes.status} al obtener municipios del supervisor`);
            setMunicipios([]);
          } else {
            const municipiosData = await municipioRes.json();
            setMunicipios(municipiosData || []);

            // Si solo hay un municipio, seleccionarlo automáticamente
            if (municipiosData.length === 1) {
              setMunicipioFiltro(municipiosData[0].nombre || municipiosData[0].nombre_municipio);
            }

            console.log("✅ Municipios del supervisor cargados:", municipiosData.length);
          }
        } else {
          // Para otros roles, cargar todos los municipios
          const res = await fetch(`${baseUrl}/api/ee2/municipios`);
          if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status}`);
          }
          const data = await res.json();

          console.log("🔍 Respuesta /api/ee2/municipios:", data);

          if (data.success && Array.isArray(data.data)) {
            setMunicipios(["Todos los municipios", ...data.data]);
            console.log("✅ Municipios cargados correctamente:", ["Todos los municipios", ...data.data]);
          } else if (Array.isArray(data)) {
            setMunicipios(["Todos los municipios", ...data]);
            console.log("✅ Municipios cargados (array directo):", ["Todos los municipios", ...data]);
          } else {
            console.error("❌ Formato de respuesta inválido:", data);
            setMunicipios(["Todos los municipios"]);
          }
        }
      } catch (err) {
        console.error("❌ Error cargando municipios:", err);
        setMunicipios(usuario?.rol === 'supervisor' ? [] : ["Todos los municipios"]);
      } finally {
        setCargandoMunicipios(false);
      }
    };

    cargarMunicipiosSistema();
  }, [usuario]);

  // =====================================================
  // EFFECT - CARGAR DATOS CUANDO CAMBIAN LOS FILTROS
  // =====================================================
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const t = setTimeout(() => cargarDatos(), 250);
      return () => clearTimeout(t);
    }
  }, [fechaInicio, fechaFin, verTodos, municipioFiltro]);

  // =====================================================
  // FUNCIÓN PARA CARGAR DATOS (ESTADÍSTICAS Y EVALUACIONES)
  // =====================================================
  const cargarDatos = async () => {
    setLoading(true);
    setError("");
    try {
      let fechaInicioConsulta = fechaInicio;
      let fechaFinConsulta = fechaFin;

      if (verTodos) {
        const hoy = new Date();
        const hace10Anios = new Date(hoy);
        hace10Anios.setFullYear(hoy.getFullYear() - 10);

        fechaInicioConsulta = hace10Anios.toISOString().split("T")[0];
        fechaFinConsulta = hoy.toISOString().split("T")[0];
      }

      // Construir URL con filtros
      let urlStats = `${baseUrl}/api/ee2/estadisticas?fechaInicio=${fechaInicioConsulta}&fechaFin=${fechaFinConsulta}`;
      let urlEval = `${baseUrl}/api/ee2/evaluaciones?fechaInicio=${fechaInicioConsulta}&fechaFin=${fechaFinConsulta}`;

      // Agregar filtro de municipio si está seleccionado y NO es "Todos los municipios"
      if (municipioFiltro && municipioFiltro !== "Todos los municipios") {
        urlStats += `&municipio=${encodeURIComponent(municipioFiltro)}`;
        urlEval += `&municipio=${encodeURIComponent(municipioFiltro)}`;
      }

      console.log("🔍 URLs de consulta:");
      console.log("  - Estadísticas:", urlStats);
      console.log("  - Evaluaciones:", urlEval);

      const [statsRes, evalRes] = await Promise.all([
        fetch(urlStats),
        fetch(urlEval),
      ]);

      if (!statsRes.ok) {
        const errorText = await statsRes.text();
        throw new Error(
          `Error ${statsRes.status}: No se pudieron cargar las estadísticas`
        );
      }

      if (!evalRes.ok) {
        const errorText = await evalRes.text();
        throw new Error(
          `Error ${evalRes.status}: No se pudieron cargar las evaluaciones`
        );
      }

      const statsData = await statsRes.json();
      const evalData = await evalRes.json();

      console.log("🔍 Datos recibidos:");
      console.log("  - Estadísticas:", statsData);
      console.log("  - Evaluaciones:", evalData);

      if (statsData?.success) {
        setEstadisticas(statsData.data);
      } else {
        throw new Error("Formato de respuesta inválido para estadísticas");
      }

      if (evalData?.success) {
        const datos = evalData.data;
        setEvaluaciones(datos);

        // ¡IMPORTANTE! NO actualizar municipios aquí
        // Los municipios ya están cargados desde el endpoint /api/ee2/municipios

      } else {
        throw new Error("Formato de respuesta inválido para evaluaciones");
      }
    } catch (err) {
      console.error("❌ Error cargando datos:", err);
      setError(`Error al cargar datos: ${err.message}`);
      setEstadisticas(null);
      setEvaluaciones([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FUNCIÓN PARA EXPORTAR PDF
  // =====================================================
  const exportarTablaPDF = () => {
    setGenerandoPDF(true);
    try {
      const pdf = new jsPDF("landscape", "mm", "a3");

      // ============================
      // ENCABEZADO CON LOGO A LA IZQUIERDA
      // ============================
      const logoW = 28;
      const logoH = 28;

      // Fondo rojo del encabezado
      pdf.setFillColor(229, 62, 69);
      pdf.rect(0, 0, pdf.internal.pageSize.width, 24, "F");

      // LOGO CHAGAS A LA IZQUIERDA (como lo pides)
      try {
        pdf.addImage(
          logoChagas,
          "PNG",
          10,
          2.5,
          logoW,
          logoH
        );
      } catch (e) {
        console.warn("⚠️ No se pudo cargar logo CHAGAS", e);
      }

      // TÍTULO CENTRAL
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        "ESTADÍSTICAS EE2",
        pdf.internal.pageSize.width / 2,
        17,
        { align: "center" }
      );

      // SUBTÍTULO - PERÍODO Y FILTRO
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);

      const periodo = verTodos ? "Todos los registros" : `${fechaInicio} a ${fechaFin}`;
      const municipioFiltroTexto = municipioFiltro && municipioFiltro !== "Todos los municipios"
        ? ` • Municipio: ${municipioFiltro}`
        : "";

      pdf.text(
        `Período: ${periodo}${municipioFiltroTexto} • Registros: ${evaluaciones.length}`,
        14,
        34
      );

      // ============================
      // ENCABEZADOS MULTINIVEL (SIN COLUMNA MUNICIPIO)
      // ============================
      const head = [
        [
          { content: "N°", rowSpan: 3 },
          { content: "Comunidad o Barrio", rowSpan: 3 },
          { content: "Fecha ejecución", colSpan: 3 },
          { content: "Habitantes", rowSpan: 3 },
          { content: "Habitaciones", rowSpan: 3 },
          { content: "Viviendas", colSpan: 4 },
          { content: "Infestación", colSpan: 4 },
          { content: "Infestación de colonias", colSpan: 4 },
          { content: "Mejoradas", colSpan: 4 },
          { content: "Ejemplares", colSpan: 5 },
          { content: "INTRA", colSpan: 4 },
          { content: "PERI", colSpan: 4 },
          { content: "Punto Geográfico", colSpan: 3 },
        ],
        [
          { content: "Inicio" },
          { content: "Final" },
          { content: "Reg." },

          { content: "Exist." },
          { content: "Prog." },
          { content: "Eval." },
          { content: "% Cob." },

          { content: "Posit" },
          { content: "%IV" },
          { content: "(+) Intra" },
          { content: "(+) Peri" },

          { content: "Ninfas" },
          { content: "%IIC" },
          { content: "CI Intra" },
          { content: "CI Peri" },

          { content: "SI" },
          { content: "NO" },
          { content: "SI" },
          { content: "NO" },

          { content: "N" },
          { content: "A" },
          { content: "N" },
          { content: "A" },
          { content: "PO" },
          { content: "TH" },
          { content: "CM" },
          { content: "OT" },
          { content: "CL" },
          { content: "GA" },
          { content: "CJ" },
          { content: "Z/T" },

          { content: "Altura" },
          { content: "Lat" },
          { content: "Lng" },
        ],
        [],
      ];

      // ============================
      // CUERPO DE LA TABLA (SIN COLUMNA MUNICIPIO)
      // ============================
      const rows = evaluaciones.map((it, idx) => [
        idx + 1,
        it.comunidad || "N/A",

        it.fecha_inicio || it.fecha_ejecucion || "N/A",
        it.fecha_final || it.fecha_ejecucion || "N/A",
        it.fecha_ejecucion || "N/A",

        getFirst(it, ["total_habitantes", "habitantes"], 0),
        getFirst(it, ["total_habitaciones", "habitaciones"], 0),

        getFirst(it, ["viviendas_existentes"], 0),
        getFirst(it, ["viviendas_programadas"], 0),
        getFirst(it, ["viviendas_revisadas"], 0),
        it.porc_cobertura || "0%",

        getFirst(it, ["viv_positivas"], 0),
        it.porc_iv || "0%",
        `${getFirst(it, ["viv_pos_intra"])} (${it.porc_iii || "0%"})`,
        `${getFirst(it, ["viv_pos_peri"])} (${it.porc_ip || "0%"})`,

        getFirst(it, ["viv_con_ninfas"], 0),
        it.porc_iic || "0%",
        `${getFirst(it, ["viv_ci_intra"])} (${it.porc_ci || "0%"})`,
        `${getFirst(it, ["viv_ci_peri"])} (${it.porc_icp || "0%"})`,

        getFirst(it, ["mej_intra_si"], 0),
        getFirst(it, ["mej_intra_no"], 0),
        getFirst(it, ["mej_peri_si"], 0),
        getFirst(it, ["mej_peri_no"], 0),

        getFirst(it, ["intra_n", "intra_ninfas"], 0),
        getFirst(it, ["intra_a", "intra_adulta"], 0),
        getFirst(it, ["peri_n", "peri_ninfa"], 0),
        getFirst(it, ["peri_a", "peri_adulta"], 0),
        getFirst(it, ["ejemplares_total"], 0),

        getFirst(it, ["intra_pared"], 0),
        getFirst(it, ["intra_techo"], 0),
        getFirst(it, ["intra_cama"], 0),
        getFirst(it, ["intra_otros"], 0),

        getFirst(it, ["peri_corral"], 0),
        getFirst(it, ["peri_gallinero"], 0),
        getFirst(it, ["peri_conejera"], 0),
        getFirst(it, ["peri_zarzo_troje"], 0),

        getFirst(it, ["altura_prom"], 0),
        getFirst(it, ["lat_prom"], 0),
        getFirst(it, ["lng_prom"], 0),
      ]);

      // ============================
      // AUTOTABLE
      // ============================
      autoTable(pdf, {
        startY: 40,
        head,
        body: rows,
        theme: "grid",
        styles: { fontSize: 6, cellPadding: 1 },
        headStyles: {
          fillColor: [229, 62, 69],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        margin: { left: 4, right: 4 },
        tableWidth: "auto",
        pageBreak: "auto",
        horizontalPageBreak: true,
      });

      // ============================
      // FOOTER
      // ============================
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(
          `Página ${i} de ${pageCount} — Sistema de Gestión Entomológica GAMC`,
          pdf.internal.pageSize.width / 2,
          pdf.internal.pageSize.height - 8,
          { align: "center" }
        );
      }

      const fecha = new Date().toLocaleDateString("es-ES");
      const municipioTexto = municipioFiltro && municipioFiltro !== "Todos los municipios"
        ? `_${municipioFiltro.replace(/\s+/g, '_')}`
        : '';
      pdf.save(`EE2_Tabla_Completa${municipioTexto}_${fecha.replace(/\//g, "-")}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error al generar la tabla completa PDF");
    }

    setGenerandoPDF(false);
  };

  // =====================================================
  // CÁLCULOS DE TOTALES
  // =====================================================
  const tot = evaluaciones.reduce(
    (a, it) => {
      const habitantes = getFirst(
        it,
        ["total_habitantes", "habitantes", "num_habitantes", "numero_habitantes"],
        0
      );
      const habitaciones = getFirst(
        it,
        [
          "total_habitaciones",
          "habitaciones",
          "num_habitaciones",
          "numero_habitaciones",
        ],
        0
      );

      a.habitantes += toNum(habitantes);
      a.habitaciones += toNum(habitaciones);

      a.viv_exist += toNum(getFirst(it, ["viviendas_existentes"], 0));
      a.viv_prog += toNum(getFirst(it, ["viviendas_programadas"], 0));
      a.viv_eval += toNum(getFirst(it, ["viviendas_revisadas"], 0));

      a.viv_pos += toNum(getFirst(it, ["viv_positivas"], 0));
      a.viv_pos_intra += toNum(getFirst(it, ["viv_pos_intra"], 0));
      a.viv_pos_peri += toNum(getFirst(it, ["viv_pos_peri"], 0));

      a.viv_con_ninfas += toNum(getFirst(it, ["viv_con_ninfas"], 0));
      a.viv_ci_intra += toNum(getFirst(it, ["viv_ci_intra"], 0));
      a.viv_ci_peri += toNum(getFirst(it, ["viv_ci_peri"], 0));

      a.mej_intra_si += toNum(getFirst(it, ["mej_intra_si"], 0));
      a.mej_intra_no += toNum(getFirst(it, ["mej_intra_no"], 0));
      a.mej_peri_si += toNum(getFirst(it, ["mej_peri_si"], 0));
      a.mej_peri_no += toNum(getFirst(it, ["mej_peri_no"], 0));

      a.intra_n += toNum(getFirst(it, ["intra_n", "intra_ninfas"], 0));
      a.intra_a += toNum(getFirst(it, ["intra_a", "intra_adulta"], 0));
      a.peri_n += toNum(getFirst(it, ["peri_n", "peri_ninfa"], 0));
      a.peri_a += toNum(getFirst(it, ["peri_a", "peri_adulta"], 0));
      a.ejemplares += toNum(getFirst(it, ["ejemplares_total"], 0));

      a.intra_pared += toNum(getFirst(it, ["intra_pared"], 0));
      a.intra_techo += toNum(getFirst(it, ["intra_techo"], 0));
      a.intra_cama += toNum(getFirst(it, ["intra_cama"], 0));
      a.intra_otros += toNum(getFirst(it, ["intra_otros"], 0));

      a.peri_corral += toNum(getFirst(it, ["peri_corral"], 0));
      a.peri_gallinero += toNum(getFirst(it, ["peri_gallinero"], 0));
      a.peri_conejera += toNum(getFirst(it, ["peri_conejera"], 0));
      a.peri_zarzo_troje += toNum(getFirst(it, ["peri_zarzo_troje"], 0));

      return a;
    },
    {
      habitantes: 0,
      habitaciones: 0,
      viv_exist: 0,
      viv_prog: 0,
      viv_eval: 0,
      viv_pos: 0,
      viv_pos_intra: 0,
      viv_pos_peri: 0,
      viv_con_ninfas: 0,
      viv_ci_intra: 0,
      viv_ci_peri: 0,
      mej_intra_si: 0,
      mej_intra_no: 0,
      mej_peri_si: 0,
      mej_peri_no: 0,
      intra_n: 0,
      intra_a: 0,
      peri_n: 0,
      peri_a: 0,
      ejemplares: 0,
      intra_pared: 0,
      intra_techo: 0,
      intra_cama: 0,
      intra_otros: 0,
      peri_corral: 0,
      peri_gallinero: 0,
      peri_conejera: 0,
      peri_zarzo_troje: 0,
    }
  );

  const pct = (num, den) =>
    den > 0 ? ((num / den) * 100).toFixed(0) + "%" : "—";
  const cobertura = pct(tot.viv_eval, tot.viv_exist);
  const iv = pct(tot.viv_pos, tot.viv_eval);
  const iii = pct(tot.viv_pos_intra, tot.viv_eval);
  const ip = pct(tot.viv_pos_peri, tot.viv_eval);
  const iic = pct(tot.viv_con_ninfas, tot.viv_eval);
  const ci = pct(tot.viv_ci_intra, tot.viv_eval);
  const icp = pct(tot.viv_ci_peri, tot.viv_eval);

  // =====================================================
  // RENDER
  // =====================================================
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

  if (!hasAccess) {
    return <SinAcceso />;
  }

  return (
    <div className="ee2-container">
      <div className="cabecera-form">
        <div className="fila">
          <div className="campo ancho-2">
            <label>Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              disabled={verTodos}
            />
          </div>
          <div className="campo ancho-2">
            <label>Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              disabled={verTodos}
            />
          </div>
          <div className="campo ancho-2">
            <label>Filtrar por Municipio</label>
            <select
              value={municipioFiltro}
              onChange={(e) => setMunicipioFiltro(e.target.value)}
              className="municipio-select"
              disabled={cargandoMunicipios}
            >
              {cargandoMunicipios ? (
                <option value="">Cargando municipios...</option>
              ) : (
                <>
                  {usuario?.rol !== 'supervisor' && municipios.length > 1 && (
                    <option value="">Todos los municipios</option>
                  )}
                  {municipios
                    .filter(mun => mun !== "Todos los municipios")
                    .map((mun, index) => {
                      // Manejar tanto objetos (supervisores) como strings (admins)
                      const nombre = typeof mun === 'string' ? mun : (mun.nombre || mun.nombre_municipio);
                      const valor = typeof mun === 'string' ? mun : (mun.nombre || mun.nombre_municipio);
                      return (
                        <option key={index} value={valor}>
                          {nombre}
                        </option>
                      );
                    })}
                </>
              )}
            </select>
            {cargandoMunicipios && (
              <div className="loading-small">Cargando lista de municipios...</div>
            )}
          </div>
          <div className="campo ancho-2">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={verTodos}
                onChange={(e) => setVerTodos(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              📋 Ver todos los registros
            </label>
            <div className="checkbox-help">
              {verTodos
                ? "Mostrando todos los registros (rango amplio de fechas)"
                : "Filtrando por fechas seleccionadas"}
            </div>
          </div>
          <div className="campo ancho-1">
            <button
              className="btn-refresh"
              onClick={cargarDatos}
              disabled={loading || cargandoMunicipios}
            >
              {loading ? "⏳ Cargando..." : "🔄 Actualizar"}
            </button>
          </div>
        </div>
      </div>

      {/* ÚNICO BOTÓN DE PDF */}
      <div className="pdf-buttons">
        <button
          className={`btn-pdf ${generandoPDF ? "loading" : ""}`}
          onClick={exportarTablaPDF}
          disabled={generandoPDF || loading || evaluaciones.length === 0}
        >
          📋 {generandoPDF ? "Generando..." : "Exportar Tabla PDF"}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <div className="error-message">
              <strong>Error de conexión:</strong> {error}
              <div className="error-suggestion">
                <small>
                  💡 <strong>No se pudieron cargar los datos del servidor.</strong>{" "}
                  Verifique la conexión e intente nuevamente.
                </small>
              </div>
            </div>
            <button onClick={() => setError("")} className="close-btn">
              ×
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-message">
            ⏳ Cargando {verTodos ? "todos los registros" : "consolidado"}...
            {municipioFiltro && municipioFiltro !== "Todos los municipios" && ` (Municipio: ${municipioFiltro})`}
          </div>
        </div>
      ) : (
        <>
          {estadisticas && (
            <section className="resumen-section">
              <h2>RESUMEN GENERAL</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <div className="stat-value">
                      {estadisticas.total?.toLocaleString() || 0}
                    </div>
                    <div className="stat-label">Evaluaciones</div>
                    <div className="stat-subtext">Total realizadas</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🔍</div>
                  <div className="stat-info">
                    <div className="stat-value">
                      {estadisticas.positivas || 0}
                    </div>
                    <div className="stat-label">Positivas</div>
                    <div className="stat-subtext">
                      <span className="infestation-rate">
                        {estadisticas.porc}% infestación
                      </span>
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🐞</div>
                  <div className="stat-info">
                    <div className="stat-value">
                      {tot.ejemplares?.toLocaleString() || 0}
                    </div>
                    <div className="stat-label">Vinchucas</div>
                    <div className="stat-subtext">Total capturadas</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">👪</div>
                  <div className="stat-info">
                    <div className="stat-value">
                      {estadisticas.habitantes?.toLocaleString() || 0}
                    </div>
                    <div className="stat-label">Habitantes</div>
                    <div className="stat-subtext">
                      {estadisticas.habitaciones?.toLocaleString() || 0}{" "}
                      habitaciones
                    </div>
                  </div>
                </div>
              </div>

              <div className="periodo-info">
                <div className="periodo-item">
                  <strong>Período:</strong>{" "}
                  {verTodos
                    ? "Todos los registros (últimos 10 años)"
                    : `${fechaInicio} a ${fechaFin}`}
                </div>
                <div className="periodo-item">
                  <strong>Municipio:</strong>{" "}
                  {municipioFiltro && municipioFiltro !== "Todos los municipios" ? municipioFiltro : "Todos"}
                </div>
                <div className="periodo-item">
                  <strong>Comunidades:</strong> {evaluaciones.length}
                </div>
              </div>
            </section>
          )}

          <section className="tabla-section">
            <h2>DETALLE POR COMUNIDAD</h2>
            <div className="table-scroll">
              <table className="data-table wide">
                <thead>
                  <tr>
                    <th rowSpan="3">N°</th>
                    <th rowSpan="3">Comunidad o Barrio</th>
                    <th colSpan="3">Fecha de Ejecución</th>
                    <th rowSpan="3">Total Habitantes</th>
                    <th rowSpan="3">Total Habitaciones</th>
                    <th colSpan="4">Viviendas</th>
                    <th colSpan="4">Indicador de Infestación</th>
                    <th colSpan="4">Indicador Infestación de Colonias</th>
                    <th colSpan="4">Viviendas Mejoradas</th>
                    <th colSpan="5">N° Ejemplares Capturados</th>
                    <th colSpan="8">Lugar de Captura</th>
                    <th colSpan="3">Punto Geográfico</th>
                    <th rowSpan="3">Ver Mapa</th>
                  </tr>
                  <tr>
                    <th rowSpan="2">Inicio</th>
                    <th rowSpan="2">Final</th>
                    <th rowSpan="2">Reg.</th>
                    <th rowSpan="2">Exist.</th>
                    <th rowSpan="2">Prog.</th>
                    <th rowSpan="2">Eval.</th>
                    <th rowSpan="2">% Cob</th>
                    <th rowSpan="2">Posit (+)</th>
                    <th rowSpan="2">% IV</th>
                    <th rowSpan="2">(+)&nbsp;Intra % III</th>
                    <th rowSpan="2">(+)&nbsp;Peri % IP</th>
                    <th rowSpan="2">Viviendas con Ninfas</th>
                    <th rowSpan="2">% IIC</th>
                    <th rowSpan="2">(+)&nbsp;Intra % CI</th>
                    <th rowSpan="2">(+)&nbsp;Peri % ICP</th>
                    <th colSpan="2">Intra</th>
                    <th colSpan="2">Peri</th>
                    <th colSpan="2">Intra</th>
                    <th colSpan="2">Peri</th>
                    <th rowSpan="2">Total</th>
                    <th colSpan="4">N° Intra</th>
                    <th colSpan="4">N° Peri</th>
                    <th rowSpan="2">Altura</th>
                    <th rowSpan="2">Latitud</th>
                    <th rowSpan="2">Longitud</th>
                  </tr>
                  <tr>
                    <th>SI</th>
                    <th>NO</th>
                    <th>SI</th>
                    <th>NO</th>
                    <th>N</th>
                    <th>A</th>
                    <th>N</th>
                    <th>A</th>
                    <th>PO</th>
                    <th>TH</th>
                    <th>CM</th>
                    <th>OT</th>
                    <th>CL</th>
                    <th>GA</th>
                    <th>CJ</th>
                    <th>Z/T</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluaciones.length > 0 ? (
                    evaluaciones.map((it, idx) => {
                      const habitantes = getFirst(
                        it,
                        [
                          "total_habitantes",
                          "habitantes",
                          "num_habitantes",
                          "numero_habitantes",
                        ],
                        0
                      );
                      const habitaciones = getFirst(
                        it,
                        [
                          "total_habitaciones",
                          "habitaciones",
                          "num_habitaciones",
                          "numero_habitaciones",
                        ],
                        0
                      );
                      return (
                        <tr key={it.id || idx}>
                          <td>{idx + 1}</td>
                          <td className="text-bold">
                            {it.comunidad || "N/A"}
                          </td>
                          <td className="text-center">
                            {it.fecha_inicio ||
                              it.fecha_ejecucion ||
                              "N/A"}
                          </td>
                          <td className="text-center">
                            {it.fecha_final ||
                              it.fecha_ejecucion ||
                              "N/A"}
                          </td>
                          <td className="text-center">
                            {it.fecha_ejecucion || "N/A"}
                          </td>
                          <td className="text-center">{habitantes}</td>
                          <td className="text-center">{habitaciones}</td>
                          <td className="text-center">
                            {getFirst(it, ["viviendas_existentes"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["viviendas_programadas"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["viviendas_revisadas"], 0)}
                          </td>
                          <td className="text-center">
                            {it.porc_cobertura || "0%"}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["viv_positivas"], 0)}
                          </td>
                          <td className="text-center">
                            {it.porc_iv || "0%"}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["viv_pos_intra"], 0)} (
                            {it.porc_iii || "0%"})
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["viv_pos_peri"], 0)} (
                            {it.porc_ip || "0%"})
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["viv_con_ninfas"], 0)}
                          </td>
                          <td className="text-center">
                            {it.porc_iic || "0%"}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["viv_ci_intra"], 0)} (
                            {it.porc_ci || "0%"})
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["viv_ci_peri"], 0)} (
                            {it.porc_icp || "0%"})
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["mej_intra_si"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["mej_intra_no"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["mej_peri_si"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["mej_peri_no"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["intra_n", "intra_ninfas"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["intra_a", "intra_adulta"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["peri_n", "peri_ninfa"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["peri_a", "peri_adulta"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["ejemplares_total"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["intra_pared"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["intra_techo"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["intra_cama"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["intra_otros"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["peri_corral"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["peri_gallinero"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["peri_conejera"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["peri_zarzo_troje"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["altura_prom"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["lat_prom"], 0)}
                          </td>
                          <td className="text-center">
                            {getFirst(it, ["lng_prom"], 0)}
                          </td>
                          <td className="text-center">
                            <BotonVerMapa
                              coordenadas={`${getFirst(
                                it,
                                ["lat_prom"],
                                0
                              )},${getFirst(
                                it,
                                ["lng_prom"],
                                0
                              )},${getFirst(
                                it,
                                ["altura_prom"],
                                0
                              )}`}
                              comunidad={it.comunidad || "Ubicación"}
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="40" className="text-center">
                        <div className="no-data-message">
                          📊 No hay datos para el período seleccionado
                          {municipioFiltro && municipioFiltro !== "Todos los municipios" &&
                            ` en el municipio "${municipioFiltro}"`}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                {evaluaciones.length > 0 && (
                  <tfoot>
                    <tr className="table-totales">
                      <td colSpan="5" className="text-bold">
                        TOTALES
                      </td>
                      <td className="text-center text-bold">
                        {tot.habitantes.toLocaleString()}
                      </td>
                      <td className="text-center text-bold">
                        {tot.habitaciones.toLocaleString()}
                      </td>
                      <td className="text-center text-bold">
                        {tot.viv_exist.toLocaleString()}
                      </td>
                      <td className="text-center text-bold">
                        {tot.viv_prog.toLocaleString()}
                      </td>
                      <td className="text-center text-bold">
                        {tot.viv_eval.toLocaleString()}
                      </td>
                      <td className="text-center text-bold">{cobertura}</td>
                      <td className="text-center text-bold">
                        {tot.viv_pos}
                      </td>
                      <td className="text-center text-bold">{iv}</td>
                      <td className="text-center text-bold">
                        {tot.viv_pos_intra} ({iii})
                      </td>
                      <td className="text-center text-bold">
                        {tot.viv_pos_peri} ({ip})
                      </td>
                      <td className="text-center text-bold">
                        {tot.viv_con_ninfas}
                      </td>
                      <td className="text-center text-bold">{iic}</td>
                      <td className="text-center text-bold">
                        {tot.viv_ci_intra} ({ci})
                      </td>
                      <td className="text-center text-bold">
                        {tot.viv_ci_peri} ({icp})
                      </td>
                      <td className="text-center text-bold">
                        {tot.mej_intra_si}
                      </td>
                      <td className="text-center text-bold">
                        {tot.mej_intra_no}
                      </td>
                      <td className="text-center text-bold">
                        {tot.mej_peri_si}
                      </td>
                      <td className="text-center text-bold">
                        {tot.mej_peri_no}
                      </td>
                      <td className="text-center text-bold">
                        {tot.intra_n}
                      </td>
                      <td className="text-center text-bold">
                        {tot.intra_a}
                      </td>
                      <td className="text-center text-bold">
                        {tot.peri_n}
                      </td>
                      <td className="text-center text-bold">
                        {tot.peri_a}
                      </td>
                      <td className="text-center text-bold">
                        {tot.ejemplares}
                      </td>
                      <td className="text-center text-bold">
                        {tot.intra_pared}
                      </td>
                      <td className="text-center text-bold">
                        {tot.intra_techo}
                      </td>
                      <td className="text-center text-bold">
                        {tot.intra_cama}
                      </td>
                      <td className="text-center text-bold">
                        {tot.intra_otros}
                      </td>
                      <td className="text-center text-bold">
                        {tot.peri_corral}
                      </td>
                      <td className="text-center text-bold">
                        {tot.peri_gallinero}
                      </td>
                      <td className="text-center text-bold">
                        {tot.peri_conejera}
                      </td>
                      <td className="text-center text-bold">
                        {tot.peri_zarzo_troje}
                      </td>
                      <td colSpan="4"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>

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

          <footer className="report-footer">
            <div className="footer-info">
              <div className="footer-item">
                <strong>Generado:</strong>{" "}
                {new Date().toLocaleDateString("es-ES")}
              </div>
              <div className="footer-item">
                <strong>Período:</strong>{" "}
                {verTodos
                  ? "Todos los registros (últimos 10 años)"
                  : `${fechaInicio} a ${fechaFin}`}
              </div>
              <div className="footer-item">
                <strong>Municipio:</strong>{" "}
                {municipioFiltro && municipioFiltro !== "Todos los municipios" ? municipioFiltro : "Todos"}
              </div>
              <div className="footer-item">
                <strong>Registros:</strong> {evaluaciones.length}
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}