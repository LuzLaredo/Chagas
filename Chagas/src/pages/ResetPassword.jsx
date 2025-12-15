import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/Login.css";

function ResetPassword() {
  const [formData, setFormData] = useState({
    codigo: "",
    nueva_contrasena: "",
    confirmar_contrasena: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email || "";

  // 🔹 LIMPIAR CAMPOS AL ENTRAR A LA PÁGINA
  useEffect(() => {
    setFormData({
      codigo: "",
      nueva_contrasena: "",
      confirmar_contrasena: ""
    });
    setError("");
    setSuccess("");
  }, []);

  const validatePassword = (password) => {
    return {
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      hasMinLength: password.length >= 6
    };
  };

  const isPasswordValid = (password) => {
    const requirements = validatePassword(password);
    return Object.values(requirements).every(req => req === true);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setShowPasswordRequirements(true);
    
    if (formData.nueva_contrasena !== formData.confirmar_contrasena) {
      setError("Las contraseñas no coinciden");
      return;
    }
    
    if (!isPasswordValid(formData.nueva_contrasena)) {
      setError("La contraseña no cumple con todos los requisitos");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/usuarios/resetear-contrasena", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo_electronico: email,
          codigo: formData.codigo,
          nueva_contrasena: formData.nueva_contrasena
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Contraseña actualizada correctamente");
        setTimeout(() => {
          setFormData({
            codigo: "",
            nueva_contrasena: "",
            confirmar_contrasena: ""
          });
          navigate("/login");
        }, 2000);
      } else {
        setError(data.error || "Error al restablecer la contraseña");
      }
    } catch (error) {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 COMPONENTE PARA MOSTRAR REQUISITOS DE CONTRASEÑA
  const PasswordRequirements = () => {
    if (!showPasswordRequirements) return null;
    
    const requirements = validatePassword(formData.nueva_contrasena);
    
    return (
      <div className="password-requirements">
        <p style={{ fontSize: "0.9rem", marginBottom: "10px", color: "#666" }}>
          <strong>La contraseña debe contener:</strong>
        </p>
        <ul style={{ 
          listStyle: "none", 
          padding: 0, 
          margin: 0, 
          fontSize: "0.8rem",
          textAlign: "left" 
        }}>
          <li style={{ color: requirements.hasMinLength ? "green" : "red" }}>
            {requirements.hasMinLength ? "✓" : "✗"} Al menos 6 caracteres
          </li>
          <li style={{ color: requirements.hasUpperCase ? "green" : "red" }}>
            {requirements.hasUpperCase ? "✓" : "✗"} Una letra mayúscula
          </li>
          <li style={{ color: requirements.hasLowerCase ? "green" : "red" }}>
            {requirements.hasLowerCase ? "✓" : "✗"} Una letra minúscula
          </li>
          <li style={{ color: requirements.hasNumber ? "green" : "red" }}>
            {requirements.hasNumber ? "✓" : "✗"} Un número
          </li>
          <li style={{ color: requirements.hasSymbol ? "green" : "red" }}>
            {requirements.hasSymbol ? "✓" : "✗"} Un símbolo especial
          </li>
        </ul>
      </div>
    );
  };

  return (
    <div className="register-container">
      {/* Lado izquierdo */}
      <div className="register-info">
        <h2>Programa Departamental de Chagas Cochabamba</h2>
        <p>
          Sistema de Vigilancia, Denuncia y Tratamiento. <br />
          Un software para apoyar al personal de salud en la lucha contra el Chagas.
        </p>
      </div>

      {/* Card del formulario */}
      <div className="register-card">
        <h3 className="login-title">Restablecer Contraseña</h3>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="email-display">
            <strong>Correo:</strong> {email}
          </div>
          
          <input 
            type="text" 
            name="codigo" 
            placeholder="Código de recuperación" 
            value={formData.codigo}
            onChange={handleChange}
            required 
          />
          
          <input 
            type="password" 
            name="nueva_contrasena" 
            placeholder="Nueva contraseña" 
            value={formData.nueva_contrasena}
            onChange={handleChange}
            required 
          />
          
          <PasswordRequirements />
          
          <input 
            type="password" 
            name="confirmar_contrasena" 
            placeholder="Confirmar nueva contraseña" 
            value={formData.confirmar_contrasena}
            onChange={handleChange}
            required 
          />

          <button 
            type="submit" 
            className="register-btn"
            disabled={loading}
          >
            {loading ? "Actualizando..." : "Actualizar Contraseña"}
          </button>
        </form>

        <p className="login-redirect">
          <a href="#" onClick={() => navigate("/login")}>
            ← Volver al inicio de sesión
          </a>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;