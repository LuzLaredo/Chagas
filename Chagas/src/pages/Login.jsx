import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "../css/Login.css";

function Login() {
  const [formData, setFormData] = useState({
    correo_electronico: "",
    contrasena: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

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
      const response = await fetch("http://localhost:5000/api/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // 🔥 CORREGIDO: token primero, usuario después
        login(data.token, data.usuario);
        navigate("/"); // Redirigir al home
      } else {
        setError(data.error || "Error en el login");
      }
    } catch (error) {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordMessage("");
    setForgotPasswordLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/usuarios/solicitar-recuperacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo_electronico: forgotPasswordEmail })
      });

      const data = await response.json();

      if (response.ok) {
        setForgotPasswordMessage("Se ha enviado un código de recuperación a tu email");
        setTimeout(() => {
          navigate("/reset-password", { state: { email: forgotPasswordEmail } });
        }, 2000);
      } else {
        setForgotPasswordMessage(data.error || "Error al enviar el código");
      }
    } catch (error) {
      setForgotPasswordMessage("Error de conexión con el servidor");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-info">
        <h2>Programa Departamental de Chagas Cochabamba</h2>
        <p>
          Sistema de Vigilancia, Denuncia y Tratamiento. <br />
          Un software para apoyar al personal de salud en la lucha contra el Chagas.
        </p>
      </div>

      <div className="register-card">
        <h3 className="login-title">Iniciar Sesión</h3>
        
        {error && <div className="error-message">{error}</div>}
        
        {!showForgotPassword ? (
          <>
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

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? "Iniciando sesión..." : "Ingresar"}
              </button>
            </form>

            <p className="login-redirect">
              ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
            </p>
            
            <p className="forgot-password-link">
              <a href="#" onClick={() => setShowForgotPassword(true)}>
                ¿No recuerdas tu contraseña?
              </a>
            </p>
          </>
        ) : (
          <div className="forgot-password-section">
            <h4>Recuperar Contraseña</h4>
            <p>Ingresa tu correo electrónico para recibir un código de recuperación</p>
            
            {forgotPasswordMessage && (
              <div className={`message ${forgotPasswordMessage.includes("Error") ? "error-message" : "success-message"}`}>
                {forgotPasswordMessage}
              </div>
            )}
            
            <form className="register-form" onSubmit={handleForgotPassword}>
              <input 
                type="email" 
                placeholder="Correo Electrónico" 
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required 
              />
              
              <button type="submit" className="register-btn" disabled={forgotPasswordLoading}>
                {forgotPasswordLoading ? "Enviando código..." : "Enviar Código"}
              </button>
            </form>
            
            <p className="back-to-login">
              <a href="#" onClick={() => setShowForgotPassword(false)}>
                ← Volver al inicio de sesión
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
