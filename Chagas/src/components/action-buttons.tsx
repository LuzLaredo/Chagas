import React from "react"; 
import { Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import "./ActionButtons.css";

export const ActionButtons = ({ viviendaId }) => {
  const navigate = useNavigate();

  const handleProgramarClick = () => {
    if (!viviendaId) {
      alert("Selecciona una vivienda primero");
      return;
    }
    navigate(`/programar/${viviendaId}`);
  };

  return (
    <div className="action-buttons-container">
      <Button className="action-button-programar" onClick={handleProgramarClick}>
        Programar
      </Button>
      <Button className="action-button-formulario">Formulario</Button>
    </div>
  );
};

