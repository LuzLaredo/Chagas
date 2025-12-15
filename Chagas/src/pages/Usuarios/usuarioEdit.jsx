import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext"; 
import "../../css/usuarioCRUD.css";

function UsuarioEdit() {
  const { id } = useParams();
  const [form, setForm] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const navigate = useNavigate();

  // OBTENER TOKEN Y ESTADO DE CARGA DEL CONTEXTO
  const { token, loading: authLoading, usuario } = useAuth(); 

  useEffect(() => {
    // 🛑 Condición CLAVE: Solo esperamos que AuthContext termine de cargar.
    if (authLoading) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 💡 HACER HEADERS CONDICIONALES: Enviamos el token SOLO si existe (para el GET)
        const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};
        
        // 1. Fetch de datos del usuario (Ruta GET pública)
        const userPromise = fetch(`http://localhost:5000/api/usuarios/${id}`, { headers: authHeaders });
        
        // 2. Fetch de lista de municipios - Si es supervisor, solo su municipio
        let municipiosPromise;
        if (usuario?.rol === 'supervisor' && (usuario?.usuario_id || usuario?.id)) {
          const usuarioId = usuario.usuario_id || usuario.id;
          municipiosPromise = fetch(`http://localhost:5000/api/usuarios/${usuarioId}/municipios`, {
            headers: authHeaders
          });
        } else {
          municipiosPromise = fetch("http://localhost:5000/api/municipios");
        }

        const [userResponse, municipiosResponse] = await Promise.all([
          userPromise,
          municipiosPromise
        ]);

        // Manejo de error 404 (Usuario no encontrado)
        if (userResponse.status === 404) {
            setLoading(false);
            return; 
        }

        // Si el backend responde 401, es que el token que enviamos es inválido, y debemos forzar el login
        if (userResponse.status === 401) {
            alert("Su sesión ha expirado. Por favor, vuelva a iniciar sesión.");
            navigate("/login"); 
            return;
        }

        const userData = await userResponse.json();
        const municipiosData = await municipiosResponse.json();

        // Normalización de municipios
        let normalizedMunicipios = [];
        if (userData.municipios) {
          if (typeof userData.municipios === "string") {
            normalizedMunicipios = userData.municipios.split(",").map(m => m.trim());
          } else if (Array.isArray(userData.municipios)) {
            normalizedMunicipios = userData.municipios.map(m => m.toString());
          }
        }

        const { contrasena, ...userDataWithoutPassword } = userData;
        
        const normalizedUserData = {
          ...userDataWithoutPassword,
          municipios: normalizedMunicipios
        };

        setForm(normalizedUserData);
        setOriginalData(normalizedUserData);
        setMunicipios(municipiosData);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token, authLoading, navigate]); // Dependencias

  // ... (resto de funciones) ...
  
  const checkForChanges = (newForm) => {
    const fieldsToCompare = ['nombre_completo', 'correo_electronico', 'rol', 'estado'];
    
    // Comparar campos básicos
    const basicFieldsChanged = fieldsToCompare.some(field => 
      newForm[field] !== originalData[field]
    );

    // Comparar municipios (arrays)
    const municipiosChanged = 
      newForm.municipios?.length !== originalData.municipios?.length ||
      !newForm.municipios?.every((m, index) => m === originalData.municipios?.[index]);

    return basicFieldsChanged || municipiosChanged;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value };
    setForm(newForm);
    setHasChanges(checkForChanges(newForm));
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

    const newForm = { ...form, municipios: updatedMunicipios };
    setForm(newForm);
    setHasChanges(checkForChanges(newForm));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar si hay cambios
    if (!hasChanges) {
      alert("❌ No has hecho ningún cambio. Modifica algún campo para poder guardar.");
      return;
    }
    
    // 🔥 ELIMINAMOS EL BLOQUE DE VALIDACIÓN DE TOKEN AQUÍ (Ya es público)
    
    setSaving(true);

    try {
      // IMPORTANTE: Enviar solo los campos que estamos editando
      const dataToSend = {
        nombre_completo: form.nombre_completo,
        correo_electronico: form.correo_electronico,
        rol: form.rol,
        estado: form.estado,
        municipios: form.municipios || []
      };

      console.log("Enviando datos:", dataToSend);

      const response = await fetch(`http://localhost:5000/api/usuarios/${id}`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            // 🔥 ELIMINADO: No se envía Authorization header
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        setOriginalData(form);
        setHasChanges(false);

        alert("✅ Usuario actualizado exitosamente");
        navigate("/usuarios");
      } else if (response.status === 401 || response.status === 403) {
          // Si vemos 401 o 403, significa que la ruta aún está protegida en el backend
          alert("Error: El servidor RESTRICTIVO. La ruta PUT /api/usuarios/:id aún requiere autenticación/permisos.");
      } else {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        alert(errorData.error || "Error al guardar los cambios");
      }
    } catch (error) {
      console.error("Error guardando usuario:", error);
      alert("❌ Error de conexión al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  // ... (resto de funciones) ...
    const isMunicipioSelected = (municipioId) => {
    return form.municipios?.includes(municipioId.toString()) || false;
  };

  // Función para resetear cambios
  const handleReset = () => {
    setForm(originalData);
    setHasChanges(false);
  };

  // 🛑 Bloque de renderizado: Espera a que AuthContext termine de cargar
  if (loading || authLoading) { 
    return (
      <div className="edit-usuario-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Cargando datos del usuario...</p>
        </div>
        <div className="loading-note">Esperando autenticación...</div>
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
        
        {/* Indicador de cambios */}
        <div className={`changes-indicator ${hasChanges ? 'has-changes' : 'no-changes'}`}>
          {hasChanges ? (
            <>
              <span className="indicator-dot"></span>
              Tienes cambios sin guardar
            </>
          ) : (
            "No hay cambios realizados"
          )}
        </div>
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
                  <option value="supervisor">Supervisor</option>
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
          {(form.rol === "tecnico" || form.rol === "jefe_grupo" || form.rol === "supervisor") && (
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

          {/* Información adicional */}
          <div className="form-section">
            <h3 className="section-title">ℹ️ Información Adicional</h3>
            <div className="info-message">
              <p>💡 <strong>Nota:</strong> Para cambiar la contraseña del usuario, utiliza la función de "Recuperar Contraseña" desde el login o contacta al administrador del sistema.</p>
            </div>
          </div>

          {/* Acciones del Formulario */}
          <div className="form-actions">
            <Link to="/usuarios" className="cancel-button">❌ Cancelar</Link>
            <button 
              type="button" 
              className="reset-button"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              🔄 Descartar Cambios
            </button>
            <button 
              type="submit" 
              className="save-button" 
              disabled={saving || !hasChanges} // 🔥 ELIMINADO: || !token 
            >
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