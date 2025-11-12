import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../../css/usuarioCRUD.css";

function UsuarioEdit() {
  const { id } = useParams();
  const [form, setForm] = useState({});
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userResponse, municipiosResponse] = await Promise.all([
          fetch(`http://localhost:5000/api/usuarios/${id}`),
          fetch("http://localhost:5000/api/municipios")
        ]);

        const userData = await userResponse.json();
        const municipiosData = await municipiosResponse.json();

        // Normalizar los municipios del usuario a un array de strings
        if (userData.municipios) {
          if (typeof userData.municipios === "string") {
            userData.municipios = userData.municipios.split(",").map(m => m.trim());
          } else if (Array.isArray(userData.municipios)) {
            userData.municipios = userData.municipios.map(m => m.toString());
          }
        } else {
          userData.municipios = [];
        }

        setForm(userData);
        setMunicipios(municipiosData);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleCheckbox = (e) => {
    const { value, checked } = e.target;
    const municipioId = value.toString();
    let updatedMunicipios = form.municipios || [];

    if (checked) {
      updatedMunicipios = [...updatedMunicipios, municipioId];
    } else {
      updatedMunicipios = updatedMunicipios.filter((m) => m !== municipioId);
    }

    setForm({ ...form, municipios: updatedMunicipios });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`http://localhost:5000/api/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          municipios: form.municipios || []
        }),
      });

      if (response.ok) {
        alert("Usuario actualizado exitosamente");
        navigate("/usuarios");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Error al guardar los cambios");
      }
    } catch (error) {
      console.error("Error guardando usuario:", error);
      alert("Error de conexión al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const isMunicipioSelected = (municipioId) => {
    return form.municipios?.includes(municipioId.toString()) || false;
  };

  if (loading) {
    return (
      <div className="edit-usuario-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Cargando datos del usuario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-usuario-container">
      <div className="edit-usuario-header">
        <div className="header-content">
          <h1 className="edit-usuario-title">
            <span className="back-arrow">
              <Link to="/usuarios" className="back-link">←</Link>
            </span>
            Editar Usuario
          </h1>
          <div className="user-badge">ID: {id}</div>
        </div>
        <p className="edit-subtitle">Modifica la información del usuario en el sistema</p>
      </div>

      <div className="edit-usuario-card">
        <form onSubmit={handleSubmit} className="edit-usuario-form">

          {/* Información Básica */}
          <div className="form-section">
            <h3 className="section-title">Información Básica</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">👤 Nombre Completo</label>
                <input
                  name="nombre_completo"
                  value={form.nombre_completo || ""}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ingresa el nombre completo"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">📧 Correo Electrónico</label>
                <input
                  type="email"
                  name="correo_electronico"
                  value={form.correo_electronico || ""}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Configuración de Acceso */}
          <div className="form-section">
            <h3 className="section-title">Configuración de Acceso</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">🎯 Rol de Usuario</label>
                <select
                  name="rol"
                  value={form.rol || ""}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Selecciona un rol</option>
                  <option value="usuario">Usuario</option>
                  <option value="tecnico">Técnico</option>
                  <option value="jefe_grupo">Jefe de Grupo</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">📊 Estado</label>
                <select
                  name="estado"
                  value={form.estado || ""}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="activo">🟢 Activo</option>
                  <option value="inactivo">🔴 Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Municipios Asignados */}
          {(form.rol === "tecnico" || form.rol === "jefe_grupo") && (
            <div className="form-section">
              <h3 className="section-title">🏙️ Municipios Asignados</h3>
              <div className="municipios-selection">
                <p className="selection-description">
                  Selecciona los municipios que tendrá asignados este usuario:
                </p>
                <div className="checkbox-grid">
                  {municipios.map((m) => (
                    <label key={m.municipio_id} className="checkbox-label">
                      <input
                        type="checkbox"
                        value={m.municipio_id}
                        checked={isMunicipioSelected(m.municipio_id)}
                        onChange={handleCheckbox}
                        className="checkbox-input"
                      />
                      <span className="checkbox-custom"></span>
                      {m.nombre_municipio}
                    </label>
                  ))}
                </div>
                <div className="selected-count">
                  📍 {form.municipios?.length || 0} municipios seleccionados
                </div>
              </div>
            </div>
          )}

          {/* Acciones del Formulario */}
          <div className="form-actions">
            <Link to="/usuarios" className="cancel-button">❌ Cancelar</Link>
            <button type="submit" className="save-button" disabled={saving}>
              {saving ? (
                <>
                  <div className="button-spinner"></div>
                  Guardando...
                </>
              ) : <>💾 Guardar Cambios</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UsuarioEdit;
