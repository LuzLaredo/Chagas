import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
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
  const { usuario, token } = useAuth();

  // 🔹 Cargar municipios desde backend
  useEffect(() => {
    const fetchMunicipios = async () => {
      try {
        // Si es supervisor, cargar solo su municipio
        if (usuario?.rol === 'supervisor' && (usuario?.usuario_id || usuario?.id)) {
          const usuarioId = usuario.usuario_id || usuario.id;
          const res = await fetch(`http://localhost:5000/api/usuarios/${usuarioId}/municipios`, {
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
          });
          if (!res.ok) throw new Error("Error al cargar municipios del supervisor");
          const data = await res.json();

          const normalizedData = data.map(m => ({
            id: (m.municipio_id || m.id).toString(),
            nombre: m.nombre_municipio || m.nombre
          }));

          setMunicipios(normalizedData);

          // Si solo hay un municipio, seleccionarlo automáticamente
          if (normalizedData.length === 1) {
            setForm(prev => ({ ...prev, municipios: [normalizedData[0].id] }));
          }
        } else {
          // Para administradores, cargar todos los municipios
          const res = await fetch("http://localhost:5000/api/municipios");
          if (!res.ok) throw new Error("Error al cargar municipios");
          const data = await res.json();

          const normalizedData = data.map(m => ({
            id: (m.municipio_id || m.id).toString(),
            nombre: m.nombre_municipio || m.nombre
          }));

          setMunicipios(normalizedData);
        }
      } catch (err) {
        console.error(err);
        alert("⚠️ No se pudieron cargar los municipios. Verifica tu backend.");
      }
    };
    fetchMunicipios();
  }, [usuario, token]);

  const validateForm = () => {
    const newErrors = {};
    const rol = form.rol;

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

    // 🚩 Lógica de Validación de Municipios
    if (rol === "tecnico" || rol === "jefe_grupo") {
      if (form.municipios.length === 0) {
        newErrors.municipios = "Debe seleccionar al menos un municipio";
      }
    } else if (rol === "supervisor") {
      if (form.municipios.length !== 1) {
        newErrors.municipios = "El Supervisor debe seleccionar exactamente un municipio.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newMunicipios = form.municipios;

    if (name === "rol") {
      const rolesConMunicipios = ["tecnico", "jefe_grupo", "supervisor"];
      if (!rolesConMunicipios.includes(value)) {
        newMunicipios = [];
      } else if (value === "supervisor" && newMunicipios.length > 1) {
        newMunicipios = [newMunicipios[0]];
      }
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
      municipios: newMunicipios
    }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCheckbox = (e) => {
    const { value, checked } = e.target;
    let updatedMunicipios = form.municipios;

    if (form.rol === "supervisor") {
      // 🛑 Selección única para Supervisor
      updatedMunicipios = checked ? [value] : [];
    } else {
      // Selección múltiple para otros roles
      updatedMunicipios = checked
        ? [...updatedMunicipios, value]
        : updatedMunicipios.filter((m) => m !== value);
    }

    setForm((prev) => ({
      ...prev,
      municipios: updatedMunicipios,
    }));

    if (errors.municipios) setErrors((prev) => ({ ...prev, municipios: "" }));
  };

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
        const errorData = await response.json();
        alert(errorData.error || errorData.message || "Error al crear usuario");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Error de conexión al crear usuario.");
    } finally {
      setLoading(false);
    }
  };

  const rolesDisponibles = [
    { value: "usuario", label: "Usuario" },
    { value: "tecnico", label: "Técnico" },
    { value: "jefe_grupo", label: "Jefe de Grupo" },
    { value: "supervisor", label: "Supervisor" },
    { value: "administrador", label: "Administrador" },
  ];

  // 🔒 FILTRO DE SEGURIDAD REFORZADO: Jefe de Grupo no puede crear Admin ni Supervisor
  const rolesFiltrados = rolesDisponibles.filter(r => {
    // PROTECCIÓN DEFENSA EN PROFUNDIDAD
    const rolUsuario = (usuario?.rol || '').toLowerCase();

    // Detectar cualquier variación de "jefe"
    const esJefe = rolUsuario.includes('jefe');

    if (esJefe) {
      // Ocultar roles superiores
      return r.value !== 'administrador' && r.value !== 'supervisor';
    }
    return true;
  });

  // Debugging para desarrollo (visible en consola del navegador)
  // console.log("Rol Usuario:", usuario?.rol, "Es Jefe?", (usuario?.rol || '').toLowerCase().includes('jefe'), "Opciones:", rolesFiltrados);

  return (
    <div className="usuario-create-container">
      <div className="create-header">
        <h1 className="create-title">Crear Nuevo Usuario</h1>
      </div>

      <form onSubmit={handleSubmit} className="create-form">
        <div className="form-section">
          <h3 className="section-title">Información Básica</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nombre Completo *</label>
              <input name="nombre_completo" value={form.nombre_completo} onChange={handleChange} className="form-input" />
              {errors.nombre_completo && <span className="error-message">{errors.nombre_completo}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Correo Electrónico *</label>
              <input name="correo_electronico" type="email" value={form.correo_electronico} onChange={handleChange} className="form-input" />
              {errors.correo_electronico && <span className="error-message">{errors.correo_electronico}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña *</label>
              <input name="contrasena" type="password" value={form.contrasena} onChange={handleChange} className="form-input" />
              {errors.contrasena && <span className="error-message">{errors.contrasena}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Configuración del Perfil</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Rol *</label>
              <select name="rol" value={form.rol} onChange={handleChange} className="form-select">
                {rolesFiltrados.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            {/* Estado field removed: Defaulting to 'activo' */}
          </div>
        </div>

        {(form.rol === "tecnico" || form.rol === "jefe_grupo" || form.rol === "supervisor") && (
          <div className="form-section">
            <h3 className="section-title">Asignación de Municipios</h3>
            {form.rol === "supervisor" && <div className="supervisor-hint">🚨 Selección única requerida.</div>}
            <div className="municipios-grid">
              {municipios.map((m) => (
                <label key={m.id} className="checkbox-option">
                  <input
                    type="checkbox"
                    value={m.id}
                    checked={form.municipios.includes(m.id)}
                    onChange={handleCheckbox}
                    disabled={form.rol === "supervisor" && form.municipios.length === 1 && !form.municipios.includes(m.id)}
                  />
                  {m.nombre}
                </label>
              ))}
            </div>
            {errors.municipios && <span className="error-message">{errors.municipios}</span>}
          </div>
        )}

        <div className="form-actions">
          <Link to="/usuarios" className="btn-cancel">Cancelar</Link>
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? "Creando..." : "Crear Usuario"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UsuarioCreate;