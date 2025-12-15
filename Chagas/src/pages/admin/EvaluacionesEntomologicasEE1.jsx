import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../../css/EE1.css";
import { useAuth } from "../AuthContext";
import { useRouteAccess } from "../AuthContext";
import SinAcceso from "../SinAcceso";
import { baseUrl } from "../../api/BaseUrl";

/* ============================== Leaflet: icono ============================== */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

/* ============================== Constantes ============================== */
const DEFAULT_CENTER = { lat: -17.3895, lng: -66.1568, altura: 0 };
const API_URL = `${baseUrl}/api`;

/**
 * Campos que SÍ o SÍ deben llenarse cuando el resultado es POSITIVO
 * (SIN fecha_programada ni hora_programada)
 */
const POSITIVE_FIELDS = [
  "intra_ninfas",
  "intra_adulta",
  "peri_ninfa",
  "peri_adulta",
  "intra_pared",
  "intra_techo",
  "intra_cama",
  "intra_otros",
  "peri_pared",
  "peri_corral",
  "peri_gallinero",
  "peri_conejera",
  "peri_zarzo_troje",
  "peri_otros",
];

/**
 * Objeto base vacío para cuando se cambia a "positivo"
 * (SIN fecha_programada ni hora_programada)
 */
const EMPTY_POSITIVE_BLOCK = {
  intra_ninfas: "",
  intra_adulta: "",
  peri_ninfa: "",
  peri_adulta: "",
  intra_pared: "",
  intra_techo: "",
  intra_cama: "",
  intra_otros: "",
  peri_pared: "",
  peri_corral: "",
  peri_gallinero: "",
  peri_conejera: "",
  peri_zarzo_troje: "",
  peri_otros: "",
};

/* ============================== Altura ============================== */
const obtenerAltura = async (lat, lng) => {
  try {
    const r = await fetch(
      `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`
    );
    const j = await r.json();
    if (j.results && j.results.length > 0) {
      return Math.round(j.results[0].elevation);
    }
  } catch (e) {
    console.error("Error obteniendo altura:", e);
  }
  return 0;
};

/* ============================== Control de Mapa ============================== */
function MapController({ markerPos, setMarkerPos, onPositionChange, centerMap }) {
  const markerRef = useRef(null);

  const updateInputs = (latlng) => {
    const newPos = { lat: latlng.lat, lng: latlng.lng, altura: markerPos.altura };
    setMarkerPos(newPos);
    onPositionChange(newPos);
  };

  useEffect(() => {
    if (centerMap && markerRef.current) {
      const marker = markerRef.current;
      const map = marker._map;
      if (map) map.setView(marker.getLatLng(), 17);
    }
  }, [centerMap]);

  useMapEvents({
    click(e) {
      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
        updateInputs(e.latlng);
      }
    },
  });

  return (
    <Marker
      draggable
      position={[markerPos.lat, markerPos.lng]}
      ref={markerRef}
      eventHandlers={{
        dragend: () => {
          const m = markerRef.current;
          if (m) updateInputs(m.getLatLng());
        },
      }}
    />
  );
}

