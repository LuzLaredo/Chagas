import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // Importa el contexto
import "../css/Login.css";
import { baseUrl } from "../api/BaseUrl"; 

function Login() {
  const [formData, setFormData] = useState({
    correo_electronico: "",
    contrasena: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Usa la función login del contexto

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${baseUrl}/api/usuarios/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Usa la función login del contexto para actualizar el estado global
        login(data.token, data.usuario);
        
        // Redirigir al home
        navigate("/");
      } else {
        setError(data.error || "Error en el login");
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
        <h3 className="login-title">Iniciar Sesión</h3>
        
        {error && <div className="error-message">{error}</div>}
        
        <form className="register-form" onSubmit={handleSubmit}>
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
          />

          <button 
            type="submit" 
            className="register-btn"
            disabled={loading}
          >
            {loading ? "Iniciando sesión..." : "Ingresar"}
          </button>
        </form>

        <p className="login-redirect">
          ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;