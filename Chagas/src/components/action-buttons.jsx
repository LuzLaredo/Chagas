import React from "react";
import { Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import "./ActionButtons.css";

export const ActionButtons = ({ viviendaId, denunciaData, viviendaData }) => {
  const navigate = useNavigate();

  // ✅ DEFINIR estadoDenuncia ANTES de usarlo
  const estadoDenuncia = denunciaData?.estado_denuncia;

  const handleProgramarClick = () => {
    if (!viviendaId) {
      alert("Selecciona una vivienda primero");
      return;
    }
    if (!denunciaData || !denunciaData.denuncia_id) {
      alert("No hay denuncia disponible para programar");
      return;
    }
    
    // ✅ VALIDACIÓN DE ESTADO PARA NAVEGACIÓN
    const estado = denunciaData.estado_denuncia;
    
    if (estado === "cancelada") {
      alert("❌ La denuncia ha sido cancelada. No se puede programar.");
      return;
    }
    
    if (estado === "realizada") {
      alert("ℹ️ Esta denuncia ya fue realizada. No se puede programar.");
      return;
    }
    
    // Navegar a la página de reprogramar si ya está programada o reprogramada
    if (estado === "programada" || estado === "reprogramada") {
      navigate(`/reprogramar/${viviendaId}`);
    } else {
      navigate(`/programar/${viviendaId}`);
    }
  };

  const handleFormularioClick = () => {
    if (!viviendaId || !viviendaData) {
      alert("Selecciona una vivienda primero");
      return;
    }

    // ✅ VALIDACIÓN DE ESTADO PARA FORMULARIO
    const estado = denunciaData?.estado_denuncia;
    if (estado !== "programada" && estado !== "reprogramada") {
      alert("ℹ️ Solo se puede completar el formulario RR1 para denuncias programadas o reprogramadas");
      return;
    }

    console.log("📋 Datos de vivienda para RR1:", viviendaData);

    const datosParaRR1 = {
      municipio_id: viviendaData.municipio_id || "",
      comunidad_id: viviendaData.comunidad_id || "",
      numero_vivienda: viviendaData.numero_vivienda || "",
      jefe_familia: viviendaData.jefe_familia || "",
      nombre_municipio: viviendaData.nombre_municipio || "",
      nombre_comunidad: viviendaData.nombre_comunidad || "",
      vivienda_id: viviendaId,
      denuncia_id: denunciaData?.denuncia_id,
      direccion: viviendaData.direccion || ""
    };

    console.log("🚀 Enviando a RR1:", {
      municipio_id: datosParaRR1.municipio_id,
      comunidad_id: datosParaRR1.comunidad_id,
      numero_vivienda: datosParaRR1.numero_vivienda,
      jefe_familia: datosParaRR1.jefe_familia
    });

    navigate("/admin/rr1", { 
      state: { 
        datosVivienda: datosParaRR1
      } 
    });
  };

  // ✅ VALIDACIONES POR ESTADO
  // Determinar si mostrar "Programar" o "Reprogramar"
  const isReprogramar = estadoDenuncia === "programada" || estadoDenuncia === "reprogramada";
  
  // Habilitar programar solo para estado "recibida"
  const isProgramarHabilitado = estadoDenuncia === "recibida";
  
  // Habilitar reprogramar solo para estado "programada" y "reprogramada"
  const isReprogramarHabilitado = estadoDenuncia === "programada" || estadoDenuncia === "reprogramada";
  
  // Habilitar formulario solo para estado "programada" y "reprogramada"
  const isFormularioHabilitado = estadoDenuncia === "programada" || estadoDenuncia === "reprogramada";

  // Texto del botón según estado
  const getTextoBotonProgramar = () => {
    if (!estadoDenuncia) return "Programar";
    
    switch(estadoDenuncia) {
      case "recibida": return "Programar";
      case "programada": return "Reprogramar";
      case "reprogramada": return "Reprogramar";
      case "realizada": return "Realizada";
      case "cancelada": return "Cancelada";
      default: return "Programar";
    }
  };

  // ✅ OBTENER MENSAJE EXPLICATIVO SEGÚN EL ESTADO
  const getMensajeExplicativo = () => {
    if (!denunciaData) {
      return "No hay denuncia disponible para esta vivienda.";
    }

    switch(estadoDenuncia) {
      case "recibida":
        return "📋 Estado: Recibida - Solo puede PROGRAMAR la visita. Una vez programada podrá completar el Formulario RR1.";
      case "programada":
        return "✅ Estado: Programada - Ya puede completar el FORMULARIO RR1 después de realizar el rociado. También puede REPROGRAMAR la visita si es necesario.";
      case "reprogramada":
        return "🔄 Estado: Reprogramada - Puede REPROGRAMAR nuevamente la visita si es necesario. También puede completar el FORMULARIO RR1 después del rociado.";
      case "realizada":
        return "🏁 Estado: Realizada - El rociado ya fue completado y registrado. No se puede programar ni reprogramar.";
      case "cancelada":
        return "❌ Estado: Cancelada - La denuncia ha sido cancelada. No se puede programar ni reprogramar.";
      default:
        return "ℹ️ Seleccione una vivienda con denuncia activa.";
    }
  };

  return (
    <div className="action-buttons-container">
      <div className="buttons-row">
        <Button 
          className={`action-button-programar ${isReprogramar ? 'reprogramar-button' : ''}`}
          onClick={handleProgramarClick}
          disabled={!viviendaId || !denunciaData?.denuncia_id || 
                   (!isProgramarHabilitado && !isReprogramarHabilitado)}
        >
          {getTextoBotonProgramar()}
        </Button>
        <Button 
          className="action-button-formulario" 
          onClick={handleFormularioClick}
          disabled={!viviendaId || !viviendaData || !isFormularioHabilitado}
        >
          Formulario RR1
        </Button>
      </div>
      
      {/* ✅ MENSAJE EXPLICATIVO DEBAJO DE LOS BOTONES */}
      <div className="explicacion-estado">
        <div className="icono-info">💡</div>
        <div className="texto-explicacion">
          {getMensajeExplicativo()}
        </div>
      </div>
    </div>
  );
};