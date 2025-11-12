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
 
  const nombresMeses = [
    "ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO",
    "JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"
  ];
 
  const diasSemana = ["D","L","M","M","J","V","S"];
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
    fetch(`${baseUrl}/api/viviendas/${id}`)
      .then(res => res.json())
      .then(data => setVivienda(data))
      .catch(err => console.error("Error cargando vivienda:", err));
 
    fetch(`${baseUrl}/api/denuncias/vivienda/${id}`)
      .then(res => res.json())
      .then(denuncias => {
        if (denuncias && denuncias.length > 0) {
          const denunciaReciente = denuncias.sort((a, b) =>
            new Date(b.fecha_denuncia) - new Date(a.fecha_denuncia)
          )[0];
          setDenuncia(denunciaReciente);
        }
      })
      .catch(err => console.error("Error cargando denuncia:", err));
  }, [id]);
 
  const handleSubmit = async () => {
    if (!diaSeleccionado) {
      alert("Por favor, selecciona un día");
      return;
    }
 
    if (!denuncia || !denuncia.denuncia_id) {
      alert("No hay denuncia disponible para programar");
      return;
    }
 
    const fechaSeleccionada = new Date(añoActual, mesActual, diaSeleccionado, hora, minutos);
    const fechaActual = new Date();
 
    if (fechaSeleccionada < fechaActual) {
      alert("⚠️ No puedes programar una fecha u hora pasada.");
      return;
    }
 
    const fechaISO = fechaSeleccionada.toISOString().slice(0, 19).replace("T", " ");
 
    try {
      const response = await fetch(`${baseUrl}/api/denuncias/${denuncia.denuncia_id}/programacion`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha_programacion: fechaISO
        })
      });
 
      if (response.ok) {
        alert(`✅ Servicio programado para: ${fechaSeleccionada.toLocaleString()}`);
        navigate("/");
      } else {
        alert("❌ Error al programar servicio");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error en la conexión con el servidor");
    }
  };
 
  return (
    <div className="programar-container">
      <h1 className="programar-titulo">Programacion de Servicio</h1>
 
      {vivienda && (
        <div className="vivienda-info">
          <p><b>Jefe de familia:</b> {vivienda.jefe_familia}</p>
          <p><b>N° de vivienda:</b> {vivienda.numero_vivienda}</p>
          <p><b>Dirección:</b> {vivienda.direccion}</p>
          <p><b>Comunidad:</b> {vivienda.nombre_comunidad}</p>
          {denuncia?.descripcion && (
            <p><b>Descripción:</b> {denuncia.descripcion}</p>
          )}
        </div>
      )}
 
      <div className="tiempo-selector">
        <div className="selector-grupo">
          <span className="selector-label">Horas</span>
          <div className="selector-controls">
            <button className="selector-btn" onClick={disminuirHora}>&lt;</button>
            <span className="selector-valor">{String(hora).padStart(2, "0")}</span>
            <button className="selector-btn" onClick={aumentarHora}>&gt;</button>
          </div>
        </div>
 
        <div className="selector-grupo">
          <span className="selector-label">Minutos</span>
          <div className="selector-controls">
            <button className="selector-btn" onClick={disminuirMinutos}>&lt;</button>
            <span className="selector-valor">{String(minutos).padStart(2, "0")}</span>
            <button className="selector-btn" onClick={aumentarMinutos}>&gt;</button>
          </div>
        </div>
      </div>
 
      <div className="calendario-container">
        <div className="calendario-header">
          <button className="mes-btn" onClick={() => cambiarMes("prev")}>&lt;</button>
          <h2 className="mes-titulo">{nombresMeses[mesActual]} {añoActual}</h2>
          <button className="mes-btn" onClick={() => cambiarMes("next")}>&gt;</button>
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
 
      <button onClick={handleSubmit} className="programar-btn">
        Programar
      </button>
    </div>
  );
}
 
 