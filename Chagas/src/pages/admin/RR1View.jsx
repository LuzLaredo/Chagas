import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useRouteAccess } from "../AuthContext";
import SinAcceso from "../SinAcceso";
import "../../css/RR1.css";
import "../../css/RR1View.css";
import { baseUrl } from "../../api/BaseUrl";

function RR1View() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useRouteAccess(["tecnico", "jefe_grupo", "administrador", "supervisor"]);
  
  const [formulario, setFormulario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [catalogos, setCatalogos] = useState({
    municipios: [],
    comunidades: [],
    sedes: [],
    redesSalud: [],
    establecimientos: [],
    jefesGrupo: [],
    tecnicos: []
  });

  const cargarFormularioRR1 = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert("Por favor, inicie sesión nuevamente.");
        logout();
        return;
      }

      console.log(`🔍 Cargando formulario RR1 ID: ${id}`);
      
      const response = await fetch(`${baseUrl}/api/rr1/${id}`, {
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
        throw new Error(`Error ${response.status} al cargar formulario`);
      }

      const data = await response.json();
      console.log("✅ Datos del formulario recibidos:", data);
      setFormulario(data);
      
    } catch (error) {
      console.error("❌ Error al cargar formulario RR1:", error);
      alert("Error al cargar el formulario RR1");
    } finally {
      setLoading(false);
    }
  };

  const cargarCatalogos = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [catalogosResponse, jefesGrupoResponse, tecnicosResponse] = await Promise.all([
        fetch(`${baseUrl}/api/catalogos/completos`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${baseUrl}/api/usuarios/jefes-grupo`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${baseUrl}/api/usuarios/tecnicos`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      // DEBUG de respuestas
      console.log("📡 Estado de respuestas de catálogos:", {
        catalogos: catalogosResponse.status,
        jefesGrupo: jefesGrupoResponse.status,
        tecnicos: tecnicosResponse.status
      });

      if (catalogosResponse.ok) {
        const data = await catalogosResponse.json();
        console.log("📊 Datos de catálogos recibidos:", {
          municipios: data.municipios?.length || 0,
          comunidades: data.comunidades?.length || 0,
          sedes: data.sedes?.length || 0,
          redesSalud: data.redesSalud?.length || 0,
          establecimientos: data.establecimientos?.length || 0
        });
        
        setCatalogos(prev => ({
          ...prev,
          municipios: data.municipios || [],
          comunidades: data.comunidades || [],
          sedes: data.sedes || [],
          redesSalud: data.redesSalud || [],
          establecimientos: data.establecimientos || []
        }));
      } else {
        console.error("❌ Error al cargar catálogos completos:", catalogosResponse.status);
      }

      if (jefesGrupoResponse.ok) {
        const jefesGrupo = await jefesGrupoResponse.json();
        console.log("👥 Jefes de grupo recibidos:", jefesGrupo);
        setCatalogos(prev => ({ ...prev, jefesGrupo: jefesGrupo || [] }));
      } else {
        console.error("❌ Error al cargar jefes de grupo:", jefesGrupoResponse.status);
      }

      if (tecnicosResponse.ok) {
        const tecnicos = await tecnicosResponse.json();
        console.log("🔧 Técnicos recibidos:", tecnicos);
        setCatalogos(prev => ({ ...prev, tecnicos: tecnicos || [] }));
      } else {
        console.error("❌ Error al cargar técnicos:", tecnicosResponse.status);
      }

    } catch (error) {
      console.error("❌ Error al cargar catálogos:", error);
    }
  };

  useEffect(() => {
    cargarFormularioRR1();
    cargarCatalogos();
  }, [id]);

  // DEBUG completo cuando tengamos formulario y catálogos
  useEffect(() => {
    if (formulario && catalogos.jefesGrupo.length > 0) {
      console.log("🔍 DEBUG COMPLETO - Formulario:", formulario);
      console.log("🔍 DEBUG COMPLETO - Catálogos cargados:", {
        jefesGrupo: catalogos.jefesGrupo,
        comunidades: catalogos.comunidades,
        redesSalud: catalogos.redesSalud,
        sedes: catalogos.sedes,
        establecimientos: catalogos.establecimientos
      });
      
      // Debug específico para los IDs que tenemos
      console.log("🔍 BUSCANDO NOMBRES PARA:", {
        jefe1_id: formulario.jefe1_id,
        jefe2_id: formulario.jefe2_id,
        jefe3_id: formulario.jefe3_id,
        jefe4_id: formulario.jefe4_id,
        comunidad_id: formulario.comunidad_id,
        redsalud_id: formulario.redsalud_id
      });

      // Mostrar qué encontramos para cada ID
      console.log("🔍 RESULTADOS DE BÚSQUEDA:", {
        jefe1: catalogos.jefesGrupo.find(j => j.usuario_id === formulario.jefe1_id),
        jefe2: catalogos.jefesGrupo.find(j => j.usuario_id === formulario.jefe2_id),
        jefe3: catalogos.jefesGrupo.find(j => j.usuario_id === formulario.jefe3_id),
        jefe4: catalogos.jefesGrupo.find(j => j.usuario_id === formulario.jefe4_id),
        comunidad: catalogos.comunidades.find(c => c.comunidad_id === formulario.comunidad_id),
        redsalud: catalogos.redesSalud.find(r => r.redsalud_id === formulario.redsalud_id)
      });
    }
  }, [formulario, catalogos]);

  // Función para obtener nombres de usuarios por ID - MEJORADA
  const getNombreUsuario = (usuarioId, tipo = "tecnico") => {
    if (!usuarioId) return "-";
    
    const lista = tipo === "jefe" ? catalogos.jefesGrupo : catalogos.tecnicos;
    console.log(`🔍 Buscando ${tipo} ID ${usuarioId} en lista:`, lista);
    
    const usuario = lista.find(u => u.usuario_id === usuarioId);
    const resultado = usuario ? usuario.nombre_completo : `ID: ${usuarioId}`;
    
    console.log(`🔍 Resultado para ${tipo} ID ${usuarioId}:`, resultado);
    return resultado;
  };

  // Función para obtener nombres de catálogos - MEJORADA
  const getNombreCatalogo = (id, tipo) => {
    if (!id) return "-";
    
    const lista = catalogos[tipo] || [];
    console.log(`🔍 Buscando ${tipo} ID ${id} en lista:`, lista);
    
    const item = lista.find(item => {
      const idField = `${tipo.slice(0, -1)}_id`;
      return item[idField] === id;
    });
    
    const resultado = item ? item.nombre : `ID: ${id}`;
    console.log(`🔍 Resultado para ${tipo} ID ${id}:`, resultado);
    return resultado;
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleVolver = () => {
    navigate('/admin/rr1/crud');
  };

  const handleEditar = () => {
    navigate(`/admin/rr1/edit/${id}`);
  };

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

  if (loading) {
    return (
      <div className="loading-container">
        <p>Cargando formulario RR1...</p>
      </div>
    );
  }

  if (!formulario) {
    return (
      <div className="container">
        <div className="error-container">
          <h2>Formulario no encontrado</h2>
          <p>El formulario RR1 solicitado no existe o no se pudo cargar.</p>
          <button onClick={handleVolver} className="btn btn-primary">
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container rr1view-container">
      <div className="header">
        <div className="header-actions">
          <button onClick={handleVolver} className="btn btn-secondary">
            ← Volver
          </button>
          <button onClick={handleEditar} className="btn btn-primary">
            ✏️ Editar
          </button>
        </div>
        <h1>DETALLES DEL FORMULARIO RR1 - ID: {formulario.id_rr1}</h1>
        <p>Información completa del formulario de registro de rociado</p>
        {usuario && (
          <p className="user-info">
            Usuario: {usuario.nombre_completo} - Rol: {usuario.rol}
          </p>
        )}
      </div>

      {/* Información General */}
      <div className="form-section">
        <h3>📋 Información General</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>ID del Formulario:</label>
            <span className="info-value">{formulario.id_rr1}</span>
          </div>
          <div className="info-item">
            <label>Fecha de Registro:</label>
            <span className="info-value">{formatFecha(formulario.fecha_registro)}</span>
          </div>
          <div className="info-item">
            <label>Estado:</label>
            <span className={`estado-badge estado-${formulario.estado}`}>
              {formulario.estado || 'activo'}
            </span>
          </div>
        </div>
      </div>

      {/* Personal */}
      <div className="form-section">
        <h3>👥 Personal</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Técnico Principal:</label>
            <span className="info-value">
              {formulario.tecnico_nombre || getNombreUsuario(formulario.tecnico_id)}
            </span>
          </div>
          <div className="info-item">
            <label>Jefe de Grupo 1:</label>
            <span className="info-value">
              {getNombreUsuario(formulario.jefe1_id, "jefe")}
            </span>
          </div>
          <div className="info-item">
            <label>Jefe de Grupo 2:</label>
            <span className="info-value">{formulario.jefe2_nombre}</span>
          </div>
          <div className="info-item">
            <label>Jefe de Grupo 3:</label>
            <span className="info-value">{formulario.jefe3_nombre}</span>
          </div>
          <div className="info-item">
            <label>Jefe de Grupo 4:</label>
            <span className="info-value">{formulario.jefe4_nombre}</span>
          </div>
        </div>
      </div>

      {/* Ubicación */}
      <div className="form-section">
        <h3>📍 Ubicación</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Sede:</label>
            <span className="info-value">
              {getNombreCatalogo(formulario.sede_id, 'sedes')}
            </span>
          </div>
          <div className="info-item">
            <label>Red de Salud:</label>
            <span className="info-value">{formulario.redsalud_nombre}</span>
          </div>
          <div className="info-item">
            <label>Establecimiento:</label>
            <span className="info-value">
              {getNombreCatalogo(formulario.establecimiento_id, 'establecimientos')}
            </span>
          </div>
          <div className="info-item">
            <label>Municipio:</label>
            <span className="info-value">
              {getNombreCatalogo(formulario.municipio_id, 'municipios')}
            </span>
          </div>
          <div className="info-item">
            <label>Comunidad:</label>
            <span className="info-value">{formulario.comunidad_nombre}</span>
          </div>
        </div>
      </div>

      {/* Vivienda */}
      <div className="form-section">
        <h3>🏠 Datos de la Vivienda</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Número de Vivienda:</label>
            <span className="info-value">{formulario.numero_vivienda || "-"}</span>
          </div>
          <div className="info-item">
            <label>Jefe de Familia:</label>
            <span className="info-value">{formulario.jefe_familia || "-"}</span>
          </div>
          <div className="info-item">
            <label>Habitantes Protegidos:</label>
            <span className="info-value">{formulario.habitantes_protegidos || 0}</span>
          </div>
        </div>
      </div>

      {/* Estado del Rociado */}
      <div className="form-section">
        <h3>🔍 Estado del Rociado</h3>
        <div className="status-grid">
          <div className="status-item">
            <label>Rociado:</label>
            <span className={`status-badge ${formulario.rociado ? 'status-si' : 'status-no'}`}>
              {formulario.rociado ? 'SÍ' : 'NO'}
            </span>
          </div>
          <div className="status-item">
            <label>No Rociado:</label>
            <span className={`status-badge ${formulario.no_rociado ? 'status-si' : 'status-no'}`}>
              {formulario.no_rociado ? 'SÍ' : 'NO'}
            </span>
          </div>
          <div className="status-item">
            <label>Cerrada:</label>
            <span className={`status-badge ${formulario.cerrada ? 'status-si' : 'status-no'}`}>
              {formulario.cerrada ? 'SÍ' : 'NO'}
            </span>
          </div>
          <div className="status-item">
            <label>Renuente:</label>
            <span className={`status-badge ${formulario.renuente ? 'status-si' : 'status-no'}`}>
              {formulario.renuente ? 'SÍ' : 'NO'}
            </span>
          </div>
        </div>
      </div>

      {/* Intradomicilio */}
      <div className="form-section">
        <h3>🏠 Intradomicilio</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Rociadas</th>
                <th>No Rociadas</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Habitaciones</td>
                <td>{formulario.habitaciones_rociadas || 0}</td>
                <td>{formulario.habitaciones_no_rociadas || 0}</td>
                <td>{formulario.habitaciones_total || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Peridomicilio */}
      <div className="form-section">
        <h3>🌳 Peridomicilio</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Corrales</td>
                <td>{formulario.corrales || 0}</td>
              </tr>
              <tr>
                <td>Gallineros</td>
                <td>{formulario.gallineros || 0}</td>
              </tr>
              <tr>
                <td>Conejeras</td>
                <td>{formulario.conejeras || 0}</td>
              </tr>
              <tr>
                <td>Zarzos/Trojes</td>
                <td>{formulario.zarzos_trojes || 0}</td>
              </tr>
              <tr>
                <td>Otros</td>
                <td>{formulario.otros_peridomicilio || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Datos del Rociado */}
      <div className="form-section">
        <h3>🧴 Datos del Rociado</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Insecticida Utilizado:</label>
            <span className="info-value">{formulario.insecticida_utilizado || "-"}</span>
          </div>
          <div className="info-item">
            <label>Lote:</label>
            <span className="info-value">{formulario.lote || "-"}</span>
          </div>
          <div className="info-item">
            <label>Dosis (ml):</label>
            <span className="info-value">{formulario.dosis || 0}</span>
          </div>
          <div className="info-item">
            <label>Número de Cargas:</label>
            <span className="info-value">{formulario.numero_cargas || 0}</span>
          </div>
          <div className="info-item">
            <label>Cantidad de Insecticida (ml):</label>
            <span className="info-value">{formulario.cantidad_insecticida || 0}</span>
          </div>
        </div>
      </div>

      {/* Firma */}
      {formulario.firma_conformidad && (
        <div className="form-section">
          <h3>📝 Firma de Conformidad</h3>
          <div className="info-item">
            <label>Archivo de Firma:</label>
            <span className="info-value">{formulario.firma_conformidad}</span>
          </div>
        </div>
      )}

      <div className="action-buttons-bottom">
        <button onClick={handleVolver} className="btn btn-secondary">
          ← Volver a la lista
        </button>
        <button onClick={handleEditar} className="btn btn-primary">
          ✏️ Editar Formulario
        </button>
      </div>
    </div>
  );
}

export default RR1View;