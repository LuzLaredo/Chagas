import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext"; // Ajusta la ruta según tu estructura
import SinAcceso from "../SinAcceso"; // Importa SinAcceso
import NavBar from "../NavBar"; // Importa NavBar
import "../../css/usuarioCRUD.css";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { usuario, isLoading, hasRole } = useAuth(); // Usa el hook de autenticación

  // Verificar acceso - mismos roles que en NavBar
  const allowedRoles = ["tecnico", "jefe_grupo", "administrador"];
  const hasAccess = usuario && allowedRoles.includes(usuario.rol);

  useEffect(() => {
    // Solo hacer fetch si tiene acceso
    if (hasAccess) {
      fetch("http://localhost:5000/api/usuarios")
        .then((res) => res.json())
        .then((data) => setUsuarios(data))
        .catch((err) => console.error("Error cargando usuarios:", err));
    }
  }, [hasAccess]);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
    await fetch(`http://localhost:5000/api/usuarios/${id}`, { method: "DELETE" });
    setUsuarios(usuarios.filter((u) => u.usuario_id !== id));
  };

  const handleView = (id) => {
    navigate(`/usuarios/view/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/usuarios/edit/${id}`);
  };

  const filtered = usuarios.filter((u) =>
    u.nombre_completo.toLowerCase().includes(search.toLowerCase())
  );

  // Estados de carga y acceso
  if (isLoading) {
    return (
      <div className="usuarios-page">
        <NavBar />
        <div className="usuarios-container">
          <div className="loading">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <SinAcceso />;
  }

  return (
    <div className="usuarios-page">
      <NavBar />
      <div className="usuarios-container">
        <div className="usuarios-header">
          <h1 className="usuarios-title">Gestión de Usuarios</h1>
          <div className="user-info">
            <span className="user-role">Rol: {usuario?.rol}</span>
            <span className="user-name">Usuario: {usuario?.nombre_completo || 'Usuario'}</span>
          </div>
        </div>

        <div className="search-create-container">
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <Link to="/usuarios/create" className="create-button">
            + Crear usuario
          </Link>
        </div>

        <div className="table-container">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Municipios</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.usuario_id}>
                  <td>{u.nombre_completo}</td>
                  <td>{u.correo_electronico}</td>
                  <td>
                    <span className={`role-badge role-${u.rol.toLowerCase().replace('_', '-')}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${u.estado.toLowerCase().replace(' ', '-')}`}>
                      {u.estado}
                    </span>
                  </td>
                  <td>{u.municipios || <span className="empty-state">—</span>}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        onClick={() => handleView(u.usuario_id)}
                        className="action-btn btn-view"
                      >
                        👁️ Ver
                      </button>
                      <button
                        onClick={() => handleEdit(u.usuario_id)}
                        className="action-btn btn-edit"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(u.usuario_id)}
                        className="action-btn btn-delete"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Información de permisos */}
        <div className="permisos-info">
          <h3>Permisos de Gestión de Usuarios</h3>
          <div className="permisos-grid">
            <div className="permiso-item">
              <span className="permiso-rol">👨‍💼 Técnico</span>
              <span className="permiso-desc">Puede: Ver y gestionar usuarios</span>
            </div>
            <div className="permiso-item">
              <span className="permiso-rol">👔 Jefe de Grupo</span>
              <span className="permiso-desc">Puede: Ver y gestionar usuarios</span>
            </div>
            <div className="permiso-item">
              <span className="permiso-rol">🔧 Administrador</span>
              <span className="permiso-desc">Puede: Ver y gestionar usuarios</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Usuarios;