/* ============================== Página ============================== */
const EvaluacionesEntomologicasEE1 = () => {
  const mapRef = useRef(null);
  const formRef = useRef(null);
  const [centerTrigger, setCenterTrigger] = useState(0);
  const { usuario, isAuthenticated } = useAuth();

  // Verificar acceso usando el hook de rutas - SOLO PARA ROLES ESPECÍFICOS
  const { hasAccess, isLoading: accessLoading } = useRouteAccess(["tecnico", "jefe_grupo", "administrador", "supervisor"]);

  /* ------------------------------ Estados base ------------------------------ */
  const [evalData, setEvalData] = useState({
    tecnico_id: "",
    municipio_id: "",
    comunidad_id: "",
    jefe_familia: "",
    hora_inicio: "",
    hora_final: "",
    hora_total: "",
    numero_habitantes: "",
    numero_habitaciones: "",
    fecha_ultimo_rociado: "",
    vivienda_mejorada_intra: false,
    vivienda_mejorada_peri: false,
    fecha_evaluacion: "",
    numero_vivienda: "",
    latitud: DEFAULT_CENTER.lat,
    longitud: DEFAULT_CENTER.lng,
    altura: DEFAULT_CENTER.altura,
    resultado: "negativo",
    sede_id: "",
    redsalud_id: "",
    establecimiento_id: "",
  });

  const [ee1Data, setEe1Data] = useState({ ...EMPTY_POSITIVE_BLOCK });

  // 1 obligatorio + hasta 3 opcionales
  const [jefesGrupo, setJefesGrupo] = useState([
    { id: "jefe1", jefe_grupo_id: "", esObligatorio: true },
  ]);

  // Imagen
  const [fotoArchivo, setFotoArchivo] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [fotoExistente, setFotoExistente] = useState("");

  // Combos
  const [tecnicos, setTecnicos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [comunidadesFiltradas, setComunidadesFiltradas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [redesSalud, setRedesSalud] = useState([]);
  const [establecimientos, setEstablecimientos] = useState([]);
  const [redesFiltradas, setRedesFiltradas] = useState([]);
  const [establecimientosFiltrados, setEstablecimientosFiltrados] = useState([]);
  const [jefesGrupoOpciones, setJefesGrupoOpciones] = useState([]);

  const [registros, setRegistros] = useState([]);
  const [markerPos, setMarkerPos] = useState({
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
    altura: DEFAULT_CENTER.altura,
  });
  const [cargandoAltura, setCargandoAltura] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [cargandoOpciones, setCargandoOpciones] = useState({
    tecnicos: false,
    municipios: false,
    comunidades: false,
    sedes: false,
    redes: false,
    establecimientos: false,
    jefesGrupo: false,
  });

  const [editId, setEditId] = useState(null);
  const [fechaError, setFechaError] = useState("");

  // Nuevos estados para VER y ELIMINAR
  const [verData, setVerData] = useState(null);

  const irArriba = () => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  /* ------------------------------ Carga de combos ------------------------------ */
  const cargarTecnicos = async () => {
    try {
      setCargandoOpciones((p) => ({ ...p, tecnicos: true }));
      const r = await fetch(`${API_URL}/ee1/options/tecnicos`);
      const j = await r.json();
      if (j.success) setTecnicos(j.data);
    } catch (e) {
      setError("Error de conexión al cargar técnicos");
    } finally {
      setCargandoOpciones((p) => ({ ...p, tecnicos: false }));
    }
  };

  const cargarMunicipios = async () => {
    try {
      setCargandoOpciones((p) => ({ ...p, municipios: true }));
      const r = await fetch(`${API_URL}/ee1/options/municipios`);
      const j = await r.json();
      if (j.success) setMunicipios(j.data);
    } catch (e) {
      setError("Error de conexión al cargar municipios");
    } finally {
      setCargandoOpciones((p) => ({ ...p, municipios: false }));
    }
  };

  const cargarComunidades = async () => {
    try {
      setCargandoOpciones((p) => ({ ...p, comunidades: true }));
      const r = await fetch(`${API_URL}/ee1/options/comunidades`);
      const j = await r.json();
      if (j.success) setComunidades(j.data);
    } catch (e) {
      setError("Error de conexión al cargar comunidades");
    } finally {
      setCargandoOpciones((p) => ({ ...p, comunidades: false }));
    }
  };

  const cargarSedes = async () => {
    try {
      setCargandoOpciones((p) => ({ ...p, sedes: true }));
      const r = await fetch(`${API_URL}/ee1/options/sedes`);
      const j = await r.json();
      if (j.success) setSedes(j.data);
    } catch (e) {
      setError("Error de conexión al cargar sedes");
    } finally {
      setCargandoOpciones((p) => ({ ...p, sedes: false }));
    }
  };

  const cargarRedesSalud = async () => {
    try {
      setCargandoOpciones((p) => ({ ...p, redes: true }));
      const r = await fetch(`${API_URL}/ee1/options/redes-salud`);
      const j = await r.json();
      if (j.success) setRedesSalud(j.data);
    } catch (e) {
      setError("Error de conexión al cargar redes de salud");
    } finally {
      setCargandoOpciones((p) => ({ ...p, redes: false }));
    }
  };

  const cargarEstablecimientos = async () => {
    try {
      setCargandoOpciones((p) => ({ ...p, establecimientos: true }));
      const r = await fetch(`${API_URL}/ee1/options/establecimientos`);
      const j = await r.json();
      if (j.success) setEstablecimientos(j.data);
    } catch (e) {
      setError("Error de conexión al cargar establecimientos");
    } finally {
      setCargandoOpciones((p) => ({ ...p, establecimientos: false }));
    }
  };

  const cargarJefesGrupo = async () => {
    try {
      setCargandoOpciones((p) => ({ ...p, jefesGrupo: true }));
      const r = await fetch(`${API_URL}/ee1/options/jefes-grupo`);
      const j = await r.json();
      if (j.success) setJefesGrupoOpciones(j.data);
    } catch (e) {
      setError("Error de conexión al cargar jefes de grupo");
    } finally {
      setCargandoOpciones((p) => ({ ...p, jefesGrupo: false }));
    }
  };

  useEffect(() => {
    cargarTecnicos();
    cargarMunicipios();
    cargarComunidades();
    cargarSedes();
    cargarRedesSalud();
    cargarEstablecimientos();
    cargarJefesGrupo();
  }, []);

  /* ------------------------------ Usuario ------------------------------ */
  const userInfo = usuario || {};
  const userName = userInfo.nombre_completo || "Usuario no identificado";
  const userRole = userInfo.rol || "No especificado";
  const userId = userInfo.usuario_id || "N/A";

  useEffect(() => {
    if (isAuthenticated && userInfo.usuario_id) {
      setEvalData((p) => ({ ...p, tecnico_id: String(userInfo.usuario_id) }));
    }
  }, [isAuthenticated, userInfo]);

  /* -------------------- Dependencias (municipio/sede/red) -------------------- */
  useEffect(() => {
    if (evalData.municipio_id && comunidades.length > 0) {
      const f = comunidades.filter(
        (c) => c.municipio_id === parseInt(evalData.municipio_id)
      );
      setComunidadesFiltradas(f);
      if (evalData.comunidad_id) {
        const actual = comunidades.find(
          (c) => c.id === parseInt(evalData.comunidad_id)
        );
        if (actual && actual.municipio_id !== parseInt(evalData.municipio_id)) {
          setEvalData((p) => ({ ...p, comunidad_id: "" }));
        }
      }
    } else {
      setComunidadesFiltradas(comunidades);
    }
  }, [evalData.municipio_id, evalData.comunidad_id, comunidades]);

  useEffect(() => {
    if (evalData.sede_id && redesSalud.length > 0) {
      const f = redesSalud.filter(
        (r) => r.sede_id === parseInt(evalData.sede_id)
      );
      setRedesFiltradas(f);
      if (evalData.redsalud_id) {
        const actual = redesSalud.find(
          (r) => r.id === parseInt(evalData.redsalud_id)
        );
        if (actual && actual.sede_id !== parseInt(evalData.sede_id)) {
          setEvalData((p) => ({ ...p, redsalud_id: "", establecimiento_id: "" }));
        }
      } else {
        setEvalData((p) => ({ ...p, redsalud_id: "", establecimiento_id: "" }));
      }
    } else {
      setRedesFiltradas(redesSalud);
      setEvalData((p) => ({ ...p, redsalud_id: "", establecimiento_id: "" }));
    }
  }, [evalData.sede_id, evalData.redsalud_id, redesSalud]);

  useEffect(() => {
    if (evalData.redsalud_id && establecimientos.length > 0) {
      const f = establecimientos.filter(
        (e) => e.redsalud_id === parseInt(evalData.redsalud_id)
      );
      setEstablecimientosFiltrados(f);
      if (evalData.establecimiento_id) {
        const actual = establecimientos.find(
          (e) => e.id === parseInt(evalData.establecimiento_id)
        );
        if (actual && actual.redsalud_id !== parseInt(evalData.redsalud_id)) {
          setEvalData((p) => ({ ...p, establecimiento_id: "" }));
        }
      }
    } else {
      setEstablecimientosFiltrados(establecimientos);
      setEvalData((p) => ({ ...p, establecimiento_id: "" }));
    }
  }, [evalData.redsalud_id, evalData.establecimiento_id, establecimientos]);

  /* ------------------------------ Jefes de grupo ----------------------------- */
  const agregarJefeGrupo = () => {
    if (jefesGrupo.length < 4) {
      const nuevoId = `jefe${jefesGrupo.length + 1}`;
      setJefesGrupo((p) => [
        ...p,
        { id: nuevoId, jefe_grupo_id: "", esObligatorio: false },
      ]);
    }
  };

  const eliminarJefeGrupo = (id) => {
    const item = jefesGrupo.find((j) => j.id === id);
    if (item?.esObligatorio) return;
    setJefesGrupo((p) => p.filter((j) => j.id !== id));
  };

  const manejarCambioJefeGrupo = (id, valor) => {
    setJefesGrupo((p) =>
      p.map((j) => (j.id === id ? { ...j, jefe_grupo_id: valor } : j))
    );
  };

  const opcionesJefeDisponibles = (idActual) => {
    const elegidos = jefesGrupo
      .filter((j) => j.id !== idActual && j.jefe_grupo_id)
      .map((j) => String(j.jefe_grupo_id));
    return jefesGrupoOpciones.map((op) => ({
      ...op,
      disabled: elegidos.includes(String(op.id)),
    }));
  };

  /* -------------------------------- Imagen -------------------------------- */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError("❌ Solo se permiten archivos de imagen");
        e.target.value = '';
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("❌ La imagen no debe superar los 5MB");
        e.target.value = '';
        return;
      }

      setFotoArchivo(file);
      setFotoExistente("");
      setError(null);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setFotoArchivo(null);
      if (!fotoExistente) setImagePreview(null);
    }
  };

  /* ------------------------------ Altura / mapa ----------------------------- */
  const actualizarAltura = async (lat, lng) => {
    setCargandoAltura(true);
    try {
      const altura = await obtenerAltura(lat, lng);
      setMarkerPos((p) => ({ ...p, lat, lng, altura }));
    } finally {
      setCargandoAltura(false);
    }
  };

  const manejarCambioPosicion = (pos) => actualizarAltura(pos.lat, pos.lng);

  const obtenerUbicacionUsuario = () => {
    if (!navigator.geolocation)
      return setError("La geolocalización no es soportada por este navegador");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = {
          lat: latitude,
          lng: longitude,
          altura: markerPos.altura,
        };
        setMarkerPos(newPos);
        setCenterTrigger((v) => v + 1);
        await actualizarAltura(latitude, longitude);
      },
      (err) => setError("No se pudo obtener tu ubicación: " + err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    obtenerUbicacionUsuario();
  }, []);

  useEffect(() => {
    setEvalData((p) => ({
      ...p,
      latitud: markerPos.lat,
      longitud: markerPos.lng,
      altura: markerPos.altura,
    }));
  }, [markerPos]);

  /* ------------------------------ Registros ------------------------------ */
  const cargarRegistrosUsuario = async () => {
    try {
      const tecnicoId = evalData.tecnico_id;
      if (!tecnicoId) return setRegistros([]);
      const r = await fetch(`${API_URL}/ee1/tecnico/${tecnicoId}`);
      if (!r.ok) throw new Error();
      const j = await r.json();
      if (j.success) setRegistros(j.data);
    } catch {
      try {
        const r2 = await fetch(`${API_URL}/ee1`);
        const j2 = await r2.json();
        if (j2.success) {
          const filtrados = j2.data.filter(
            (x) => x.tecnico_id === parseInt(evalData.tecnico_id)
          );
          setRegistros(filtrados);
        }
      } catch {
        setError("Error de conexión al cargar registros");
      }
    }
  };

  useEffect(() => {
    if (evalData.tecnico_id) cargarRegistrosUsuario();
  }, [evalData.tecnico_id]);

  /* ------------------------------ Helpers input ------------------------------ */
  const toNonNegative = (v) => {
    if (v === "") return "";
    const n = parseFloat(v);
    if (isNaN(n) || n < 0) return 0;
    return n;
  };

  // Validación de fechas mejorada (SIN validación de fecha programada futura)
  const validarFechas = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Validar fecha de evaluación no sea futura
    if (evalData.fecha_evaluacion) {
      const fechaEval = new Date(evalData.fecha_evaluacion);
      if (fechaEval > hoy) {
        throw new Error("❌ La fecha de evaluación no puede ser futura");
      }
    }

    // Validar fecha último rociado no sea futura
    if (evalData.fecha_ultimo_rociado) {
      const fechaRociado = new Date(evalData.fecha_ultimo_rociado);
      if (fechaRociado > hoy) {
        throw new Error("❌ La fecha del último rociado no puede ser futura");
      }
    }

    // VALIDACIÓN DE FECHA PROGRAMADA FUTURA ELIMINADA (ya no existe este campo)

    // Validar que fecha último rociado no sea posterior a fecha evaluación
    if (evalData.fecha_ultimo_rociado && evalData.fecha_evaluacion) {
      const fechaRociado = new Date(evalData.fecha_ultimo_rociado);
      const fechaEval = new Date(evalData.fecha_evaluacion);
      if (fechaRociado > fechaEval) {
        throw new Error("❌ El último rociado no puede ser posterior a la evaluación");
      }
    }
  };

  // Validación en tiempo real de fechas
  const validarFechasEnTiempoReal = () => {
    setFechaError("");

    if (evalData.fecha_ultimo_rociado && evalData.fecha_evaluacion) {
      const fechaRociado = new Date(evalData.fecha_ultimo_rociado);
      const fechaEval = new Date(evalData.fecha_evaluacion);

      if (fechaRociado > fechaEval) {
        setFechaError("⚠️ El último rociado NO puede ser posterior a la evaluación");
        return false;
      }
    }
    return true;
  };

  const handleEvalChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "resultado") {
      if (value === "positivo") {
        setEe1Data({ ...EMPTY_POSITIVE_BLOCK });
      }
      setEvalData((p) => ({ ...p, [name]: value }));
      return;
    }

    if (type === "checkbox") {
      setEvalData((p) => ({ ...p, [name]: checked }));
    } else if (
      ["numero_habitantes", "numero_habitaciones", "altura"].includes(name)
    ) {
      setEvalData((p) => ({ ...p, [name]: toNonNegative(value) }));
    } else {
      setEvalData((p) => ({ ...p, [name]: value }));
    }

    // Validar fechas en tiempo real cuando cambian
    if (name === "fecha_ultimo_rociado" || name === "fecha_evaluacion") {
      setTimeout(validarFechasEnTiempoReal, 100);
    }
  };

  const handleEe1Change = (e) => {
    const { name, value } = e.target;
    const numericos = [
      "intra_ninfas",
      "intra_adulta",
      "peri_ninfa",
      "peri_adulta",
      "intra_pared",
      "intra_techo",
      "intra_cama",
      "intra_otros",
      "peri_pared",
      "peri_corral",
      "peri_gallinero",
      "peri_conejera",
      "peri_zarzo_troje",
      "peri_otros",
    ];
    if (numericos.includes(name)) {
      setEe1Data((p) => ({ ...p, [name]: toNonNegative(value) }));
    } else {
      setEe1Data((p) => ({ ...p, [name]: value }));
    }
  };

  /* ------------------------------ Funciones CRUD completas ------------------------------ */

  // VER evaluación
  const verEvaluacion = async (id) => {
    try {
      const r = await fetch(`${API_URL}/ee1/${id}`);
      const j = await r.json();
      if (j.success) setVerData(j.data);
      else alert("❌ No se pudo cargar la evaluación");
    } catch (err) {
      alert("❌ Error al obtener los datos");
      console.error(err);
    }
  };

  // ELIMINAR evaluación
  const eliminarEvaluacion = async (id) => {
    if (!window.confirm("¿Eliminar definitivamente esta evaluación?")) return;

    try {
      const resp = await fetch(`${API_URL}/ee1/${id}`, {
        method: "DELETE",
      });

      const json = await resp.json();

      if (!json.success) {
        throw new Error(json.message || "Error al eliminar");
      }

      alert("🗑️ Evaluación eliminada");
      cargarRegistrosUsuario();

    } catch (error) {
      console.error(error);
      alert("❌ No se pudo eliminar la evaluación");
    }
  };

  /* ------------------------------ Editar ------------------------------ */
  const cargarEnEdicion = (row) => {
    setEditId(row.evaluacion_id);
    setError(null);
    setFechaError("");

    setEvalData((p) => ({
      ...p,
      tecnico_id: String(row.tecnico_id || p.tecnico_id),
      municipio_id: String(row.municipio_id || ""),
      comunidad_id: String(row.comunidad_id || ""),
      jefe_familia: row.jefe_familia || "",
      hora_inicio: row.hora_inicio || "",
      hora_final: row.hora_final || "",
      hora_total: row.hora_total || "",
      numero_habitantes: row.numero_habitantes ?? 0,
      numero_habitaciones: row.numero_habitaciones ?? 0,
      fecha_ultimo_rociado: row.fecha_ultimo_rociado
        ? row.fecha_ultimo_rociado.substring(0, 10)
        : "",
      vivienda_mejorada_intra: !!row.vivienda_mejorada_intra,
      vivienda_mejorada_peri: !!row.vivienda_mejorada_peri,
      fecha_evaluacion: row.fecha_evaluacion
        ? row.fecha_evaluacion.substring(0, 10)
        : "",
      numero_vivienda: row.numero_vivienda || "",
      latitud: row.latitud ?? DEFAULT_CENTER.lat,
      longitud: row.longitud ?? DEFAULT_CENTER.lng,
      altura: row.altura ?? DEFAULT_CENTER.altura,
      resultado: row.resultado || "negativo",
      sede_id: String(row.sede_id || ""),
      redsalud_id: String(row.redsalud_id || ""),
      establecimiento_id: String(row.establecimiento_id || ""),
    }));

    setMarkerPos({
      lat: Number(row.latitud ?? DEFAULT_CENTER.lat),
      lng: Number(row.longitud ?? DEFAULT_CENTER.lng),
      altura: Number(row.altura ?? DEFAULT_CENTER.altura),
    });

    const ids = [row.jefe1_id, row.jefe2_id, row.jefe3_id, row.jefe4_id]
      .filter(Boolean)
      .map(String);
    const base = [
      { id: "jefe1", jefe_grupo_id: ids[0] || "", esObligatorio: true },
    ];
    if (ids[1])
      base.push({ id: "jefe2", jefe_grupo_id: ids[1], esObligatorio: false });
    if (ids[2])
      base.push({ id: "jefe3", jefe_grupo_id: ids[2], esObligatorio: false });
    if (ids[3])
      base.push({ id: "jefe4", jefe_grupo_id: ids[3], esObligatorio: false });
    setJefesGrupo(base);

    setEe1Data((p) => ({
      ...p,
      // FECHA_PROGRAMADA y HORA_PROGRAMADA ELIMINADAS
      intra_ninfas: row.intra_ninfas ?? "",
      intra_adulta: row.intra_adulta ?? "",
      peri_ninfa: row.peri_ninfa ?? "",
      peri_adulta: row.peri_adulta ?? "",
      intra_pared: row.intra_pared ?? "",
      intra_techo: row.intra_techo ?? "",
      intra_cama: row.intra_cama ?? "",
      intra_otros: row.intra_otros ?? "",
      peri_pared: row.peri_pared ?? "",
      peri_corral: row.peri_corral ?? "",
      peri_gallinero: row.peri_gallinero ?? "",
      peri_conejera: row.peri_conejera ?? "",
      peri_zarzo_troje: row.peri_zarzo_troje ?? "",
      peri_otros: row.peri_otros ?? "",
    }));

    setFotoArchivo(null);
    setFotoExistente(row.foto_entrada || "");
    setImagePreview(
      row.foto_entrada
        ? `${baseUrl}/uploads/${row.foto_entrada}`
        : null
    );

    setCenterTrigger((v) => v + 1);

    setTimeout(() => {
      const top = document.getElementById("edit-top");
      if (top) top.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const cancelarEdicion = () => {
    setEditId(null);
    setFotoArchivo(null);
    setFotoExistente("");
    setImagePreview(null);
    setJefesGrupo([{ id: "jefe1", jefe_grupo_id: "", esObligatorio: true }]);
    setFechaError("");
  };

  /* ------------------------------ Submit ------------------------------ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    try {
      // Validación básica del formulario
      if (formRef.current && !formRef.current.reportValidity()) {
        setGuardando(false);
        return;
      }

      // Validar fechas en tiempo real antes de enviar
      if (!validarFechasEnTiempoReal()) {
        throw new Error("❌ Hay errores en las fechas. Por favor, corrígelos antes de guardar.");
      }

      // Requeridos base
      if (
        !evalData.tecnico_id ||
        !evalData.municipio_id ||
        !evalData.comunidad_id ||
        !evalData.sede_id ||
        !evalData.redsalud_id ||
        !evalData.establecimiento_id ||
        !evalData.fecha_evaluacion ||
        !evalData.jefe_familia ||
        !evalData.numero_vivienda
      ) {
        throw new Error("Debe completar todos los campos requeridos (*).");
      }

      // Foto obligatoria si no hay nueva ni existente
      if (!fotoArchivo && !fotoExistente) {
        throw new Error("Debe adjuntar una foto de entrada.");
      }

      // Jefe obligatorio
      const jefeObl = jefesGrupo.find((j) => j.esObligatorio);
      if (!jefeObl || !jefeObl.jefe_grupo_id) {
        throw new Error("Debe seleccionar al menos un jefe de grupo (obligatorio).");
      }

      // Validaciones de fecha (sin validación de fecha programada)
      validarFechas();

      // Jefes únicos (máx 4)
      const jefes = jefesGrupo
        .map((j) => (j.jefe_grupo_id ? Number(j.jefe_grupo_id) : null))
        .filter(Boolean);
      const jefesUnicos = [...new Set(jefes)].slice(0, 4);

      // Si es POSITIVO, validaciones extra
      if (evalData.resultado === "positivo") {
        const missing = POSITIVE_FIELDS.filter((f) => {
          const val = ee1Data[f];
          return val === "" || val === null || typeof val === "undefined";
        });

        if (missing.length > 0) {
          throw new Error(
            "Debe completar todos los campos de la sección EE1 porque el resultado es POSITIVO."
          );
        }

        const numericPositive = [
          Number(ee1Data.intra_ninfas) || 0,
          Number(ee1Data.intra_adulta) || 0,
          Number(ee1Data.peri_ninfa) || 0,
          Number(ee1Data.peri_adulta) || 0,
          Number(ee1Data.intra_pared) || 0,
          Number(ee1Data.intra_techo) || 0,
          Number(ee1Data.intra_cama) || 0,
          Number(ee1Data.intra_otros) || 0,
          Number(ee1Data.peri_pared) || 0,
          Number(ee1Data.peri_corral) || 0,
          Number(ee1Data.peri_gallinero) || 0,
          Number(ee1Data.peri_conejera) || 0,
          Number(ee1Data.peri_zarzo_troje) || 0,
          Number(ee1Data.peri_otros) || 0,
        ];
        const hayAlgunoMayorCero = numericPositive.some((n) => n > 0);
        if (!hayAlgunoMayorCero) {
          throw new Error(
            "Como el resultado es POSITIVO debe registrar al menos un conteo mayor a 0."
          );
        }
      }

      // Normalizar payload
      const payloadEval = {
        ...evalData,
        numero_habitantes:
          evalData.numero_habitantes === ""
            ? 0
            : Number(evalData.numero_habitantes),
        numero_habitaciones:
          evalData.numero_habitaciones === ""
            ? 0
            : Number(evalData.numero_habitaciones),
        altura: evalData.altura === "" ? 0 : Number(evalData.altura),
        latitud: Number(evalData.latitud),
        longitud: Number(evalData.longitud),
        vivienda_mejorada_intra: evalData.vivienda_mejorada_intra ? "1" : "0",
        vivienda_mejorada_peri: evalData.vivienda_mejorada_peri ? "1" : "0",
      };

      const formData = new FormData();
      Object.keys(payloadEval).forEach((k) => {
        if (k !== "foto_entrada") formData.append(k, payloadEval[k]);
      });
      formData.append("jefes", JSON.stringify(jefesUnicos));
      if (fotoArchivo) {
        formData.append("foto_entrada", fotoArchivo);
      } else if (fotoExistente) {
        formData.append("foto_entrada_existente", fotoExistente);
      }

      // Solo enviar campos EE1 para positivos (SIN fecha/hora programada)
      if (evalData.resultado === "positivo") {
        const camposPositivos = [
          "intra_ninfas", "intra_adulta",
          "peri_ninfa", "peri_adulta",
          "intra_pared", "intra_techo", "intra_cama", "intra_otros",
          "peri_pared", "peri_corral", "peri_gallinero", "peri_conejera",
          "peri_zarzo_troje", "peri_otros"
        ];
        camposPositivos.forEach(k => formData.append(k, ee1Data[k]));
      }

      const url = editId ? `${API_URL}/ee1/${editId}` : `${API_URL}/ee1`;
      const method = editId ? "PUT" : "POST";
      const resp = await fetch(url, { method, body: formData });
      const json = await resp.json();

      if (!json.success) throw new Error(json.message || "Error al guardar");

      alert(editId ? "✅ Evaluación actualizada" : "✅ Evaluación guardada");
      await cargarRegistrosUsuario();

      // reset
      setEditId(null);
      setEvalData((p) => ({
        ...p,
        municipio_id: "",
        comunidad_id: "",
        jefe_familia: "",
        hora_inicio: "",
        hora_final: "",
        hora_total: "",
        numero_habitantes: "",
        numero_habitaciones: "",
        fecha_ultimo_rociado: "",
        vivienda_mejorada_intra: false,
        vivienda_mejorada_peri: false,
        fecha_evaluacion: "",
        numero_vivienda: "",
        resultado: "negativo",
        sede_id: "",
        redsalud_id: "",
        establecimiento_id: "",
      }));
      setEe1Data({ ...EMPTY_POSITIVE_BLOCK });
      setJefesGrupo([{ id: "jefe1", jefe_grupo_id: "", esObligatorio: true }]);
      setFotoArchivo(null);
      setFotoExistente("");
      setImagePreview(null);
      setFechaError("");
    } catch (e2) {
      setError("❌ " + e2.message);
    } finally {
      setGuardando(false);
    }
  };

  const mostrarImagen = (nombreArchivo) =>
    nombreArchivo ? `${baseUrl}/uploads/${nombreArchivo}` : null;

  /* ------------------------------ CONDICIONALES DE ACCESO ------------------------------ */
  if (accessLoading) {
    return (
      <div className="ee1">
        <div className="container">
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

  if (!isAuthenticated) {
    return (
      <div className="ee1">
        <div className="container">
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeaa7",
              borderRadius: "8px",
              margin: "2rem 0",
            }}
          >
            <h3>🔒 Acceso Requerido</h3>
            <p>Debes iniciar sesión para acceder a las evaluaciones entomológicas.</p>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------- Render -------------------------------- */
  return (
    <div className="ee1">
      <div className="container">
        {/* Header profesional */}
        <div className="ee1-header">
          <h1>🦟 Evaluaciones Entomológicas (EE1)</h1>
          <p className="subtitle">
            {editId ? `Editando registro #${editId}` : "Registro de evaluación ent omológica"}
          </p>
          <div className="user-info-badge">
            <span className="badge-item"><strong>Usuario:</strong> {userName}</span>
            <span className="badge-divider">|</span>
            <span className="badge-item"><strong>Rol:</strong> {userRole}</span>
            <span className="badge-divider">|</span>
            <span className="badge-item"><strong>ID:</strong> {userId}</span>
          </div>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#ffebee",
              color: "#c62828",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "1rem",
              border: "1px solid #ffcdd2",
            }}
          >
            {error}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit}>
          {/* ====================== DATOS GENERALES ====================== */}
          <div className="section">
            <h3>Datos Generales</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Técnico *</label>
                <select
                  name="tecnico_id"
                  value={evalData.tecnico_id}
                  onChange={handleEvalChange}
                  required
                  disabled={cargandoOpciones.tecnicos || userRole === "tecnico"}
                >
                  <option value="">
                    {cargandoOpciones.tecnicos
                      ? "Cargando técnicos..."
                      : "Seleccione un técnico"}
                  </option>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Municipio *</label>
                <select
                  name="municipio_id"
                  value={evalData.municipio_id}
                  onChange={handleEvalChange}
                  required
                  disabled={cargandoOpciones.municipios}
                >
                  <option value="">
                    {cargandoOpciones.municipios
                      ? "Cargando municipios..."
                      : "Seleccione un municipio"}
                  </option>
                  {municipios.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Comunidad *</label>
                <select
                  name="comunidad_id"
                  value={evalData.comunidad_id}
                  onChange={handleEvalChange}
                  required
                  disabled={cargandoOpciones.comunidades || !evalData.municipio_id}
                >
                  <option value="">
                    {cargandoOpciones.comunidades
                      ? "Cargando comunidades..."
                      : !evalData.municipio_id
                        ? "Primero seleccione un municipio"
                        : "Seleccione una comunidad"}
                  </option>
                  {comunidadesFiltradas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.municipio ? `- ${c.municipio}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Sede *</label>
                <select
                  name="sede_id"
                  value={evalData.sede_id}
                  onChange={handleEvalChange}
                  required
                  disabled={cargandoOpciones.sedes}
                >
                  <option value="">
                    {cargandoOpciones.sedes
                      ? "Cargando sedes..."
                      : "Seleccione una sede"}
                  </option>
                  {sedes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Red de Salud *</label>
                <select
                  name="redsalud_id"
                  value={evalData.redsalud_id}
                  onChange={handleEvalChange}
                  required
                  disabled={cargandoOpciones.redes || !evalData.sede_id}
                >
                  <option value="">
                    {cargandoOpciones.redes
                      ? "Cargando redes..."
                      : !evalData.sede_id
                        ? "Primero seleccione una sede"
                        : "Seleccione una red de salud"}
                  </option>
                  {redesFiltradas.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Establecimiento de Salud *</label>
                <select
                  name="establecimiento_id"
                  value={evalData.establecimiento_id}
                  onChange={handleEvalChange}
                  required
                  disabled={cargandoOpciones.establecimientos || !evalData.redsalud_id}
                >
                  <option value="">
                    {cargandoOpciones.establecimientos
                      ? "Cargando establecimientos..."
                      : !evalData.redsalud_id
                        ? "Primero seleccione una red de salud"
                        : "Seleccione un establecimiento"}
                  </option>
                  {establecimientosFiltrados.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre} ({e.tipo})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ====================== JEFES DE GRUPO ====================== */}
            <div className="section jefes-wrapper">
              <h3>👥 Jefes de Grupo</h3>
              <div style={{ marginBottom: "1rem" }}>
                <small style={{ color: "#666" }}>
                  Selecciona al menos un jefe (obligatorio). Puedes agregar hasta 3
                  opcionales (total 4).
                </small>
              </div>

              {jefesGrupo.map((jefe, index) => {
                const opciones = opcionesJefeDisponibles(jefe.id);
                return (
                  <div
                    key={jefe.id}
                    className="form-row"
                    style={{
                      alignItems: "center",
                      padding: "10px",
                      backgroundColor: index === 0 ? "#f8f9fa" : "transparent",
                      border: index === 0 ? "1px solid #dee2e6" : "none",
                      borderRadius: "4px",
                      marginBottom: "10px",
                    }}
                  >
                    <div className="form-group" style={{ flex: "1" }}>
                      <label>
                        Jefe de Grupo {index + 1}
                        {jefe.esObligatorio && (
                          <span style={{ color: "red" }}> *</span>
                        )}
                      </label>
                      <select
                        value={jefe.jefe_grupo_id}
                        onChange={(e) => manejarCambioJefeGrupo(jefe.id, e.target.value)}
                        required={jefe.esObligatorio}
                        disabled={cargandoOpciones.jefesGrupo}
                      >
                        <option value="">
                          {cargandoOpciones.jefesGrupo
                            ? "Cargando jefes de grupo..."
                            : "Seleccione un jefe de grupo"}
                        </option>
                        {opciones.map((op) => (
                          <option key={op.id} value={op.id} disabled={op.disabled}>
                            {op.nombre}
                            {op.disabled ? " (ya seleccionado)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {!jefe.esObligatorio && (
                      <button
                        type="button"
                        onClick={() => eliminarJefeGrupo(jefe.id)}
                        className="btn btn-danger"
                        style={{ marginLeft: 10 }}
                      >
                        ❌ Eliminar
                      </button>
                    )}
                  </div>
                );
              })}

              {jefesGrupo.length < 4 && (
                <div className="form-row">
                  <button
                    type="button"
                    onClick={agregarJefeGrupo}
                    className="btn btn-success"
                  >
                    ➕ Agregar Jefe de Grupo Opcional
                  </button>
                </div>
              )}
            </div>

            {/* ---------- resto datos ---------- */}
            <div className="after-jefes">
              <div className="form-row">
                <div className="form-group">
                  <label>Jefe Familia *</label>
                  <input
                    type="text"
                    name="jefe_familia"
                    value={evalData.jefe_familia}
                    onChange={handleEvalChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Número Vivienda *</label>
                  <input
                    type="text"
                    name="numero_vivienda"
                    value={evalData.numero_vivienda}
                    onChange={handleEvalChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hora Inicio</label>
                  <input
                    type="time"
                    name="hora_inicio"
                    value={evalData.hora_inicio}
                    onChange={handleEvalChange}
                  />
                </div>
                <div className="form-group">
                  <label>Hora Final</label>
                  <input
                    type="time"
                    name="hora_final"
                    value={evalData.hora_final}
                    onChange={handleEvalChange}
                  />
                </div>
                <div className="form-group">
                  <label>Hora Total</label>
                  <input
                    type="time"
                    name="hora_total"
                    value={evalData.hora_total}
                    onChange={handleEvalChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>N° Habitantes</label>
                  <input
                    type="number"
                    name="numero_habitantes"
                    inputMode="numeric"
                    min="0"
                    value={evalData.numero_habitantes}
                    onChange={handleEvalChange}
                  />
                </div>
                <div className="form-group">
                  <label>N° Habitaciones</label>
                  <input
                    type="number"
                    name="numero_habitaciones"
                    inputMode="numeric"
                    min="0"
                    value={evalData.numero_habitaciones}
                    onChange={handleEvalChange}
                  />
                </div>
                <div className="form-group">
                  <label>Fecha Último Rociado</label>
                  <input
                    type="date"
                    name="fecha_ultimo_rociado"
                    value={evalData.fecha_ultimo_rociado}
                    onChange={handleEvalChange}
                    max={evalData.fecha_evaluacion || new Date().toISOString().split("T")[0]}
                  />
                  {fechaError && (
                    <small style={{ color: "#d32f2f", fontWeight: "bold", marginTop: "4px", display: "block" }}>
                      {fechaError}
                    </small>
                  )}
                  <small style={{ color: "#666", marginTop: "4px", display: "block" }}>
                    ⚠️ Esta fecha NO puede ser posterior a la fecha de evaluación
                  </small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ alignItems: "center" }}>
                  <label style={{ marginBottom: 6 }}>Vivienda Mejorada Intra</label>
                  <input
                    type="checkbox"
                    name="vivienda_mejorada_intra"
                    checked={evalData.vivienda_mejorada_intra}
                    onChange={handleEvalChange}
                  />
                </div>
                <div className="form-group" style={{ alignItems: "center" }}>
                  <label style={{ marginBottom: 6 }}>Vivienda Mejorada Peri</label>
                  <input
                    type="checkbox"
                    name="vivienda_mejorada_peri"
                    checked={evalData.vivienda_mejorada_peri}
                    onChange={handleEvalChange}
                  />
                </div>
                <div className="form-group">
                  <label>Fecha Evaluación *</label>
                  <input
                    type="date"
                    name="fecha_evaluacion"
                    value={evalData.fecha_evaluacion}
                    onChange={handleEvalChange}
                    required
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Altura (metros)</label>
                  <input
                    type="number"
                    name="altura"
                    inputMode="numeric"
                    min="0"
                    value={cargandoAltura ? "" : evalData.altura}
                    placeholder={cargandoAltura ? "Cargando..." : ""}
                    onChange={handleEvalChange}
                    disabled={cargandoAltura}
                  />
                  <small>
                    La altura se actualizará automáticamente al mover el marcador
                  </small>
                </div>
              </div>

              {/* ====================== MAPA FULL WIDTH ====================== */}
              <div className="map-section-full">
                <label className="map-label">Ubicación en el mapa</label>
                <div className="map-wrapper">
                  <button
                    type="button"
                    onClick={obtenerUbicacionUsuario}
                    className="btn-location"
                  >
                    📍 USAR MI UBICACIÓN
                  </button>

                  <MapContainer
                    center={[markerPos.lat, markerPos.lng]}
                    zoom={17}
                    className="leaflet-container"
                    whenCreated={(m) => (mapRef.current = m)}
                    zoomControl={true}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />

                    <MapController
                      markerPos={markerPos}
                      setMarkerPos={setMarkerPos}
                      onPositionChange={manejarCambioPosicion}
                      centerMap={centerTrigger}
                    />
                  </MapContainer>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Latitud</label>
                  <input
                    type="number"
                    step="any"
                    name="latitud"
                    value={markerPos.lat}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setMarkerPos((p) => ({ ...p, lat: isNaN(v) ? 0 : v }));
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Longitud</label>
                  <input
                    type="number"
                    step="any"
                    name="longitud"
                    value={markerPos.lng}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setMarkerPos((p) => ({ ...p, lng: isNaN(v) ? 0 : v }));
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Resultado *</label>
                  <select
                    name="resultado"
                    value={evalData.resultado}
                    onChange={handleEvalChange}
                    required
                  >
                    <option value="negativo">Negativo</option>
                    <option value="positivo">Positivo</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: "1 1 100%" }}>
                  <label>Foto Entrada (Subir Archivo) *</label>
                  <input
                    type="file"
                    name="foto_entrada"
                    accept="image/*"
                    onChange={handleImageChange}
                    required={!fotoArchivo && !fotoExistente}
                  />
                  <small style={{ color: "#666" }}>
                    Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB
                  </small>
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="preview"
                      style={{
                        width: "100%",
                        maxWidth: 420,
                        marginTop: "0.5rem",
                        borderRadius: 4,
                        border: "1px solid #d0d0d0",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ====================== DETALLES EE1 (solo positivo) - SIN FECHA/HORA PROGRAMADA ====================== */}
          {evalData.resultado === "positivo" && (
            <div className="section">
              <h3>🪲 EE1 - Detalles de Capturas</h3>

              {/* ELIMINADO BLOQUE COMPLETO DE FECHA/HORA PROGRAMADA */}

              {/* Conteos */}
              <div className="form-row">
                <div className="form-group">
                  <label>Intra Ninfas *</label>
                  <input
                    type="number"
                    min="0"
                    name="intra_ninfas"
                    value={ee1Data.intra_ninfas}
                    onChange={handleEe1Change}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Intra Adultas *</label>
                  <input
                    type="number"
                    min="0"
                    name="intra_adulta"
                    value={ee1Data.intra_adulta}
                    onChange={handleEe1Change}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Peri Ninfas *</label>
                  <input
                    type="number"
                    min="0"
                    name="peri_ninfa"
                    value={ee1Data.peri_ninfa}
                    onChange={handleEe1Change}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Peri Adultas *</label>
                  <input
                    type="number"
                    min="0"
                    name="peri_adulta"
                    value={ee1Data.peri_adulta}
                    onChange={handleEe1Change}
                    required
                  />
                </div>
              </div>

              {/* Sitios Intra */}
              <div className="form-row">
                <div className="form-group">
                  <label>Intra Pared *</label>
                  <input
                    type="number"
                    min="0"
                    name="intra_pared"
                    value={ee1Data.intra_pared}
                    onChange={handleEe1Change}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Intra Techo *</label>
                  <input
                    type="number"
                    min="0"
                    name="intra_techo"
                    value={ee1Data.intra_techo}
                    onChange={handleEe1Change}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Intra Cama *</label>
                  <input
                    type="number"
                    min="0"
                    name="intra_cama"
                    value={ee1Data.intra_cama}
                    onChange={handleEe1Change}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Intra Otros *</label>
                  <input
                    type="number"
                    min="0"
                    name="intra_otros"
                    value={ee1Data.intra_otros}
                    onChange={handleEe1Change}
                    required
                  />
                </div>
              </div>

              {/* Sitios Peri */}
              <div className="form-row">
                <div className="form-group">
                  <label>Peri Pared *</label>
                  <input
                    type="number"
                    min="0"
                    name="peri_pared"
                    value={ee1Data.peri_pared}
                    onChange={handleEe1Change}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Peri Corral *</label>
                  <input
                    type="number"
                    min="0"
                    name="peri_corral"
                    value={ee1Data.peri_corral}
                    onChange={handleEe1Change}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Peri Gallinero *</label>
                  <input
                    type="number"
                    min="0"
                    name="peri_gallinero"
                    value={ee1Data.peri_gallinero}
                    onChange={handleEe1Change}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Peri Conejera *</label>
                  <input
                    type="number"
                    min="0"
                    name="peri_conejera"
                    value={ee1Data.peri_conejera}
                    onChange={handleEe1Change}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Peri Zarzo/Troje *</label>
                  <input
                    type="number"
                    min="0"
                    name="peri_zarzo_troje"
                    value={ee1Data.peri_zarzo_troje}
                    onChange={handleEe1Change}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Peri Otros *</label>
                  <input
                    type="number"
                    min="0"
                    name="peri_otros"
                    value={ee1Data.peri_otros}
                    onChange={handleEe1Change}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* ====================== Botones ====================== */}
          <div className="form-row" style={{ gap: 10 }}>
            <button type="submit" className="btn btn-save" disabled={guardando}>
              {guardando
                ? "⏳ Guardando..."
                : editId
                  ? "💾 Actualizar"
                  : "💾 Guardar en Base de Datos"}
            </button>

            {editId && (
              <button
                type="button"
                className="btn btn-light"
                onClick={cancelarEdicion}
              >
                ↩️ Cancelar Edición
              </button>
            )}
          </div>
        </form>

        {/* ====================== Registros del técnico ====================== */}
        <div className="section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h3>📋 Mis Registros Guardados</h3>
            <button
              onClick={cargarRegistrosUsuario}
              className="btn btn-light"
              style={{ padding: "8px 16px", fontSize: "14px" }}
              disabled={!evalData.tecnico_id}
            >
              🔄 Actualizar Mis Registros
            </button>
          </div>

          <div
            style={{
              overflowX: "auto",
              overflowY: "hidden",
              WebkitOverflowScrolling: "touch",
              border: "1px solid #efefef",
              borderRadius: "8px",
              background: "white",
            }}
          >
            <table style={{ minWidth: "1220px" }}>
              <thead>
                <tr>
                  <th>Técnico</th>
                  <th>Municipio</th>
                  <th>Comunidad</th>
                  <th>Jefe Familia</th>
                  <th>Jefe(s) Grupo</th>
                  <th>Resultado</th>
                  <th>Fecha Evaluación</th>
                  <th>Último Rociado</th>
                  <th>Sede</th>
                  <th>Red de Salud</th>
                  <th>Establecimiento</th>
                  <th>Foto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r, idx) => (
                  <tr key={idx}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {r.tecnico_nombre || r.tecnico_id}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {r.municipio_nombre || r.municipio_id}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {r.comunidad_nombre || r.comunidad_id}
                    </td>
                    <td>{r.jefe_familia}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {[r.jefe1_nombre || r.jefe1_id,
                      r.jefe2_nombre || r.jefe2_id,
                      r.jefe3_nombre || r.jefe3_id,
                      r.jefe4_nombre || r.jefe4_id]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td>
                      <span
                        style={{
                          color: r.resultado === "positivo" ? "red" : "green",
                          fontWeight: "bold",
                        }}
                      >
                        {r.resultado}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {r.fecha_evaluacion
                        ? new Date(r.fecha_evaluacion).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {r.fecha_ultimo_rociado
                        ? new Date(r.fecha_ultimo_rociado).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {r.sede_nombre || "N/A"}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {r.red_salud_nombre || "N/A"}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {r.establecimiento_nombre || "N/A"}
                    </td>
                    <td>
                      {r.foto_entrada ? (
                        <a
                          href={mostrarImagen(r.foto_entrada)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#007bff",
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          👁️ Ver
                        </a>
                      ) : (
                        <span
                          style={{
                            color: "#999",
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Sin imagen
                        </span>
                      )}
                    </td>
                    <td style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn btn-info"
                        onClick={() => verEvaluacion(r.evaluacion_id)}
                      >
                        👁️ Ver
                      </button>

                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => {
                          cargarEnEdicion(r);
                          irArriba();
                        }}
                      >
                        ✏️ Editar
                      </button>

                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => eliminarEvaluacion(r.evaluacion_id)}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {registros.length === 0 && (
            <p style={{ textAlign: "center", color: "#666", padding: "2rem" }}>
              No hay registros guardados para este técnico
            </p>
          )}
        </div>
      </div>

      {/* ====================== MODAL PARA VER DETALLES (SIN FECHA/HORA PROGRAMADA) ====================== */}
      {verData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 800 }}>

            <h3>📄 Detalles de la Evaluación #{verData.evaluacion_id}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <p><strong>Técnico:</strong> {verData.tecnico_nombre}</p>
                <p><strong>Municipio:</strong> {verData.municipio_nombre}</p>
                <p><strong>Comunidad:</strong> {verData.comunidad_nombre}</p>
                <p><strong>Jefe Familia:</strong> {verData.jefe_familia}</p>
                <p><strong>N° Vivienda:</strong> {verData.numero_vivienda}</p>
                <p><strong>Resultado:</strong>
                  <span style={{
                    color: verData.resultado === 'positivo' ? 'red' : 'green',
                    fontWeight: "bold",
                    marginLeft: "5px"
                  }}>
                    {verData.resultado?.toUpperCase()}
                  </span>
                </p>
              </div>

              <div>
                <p><strong>Fecha Evaluación:</strong>
                  {new Date(verData.fecha_evaluacion).toLocaleDateString()}
                </p>
                <p><strong>Último Rociado:</strong>
                  {verData.fecha_ultimo_rociado
                    ? new Date(verData.fecha_ultimo_rociado).toLocaleDateString()
                    : "N/A"}
                </p>
                <p><strong>Habitantes:</strong> {verData.numero_habitantes}</p>
                <p><strong>Habitaciones:</strong> {verData.numero_habitaciones}</p>
                <p><strong>Altura:</strong> {verData.altura} m</p>
                <p><strong>Coordenadas:</strong> {Number(verData.latitud)?.toFixed(6)}, {Number(verData.longitud)?.toFixed(6)}</p>
              </div>
            </div>

            <div style={{ marginTop: "15px" }}>
              <p><strong>Jefes de Grupo:</strong></p>
              <ul>
                {[verData.jefe1_nombre, verData.jefe2_nombre, verData.jefe3_nombre, verData.jefe4_nombre]
                  .filter(Boolean)
                  .map((nombre, index) => (
                    <li key={index}>{nombre}</li>
                  ))}
              </ul>
            </div>

            {verData.resultado === "positivo" && (
              <>
                <h4>🪲 Capturas EE1</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div>
                    {/* ELIMINADO: FECHA PROGRAMADA Y HORA PROGRAMADA */}
                    <p><strong>Total ninfas:</strong> {verData.total_ninfas}</p>
                    <p><strong>Total adultas:</strong> {verData.total_adultas}</p>
                  </div>
                  <div>
                    <p><strong>Intra:</strong> Ninfas: {verData.intra_ninfas}, Adultas: {verData.intra_adulta}</p>
                    <p><strong>Peri:</strong> Ninfas: {verData.peri_ninfa}, Adultas: {verData.peri_adulta}</p>
                  </div>
                </div>
              </>
            )}

            {verData.foto_entrada && (
              <div style={{ marginTop: "15px" }}>
                <p><strong>Foto de Entrada:</strong></p>
                <img
                  src={`${baseUrl}/uploads/${verData.foto_entrada}`}
                  style={{
                    width: "100%",
                    maxWidth: "500px",
                    borderRadius: 6,
                    marginTop: 10,
                    border: "1px solid #ddd"
                  }}
                  alt="Foto de la evaluación"
                />
              </div>
            )}

            <button
              className="btn btn-light"
              onClick={() => setVerData(null)}
              style={{ marginTop: 20 }}
            >
              ❌ Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluacionesEntomologicasEE1;