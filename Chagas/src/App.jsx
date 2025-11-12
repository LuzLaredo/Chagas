import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./pages/AuthContext";

// Componentes base
import NavBar from "./pages/NavBar";
import Footer from "./pages/Footer";
import Register from "./pages/Register";
import AboutUs from "./pages/AboutUs";
import Login from "./pages/Login";
import Home from "./pages/Home";

/* ========== ADMIN ========== */
import RR1 from "./pages/admin/RR1";
import RR2 from "./pages/admin/RR2";
import RR3 from "./pages/admin/RR3";
import EE1 from "./pages/admin/EvaluacionesEntomologicasEE1.jsx"; // ✅ Nombre exacto del archivo
import EE2 from "./pages/admin/EE2";
import EE3 from "./pages/admin/EE3";
import Manejo from "./pages/admin/Manejo";
import DetalleEE1 from "./pages/DatosEE1";

/* ========== USUARIOS ========== */
import Usuarios from "./pages/Usuarios/usuarios";
import UsuarioView from "./pages/Usuarios/usuarioView";
import UsuarioEdit from "./pages/Usuarios/usuarioEdit";
import UsuarioCreate from "./pages/Usuarios/usuarioCreate";

/* ========== FUNCIONES Y REPORTES ========== */
import Programar from "./pages/Programar";
import CargaRociado from "./pages/CargaRociado";
import Estadisticas from "./pages/Estadisticas";
import EstadisticasNivo from "./pages/EstadisticasNivo";

/* ========== DENUNCIAS ========== */
import Denuncias from "./pages/Denuncias";
import RegistrarDenuncia from "./pages/RegistrarDenuncia";
import DetallesDenuncia from "./pages/DetallesDenuncia";

/* ========== MAPAS ========== */
import Mapas from "./pages/Mapas";
import MapasEE1 from "./pages/MapasEE1";
import MapasGeneral from "./pages/MapasGeneral";

/* ========== ESTILOS ========== */
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          {/* Barra superior */}
          <NavBar />

          <main className="main-content">
            <Routes>
              {/* ====== PÁGINAS PRINCIPALES ====== */}
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/sobreNosotros" element={<AboutUs />} />

              {/* ====== ADMIN ====== */}
              <Route path="/admin/RR1" element={<RR1 />} />
              <Route path="/admin/RR2" element={<RR2 />} />
              <Route path="/admin/RR3" element={<RR3 />} />
              <Route path="/admin/EE1" element={<EE1 />} /> {/* ✅ Evaluaciones EE1 */}
              <Route path="/admin/EE2" element={<EE2 />} />
              <Route path="/admin/EE3" element={<EE3 />} />
              <Route path="/admin/manejo" element={<Manejo />} />
              <Route path="/DatosEE1" element={<DetalleEE1 />} />

              {/* ====== USUARIOS ====== */}
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/usuarios/view/:id" element={<UsuarioView />} />
              <Route path="/usuarios/edit/:id" element={<UsuarioEdit />} />
              <Route path="/usuarios/create" element={<UsuarioCreate />} />

              {/* ====== FUNCIONES Y ROCIADO ====== */}
              <Route path="/cargaRociado" element={<CargaRociado />} />
              <Route path="/programar/:id" element={<Programar />} />

              {/* ====== MAPAS ====== */}
              <Route path="/mapas" element={<Mapas />} />
              <Route path="/mapaEE1" element={<MapasEE1 />} />
              <Route path="/mapaGeneral" element={<MapasGeneral />} />

              {/* ====== ESTADÍSTICAS ====== */}
              <Route path="/estadisticas" element={<Estadisticas />} />
              <Route
                path="/estadisticas-avanzadas"
                element={<EstadisticasNivo />}
              />

              {/* ====== DENUNCIAS ====== */}
              <Route path="/denuncia" element={<Denuncias />} />
              <Route path="/registrar-denuncia" element={<RegistrarDenuncia />} />
              <Route path="/detalles-denuncia/:id" element={<DetallesDenuncia />} />
            </Routes>
          </main>

          {/* Pie de página */}
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
