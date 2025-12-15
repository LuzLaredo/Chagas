import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/Programar.css";
import { baseUrl } from "../api/BaseUrl"; 
 
export default function ReProgramar() {
  const { id } = useParams();
  const navigate = useNavigate();
 
  const [vivienda, setVivienda] = useState(null);
  const [denuncia, setDenuncia] = useState(null);
  const [hora, setHora] = useState(9);
  const [minutos, setMinutos] = useState(0);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [mesActual, setMesActual] = useState(new Date().getMonth());
  const [añoActual, setAñoActual] = useState(new Date().getFullYear());
  const [motivoReprogramacion, setMotivoReprogramacion] = useState("");
  const [cargando, setCargando] = useState(true);
 
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
          
          // ✅ VALIDAR ESTADO DE LA DENUNCIA - PERMITIR "programada" Y "reprogramada"
          const estado = denunciaReciente.estado_denuncia;
          
          if (estado === "cancelada") {
            alert("❌ La denuncia ha sido cancelada. No se puede reprogramar.");
            navigate("/CargaRociado");
            return;
          }
          
          if (estado === "recibida") {
            alert("ℹ️ Esta denuncia aún no ha sido programada. Use la opción 'Programar' primero.");
            navigate("/CargaRociado");
            return;
          }
          
          if (estado === "realizada") {
            alert("ℹ️ Esta denuncia ya fue realizada. No se puede reprogramar.");
            navigate("/CargaRociado");
            return;
          }

          // ✅ PERMITIR ACCESO PARA ESTADOS "programada" Y "reprogramada"
          if (estado !== "programada" && estado !== "reprogramada") {
            alert(`ℹ️ No se puede reprogramar una denuncia con estado "${estado}"`);
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
      alert("No hay denuncia disponible para reprogramar");
      return;
    }

    // ✅ VALIDAR ESTADO ANTES DE REPROGRAMAR - PERMITIR "programada" Y "reprogramada"
    if (denuncia.estado_denuncia !== "programada" && denuncia.estado_denuncia !== "reprogramada") {
      alert(`No se puede reprogramar una denuncia con estado "${denuncia.estado_denuncia}"`);
      return;
    }

    // Validar motivo de reprogramación
    if (!motivoReprogramacion.trim()) {
      alert("Por favor, ingresa el motivo de la reprogramación");
      return;
    }

    if (motivoReprogramacion.length > 500) {
      alert("El motivo de reprogramación no puede exceder los 500 caracteres");
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
      const response = await fetch(`${baseUrl}/api/denuncias/${denuncia.denuncia_id}/reprogramacion`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha_programacion: fechaMySQL,
          motivo_reprogramacion: motivoReprogramacion.trim()
        })
      });
 
      if (response.ok) {
        alert(`✅ Servicio reprogramado para: ${fechaSeleccionada.toLocaleString()}`);
        navigate("/CargaRociado");
      } else {
        const errorData = await response.json();
        alert(`❌ Error al reprogramar servicio: ${errorData.error || "Error desconocido"}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error en la conexión con el servidor");
    }
  };

  const caracteresRestantes = 500 - motivoReprogramacion.length;

  // ✅ MOSTRAR MENSAJE DE CARGA
  if (cargando) {
    return (
      <div className="programar-container">
        <div className="cargando-mensaje">Cargando datos de la denuncia...</div>
      </div>
    );
  }
 
  return (
    <div className="programar-container">
      <h1 className="programar-titulo">Reprogramación de Servicio</h1>
 
      {vivienda && (
        <div className="vivienda-info">
          <p><b>Jefe de familia:</b> {vivienda.jefe_familia}</p>
          <p><b>N° de vivienda:</b> {vivienda.numero_vivienda}</p>
          <p><b>Dirección:</b> {vivienda.direccion}</p>
          <p><b>Comunidad:</b> {vivienda.nombre_comunidad}</p>
          {denuncia?.descripcion && (
            <p><b>Descripción:</b> {denuncia.descripcion}</p>
          )}
          {denuncia && (
            <p><b>Estado actual:</b> <span className={`estado-${denuncia.estado_denuncia}`}>{denuncia.estado_denuncia.toUpperCase()}</span></p>
          )}
          {denuncia?.fecha_programacion && (
            <p><b>Fecha programada actual:</b> {new Date(denuncia.fecha_programacion).toLocaleString('es-BO')}</p>
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

      {/* SECCIÓN MOTIVO DE REPROGRAMACIÓN */}
      <div className="motivo-reprogramacion-container">
        <h3 className="motivo-subtitulo">Motivo de Reprogramación</h3>
        <textarea
          className="motivo-textarea"
          value={motivoReprogramacion}
          onChange={(e) => setMotivoReprogramacion(e.target.value)}
          placeholder="Describe el motivo por el cual necesitas reprogramar el servicio..."
          maxLength={500}
          rows={4}
        />
        <div className={`contador-caracteres ${caracteresRestantes < 50 ? 'contador-bajo' : ''}`}>
          {caracteresRestantes} caracteres restantes
        </div>
      </div>
 
      <button onClick={handleSubmit} className="programar-btn reprogramar-btn">
        Reprogramar
      </button>
    </div>
  );
}