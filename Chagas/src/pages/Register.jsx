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
  const navigate = useNavigate();

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
    setLoading(true);

    // Validaciones
    if (formData.contrasena !== formData.confirmar_contrasena) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (formData.contrasena.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
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

  return (
    <div className="register-container">
      {/* Lado izquierdo */}
      <div className="register-info">
        <h2>Programa Nacional de Chagas</h2>
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