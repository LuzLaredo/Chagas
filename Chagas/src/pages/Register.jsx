import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Register.css";
import { baseUrl } from "../api/BaseUrl"; 

function Register() {
  const [formData, setFormData] = useState({
    nombre_completo: "",
    correo_electronico: "",
    contrasena: "",
    confirmar_contrasena: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const navigate = useNavigate();

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
    setLoading(true);

    // Validaciones
    if (formData.contrasena !== formData.confirmar_contrasena) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (!isPasswordValid(formData.contrasena)) {
      setError("La contraseña no cumple con todos los requisitos");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/usuarios/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_completo: formData.nombre_completo,
          correo_electronico: formData.correo_electronico,
          contrasena: formData.contrasena,
          rol: "usuario" // Rol fijo como "usuario"
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Usuario registrado exitosamente");
        // Limpiar formulario
        setFormData({
          nombre_completo: "",
          correo_electronico: "",
          contrasena: "",
          confirmar_contrasena: ""
        });
        
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(data.error || "Error en el registro");
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
    
    const requirements = validatePassword(formData.contrasena);
    
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
        <h3 className="register-title">Crear Cuenta</h3>
        
        {error && <div style={{color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffe6e6', border: '1px solid red', borderRadius: '4px'}}>{error}</div>}
        {success && <div style={{color: 'green', marginBottom: '10px', padding: '10px', backgroundColor: '#e6ffe6', border: '1px solid green', borderRadius: '4px'}}>{success}</div>}
        
        <form className="register-form" onSubmit={handleSubmit}>
          <input 
            type="text" 
            name="nombre_completo" 
            placeholder="Nombre Completo" 
            value={formData.nombre_completo}
            onChange={handleChange}
            required 
          />
          <input 
            type="email" 
            name="correo_electronico" 
            placeholder="Correo Electrónico" 
            value={formData.correo_electronico}
            onChange={handleChange}
            required 
          />
          <input 
            type="password" 
            name="contrasena" 
            placeholder="Contraseña" 
            value={formData.contrasena}
            onChange={handleChange}
            required 
            minLength="6"
          />
          
          <PasswordRequirements />
          
          <input 
            type="password" 
            name="confirmar_contrasena" 
            placeholder="Confirmar Contraseña" 
            value={formData.confirmar_contrasena}
            onChange={handleChange}
            required 
          />

          <button 
            type="submit" 
            className="register-btn"
            disabled={loading}
          >
            {loading ? "Registrando..." : "Registrarse"}
          </button>
        </form>

        <p className="login-redirect">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;