import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import SinAcceso from "../SinAcceso";
import NavBar from "../NavBar";
import "../../css/usuarioCRUD.css";

function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [search, setSearch] = useState("");
    const [showInactive, setShowInactive] = useState(false); // 🆕 Estado para mostrar inactivos
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { usuario, token, loading: authLoading } = useAuth();

    // Verificar acceso
    const allowedRoles = ["tecnico", "jefe_grupo", "administrador", "supervisor"];
    const hasAccess = usuario && allowedRoles.includes(usuario.rol);

    useEffect(() => {
        if (authLoading) return;

        const fetchUsuarios = async () => {
            setError(null);
            const headers = token ? { "Authorization": `Bearer ${token}` } : {};

            try {
                const res = await fetch("http://localhost:5000/api/usuarios", { headers });
                if (!res.ok) throw new Error(`Error en el servidor: Código ${res.status}`);
                const data = await res.json();

                let usersArray = [];
                if (Array.isArray(data)) {
                    usersArray = data;
                } else if (data && Array.isArray(data.usuarios)) {
                    usersArray = data.usuarios;
                }

                setUsuarios(usersArray);
            } catch (err) {
                console.error("Error cargando usuarios:", err);
                setError(err.message || "Error de conexión con el servidor.");
            }
        };

        fetchUsuarios();
    }, [hasAccess, authLoading, token]);

    // 🆕 Función para cambiar estado (Activar/Desactivar)
    const handleToggleStatus = async (user) => {
        const nuevoEstado = user.estado === 'activo' ? 'inactivo' : 'activo';
        const accion = nuevoEstado === 'activo' ? 'activar' : 'desactivar';

        if (!window.confirm(`¿Estás seguro de que deseas ${accion} a ${user.nombre_completo}?`)) return;

        try {
            const res = await fetch(`http://localhost:5000/api/usuarios/${user.usuario_id}/estado`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (res.ok) {
                // Actualizar estado localmente
                setUsuarios(prev => prev.map(u =>
                    u.usuario_id === user.usuario_id ? { ...u, estado: nuevoEstado } : u
                ));
            } else {
                const errorData = await res.json().catch(() => ({ error: "Error desconocido" }));
                alert(`No se pudo cambiar el estado: ${errorData.error}`);
            }
        } catch (err) {
            console.error("Error cambiando estado:", err);
            alert("Error de conexión al intentar cambiar el estado.");
        }
    };

    const handleView = (id) => navigate(`/usuarios/view/${id}`);
    const handleEdit = (id) => navigate(`/usuarios/edit/${id}`);

    // 🔎 Filtrado de usuarios
    const filtered = Array.isArray(usuarios)
        ? usuarios.filter((u) => {
            // Filtro de búsqueda
            const matchesSearch = u.nombre_completo.toLowerCase().includes(search.toLowerCase());
            // Filtro de estado (si showInactive es false, solo muestra activos)
            const matchesStatus = showInactive ? true : u.estado === 'activo';

            // 🛡️ FILTRO DE VISIBILIDAD DEFENSA EN PROFUNDIDAD (Frontend)
            // Si soy jefe_grupo, no debo ver admins ni supervisores
            const currentUserRole = (usuario?.rol || '').toLowerCase();
            const esJefe = currentUserRole.includes('jefe'); // Detectar jefe_grupo, etc.

            if (esJefe) {
                const targetRole = (u.rol || '').toLowerCase();
                if (targetRole === 'administrador' || targetRole === 'supervisor') {
                    return false; // Ocultar
                }
            }

            return matchesSearch && matchesStatus;
        })
        : [];

    if (authLoading) return <div className="loading">Cargando autenticación...</div>;
    if (!hasAccess) return <SinAcceso />;

    return (
        <div className="usuarios-page">
            <NavBar />
            <div className="usuarios-container">
                <div className="usuarios-header">
                    <h1 className="usuarios-title">Gestión de Usuarios</h1>
                    <div className="user-info">
                        <span className="user-role">Rol: {usuario?.rol}</span>
                    </div>
                </div>

                <div className="search-create-container" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Buscar usuario..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />

                    <label className="toggle-inactive" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                        />
                        Mostrar Inactivos
                    </label>

                    <Link to="/usuarios/create" className="create-button">
                        + Crear usuario
                    </Link>
                </div>

                {error && <div className="error-message">{error}</div>}

                {filtered.length === 0 && !error ? (
                    <div className="empty-message">No se encontraron usuarios {showInactive ? '' : 'activos'}.</div>
                ) : (
                    <div className="table-container">
                        <table className="usuarios-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Correo</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Municipios</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((u) => (
                                    <tr key={u.usuario_id}>
                                        <td>{u.nombre_completo}</td>
                                        <td>{u.correo_electronico}</td>
                                        <td>
                                            <span className={`role-badge role-${u.rol.toLowerCase().replace('_', '-')}`}>
                                                {u.rol}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${u.estado.toLowerCase().replace(' ', '-')}`}>
                                                {u.estado}
                                            </span>
                                        </td>
                                        <td>{u.municipios && u.municipios.trim() !== "" ? u.municipios : <span className="municipio-sin-asignar">Sin asignar</span>}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button onClick={() => handleView(u.usuario_id)} className="action-btn btn-view" title="Ver detalle">
                                                    Ver
                                                </button>
                                                <button onClick={() => handleEdit(u.usuario_id)} className="action-btn btn-edit" title="Editar">
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(u)}
                                                    className={`action-btn ${u.estado === 'activo' ? 'btn-delete' : 'btn-activate'}`}
                                                    title={u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                                    style={{ backgroundColor: u.estado === 'activo' ? '' : '#10b981', color: 'white' }}
                                                >
                                                    {u.estado === 'activo' ? 'Eliminar' : 'Activar'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Usuarios;