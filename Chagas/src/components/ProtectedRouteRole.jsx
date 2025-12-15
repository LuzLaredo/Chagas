import { Navigate } from "react-router-dom";
import { useAuth } from "../pages/AuthContext";

export default function ProtectedRouteRole({ children, allowedRoles = [] }) {
  const { usuario, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        ⏳ Verificando credenciales...
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // 👀 Aquí la validación dinámica
  if (!allowedRoles.includes(usuario.rol)) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        ❌ Acceso denegado. No tienes permisos para ver esta página.
      </div>
    );
  }

  return children;
}
