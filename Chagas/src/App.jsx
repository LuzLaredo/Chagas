import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./pages/AuthContext";

import NavBar from "./pages/NavBar";
import Footer from "./pages/Footer";
import Register from "./pages/Register";
import AboutUs from "./pages/AboutUs";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ResetPassword from "./pages/ResetPassword";

/* ========== ADMIN ========== */
import RR1 from "./pages/admin/RR1";
import RR2 from "./pages/admin/RR2";
import RR3 from "./pages/admin/RR3";
import EE1 from "./pages/admin/EvaluacionesEntomologicasEE1.jsx";
import EE2 from "./pages/admin/EE2";
import EE3 from "./pages/admin/EE3";
import Manejo from "./pages/admin/Manejo"; // ⬅️ RUTA A CORREGIR

import RR1CRUD from "./pages/admin/RR1CRUD";
import RR1View from "./pages/admin/RR1View";
import RR1Edit from "./pages/admin/RR1Edit";

/* ========== EE1 DETALLES ========== */
import DetalleEE1 from "./pages/DatosEE1";
import DetallesEE1 from "./pages/DetallesEE1";

/* ========== USUARIOS ========== */
import Usuarios from "./pages/Usuarios/usuarios";
import UsuarioView from "./pages/Usuarios/usuarioView";
import UsuarioEdit from "./pages/Usuarios/usuarioEdit";
import UsuarioCreate from "./pages/Usuarios/usuarioCreate";

/* ========== FUNCIONES Y REPORTES ========== */
import Programar from "./pages/Programar";
import ReProgramar from "./pages/ReProgramar";
import CargaRociado from "./pages/CargaRociado";
import Estadisticas from "./pages/Estadisticas";
import EstadisticasBasicas from "./pages/EstadisticasBasicas";
import EstadisticasNivo from "./pages/EstadisticasNivo";
import NotificacionesPage from "./pages/NotificacionesPage.jsx";

/* ========== DENUNCIAS ========== */
import Denuncias from "./pages/Denuncias";
import RegistrarDenuncia from "./pages/RegistrarDenuncia";
import DetallesDenuncia from "./pages/DetallesDenuncia";

/* ========== MAPAS ========== */
import Mapas from "./pages/Mapas";
import MapasEE1 from "./pages/MapasEE1";
import MapasGeneral from "./pages/MapasGeneral";

/* ========== PROTECCIONES ========== */
import ProtectedRoute from "./components/ProtectedRoute";
import GuestOnlyRoute from "./components/GuestOnlyRoute";
import { ROLE_COMBINATIONS } from "./constants/roles";

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="app-container">
                    <NavBar />

                    <main className="main-content">
                        <Routes>

                            {/* ====== PÚBLICAS ====== */}
                            <Route path="/" element={<Home />} />
                            <Route path="/home" element={<Home />} />
                            <Route path="/sobreNosotros" element={<AboutUs />} />

                            {/* ====== SOLO PARA INVITADOS ====== */}
                            <Route path="/login" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
                            <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />
                            <Route path="/reset-password" element={<GuestOnlyRoute><ResetPassword /></GuestOnlyRoute>} />

                            {/* ====== NOTIFICACIONES ====== */}
                            <Route path="/notificaciones" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.ALL_AUTHENTICATED}><NotificacionesPage /></ProtectedRoute>} />

                            {/* ====== ADMIN RR1 - RR3 (TECNICO_UP, incluye Supervisor) ====== */}
                            <Route path="/admin/RR1" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.TECNICO_UP}><RR1 /></ProtectedRoute>} />
                            <Route path="/admin/manejo" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.TECNICO_UP}><Manejo /></ProtectedRoute>} /> {/* ⬅️ CORREGIDO: TECNICO_UP */}
                            <Route path="/cargaRociado" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.TECNICO_UP}><CargaRociado /></ProtectedRoute>} />
                            <Route path="/programar/:id" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.TECNICO_UP}><Programar /></ProtectedRoute>} />
                            <Route path="/reprogramar/:id" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.TECNICO_UP}><ReProgramar /></ProtectedRoute>} />
                            <Route path="/admin/EE1" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.TECNICO_UP}><EE1 /></ProtectedRoute>} />


                            {/* ====== REPORTES JEFE (JEFE_UP, incluye Supervisor) ====== */}
                            <Route path="/admin/RR2" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.JEFE_UP}><RR2 /></ProtectedRoute>} />
                            <Route path="/admin/RR3" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.JEFE_UP}><RR3 /></ProtectedRoute>} />
                            <Route path="/admin/EE2" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.JEFE_UP}><EE2 /></ProtectedRoute>} />
                            <Route path="/admin/EE3" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.JEFE_UP}><EE3 /></ProtectedRoute>} />
                            <Route path="/admin/rr1/crud" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.JEFE_UP}><RR1CRUD /></ProtectedRoute>} />
                            <Route path="/admin/rr1/view/:id" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.JEFE_UP}><RR1View /></ProtectedRoute>} />
                            <Route path="/admin/rr1/edit/:id" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.JEFE_UP}><RR1Edit /></ProtectedRoute>} />
                            <Route path="/DatosEE1" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.JEFE_UP}><DetalleEE1 /></ProtectedRoute>} />
                            <Route path="/DetallesEE1/:id" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.JEFE_UP}><DetallesEE1 /></ProtectedRoute>} />
                            <Route path="/mapas" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.JEFE_UP}><Mapas /></ProtectedRoute>} />
                            <Route path="/mapaEE1" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.JEFE_UP}><MapasEE1 /></ProtectedRoute>} />
                            <Route path="/mapaGeneral" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.JEFE_UP}><MapasGeneral /></ProtectedRoute>} />
                            <Route path="/estadisticas-avanzadas" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.JEFE_UP}><EstadisticasNivo /></ProtectedRoute>} />


                            {/* ====== USUARIOS (ACCESO: JEFE_UP, incluye Jefe, Supervisor y Admin) ====== */}
                            <Route path="/usuarios" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.JEFE_UP}><Usuarios /></ProtectedRoute>} />
                            <Route path="/usuarios/view/:id" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.JEFE_UP}><UsuarioView /></ProtectedRoute>} />
                            <Route path="/usuarios/edit/:id" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.JEFE_UP}><UsuarioEdit /></ProtectedRoute>} />
                            <Route path="/usuarios/create" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.JEFE_UP}><UsuarioCreate /></ProtectedRoute>} />


                            {/* ====== DENUNCIAS & ESTADÍSTICAS BÁSICAS (TODOS AUTENTICADOS) ====== */}
                            <Route path="/denuncia" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.ALL_AUTHENTICATED}><Denuncias /></ProtectedRoute>} />
                            <Route path="/registrar-denuncia" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.ALL_AUTHENTICATED}><RegistrarDenuncia /></ProtectedRoute>} />
                            <Route path="/detalles-denuncia/:id" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.ALL_AUTHENTICATED}><DetallesDenuncia /></ProtectedRoute>} />
                            <Route path="/estadisticas" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.ALL_AUTHENTICATED}><Estadisticas /></ProtectedRoute>} />
                            <Route path="/estadisticas-basicas" element={<ProtectedRoute allowedRoles={ROLE_COMBINATIONS.ALL_AUTHENTICATED}><EstadisticasBasicas /></ProtectedRoute>} />

                            {/* ====== Fallback ====== */}
                            <Route path="*" element={<Home />} />

                        </Routes>
                    </main>

                    <Footer />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;