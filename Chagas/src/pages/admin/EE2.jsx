import React, { useState, useEffect, useRef } from "react";
import { useRouteAccess } from "../AuthContext";
import SinAcceso from "../SinAcceso";
import "../../css/EE2.css";
import { baseUrl } from "../../api/BaseUrl"; 

const MapaModal = ({ coordenadas = "", comunidad = "Ubicación", onClose }) => {
  const [leafletReady, setLeafletReady] = useState(!!window.L);
  const [navOn, setNavOn] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    const cssId = "leaflet-css-ee2";
    const jsId = "leaflet-js-ee2";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId; link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = ""; document.head.appendChild(link);
    }
    if (!document.getElementById(jsId)) {
      const script = document.createElement("script");
      script.id = jsId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
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

  const parsed = String(coordenadas).split(",").map((c) => parseFloat(String(c).trim()));
  const valid = parsed.length >= 2 && !isNaN(parsed[0]) && !isNaN(parsed[1]);
  const [lat, lng, alt] = valid ? parsed : [null, null, null];

  const setMapInteractions = (enabled) => {
    if (!mapRef.current) return;
    const m = mapRef.current;
    if (enabled) {
      m.dragging.enable(); m.scrollWheelZoom.enable(); m.doubleClickZoom.enable();
      m.boxZoom.enable(); m.keyboard.enable(); m.touchZoom?.enable(); m.tap?.enable?.();
    } else {
      m.dragging.disable(); m.scrollWheelZoom.disable(); m.doubleClickZoom.disable();
      m.boxZoom.disable(); m.keyboard.disable(); m.touchZoom?.disable(); m.tap?.disable?.();
    }
  };

  useEffect(() => {
    if (!leafletReady || !valid) return;
    const L = window.L;

    if (!mapRef.current) {
      mapRef.current = L.map("mapa-modal", {
        center: [lat, lng], zoom: 15, zoomControl: true, preferCanvas: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors", maxZoom: 19,
      }).addTo(mapRef.current);

      const cont = mapRef.current.getContainer();
      ["mousedown","mouseup","click","dblclick","contextmenu","touchstart","touchend"]
        .forEach(evt => cont.addEventListener(evt, (e)=>e.stopPropagation(), { passive:true }));

      setMapInteractions(false);
    }

    const popupHTML = `
      <div style="text-align:center;min-width:200px;">
        <h3 style="color:#e53e3e;margin:0 0 8px;font-size:16px;font-weight:700">📍 ${comunidad}</h3>
        <hr style="border:none;height:2px;background:linear-gradient(135deg,#e53e3e 0%,#c53030 100%);margin:8px 0;border-radius:1px;">
        <div style="text-align:left;font-size:13px;">
          <strong>Coordenadas:</strong><br/>
          📍 Lat: ${lat.toFixed(6)}<br/>
          📍 Lon: ${lng.toFixed(6)}<br/>
          ${!isNaN(alt) ? `<strong>Altura:</strong> ${alt} m` : ""}
        </div>
      </div>`.trim();

    if (!markerRef.current) {
      markerRef.current = window.L.marker([lat, lng]).addTo(mapRef.current).bindPopup(popupHTML).openPopup();
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
  useEffect(() => () => { mapRef.current?.remove(); mapRef.current = null; markerRef.current = null; }, []);

  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };
  const stopPointer = (e) => e.stopPropagation();

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={handleOverlayClick}
         onMouseDown={stopPointer} onTouchStart={stopPointer}>
      <div className="modal-content" onClick={stopPointer} onMouseDown={stopPointer} onTouchStart={stopPointer}>
        <div className="modal-header">
          <h2>🗺️ Mapa de Ubicación - {comunidad}</h2>
          <div className="modal-actions">
            <button
              className={`toggle-nav-btn ${navOn ? "on" : "off"}`}
              onClick={() => setNavOn(v => !v)}
              title={navOn ? "Bloquear navegación del mapa" : "Permitir mover/zoom del mapa"}
            >
              {navOn ? "🔓 Navegar" : "🔒 Bloquear"}
            </button>
            <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>
        </div>

        <div className="modal-body">
          {valid ? (
            <>
              <div className="coordenadas-info">
                <div className="coordenadas-item"><strong>📍 Latitud:</strong> {lat.toFixed(6)}</div>
                <div className="coordenadas-item"><strong>📍 Longitud:</strong> {lng.toFixed(6)}</div>
                {!isNaN(alt) && <div className="coordenadas-item"><strong>📏 Altura:</strong> {alt} m</div>}
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
              <p>Las coordenadas proporcionadas no son válidas para mostrar en el mapa.</p>
              <div className="coordenadas-raw"><strong>Datos crudos:</strong> {coordenadas}</div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cerrar" onClick={onClose}>Cerrar Mapa</button>
        </div>
      </div>
    </div>
  );
};

const BotonVerMapa = ({ coordenadas, comunidad }) => {
  const [showModal, setShowModal] = useState(false);
  if (!coordenadas || coordenadas.trim() === "") return <span className="badge badge-muted">N/A</span>;
  const coords = coordenadas.split(",").map((c) => parseFloat(String(c).trim()));
  const ok = coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1]);
  if (!ok) return <span className="badge badge-danger">Inválidas</span>;
  return (
    <>
      <button
        className="btn-ver-mapa-modal"
        onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
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
  const { hasAccess, isLoading: accessLoading } = useRouteAccess(["jefe_grupo", "administrador"]);

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

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [municipioId, setMunicipioId] = useState("");
  const [sedeId, setSedeId] = useState("");
  const [redId, setRedId] = useState("");
  const [establecimientoId, setEstablecimientoId] = useState("");

  const [municipios, setMunicipios] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [redes, setRedes] = useState([]);
  const [establecimientos, setEstablecimientos] = useState([]);

  const [evaluaciones, setEvaluaciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getFirst = (obj, names, def = 0) => {
    for (const n of names) {
      if (obj[n] !== undefined && obj[n] !== null) return obj[n];
    }
    return def;
  };

  useEffect(() => {
    const hoy = new Date();
    const hace30 = new Date(hoy);
    hace30.setDate(hoy.getDate() - 30);
    setFechaInicio(hace30.toISOString().split("T")[0]);
    setFechaFin(hoy.toISOString().split("T")[0]);
    cargarMunicipios();
    cargarSedesRedesEstabs();
  }, []);

  const cargarMunicipios = async () => {
    try {
      const r = await fetch(`${baseUrl}/api/ee2/municipios`);
      const data = await r.json();
      if (data.success) setMunicipios(data.data);
    } catch (e) { console.log("Error municipios:", e); }
  };

  const cargarSedesRedesEstabs = async () => {
    try {
      const [s, r, e] = await Promise.all([
        fetch(`${baseUrl}/api/ee1/options/sedes`),
        fetch(`${baseUrl}/api/ee1/options/redes-salud`),
        fetch(`${baseUrl}/api/ee1/options/establecimientos`),
      ]);
      const sd = await s.json(); const rd = await r.json(); const ed = await e.json();
      if (sd.success) setSedes(sd.data);
      if (rd.success) setRedes(rd.data);
      if (ed.success) setEstablecimientos(ed.data);
    } catch (err) { console.log("Error combos S/R/E:", err); }
  };

  const redesFiltradas = redId || sedeId
    ? redes.filter((x) => (sedeId ? x.sede_id === parseInt(sedeId) : true))
    : redes;

  const estabsFiltrados = establecimientoId || redId
    ? establecimientos.filter((x) => (redId ? x.redsalud_id === parseInt(redId) : true))
    : establecimientos;

  useEffect(() => {
    if (!fechaInicio || !fechaFin) return;
    const t = setTimeout(() => cargarDatos(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin, municipioId, sedeId, redId, establecimientoId]);

  const cargarDatos = async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({
        fechaInicio, fechaFin,
        municipioId: municipioId || "",
        sedeId: sedeId || "",
        redId: redId || "",
        establecimientoId: establecimientoId || "",
      });

      const [statsRes, evalRes] = await Promise.all([
        fetch(`${baseUrl}/api/ee2/estadisticas?${params}`),
        fetch(`${baseUrl}/api/ee2/evaluaciones?${params}`),
      ]);

      if (!statsRes.ok) throw new Error("Error al cargar estadísticas");
      if (!evalRes.ok) throw new Error("Error al cargar evaluaciones");

      const statsData = await statsRes.json();
      const evalData = await evalRes.json();

      if (statsData?.success) setEstadisticas(statsData.data);
      if (evalData?.success) setEvaluaciones(evalData.data);
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError("Error de conexión con el servidor: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const tot = evaluaciones.reduce((a, it) => {
    const habitantes = getFirst(it, ["total_habitantes","habitantes","num_habitantes","numero_habitantes"], 0);
    const habitaciones = getFirst(it, ["total_habitaciones","habitaciones","num_habitaciones","numero_habitaciones"], 0);

    a.habitantes += Number(habitantes) || 0;
    a.habitaciones += Number(habitaciones) || 0;

    a.viv_exist += Number(getFirst(it, ["viviendas_existentes"], 0)) || 0;
    a.viv_prog  += Number(getFirst(it, ["viviendas_programadas"], 0)) || 0;
    a.viv_eval  += Number(getFirst(it, ["viviendas_revisadas"], 0)) || 0;

    a.viv_pos += Number(getFirst(it, ["viv_positivas"], 0)) || 0;
    a.viv_pos_intra += Number(getFirst(it, ["viv_pos_intra"], 0)) || 0;
    a.viv_pos_peri  += Number(getFirst(it, ["viv_pos_peri"], 0)) || 0;

    a.viv_con_ninfas += Number(getFirst(it, ["viv_con_ninfas"], 0)) || 0;
    a.viv_ci_intra  += Number(getFirst(it, ["viv_ci_intra"], 0)) || 0;
    a.viv_ci_peri   += Number(getFirst(it, ["viv_ci_peri"], 0)) || 0;

    a.mej_intra_si += Number(getFirst(it, ["mej_intra_si"], 0)) || 0;
    a.mej_intra_no += Number(getFirst(it, ["mej_intra_no"], 0)) || 0;
    a.mej_peri_si  += Number(getFirst(it, ["mej_peri_si"], 0)) || 0;
    a.mej_peri_no  += Number(getFirst(it, ["mej_peri_no"], 0)) || 0;

    a.intra_n += Number(getFirst(it, ["intra_n","intra_ninfas"], 0)) || 0;
    a.intra_a += Number(getFirst(it, ["intra_a","intra_adulta"], 0)) || 0;
    a.peri_n  += Number(getFirst(it, ["peri_n","peri_ninfa"], 0)) || 0;
    a.peri_a  += Number(getFirst(it, ["peri_a","peri_adulta"], 0)) || 0;
    a.ejemplares += Number(getFirst(it, ["ejemplares_total"], 0)) || 0;

    a.intra_pared  += Number(getFirst(it, ["intra_pared"], 0)) || 0;
    a.intra_techo  += Number(getFirst(it, ["intra_techo"], 0)) || 0;
    a.intra_cama   += Number(getFirst(it, ["intra_cama"], 0)) || 0;
    a.intra_otros  += Number(getFirst(it, ["intra_otros"], 0)) || 0;

    a.peri_corral     += Number(getFirst(it, ["peri_corral"], 0)) || 0;
    a.peri_gallinero  += Number(getFirst(it, ["peri_gallinero"], 0)) || 0;
    a.peri_conejera   += Number(getFirst(it, ["peri_conejera"], 0)) || 0;
    a.peri_zarzo_troje+= Number(getFirst(it, ["peri_zarzo_troje"], 0)) || 0;

    return a;
  }, {
    habitantes:0, habitaciones:0,
    viv_exist:0, viv_prog:0, viv_eval:0,
    viv_pos:0, viv_pos_intra:0, viv_pos_peri:0,
    viv_con_ninfas:0, viv_ci_intra:0, viv_ci_peri:0,
    mej_intra_si:0, mej_intra_no:0, mej_peri_si:0, mej_peri_no:0,
    intra_n:0, intra_a:0, peri_n:0, peri_a:0, ejemplares:0,
    intra_pared:0, intra_techo:0, intra_cama:0, intra_otros:0,
    peri_corral:0, peri_gallinero:0, peri_conejera:0, peri_zarzo_troje:0,
  });

  const pct = (num, den) => den > 0 ? ((num / den) * 100).toFixed(0) + "%" : "—";
  const cobertura = pct(tot.viv_eval, tot.viv_exist);
  const iv  = pct(tot.viv_pos, tot.viv_eval);
  const iii = pct(tot.viv_pos_intra, tot.viv_eval);
  const ip  = pct(tot.viv_pos_peri,  tot.viv_eval);
  const iic = pct(tot.viv_con_ninfas, tot.viv_eval);
  const ci  = pct(tot.viv_ci_intra, tot.viv_eval);
  const icp = pct(tot.viv_ci_peri,  tot.viv_eval);

  const nombreMunicipio = (id) => {
    if (!id) return "Todos";
    const m = municipios.find((x) => x.municipio_id === parseInt(id));
    return m ? m.nombre_municipio : "Todos";
  };

  return (
    <div className="ee2-container">
      <div className="cabecera-form">
        <div className="fila">
          <div className="campo ancho-2">
            <label>Servicio Departamental de Salud</label>
            <div className="campo-valor">
              <select value={sedeId} onChange={(e) => { setSedeId(e.target.value); setRedId(""); setEstablecimientoId(""); }}>
                <option value="">Todos</option>
                {sedes.map((s) => (<option key={s.id} value={s.id}>{s.nombre}</option>))}
              </select>
            </div>
          </div>
          <div className="campo ancho-2">
            <label>Red de Salud</label>
            <div className="campo-valor">
              <select value={redId} onChange={(e) => { setRedId(e.target.value); setEstablecimientoId(""); }}>
                <option value="">Todas</option>
                {redesFiltradas.map((r) => (<option key={r.id} value={r.id}>{r.nombre}</option>))}
              </select>
            </div>
          </div>
          <div className="campo ancho-2">
            <label>Establecimiento de Salud</label>
            <div className="campo-valor">
              <select value={establecimientoId} onChange={(e) => setEstablecimientoId(e.target.value)}>
                <option value="">Todos</option>
                {estabsFiltrados.map((es) => (
                  <option key={es.id} value={es.id}>{es.nombre} ({es.tipo})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="campo ancho-2">
            <label>Municipio</label>
            <div className="campo-valor">
              <select value={municipioId} onChange={(e) => setMunicipioId(e.target.value)}>
                <option value="">Todos</option>
                {municipios.map((m) => (
                  <option key={m.municipio_id} value={m.municipio_id}>{m.nombre_municipio}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="fila">
          <div className="campo ancho-2">
            <label>Fecha Inicio</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div className="campo ancho-2">
            <label>Fecha Fin</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
          <div className="campo ancho-2"></div>
          <div className="campo ancho-2"></div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button onClick={() => setError("")} className="close-btn">×</button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-message">⏳ Cargando consolidado...</div>
        </div>
      ) : (
        <>
          {estadisticas && (
            <section className="resumen-section">
              <h2>RESUMEN</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">🏠</div>
                  <div className="stat-info">
                    <div className="stat-value">{estadisticas.total?.toLocaleString() || 0}</div>
                    <div className="stat-label">Eval. registradas</div>
                    <div className="stat-subtext">{nombreMunicipio(municipioId)}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <div className="stat-value">{estadisticas.positivas || 0}</div>
                    <div className="stat-label">Positivas</div>
                    <div className="stat-subtext">{estadisticas.porc}% infestación</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🐛</div>
                  <div className="stat-info">
                    <div className="stat-value">{estadisticas.capturas?.toLocaleString() || 0}</div>
                    <div className="stat-label">Ejemplares</div>
                    <div className="stat-subtext">
                      Intra: {(estadisticas.intraN + estadisticas.intraA) || 0} · Peri: {(estadisticas.periN + estadisticas.periA) || 0}
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👪</div>
                  <div className="stat-info">
                    <div className="stat-value">{estadisticas.habitantes?.toLocaleString() || 0}</div>
                    <div className="stat-label">Habitantes</div>
                    <div className="stat-subtext">{estadisticas.habitaciones || 0} habitaciones</div>
                  </div>
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
                    <th>SI</th><th>NO</th>
                    <th>SI</th><th>NO</th>

                    <th>N</th><th>A</th>
                    <th>N</th><th>A</th>

                    <th>PO</th><th>TH</th><th>CM</th><th>OT</th>
                    <th>CL</th><th>GA</th><th>CJ</th><th>Z/T</th>
                  </tr>
                </thead>

                <tbody>
                  {evaluaciones.length > 0 ? (
                    evaluaciones.map((it, idx) => {
                      const habitantes = getFirst(it, ["total_habitantes","habitantes","num_habitantes","numero_habitantes"], 0);
                      const habitaciones = getFirst(it, ["total_habitaciones","habitaciones","num_habitaciones","numero_habitaciones"], 0);
                      return (
                        <tr key={it.id || idx}>
                          <td>{idx + 1}</td>
                          <td className="text-bold">{it.comunidad || "N/A"}</td>

                          <td className="text-center">{it.fecha_inicio || it.fecha_ejecucion || "N/A"}</td>
                          <td className="text-center">{it.fecha_final || it.fecha_ejecucion || "N/A"}</td>
                          <td className="text-center">{it.fecha_ejecucion || "N/A"}</td>

                          <td className="text-center">{habitantes}</td>
                          <td className="text-center">{habitaciones}</td>

                          <td className="text-center">{getFirst(it, ["viviendas_existentes"], 0)}</td>
                          <td className="text-center">{getFirst(it, ["viviendas_programadas"], 0)}</td>
                          <td className="text-center">{getFirst(it, ["viviendas_revisadas"], 0)}</td>
                          <td className="text-center">{it.porc_cobertura || "0%"}</td>

                          <td className="text-center">{getFirst(it, ["viv_positivas"], 0)}</td>
                          <td className="text-center">{it.porc_iv || "0%"}</td>
                          <td className="text-center">{getFirst(it, ["viv_pos_intra"], 0)} ({it.porc_iii || "0%"})</td>
                          <td className="text-center">{getFirst(it, ["viv_pos_peri"], 0)} ({it.porc_ip || "0%"})</td>

                          <td className="text-center">{getFirst(it, ["viv_con_ninfas"], 0)}</td>
                          <td className="text-center">{it.porc_iic || "0%"}</td>
                          <td className="text-center">{getFirst(it, ["viv_ci_intra"], 0)} ({it.porc_ci || "0%"})</td>
                          <td className="text-center">{getFirst(it, ["viv_ci_peri"], 0)} ({it.porc_icp || "0%"})</td>

                          <td className="text-center">{getFirst(it, ["mej_intra_si"], 0)}</td>
                          <td className="text-center">{getFirst(it, ["mej_intra_no"], 0)}</td>
                          <td className="text-center">{getFirst(it, ["mej_peri_si"], 0)}</td>
                          <td className="text-center">{getFirst(it, ["mej_peri_no"], 0)}</td>

                          <td className="text-center">{getFirst(it, ["intra_n","intra_ninfas"], 0)}</td>
                          <td className="text-center">{getFirst(it, ["intra_a","intra_adulta"], 0)}</td>
                          <td className="text-center">{getFirst(it, ["peri_n","peri_ninfa"], 0)}</td>
                          <td className="text-center">{getFirst(it, ["peri_a","peri_adulta"], 0)}</td>
                          <td className="text-center">{getFirst(it, ["ejemplares_total"], 0)}</td>

                          <td className="text-center">{getFirst(it, ["intra_pared"], 0)}</td>
                          <td className="text-center">{getFirst(it, ["intra_techo"], 0)}</td>
                          <td className="text-center">{getFirst(it, ["intra_cama"], 0)}</td>
                          <td className="text-center">{getFirst(it, ["intra_otros"], 0)}</td>

                          <td className="text-center">{getFirst(it, ["peri_corral"], 0)}</td>
                          <td className="text-center">{getFirst(it, ["peri_gallinero"], 0)}</td>
                          <td className="text-center">{getFirst(it, ["peri_conejera"], 0)}</td>
                          <td className="text-center">{getFirst(it, ["peri_zarzo_troje"], 0)}</td>

                          <td className="text-center">{getFirst(it, ["altura_prom"], 0)}</td>
                          <td className="text-center">{getFirst(it, ["lat_prom"], 0)}</td>
                          <td className="text-center">{getFirst(it, ["lng_prom"], 0)}</td>

                          <td className="text-center">
                            <BotonVerMapa
                              coordenadas={`${getFirst(it, ["lat_prom"], 0)},${getFirst(it, ["lng_prom"], 0)},${getFirst(it, ["altura_prom"], 0)}`}
                              comunidad={it.comunidad || "Ubicación"}
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="40" className="text-center">
                        <div className="no-data-message">📊 No hay datos para el período seleccionado</div>
                      </td>
                    </tr>
                  )}
                </tbody>

                {evaluaciones.length > 0 && (
                  <tfoot>
                    <tr className="table-totals">
                      <td colSpan="5" className="text-bold">TOTALES</td>

                      <td className="text-center text-bold">{tot.habitantes.toLocaleString()}</td>
                      <td className="text-center text-bold">{tot.habitaciones.toLocaleString()}</td>

                      <td className="text-center text-bold">{tot.viv_exist.toLocaleString()}</td>
                      <td className="text-center text-bold">{tot.viv_prog.toLocaleString()}</td>
                      <td className="text-center text-bold">{tot.viv_eval.toLocaleString()}</td>
                      <td className="text-center text-bold">{cobertura}</td>

                      <td className="text-center text-bold">{tot.viv_pos}</td>
                      <td className="text-center text-bold">{iv}</td>
                      <td className="text-center text-bold">{tot.viv_pos_intra} ({iii})</td>
                      <td className="text-center text-bold">{tot.viv_pos_peri} ({ip})</td>

                      <td className="text-center text-bold">{tot.viv_con_ninfas}</td>
                      <td className="text-center text-bold">{iic}</td>
                      <td className="text-center text-bold">{tot.viv_ci_intra} ({ci})</td>
                      <td className="text-center text-bold">{tot.viv_ci_peri} ({icp})</td>

                      <td className="text-center text-bold">{tot.mej_intra_si}</td>
                      <td className="text-center text-bold">{tot.mej_intra_no}</td>
                      <td className="text-center text-bold">{tot.mej_peri_si}</td>
                      <td className="text-center text-bold">{tot.mej_peri_no}</td>

                      <td className="text-center text-bold">{tot.intra_n}</td>
                      <td className="text-center text-bold">{tot.intra_a}</td>
                      <td className="text-center text-bold">{tot.peri_n}</td>
                      <td className="text-center text-bold">{tot.peri_a}</td>
                      <td className="text-center text-bold">{tot.ejemplares}</td>

                      <td className="text-center text-bold">{tot.intra_pared}</td>
                      <td className="text-center text-bold">{tot.intra_techo}</td>
                      <td className="text-center text-bold">{tot.intra_cama}</td>
                      <td className="text-center text-bold">{tot.intra_otros}</td>
                      <td className="text-center text-bold">{tot.peri_corral}</td>
                      <td className="text-center text-bold">{tot.peri_gallinero}</td>
                      <td className="text-center text-bold">{tot.peri_conejera}</td>
                      <td className="text-center text-bold">{tot.peri_zarzo_troje}</td>

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
              <div className="footer-item"><strong>Generado:</strong> {new Date().toLocaleDateString("es-ES")}</div>
              <div className="footer-item"><strong>Período:</strong> {fechaInicio} a {fechaFin}</div>
              <div className="footer-item"><strong>Municipio:</strong> {nombreMunicipio(municipioId)}</div>
              <div className="footer-item"><strong>Registros:</strong> {evaluaciones.length}</div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}