import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "../../css/usuarioCRUD.css";

function UsuarioView() {
  const { id } = useParams();
  const [usuario, setUsuario] = useState(null);
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Traer usuario y municipios al mismo tiempo
        const [userRes, municipiosRes] = await Promise.all([
          fetch(`http://localhost:5000/api/usuarios/${id}`),
          fetch("http://localhost:5000/api/municipios")
        ]);

        const userData = await userRes.json();
        const municipiosData = await municipiosRes.json();

        // Normalizar municipios si vienen como string
        if (userData.municipios && typeof userData.municipios === "string") {
          userData.municipios = userData.municipios
            .split(",")
            .map(id => id.trim());
        }

        console.log("Usuario cargado:", userData);
        console.log("Municipios disponibles:", municipiosData);

        setUsuario(userData);
        setMunicipios(municipiosData);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Función para mapear IDs a nombres
  const obtenerNombresMunicipios = (ids) => {
    if (!ids || ids.length === 0) return "No asignado";
    return ids
      .map(id => municipios.find(m => m.municipio_id.toString() === id.toString())?.nombre_municipio)
      .filter(Boolean)
      .join(", ") || "No asignado";
  };

  if (loading)
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Cargando información del usuario...</p>
      </div>
    );

  if (!usuario)
    return (
      <div className="error-container">
        <h2>Usuario no encontrado</h2>
        <p>El usuario que buscas no existe o no se pudo cargar.</p>
        <Link to="/usuarios" className="back-btn">
          Volver a Usuarios
        </Link>
      </div>
    );

  return (
    <div className="usuario-view-container">
      <div className="usuario-header">
        <h1 className="usuario-title">Información del Usuario</h1>
        <div className="usuario-badge">{usuario.rol}</div>
      </div>

      <div className="usuario-card">
        <div className="card-section">
          <h3 className="section-title">Información Personal</h3>
          <div className="info-grid">
            <div className="info-item">
              <label className="info-label">Nombre Completo</label>
              <p className="info-value">{usuario.nombre_completo}</p>
            </div>
            <div className="info-item">
              <label className="info-label">Correo Electrónico</label>
              <p className="info-value">{usuario.correo_electronico}</p>
            </div>
          </div>
        </div>

        <div className="card-section">
          <h3 className="section-title">Detalles del Perfil</h3>
          <div className="info-grid">
            <div className="info-item">
              <label className="info-label">Rol</label>
              <p className="info-value role-badge">{usuario.rol}</p>
            </div>
            <div className="info-item">
              <label className="info-label">Estado</label>
              <span className={`status-badge ${usuario.estado === 'activo' ? 'status-active' : 'status-inactive'}`}>
                {usuario.estado}
              </span>
            </div>
            <div className="info-item full-width">
              <label className="info-label">Municipios Asignados</label>
              <p className="info-value">{obtenerNombresMunicipios(usuario.municipios)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <Link to="/usuarios" className="back-button">
          <span className="button-icon">←</span>
          Volver a la Lista
        </Link>
        <Link to={`/usuarios/edit/${id}`} className="edit-button">
          Editar Usuario
        </Link>
      </div>
    </div>
  );
}

export default UsuarioView;
