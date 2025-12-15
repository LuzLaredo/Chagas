import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/Programar.css";
import { baseUrl } from "../api/BaseUrl";

export default function Programar() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vivienda, setVivienda] = useState(null);
  const [denuncia, setDenuncia] = useState(null);
  const [hora, setHora] = useState(9);
  const [minutos, setMinutos] = useState(0);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [mesActual, setMesActual] = useState(new Date().getMonth());
  const [añoActual, setAñoActual] = useState(new Date().getFullYear());
  const [cargando, setCargando] = useState(true);

  const nombresMeses = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
  ];

  const diasSemana = ["D", "L", "M", "M", "J", "V", "S"];
  const hoy = new Date();

  const generarCalendario = () => {
    const primerDia = new Date(añoActual, mesActual, 1);
    const ultimoDia = new Date(añoActual, mesActual + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();
    const semanas = [];
    let dia = 1;

    for (let i = 0; i < 6; i++) {
      const semana = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < primerDiaSemana) || dia > diasEnMes) {
          semana.push(null);
        } else {
          semana.push(dia);
          dia++;
        }
      }
      semanas.push(semana);
      if (dia > diasEnMes) break;
    }
    return semanas;
  };

  const semanas = generarCalendario();

  const aumentarHora = () => {
    if (diaSeleccionado === hoy.getDate() &&
      mesActual === hoy.getMonth() &&
      añoActual === hoy.getFullYear() &&
      hora + 1 < hoy.getHours()) return; // evita horas pasadas hoy
    setHora(prev => (prev < 23 ? prev + 1 : 0));
  };

  const disminuirHora = () => {
    if (diaSeleccionado === hoy.getDate() &&
      mesActual === hoy.getMonth() &&
      añoActual === hoy.getFullYear() &&
      hora - 1 < hoy.getHours()) return; // evita horas pasadas hoy
    setHora(prev => (prev > 0 ? prev - 1 : 23));
  };

  const aumentarMinutos = () => {
    // Solo controla minutos si está en el día actual y hora actual
    if (diaSeleccionado === hoy.getDate() &&
      mesActual === hoy.getMonth() &&
      añoActual === hoy.getFullYear() &&
      hora === hoy.getHours() &&
      minutos + 15 <= hoy.getMinutes()) return;
    setMinutos(prev => (prev < 45 ? prev + 15 : 0));
  };

  const disminuirMinutos = () => {
    if (diaSeleccionado === hoy.getDate() &&
      mesActual === hoy.getMonth() &&
      añoActual === hoy.getFullYear()) {
      const posibleHora = hora;
      const posibleMinuto = minutos - 15 < 0 ? 45 : minutos - 15;
      if (
        new Date(añoActual, mesActual, diaSeleccionado, posibleHora, posibleMinuto) <
        hoy
      ) return;
    }
    setMinutos(prev => (prev > 0 ? prev - 15 : 45));
  };

  const cambiarMes = (direccion) => {
    if (direccion === "next") {
      if (mesActual === 11) {
        setMesActual(0);
        setAñoActual(añoActual + 1);
      } else {
        setMesActual(mesActual + 1);
      }
    } else {
      if (mesActual === 0) {
        setMesActual(11);
        setAñoActual(añoActual - 1);
      } else {
        setMesActual(mesActual - 1);
      }
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);

        // Cargar vivienda
        const resVivienda = await fetch(`${baseUrl}/api/viviendas/${id}`);
        const dataVivienda = await resVivienda.json();
        setVivienda(dataVivienda);

        // Cargar denuncias
        const resDenuncias = await fetch(`${baseUrl}/api/denuncias/vivienda/${id}`);
        const denuncias = await resDenuncias.json();

        if (denuncias && denuncias.length > 0) {
          const denunciaReciente = denuncias.sort((a, b) =>
            new Date(b.fecha_denuncia) - new Date(a.fecha_denuncia)
          )[0];
          setDenuncia(denunciaReciente);

          // ✅ VALIDAR ESTADO DE LA DENUNCIA
          const estado = denunciaReciente.estado_denuncia;

          if (estado === "cancelada") {
            alert("❌ La denuncia ha sido cancelada. No se puede programar.");
            navigate("/CargaRociado");
            return;
          }

          if (estado === "programada" || estado === "realizada") {
            alert("ℹ️ Esta denuncia ya está programada o realizada. Use la opción 'Reprogramar' si necesita cambiar la fecha.");
            navigate("/CargaRociado");
            return;
          }
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        alert("Error al cargar los datos de la denuncia");
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [id, navigate]);

  const handleSubmit = async () => {
    if (!diaSeleccionado) {
      alert("Por favor, selecciona un día");
      return;
    }

    if (!denuncia || !denuncia.denuncia_id) {
      alert("No hay denuncia disponible para programar");
      return;
    }

    // ✅ VALIDAR ESTADO ANTES DE PROGRAMAR
    if (denuncia.estado_denuncia !== "recibida") {
      alert(`No se puede programar una denuncia con estado "${denuncia.estado_denuncia}"`);
      return;
    }

    const fechaSeleccionada = new Date(añoActual, mesActual, diaSeleccionado, hora, minutos);
    const fechaActual = new Date();

    if (fechaSeleccionada < fechaActual) {
      alert("⚠️ No puedes programar una fecha u hora pasada.");
      return;
    }

    // 🔥 FORMATO CORRECTO: fecha y hora en formato MySQL DATETIME (sin segundos)
    const año = fechaSeleccionada.getFullYear();
    const mes = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaSeleccionada.getDate()).padStart(2, '0');
    const horas = String(fechaSeleccionada.getHours()).padStart(2, '0');
    const minutosFormato = String(fechaSeleccionada.getMinutes()).padStart(2, '0');

    const fechaMySQL = `${año}-${mes}-${dia} ${horas}:${minutosFormato}:00`;

    try {
      const response = await fetch(`${baseUrl}/api/denuncias/${denuncia.denuncia_id}/programacion`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha_programacion: fechaMySQL
        })
      });

      if (response.ok) {
        alert(`✅ Servicio programado para: ${fechaSeleccionada.toLocaleString()}`);
        navigate("/CargaRociado");
      } else {
        const errorData = await response.json();
        alert(`❌ Error al programar servicio: ${errorData.error || "Error desconocido"}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error en la conexión con el servidor");
    }
  };

  // ✅ MOSTRAR MENSAJE DE CARGA
  if (cargando) {
    return (
      <div className="programar-container">
        <div className="cargando-mensaje">Cargando datos de la denuncia...</div>
      </div>
    );
  }

  return (
    <div className="programar-page">
      <div className="programar-card">
        <div className="card-header">
          <h1 className="programar-titulo">Programación de Servicio</h1>
          <div className="header-decoration"></div>
        </div>

        {vivienda && (
          <div className="vivienda-info-card">
            <div className="info-row">
              <span className="info-label">Jefe de familia:</span>
              <span className="info-value">{vivienda.jefe_familia}</span>
            </div>
            <div className="info-row">
              <span className="info-label">N° de vivienda:</span>
              <span className="info-value">{vivienda.numero_vivienda}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Dirección:</span>
              <span className="info-value">{vivienda.direccion}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Comunidad:</span>
              <span className="info-value">{vivienda.nombre_comunidad}</span>
            </div>
            {denuncia?.descripcion && (
              <div className="info-row description">
                <span className="info-label">Descripción:</span>
                <span className="info-value">{denuncia.descripcion}</span>
              </div>
            )}
            {denuncia && (
              <div className="info-row status">
                <span className="info-label">Estado:</span>
                <span className={`estado-badge estado-${denuncia.estado_denuncia}`}>
                  {denuncia.estado_denuncia.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="tiempo-selector-container">
          <h3 className="section-subtitle">Seleccionar Hora</h3>
          <div className="tiempo-selector">
            <div className="selector-grupo">
              <span className="selector-label">HORA</span>
              <div className="selector-controls">
                <button className="selector-btn" onClick={disminuirHora}>−</button>
                <span className="selector-valor">{String(hora).padStart(2, "0")}</span>
                <button className="selector-btn" onClick={aumentarHora}>+</button>
              </div>
            </div>

            <div className="selector-divider">:</div>

            <div className="selector-grupo">
              <span className="selector-label">MINUTOS</span>
              <div className="selector-controls">
                <button className="selector-btn" onClick={disminuirMinutos}>−</button>
                <span className="selector-valor">{String(minutos).padStart(2, "0")}</span>
                <button className="selector-btn" onClick={aumentarMinutos}>+</button>
              </div>
            </div>
          </div>
        </div>

        <div className="calendario-section">
          <h3 className="section-subtitle">Seleccionar Fecha</h3>
          <div className="calendario-container">
            <div className="calendario-header">
              <button className="mes-btn" onClick={() => cambiarMes("prev")}>
                ‹
              </button>
              <h2 className="mes-titulo">{nombresMeses[mesActual]} {añoActual}</h2>
              <button className="mes-btn" onClick={() => cambiarMes("next")}>
                ›
              </button>
            </div>

            <div className="dias-semana">
              {diasSemana.map((dia, index) => (
                <div key={index} className="dia-semana">{dia}</div>
              ))}
            </div>

            <div className="dias-mes">
              {semanas.map((semana, semanaIndex) => (
                <div key={semanaIndex} className="semana">
                  {semana.map((dia, diaIndex) => {
                    const esPasado =
                      dia &&
                      new Date(añoActual, mesActual, dia) <
                      new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

                    return (
                      <div
                        key={diaIndex}
                        className={`dia
                          ${!dia ? "vacio" : ""}
                          ${dia === diaSeleccionado ? "seleccionado" : ""}
                          ${esPasado ? "deshabilitado" : ""}
                        `}
                        onClick={() => {
                          if (dia && !esPasado) setDiaSeleccionado(dia);
                        }}
                      >
                        {dia}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="actions-section">
          <button onClick={() => navigate(-1)} className="cancelar-btn">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="programar-btn">
            Confirmar Programación
          </button>
        </div>
      </div>
    </div>
  );
}