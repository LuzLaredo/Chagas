import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../pages/AuthContext";
import "./ProtectedRoute.css"; // Importa el CSS

const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true 
}) => {
  const { usuario, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="access-denied-container">
        ⏳ Verificando credenciales...
      </div>
    );
  }

  if (requireAuth && !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0) {
    if (!usuario) {
      return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(usuario.rol)) {
      return (
        <div className="access-denied-container">
          <div className="access-denied-message">
            ❌ Acceso denegado. No tienes permisos para ver esta página.
          </div>
          <p className="access-denied-subtext">
            Contacta al administrador si crees que esto es un error.
          </p>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;