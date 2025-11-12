import React from "react";
import { Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import "./ActionButtons.css";

export const ActionButtons = ({ viviendaId, denunciaData }) => {
  const navigate = useNavigate();

  const handleProgramarClick = () => {
    if (!viviendaId) {
      alert("Selecciona una vivienda primero");
      return;
    }
    if (!denunciaData || !denunciaData.denuncia_id) {
      alert("No hay denuncia disponible para programar");
      return;
    }
    navigate(`/programar/${viviendaId}`);
  };

  const handleFormularioClick = () => {
    if (!viviendaId) {
      alert("Selecciona una vivienda primero");
      return;
    }
    // Aquí puedes implementar la lógica para el formulario
    alert("Funcionalidad de formulario en desarrollo");
  };

  return (
    <div className="action-buttons-container">
      <Button 
        className="action-button-programar" 
        onClick={handleProgramarClick}
        disabled={!viviendaId || !denunciaData?.denuncia_id}
      >
        Programar
      </Button>
      <Button 
        className="action-button-formulario" 
        onClick={handleFormularioClick}
        disabled={!viviendaId}
      >
        Formulario
      </Button>
    </div>
  );
};