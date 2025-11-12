import React from "react";
import { Navigate } from "react-router-dom";
// 💡 Importar el hook useAuth (Ajusta la ruta si es necesario)
import { useAuth } from "../pages/AuthContext"; 

const ProtectedRoute = ({ children }) => {
  // 💡 Ahora usamos las propiedades isLoading y usuario del nuevo contexto
  const { usuario, isLoading } = useAuth(); 
  
  // Roles permitidos para esta ruta
  const allowedRoles = ["administrador", "jefe_grupo"];

  if (isLoading) {
    // Muestra un mensaje de carga mientras se inicializa el estado de autenticación (lee localStorage)
    return <div style={{ padding: "2rem", textAlign: "center" }}>
      ⏳ Verificando credenciales...
    </div>;
  }
    
  if (!usuario) {
    // Si no hay usuario, redirige al login
    return <Navigate to="/login" replace />;
  }

  // Comprueba si el rol del usuario (usuario.rol) está incluido en los roles permitidos
  // NOTA: Tu AuthProvider ya tiene una función hasRole(allowedRoles), 
  // pero para mantener la estructura original de ProtectedRoute, lo hacemos aquí:
  if (!allowedRoles.includes(usuario.rol)) {
    // Si el rol no es permitido, mostrar mensaje de acceso denegado
    return <div style={{ padding: "2rem", textAlign: "center" }}>
      ❌ Acceso denegado. No tienes permisos para ver esta página.
    </div>;
  }

  // Si pasa todas las comprobaciones (no está cargando, está logueado y tiene rol permitido)
  return children;
};

export default ProtectedRoute;