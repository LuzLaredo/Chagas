import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { useRouteAccess } from "../AuthContext";
import SinAcceso from "../SinAcceso";
import "../../css/RR1.css";
import "../../css/RR1CRUD.css";
import { baseUrl } from "../../api/BaseUrl";

function RR1CRUD() {
  const { usuario, logout } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useRouteAccess(["tecnico", "jefe_grupo", "administrador", "supervisor"]);
  
  const [formularios, setFormularios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogos, setCatalogos] = useState({
    municipios: [],
    comunidades: [],
    jefesGrupo: [],
    tecnicos: []
  });
  
  const [filtros, setFiltros] = useState({
    municipio_id: "",
    comunidad_id: "",
    jefe_familia: ""
  });
  
  const [comunidadesFiltradas, setComunidadesFiltradas] = useState([]);
  const [municipiosUsuario, setMunicipiosUsuario] = useState([]);

  // ==================== FUNCIONES PRINCIPALES ====================

  const cargarFormulariosRR1 = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert("Por favor, inicie sesión nuevamente.");
        logout();
        return;
      }

      // Determinar qué ruta usar según el rol
      let url = `${baseUrl}/api/rr1`;
      
      // SOLUCIÓN: Si la ruta /mis-municipios no funciona, usar siempre /api/rr1
      // El filtrado por municipios se hará en el backend
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        alert("Su sesión ha expirado. Por favor, inicie sesión nuevamente.");
        logout();
        return;
      }

      if (!response.ok) {
        if (response.status === 404) {
          // Si da 404, probar la ruta base
          const response2 = await fetch(`${baseUrl}/api/rr1`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response2.ok) {
            const data = await response2.json();
            setFormularios(data);
            return;
          }
        }
        throw new Error(`Error ${response.status} al cargar formularios`);
      }

      const data = await response.json();
      setFormularios(data);
      
    } catch (error) {
      console.error("❌ Error al cargar formularios RR1:", error);
      alert("Error al cargar los formularios RR1. Verifica la conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const cargarCatalogos = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // SOLUCIÓN: Probar ambas rutas de catálogos
      let catalogosResponse;
      
      // Primero intentar con /por-usuario
      catalogosResponse = await fetch(`${baseUrl}/api/catalogos/por-usuario`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Si falla, usar /completos
      if (!catalogosResponse.ok) {
        console.log("⚠️ /por-usuario no disponible, usando /completos");
        catalogosResponse = await fetch(`${baseUrl}/api/catalogos/completos`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (catalogosResponse.ok) {
        const data = await catalogosResponse.json();
        setCatalogos(prev => ({
          ...prev,
          municipios: data.municipios || [],
          comunidades: data.comunidades || [],
          tecnicos: data.tecnicos || [],
          jefesGrupo: data.jefesGrupo || []
        }));
        
        // Cargar municipios específicos del usuario
        await cargarMunicipiosUsuario();
      } else {
        console.error("Error al cargar catálogos:", catalogosResponse.status);
      }

    } catch (error) {
      console.error("❌ Error al cargar catálogos:", error);
    }
  };

  const cargarMunicipiosUsuario = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Si es administrador, usar todos los municipios del catálogo
      if (usuario && usuario.rol === 'administrador') {
        setMunicipiosUsuario(catalogos.municipios);
        return;
      }
      
      // Para técnicos y jefes_grupo, cargar municipios asignados
      if (usuario && usuario.usuario_id) {
        const response = await fetch(`${baseUrl}/api/usuarios/${usuario.usuario_id}/municipios`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setMunicipiosUsuario(data || []);
        } else {
          // Si falla, usar los municipios del catálogo (ya filtrados por backend)
          setMunicipiosUsuario(catalogos.municipios);
        }
      }
    } catch (error) {
      console.error("❌ Error al cargar municipios del usuario:", error);
      setMunicipiosUsuario(catalogos.municipios);
    }
  };

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (hasAccess && usuario) {
      cargarFormulariosRR1();
      cargarCatalogos();
    }
  }, [hasAccess, usuario]);

  useEffect(() => {
    if (filtros.municipio_id) {
      const comunidades = catalogos.comunidades.filter(
        com => com.municipio_id === parseInt(filtros.municipio_id)
      );
      setComunidadesFiltradas(comunidades);
      setFiltros(prev => ({ ...prev, comunidad_id: "" }));
    } else {
      setComunidadesFiltradas([]);
      setFiltros(prev => ({ ...prev, comunidad_id: "" }));
    }
  }, [filtros.municipio_id, catalogos.comunidades]);

  // ==================== FUNCIONES DE UTILIDAD ====================

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString) return "-";
    try {
      const fecha = new Date(fechaString);
      const dia = fecha.getDate().toString().padStart(2, '0');
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const año = fecha.getFullYear();
      return `${dia}/${mes}/${año}`;
    } catch (error) {
      return "-";
    }
  };

  const getMunicipiosDisponibles = () => {
    // Administradores ven todos los municipios
    if (usuario && usuario.rol === 'administrador') {
      return catalogos.municipios;
    }
    
    // Usar municipios específicos del usuario si están cargados
    if (municipiosUsuario.length > 0) {
      return municipiosUsuario;
    }
    
    // Si no, usar los del catálogo (ya filtrados por backend)
    return catalogos.municipios;
  };

  const formulariosFiltrados = formularios.filter(formulario => {
    // Filtro por municipio
    if (filtros.municipio_id && formulario.municipio_id !== parseInt(filtros.municipio_id)) {
      return false;
    }
    
    // Filtro por comunidad
    if (filtros.comunidad_id && formulario.comunidad_id !== parseInt(filtros.comunidad_id)) {
      return false;
    }
    
    // Filtro por jefe de familia (búsqueda insensible a mayúsculas)
    if (filtros.jefe_familia && formulario.jefe_familia) {
      const busqueda = filtros.jefe_familia.toLowerCase().trim();
      const jefe = formulario.jefe_familia.toLowerCase();
      if (!jefe.includes(busqueda)) {
        return false;
      }
    }
    
    // Filtro adicional: para no administradores, verificar municipios asignados
    if (usuario && usuario.rol !== 'administrador' && municipiosUsuario.length > 0) {
      const municipiosIds = municipiosUsuario.map(m => m.municipio_id || m.id);
      if (!municipiosIds.includes(formulario.municipio_id)) {
        return false;
      }
    }
    
    return true;
  });

  const getNombreMunicipio = (municipioId) => {
    const municipio = catalogos.municipios.find(m => 
      m.municipio_id === municipioId || m.id === municipioId
    );
    return municipio ? (municipio.nombre_municipio || municipio.nombre) : "-";
  };

  const getNombreComunidad = (comunidadId) => {
    const comunidad = catalogos.comunidades.find(c => 
      c.comunidad_id === comunidadId || c.id === comunidadId
    );
    return comunidad ? (comunidad.nombre_comunidad || comunidad.nombre) : "-";
  };

  // ==================== MANEJADORES DE ACCIONES ====================

  const handleVerDetalles = (id_rr1) => {
    window.location.href = `/admin/rr1/view/${id_rr1}`;
  };

  const handleEditar = (id_rr1) => {
    window.location.href = `/admin/rr1/edit/${id_rr1}`;
  };

  const handleEliminar = async (id_rr1) => {
    if (!window.confirm("¿Está seguro de que desea desactivar este formulario RR1?")) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseUrl}/api/rr1/${id_rr1}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert("Formulario RR1 desactivado exitosamente");
        cargarFormulariosRR1();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al desactivar el formulario");
      }
    } catch (error) {
      console.error("❌ Error al desactivar formulario:", error);
      alert("Error al desactivar el formulario: " + error.message);
    }
  };

  const handleBuscarPorJefeFamilia = () => {
    if (filtros.jefe_familia.trim()) {
      // Ya se filtra automáticamente por el estado
      console.log(`🔍 Buscando por jefe de familia: ${filtros.jefe_familia}`);
    }
  };

  const handleLimpiarBusqueda = () => {
    setFiltros({
      municipio_id: "",
      comunidad_id: "",
      jefe_familia: ""
    });
  };

  // ==================== RENDERIZADO CONDICIONAL ====================

  if (accessLoading) {
    return (
      <div className="loading-container">
        <p>Verificando acceso...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return <SinAcceso />;
  }

  // ==================== RENDER PRINCIPAL ====================

  return (
    <div className="container rr1crud-container">
      <div className="header">
        <h1>GESTIÓN DE FORMULARIOS RR1</h1>
        <p>Lista de todos los formularios RR1 registrados</p>
        {usuario && (
          <div className="user-info">
            <p><strong>Usuario:</strong> {usuario.nombre_completo} - <strong>Rol:</strong> {usuario.rol}</p>
            {usuario.rol !== 'administrador' && municipiosUsuario.length > 0 && (
              <p className="municipios-info">
                <strong>Municipios asignados:</strong> {municipiosUsuario.length}
                {municipiosUsuario.slice(0, 3).map((m, i) => (
                  <span key={m.municipio_id || m.id} className="municipio-tag">
                    {m.nombre_municipio || m.nombre}
                    {i < 2 && i < municipiosUsuario.length - 1 ? ', ' : ''}
                  </span>
                ))}
                {municipiosUsuario.length > 3 && (
                  <span className="more-tag">+{municipiosUsuario.length - 3} más</span>
                )}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="form-section">
        <h3>Filtros</h3>
        
        {/* Filtros por Municipio y Comunidad */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="municipio_id">Filtrar por Municipio:</label>
            <select 
              name="municipio_id" 
              value={filtros.municipio_id} 
              onChange={handleFiltroChange}
              className="form-select"
            >
              <option value="">Todos los municipios</option>
              {getMunicipiosDisponibles().map(mun => (
                <option key={mun.municipio_id || mun.id} value={mun.municipio_id || mun.id}>
                  {mun.nombre_municipio || mun.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="comunidad_id">Filtrar por Comunidad:</label>
            <select 
              name="comunidad_id" 
              value={filtros.comunidad_id} 
              onChange={handleFiltroChange}
              disabled={!filtros.municipio_id}
              className="form-select"
            >
              <option value="">Todas las comunidades</option>
              {comunidadesFiltradas.map(com => (
                <option key={com.comunidad_id || com.id} value={com.comunidad_id || com.id}>
                  {com.nombre_comunidad || com.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buscador por Jefe de Familia */}
        <div className="form-row">
          <div className="form-group search-group">
            <label htmlFor="jefe_familia">Buscar por Jefe de Familia:</label>
            <div className="search-container">
              <input
                type="text"
                name="jefe_familia"
                value={filtros.jefe_familia}
                onChange={handleFiltroChange}
                onKeyPress={(e) => e.key === 'Enter' && handleBuscarPorJefeFamilia()}
                placeholder="Ingrese nombre del jefe de familia..."
                className="search-input"
              />
              <button
                onClick={handleBuscarPorJefeFamilia}
                className="btn btn-primary search-btn"
                title="Buscar"
              >
                🔍 Buscar
              </button>
              {filtros.jefe_familia && (
                <button
                  onClick={handleLimpiarBusqueda}
                  className="btn btn-secondary clear-btn"
                  title="Limpiar búsqueda"
                >
                  ✕ Limpiar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="table-header">
          <h3>Formularios RR1 Registrados</h3>
          <div className="table-actions">
            <button 
              onClick={cargarFormulariosRR1} 
              className="btn btn-secondary refresh-btn"
              title="Actualizar lista"
            >
              🔄 Actualizar
            </button>
            <div className="counter">
              <span className="total">Total: {formularios.length}</span>
              <span className="filtrados">Filtrados: {formulariosFiltrados.length}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <p>Cargando formularios...</p>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="table-container">
            <table className="rr1crud-table">
              <thead>
                <tr>
                  <th>Municipio</th>
                  <th>Comunidad</th>
                  <th>N° Vivienda</th>
                  <th>Jefe de Familia</th>
                  <th>Fecha de Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {formulariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">
                      {formularios.length === 0 
                        ? 'No hay formularios RR1 registrados' 
                        : 'No hay resultados para los filtros aplicados'}
                    </td>
                  </tr>
                ) : (
                  formulariosFiltrados.map(formulario => (
                    <tr key={formulario.id_rr1}>
                      <td>{getNombreMunicipio(formulario.municipio_id)}</td>
                      <td>{getNombreComunidad(formulario.comunidad_id)}</td>
                      <td className="numero-vivienda">{formulario.numero_vivienda || "-"}</td>
                      <td className="jefe-familia">{formulario.jefe_familia || "-"}</td>
                      <td className="fecha-registro">{formatearFecha(formulario.fecha_registro)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => handleVerDetalles(formulario.id_rr1)}
                            className="btn-action2 btn-view"
                            title="Ver detalles completos"
                          >
                            👁️ Ver
                          </button>
                          <button 
                            onClick={() => handleEditar(formulario.id_rr1)}
                            className="btn-action2 btn-edit"
                            title="Editar formulario"
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            onClick={() => handleEliminar(formulario.id_rr1)}
                            className="btn-action2 btn-delete"
                            title="Desactivar formulario"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default RR1CRUD;