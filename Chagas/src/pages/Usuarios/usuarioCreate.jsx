import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../css/usuarioCRUD.css";

function UsuarioCreate() {
  const [form, setForm] = useState({
    nombre_completo: "",
    correo_electronico: "",
    contrasena: "",
    rol: "usuario",
    estado: "activo",
    municipios: [],
  });

  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // 🔹 Cargar municipios desde backend
  useEffect(() => {
    const fetchMunicipios = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/municipios");
        if (!res.ok) throw new Error("Error al cargar municipios");
        const data = await res.json();
        setMunicipios(data);
      } catch (err) {
        console.error(err);
        alert("⚠️ No se pudieron cargar los municipios. Verifica tu backend.");
      }
    };
    fetchMunicipios();
  }, []);

  // 🔹 Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!form.nombre_completo.trim()) newErrors.nombre_completo = "El nombre completo es requerido";
    if (!form.correo_electronico.trim()) {
      newErrors.correo_electronico = "El correo electrónico es requerido";
    } else if (!/\S+@\S+\.\S+/.test(form.correo_electronico)) {
      newErrors.correo_electronico = "El correo electrónico no es válido";
    }
    if (!form.contrasena) {
      newErrors.contrasena = "La contraseña es requerida";
    } else if (form.contrasena.length < 6) {
      newErrors.contrasena = "La contraseña debe tener al menos 6 caracteres";
    }
    if ((form.rol === "tecnico" || form.rol === "jefe_grupo") && form.municipios.length === 0) {
      newErrors.municipios = "Debe seleccionar al menos un municipio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔹 Manejar cambios
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...((name === "rol" && !["tecnico", "jefe_grupo"].includes(value)) && { municipios: [] }),
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // 🔹 Manejar checkboxes
  const handleCheckbox = (e) => {
    const { value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      municipios: checked
        ? [...prev.municipios, value]
        : prev.municipios.filter((m) => m !== value),
    }));
    if (checked && errors.municipios) setErrors((prev) => ({ ...prev, municipios: "" }));
  };

  // 🔹 Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/usuarios/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        alert("✅ Usuario creado exitosamente");
        navigate("/usuarios");
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          alert(errorData.error || errorData.message || "Error al crear usuario");
        } catch {
          alert("Error del servidor: " + errorText);
        }
      }
    } catch (error) {
      console.error(error);
      alert("❌ Error de conexión al crear usuario. Verifica que el servidor esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Roles disponibles (ya sin restricción)
  const rolesDisponibles = [
    { value: "usuario", label: "Usuario" },
    { value: "tecnico", label: "Técnico" },
    { value: "jefe_grupo", label: "Jefe de Grupo" },
    { value: "administrador", label: "Administrador" },
  ];

  return (
    <div className="usuario-create-container">
      <div className="create-header">
        <h1 className="create-title">Crear Nuevo Usuario</h1>
        <p className="create-subtitle">
          Complete la información para registrar un nuevo usuario en el sistema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="create-form">
        {/* Información Básica */}
        <div className="form-section">
          <h3 className="section-title">Información Básica</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Nombre Completo <span className="required">*</span>
              </label>
              <input
                name="nombre_completo"
                placeholder="Ingrese el nombre completo"
                value={form.nombre_completo}
                onChange={handleChange}
                className={`form-input ${errors.nombre_completo ? "input-error" : ""}`}
              />
              {errors.nombre_completo && (
                <span className="error-message">{errors.nombre_completo}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Correo Electrónico <span className="required">*</span>
              </label>
              <input
                name="correo_electronico"
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.correo_electronico}
                onChange={handleChange}
                className={`form-input ${errors.correo_electronico ? "input-error" : ""}`}
              />
              {errors.correo_electronico && (
                <span className="error-message">{errors.correo_electronico}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Contraseña <span className="required">*</span>
              </label>
              <input
                name="contrasena"
                placeholder="Ingrese la contraseña"
                type="password"
                value={form.contrasena}
                onChange={handleChange}
                className={`form-input ${errors.contrasena ? "input-error" : ""}`}
              />
              {errors.contrasena && (
                <span className="error-message">{errors.contrasena}</span>
              )}
              <div className="password-hint">
                La contraseña debe tener al menos 6 caracteres
              </div>
            </div>
          </div>
        </div>

        {/* Configuración del Perfil */}
        <div className="form-section">
          <h3 className="section-title">Configuración del Perfil</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Rol <span className="required">*</span>
              </label>
              <select
                name="rol"
                value={form.rol}
                onChange={handleChange}
                className="form-select"
              >
                {rolesDisponibles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <div className="select-hint">
                {form.rol === "tecnico" || form.rol === "jefe_grupo"
                  ? "Este rol requiere asignación de municipios"
                  : "Este rol no requiere municipios específicos"}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Estado <span className="required">*</span>
              </label>
              <div className="status-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="estado"
                    value="activo"
                    checked={form.estado === "activo"}
                    onChange={handleChange}
                  />
                  Activo
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="estado"
                    value="inactivo"
                    checked={form.estado === "inactivo"}
                    onChange={handleChange}
                  />
                  Inactivo
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Municipios */}
        {(form.rol === "tecnico" || form.rol === "jefe_grupo") && (
          <div className="form-section">
            <h3 className="section-title">Asignación de Municipios</h3>
            <div className="municipios-section">
              <label className="form-label">
                Municipios Asignados <span className="required">*</span>
              </label>
              {errors.municipios && (
                <span className="error-message block">{errors.municipios}</span>
              )}
              <div className="municipios-grid">
                {municipios.map((m) => (
                  <label key={m.municipio_id} className="checkbox-option">
                    <input
                      type="checkbox"
                      value={m.municipio_id.toString()}
                      checked={form.municipios.includes(m.municipio_id.toString())}
                      onChange={handleCheckbox}
                    />
                    {m.nombre_municipio}
                  </label>
                ))}
              </div>
              <div className="selection-info">
                {form.municipios.length} municipio(s) seleccionado(s)
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? "Creando Usuario..." : "Crear Usuario"}
          </button>
          <Link to="/usuarios" className="cancel-button">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

export default UsuarioCreate;
