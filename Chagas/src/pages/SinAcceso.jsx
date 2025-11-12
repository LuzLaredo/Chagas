import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/SinAcceso.css"; // Crearemos este CSS

function SinAcceso() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Regresa a la página anterior
  };

  const handleGoHome = () => {
    navigate("/"); // Redirige al home
  };

  return (
    <div className="sin-acceso-container">
      <div className="sin-acceso-content">
        <div className="access-denied-icon">
          <span>🚫</span>
        </div>
        
        <h1 className="access-denied-title">Acceso Denegado</h1>
        
        <div className="access-denied-message">
          <p><strong>Usted NO tiene acceso a esta página</strong></p>
          <p>Su rol de usuario no tiene los permisos necesarios para acceder a este recurso.</p>
        </div>

        <div className="access-denied-actions">
          <button 
            className="btn-back"
            onClick={handleGoBack}
          >
            ← Volver Atrás
          </button>
          
          <button 
            className="btn-home"
            onClick={handleGoHome}
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}

export default SinAcceso;