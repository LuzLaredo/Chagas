import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useRouteAccess } from "../AuthContext";
import SinAcceso from "../SinAcceso";
import "../../css/RR1.css";
import "../../css/RR1Edit.css";
import { baseUrl } from "../../api/BaseUrl";

function RR1Edit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useRouteAccess(["tecnico", "jefe_grupo", "administrador", "supervisor"]);
  
  const [formData, setFormData] = useState({
    sede_id: "",
    redsalud_id: "",
    establecimiento_id: "",
    municipio_id: "",
    comunidad_id: "",
    numero_vivienda: "",
    jefe_familia: "",
    habitantes_protegidos: "",
    rociado: false,
    no_rociado: false,
    cerrada: false,
    renuente: false,
    habitaciones_rociadas: 0,
    habitaciones_no_rociadas: 0,
    habitaciones_total: 0,
    corrales: 0,
    gallineros: 0,
    conejeras: 0,
    zarzos_trojes: 0,
    otros_peridomicilio: 0,
    numero_cargas: 0,
    cantidad_insecticida: 0,
    insecticida_utilizado: "",
    dosis: 0,
    lote: "",
    jefe_grupo_id: "",
    tecnico1_id: "",
    tecnico2_id: "",
    tecnico3_id: "",
    tecnico4_id: "",
    firma_conformidad: ""
  });

  // 🆕 NUEVO: Estado para almacenar denuncia_id
  const [denunciaId, setDenunciaId] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [catalogosLoading, setCatalogosLoading] = useState(false);
  const [catalogos, setCatalogos] = useState({ 
    municipios: [], 
    comunidades: [], 
    sedes: [],
    redesSalud: [],
    establecimientos: [],
    jefesGrupo: [],
    tecnicos: []
  });
  const [comunidadesFiltradas, setComunidadesFiltradas] = useState([]);
  const [redesFiltradas, setRedesFiltradas] = useState([]);
  const [establecimientosFiltrados, setEstablecimientosFiltrados] = useState([]);

  const cargarFormularioRR1 = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert("Por favor, inicie sesión nuevamente.");
        logout();
        return;
      }

      // ✅ USAR LA RUTA CORRECTA: /api/rr1/:id/editar
      const response = await fetch(`${baseUrl}/api/rr1/${id}/editar`, {
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
        // Si falla, intentar con la ruta normal como fallback
        console.warn("⚠️ No se pudo cargar con /editar, intentando con ruta normal...");
        const responseNormal = await fetch(`${baseUrl}/api/rr1/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!responseNormal.ok) {
          throw new Error(`Error ${responseNormal.status} al cargar formulario`);
        }

        const dataNormal = await responseNormal.json();
        procesarDatosFormulario(dataNormal);
        return;
      }

      const data = await response.json();
      procesarDatosFormulario(data);
      
    } catch (error) {
      console.error("❌ Error al cargar formulario RR1:", error);
      alert("Error al cargar el formulario RR1 para edición");
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para procesar los datos del formulario
  const procesarDatosFormulario = (data) => {
    console.log("📋 Datos del formulario cargados:", data);
    
    setFormData({
      sede_id: data.sede_id || "",
      redsalud_id: data.redsalud_id || "",
      establecimiento_id: data.establecimiento_id || "",
      municipio_id: data.municipio_id || "",
      comunidad_id: data.comunidad_id || "",
      numero_vivienda: data.numero_vivienda || "",
      jefe_familia: data.jefe_familia || "",
      habitantes_protegidos: data.habitantes_protegidos || "",
      rociado: data.rociado === 1 || data.rociado === true,
      no_rociado: data.no_rociado === 1 || data.no_rociado === true,
      cerrada: data.cerrada === 1 || data.cerrada === true,
      renuente: data.renuente === 1 || data.renuente === true,
      habitaciones_rociadas: data.habitaciones_rociadas || 0,
      habitaciones_no_rociadas: data.habitaciones_no_rociadas || 0,
      habitaciones_total: data.habitaciones_total || 0,
      corrales: data.corrales || 0,
      gallineros: data.gallineros || 0,
      conejeras: data.conejeras || 0,
      zarzos_trojes: data.zarzos_trojes || 0,
      otros_peridomicilio: data.otros_peridomicilio || 0,
      numero_cargas: data.numero_cargas || 0,
      cantidad_insecticida: data.cantidad_insecticida || 0,
      insecticida_utilizado: data.insecticida_utilizado || "",
      dosis: data.dosis || 0,
      lote: data.lote || "",
      jefe_grupo_id: data.jefe1_id || data.jefe_grupo_id || "",
      tecnico1_id: data.tecnico_id || data.tecnico1_id || "",
      tecnico2_id: data.jefe2_id || data.tecnico2_id || "",
      tecnico3_id: data.jefe3_id || data.tecnico3_id || "",
      tecnico4_id: data.jefe4_id || data.tecnico4_id || "",
      firma_conformidad: data.firma_conformidad || ""
    });
    
    // 🆕 OBTENER DENUNCIA_ID SI EXISTE
    if (data.denuncia_id) {
      setDenunciaId(data.denuncia_id);
      console.log("🔗 Denuncia relacionada encontrada:", data.denuncia_id);
    } else {
      console.log("⚠️ No se encontró denuncia relacionada con este RR1");
    }
  };

  const cargarCatalogos = async () => {
    try {
      setCatalogosLoading(true);
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

      // Verifica que las respuestas sean exitosas
      if (!catalogosResponse.ok) {
        throw new Error(`Error en catálogos: ${catalogosResponse.status}`);
      }
      if (!jefesGrupoResponse.ok) {
        console.warn("⚠️ No se pudieron cargar jefes de grupo");
      }
      if (!tecnicosResponse.ok) {
        console.warn("⚠️ No se pudieron cargar técnicos");
      }

      const data = await catalogosResponse.json();
      
      console.log("📊 Datos de catálogos recibidos:", {
        sedes: data.sedes,
        redesSalud: data.redesSalud,
        establecimientos: data.establecimientos,
        municipios: data.municipios,
        comunidades: data.comunidades
      });

      // Asegúrate de que los arrays existan y tengan los nombres correctos
      setCatalogos(prev => ({
        ...prev,
        municipios: Array.isArray(data.municipios) ? data.municipios : [],
        comunidades: Array.isArray(data.comunidades) ? data.comunidades : [],
        sedes: Array.isArray(data.sedes) ? data.sedes : [],
        redesSalud: Array.isArray(data.redesSalud) ? data.redesSalud : [],
        establecimientos: Array.isArray(data.establecimientos) ? data.establecimientos : []
      }));

      // Cargar jefes de grupo si la respuesta fue exitosa
      if (jefesGrupoResponse.ok) {
        const jefesGrupo = await jefesGrupoResponse.json();
        setCatalogos(prev => ({ 
          ...prev, 
          jefesGrupo: Array.isArray(jefesGrupo) ? jefesGrupo : [] 
        }));
      }

      // Cargar técnicos si la respuesta fue exitosa
      if (tecnicosResponse.ok) {
        const tecnicos = await tecnicosResponse.json();
        setCatalogos(prev => ({ 
          ...prev, 
          tecnicos: Array.isArray(tecnicos) ? tecnicos : [] 
        }));
      }

    } catch (error) {
      console.error("❌ Error al cargar catálogos:", error);
      alert("Error al cargar los catálogos. Por favor, recarga la página.");
    } finally {
      setCatalogosLoading(false);
    }
  };

  useEffect(() => {
    cargarFormularioRR1();
    cargarCatalogos();
  }, [id]);

  // Filtros para selectores dependientes
  useEffect(() => {
    if (formData.municipio_id) {
      const comunidades = catalogos.comunidades.filter(
        com => com.municipio_id === parseInt(formData.municipio_id)
      );
      setComunidadesFiltradas(comunidades);
      console.log("🏘️ Comunidades filtradas:", comunidades);
    } else {
      setComunidadesFiltradas([]);
    }
  }, [formData.municipio_id, catalogos.comunidades]);

  useEffect(() => {
    if (formData.sede_id) {
      const redes = catalogos.redesSalud.filter(
        red => red.sede_id === parseInt(formData.sede_id)
      );
      setRedesFiltradas(redes);
      console.log("🌐 Redes filtradas:", redes);
    } else {
      setRedesFiltradas([]);
    }
  }, [formData.sede_id, catalogos.redesSalud]);

  useEffect(() => {
    if (formData.redsalud_id) {
      const establecimientos = catalogos.establecimientos.filter(
        est => est.redsalud_id === parseInt(formData.redsalud_id)
      );
      setEstablecimientosFiltrados(establecimientos);
      console.log("🏥 Establecimientos filtrados:", establecimientos);
    } else {
      setEstablecimientosFiltrados([]);
    }
  }, [formData.redsalud_id, catalogos.establecimientos]);

  // Calcular total de habitaciones automáticamente
  useEffect(() => {
    const total = parseInt(formData.habitaciones_rociadas || 0) + 
                  parseInt(formData.habitaciones_no_rociadas || 0);
    setFormData(prev => ({
      ...prev,
      habitaciones_total: total
    }));
  }, [formData.habitaciones_rociadas, formData.habitaciones_no_rociadas]);

  // 🆕 NUEVO: Calcular cantidad de insecticida basado en el tipo seleccionado
  useEffect(() => {
    if (formData.numero_cargas > 0 && formData.insecticida_utilizado) {
      let cantidadPorCarga = 0;
      
      switch(formData.insecticida_utilizado) {
        case "LAMBDACIALOTRINA":
          cantidadPorCarga = 60; // 60ml por carga
          break;
        case "BENDIOCARB":
          cantidadPorCarga = 250; // 250gr por carga
          break;
        case "OTRO":
          cantidadPorCarga = 0; // Se define manualmente
          break;
        default:
          cantidadPorCarga = 0;
      }
      
      const cantidad = formData.numero_cargas * cantidadPorCarga;
      setFormData(prev => ({
        ...prev,
        cantidad_insecticida: cantidad
      }));
    } else if (formData.numero_cargas === 0) {
      setFormData(prev => ({
        ...prev,
        cantidad_insecticida: 0
      }));
    }
  }, [formData.numero_cargas, formData.insecticida_utilizado]);

  // 🆕 NUEVO: Auto-set dosis cuando se selecciona insecticida
  useEffect(() => {
    switch(formData.insecticida_utilizado) {
      case "LAMBDACIALOTRINA":
        setFormData(prev => ({
          ...prev,
          dosis: 60 // 60ml para LAMBDACIALOTRINA
        }));
        break;
      case "BENDIOCARB":
        setFormData(prev => ({
          ...prev,
          dosis: 250 // 250gr para BENDIOCARB
        }));
        break;
      case "OTRO":
        // Para "OTRO", permitir edición manual manteniendo el valor actual o 0
        setFormData(prev => ({
          ...prev,
          dosis: prev.dosis || 0
        }));
        break;
      default:
        setFormData(prev => ({
          ...prev,
          dosis: 0
        }));
    }
  }, [formData.insecticida_utilizado]);

  // 🆕 NUEVO: Función para obtener la unidad del insecticida
  const getUnidadInsecticida = (insecticida) => {
    switch(insecticida) {
      case "LAMBDACIALOTRINA": return "ml";
      case "BENDIOCARB": return "gr";
      case "OTRO": return "unidades";
      default: return "ml";
    }
  };

  // 🆕 NUEVO: Función para obtener el texto de cálculo automático
  const getTextoCalculoAutomatico = () => {
    switch(formData.insecticida_utilizado) {
      case "LAMBDACIALOTRINA":
        return "Calculado automáticamente: 60 ml por carga";
      case "BENDIOCARB":
        return "Calculado automáticamente: 250 gr por carga";
      case "OTRO":
        return "Ingrese manualmente la cantidad";
      default:
        return "Seleccione un insecticida para calcular";
    }
  };

  const handleChange = e => {
    const { name, value, type, checked, files } = e.target;

    if (type === "checkbox") {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      
      // Lógica para checkboxes excluyentes
      if (name === 'rociado' && checked) {
        setFormData(prev => ({ ...prev, no_rociado: false }));
      } else if (name === 'no_rociado' && checked) {
        setFormData(prev => ({ ...prev, rociado: false }));
      }
      
      if (name === 'cerrada' && checked) {
        setFormData(prev => ({ ...prev, renuente: false }));
      } else if (name === 'renuente' && checked) {
        setFormData(prev => ({ ...prev, cerrada: false }));
      }
    } else if (type === "file") {
      if (files && files[0]) {
        const file = files[0];
        if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
          setFormData(prev => ({
            ...prev,
            [name]: file.name
          }));
        } else {
          alert("Solo se permiten archivos PDF o imágenes");
          e.target.value = '';
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Sesión expirada. Por favor, inicie sesión nuevamente.");
        logout();
        return;
      }

      // Validaciones básicas
      if (!formData.numero_vivienda || !formData.jefe_familia || !formData.tecnico1_id) {
        alert("Por favor, complete los campos obligatorios: Número de Vivienda, Jefe de Familia y Técnico 1.");
        setSaving(false);
        return;
      }

      const isViviendaNoDisponible = formData.no_rociado || formData.cerrada || formData.renuente;

      // 🆕 NUEVO: Preparar datos para enviar con denuncia_id
      const datosEnviar = {
        ...formData,
        sede_id: parseInt(formData.sede_id) || null,
        redsalud_id: parseInt(formData.redsalud_id) || null,
        establecimiento_id: parseInt(formData.establecimiento_id) || null,
        municipio_id: parseInt(formData.municipio_id) || null,
        comunidad_id: parseInt(formData.comunidad_id) || null,
        tecnico_id: parseInt(formData.tecnico1_id),
        jefe1_id: formData.jefe_grupo_id ? parseInt(formData.jefe_grupo_id) : null,
        jefe2_id: formData.tecnico2_id ? parseInt(formData.tecnico2_id) : null,
        jefe3_id: formData.tecnico3_id ? parseInt(formData.tecnico3_id) : null,
        jefe4_id: formData.tecnico4_id ? parseInt(formData.tecnico4_id) : null,
        habitantes_protegidos: parseInt(formData.habitantes_protegidos) || 0,
        habitaciones_rociadas: isViviendaNoDisponible ? 0 : parseInt(formData.habitaciones_rociadas) || 0,
        habitaciones_no_rociadas: isViviendaNoDisponible ? 0 : parseInt(formData.habitaciones_no_rociadas) || 0,
        habitaciones_total: isViviendaNoDisponible ? 0 : parseInt(formData.habitaciones_total) || 0,
        corrales: isViviendaNoDisponible ? 0 : parseInt(formData.corrales) || 0,
        gallineros: isViviendaNoDisponible ? 0 : parseInt(formData.gallineros) || 0,
        conejeras: isViviendaNoDisponible ? 0 : parseInt(formData.conejeras) || 0,
        zarzos_trojes: isViviendaNoDisponible ? 0 : parseInt(formData.zarzos_trojes) || 0,
        otros_peridomicilio: isViviendaNoDisponible ? 0 : parseInt(formData.otros_peridomicilio) || 0,
        numero_cargas: isViviendaNoDisponible ? 0 : parseInt(formData.numero_cargas) || 0,
        cantidad_insecticida: isViviendaNoDisponible ? 0 : parseFloat(formData.cantidad_insecticida) || 0,
        dosis: isViviendaNoDisponible ? 0 : parseFloat(formData.dosis) || 0,
        // 🆕 CONVERTIR BOOLEANOS A 0 O 1
        cerrada: formData.cerrada ? 1 : 0,
        renuente: formData.renuente ? 1 : 0,
        rociado: formData.rociado ? 1 : 0,
        no_rociado: formData.no_rociado ? 1 : 0,
        // 🆕 ENVIAR DENUNCIA_ID
        denuncia_id: denunciaId || null
      };

      console.log("📤 Enviando datos al backend:", {
        rociado: datosEnviar.rociado,
        no_rociado: datosEnviar.no_rociado,
        denuncia_id: datosEnviar.denuncia_id,
        cerrada: datosEnviar.cerrada,
        renuente: datosEnviar.renuente
      });

      const response = await fetch(`${baseUrl}/api/rr1/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosEnviar)
      });

      if (response.ok) {
        const result = await response.json();
        alert("✅ Formulario RR1 actualizado exitosamente");
        
        // 🆕 MOSTRAR MENSAJE ESPECÍFICO SOBRE DENUNCIA
        if (result.estado_denuncia) {
          alert(`🗓️ Estado de denuncia actualizado a: ${result.estado_denuncia}`);
        }
        
        navigate(`/admin/rr1/view/${id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el formulario");
      }

    } catch (error) {
      console.error("❌ Error al actualizar formulario:", error);
      alert("Error al actualizar el formulario: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVolver = () => {
    navigate(`/admin/rr1/view/${id}`);
  };

  const handleCancelar = () => {
    if (window.confirm("¿Está seguro de que desea cancelar? Los cambios no guardados se perderán.")) {
      navigate(`/admin/rr1/view/${id}`);
    }
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
        <p>Cargando formulario para edición...</p>
      </div>
    );
  }

  const isViviendaNoDisponible = formData.no_rociado || formData.cerrada || formData.renuente;
  const isUserTecnico = usuario?.rol === 'tecnico';
  const unidadInsecticida = getUnidadInsecticida(formData.insecticida_utilizado);

  return (
    <div className="container rr1edit-container">
      <div className="header">
        <div className="header-actions">
          <button onClick={handleVolver} className="btn btn-secondary">
            ← Volver
          </button>
          <h1>EDITAR FORMULARIO RR1 - ID: {id}</h1>
        </div>
        <p>Modifique los datos del formulario de registro de rociado</p>
        
        {/* 🆕 NUEVO: Mostrar denuncia relacionada si existe */}
        {denunciaId && (
          <div className="alert alert-info" style={{
            backgroundColor: '#d1ecf1',
            border: '1px solid #bee5eb',
            padding: '10px',
            borderRadius: '5px',
            marginTop: '10px',
            fontSize: '0.9em'
          }}>
            <strong>📋 Denuncia relacionada:</strong> ID {denunciaId} 
            <br />
            <small>Al marcar "ROCIADO", la denuncia se actualizará automáticamente a "REALIZADA"</small>
          </div>
        )}
        
        {/* 🆕 NUEVO: Advertencia de campos inmutables */}
        <div className="alert alert-warning" style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          padding: '10px',
          borderRadius: '5px',
          marginTop: '10px',
          fontSize: '0.9em'
        }}>
          <strong>⚠️ Advertencia:</strong> Algunos campos no se pueden modificar en edición 
          (Municipio, Comunidad, Número de Vivienda, Jefe de Grupo y Técnicos).
        </div>
        
        {usuario && (
          <p className="user-info">
            Usuario: {usuario.nombre_completo} - Rol: {usuario.rol}
          </p>
        )}
      </div>
      {catalogosLoading ? (
        <div className="loading-container">
          <p>Cargando catálogos...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Información de Personal */}
          <div className="form-section">
            <h3>Información del Personal</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="jefe_grupo_id">JEFE DE GRUPO:</label>
                <select 
                  name="jefe_grupo_id" 
                  value={formData.jefe_grupo_id} 
                  onChange={handleChange}
                  disabled // 🆕 DESHABILITADO
                  style={{ backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed' }}
                >
                  <option value="">Seleccione jefe de grupo</option>
                  {catalogos.jefesGrupo && catalogos.jefesGrupo.map(jefe => (
                    <option key={jefe.usuario_id} value={jefe.usuario_id}>
                      {jefe.nombre_completo || `Jefe ${jefe.usuario_id}`}
                    </option>
                  ))}
                </select>
                <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                  Este campo no se puede modificar en edición
                </small>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tecnico1_id">TÉCNICO 1: *</label>
                <select 
                  name="tecnico1_id" 
                  value={formData.tecnico1_id} 
                  onChange={handleChange}
                  required
                  disabled // 🆕 DESHABILITADO (solo lectura)
                  style={{ backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed' }}
                >
                  <option value="">Seleccione técnico</option>
                  {catalogos.tecnicos && catalogos.tecnicos.map(tecnico => (
                    <option key={tecnico.usuario_id} value={tecnico.usuario_id}>
                      {tecnico.nombre_completo || `Técnico ${tecnico.usuario_id}`}
                    </option>
                  ))}
                </select>
                <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                  Este campo no se puede modificar en edición
                </small>
              </div>
              <div className="form-group">
                <label htmlFor="tecnico2_id">TÉCNICO 2:</label>
                <select 
                  name="tecnico2_id" 
                  value={formData.tecnico2_id} 
                  onChange={handleChange}
                  disabled // 🆕 DESHABILITADO
                  style={{ backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed' }}
                >
                  <option value="">Seleccione técnico</option>
                  {catalogos.tecnicos && catalogos.tecnicos.map(tecnico => (
                    <option key={tecnico.usuario_id} value={tecnico.usuario_id}>
                      {tecnico.nombre_completo || `Técnico ${tecnico.usuario_id}`}
                    </option>
                  ))}
                </select>
                <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                  Este campo no se puede modificar en edición
                </small>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tecnico3_id">TÉCNICO 3:</label>
                <select 
                  name="tecnico3_id" 
                  value={formData.tecnico3_id} 
                  onChange={handleChange}
                  disabled // 🆕 DESHABILITADO
                  style={{ backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed' }}
                >
                  <option value="">Seleccione técnico</option>
                  {catalogos.tecnicos && catalogos.tecnicos.map(tecnico => (
                    <option key={tecnico.usuario_id} value={tecnico.usuario_id}>
                      {tecnico.nombre_completo || `Técnico ${tecnico.usuario_id}`}
                    </option>
                  ))}
                </select>
                <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                  Este campo no se puede modificar en edición
                </small>
              </div>
              <div className="form-group">
                <label htmlFor="tecnico4_id">TÉCNICO 4:</label>
                <select 
                  name="tecnico4_id" 
                  value={formData.tecnico4_id} 
                  onChange={handleChange}
                  disabled // 🆕 DESHABILITADO
                  style={{ backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed' }}
                >
                  <option value="">Seleccione técnico</option>
                  {catalogos.tecnicos && catalogos.tecnicos.map(tecnico => (
                    <option key={tecnico.usuario_id} value={tecnico.usuario_id}>
                      {tecnico.nombre_completo || `Técnico ${tecnico.usuario_id}`}
                    </option>
                  ))}
                </select>
                <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                  Este campo no se puede modificar en edición
                </small>
              </div>
            </div>
          </div>

          {/* Información de Ubicación */}
          <div className="form-section">
            <h3>Información de Ubicación</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sede_id">SEDE:</label>
                <select name="sede_id" value={formData.sede_id} onChange={handleChange}>
                  <option value="">Seleccione sede</option>
                  {catalogos.sedes && catalogos.sedes.map(sede => (
                    <option key={sede.sede_id} value={sede.sede_id}>
                      {sede.nombre_sede || sede.nombre || `Sede ${sede.sede_id}`}
                    </option>
                  ))}
                </select>
                {catalogos.sedes && catalogos.sedes.length === 0 && (
                  <small style={{color: 'red'}}>No hay sedes disponibles</small>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="redsalud_id">RED DE SALUD:</label>
                <select name="redsalud_id" value={formData.redsalud_id} onChange={handleChange}>
                  <option value="">Seleccione red de salud</option>
                  {redesFiltradas && redesFiltradas.map(red => (
                    <option key={red.redsalud_id} value={red.redsalud_id}>
                      {red.nombre_red || red.nombre || `Red ${red.redsalud_id}`}
                    </option>
                  ))}
                </select>
                {redesFiltradas && redesFiltradas.length === 0 && formData.sede_id && (
                  <small style={{color: 'orange'}}>No hay redes de salud para esta sede</small>
                )}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="establecimiento_id">ESTABLECIMIENTO DE SALUD:</label>
                <select name="establecimiento_id" value={formData.establecimiento_id} onChange={handleChange}>
                  <option value="">Seleccione establecimiento</option>
                  {establecimientosFiltrados && establecimientosFiltrados.map(est => (
                    <option key={est.establecimiento_id} value={est.establecimiento_id}>
                      {est.nombre_establecimiento || est.nombre || `Establecimiento ${est.establecimiento_id}`}
                    </option>
                  ))}
                </select>
                {establecimientosFiltrados && establecimientosFiltrados.length === 0 && formData.redsalud_id && (
                  <small style={{color: 'orange'}}>No hay establecimientos para esta red de salud</small>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="municipio_id">MUNICIPIO:</label>
                <select 
                  name="municipio_id" 
                  value={formData.municipio_id} 
                  onChange={handleChange}
                  disabled // 🆕 DESHABILITADO
                  style={{ backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed' }}
                >
                  <option value="">Seleccione municipio</option>
                  {catalogos.municipios && catalogos.municipios.map(mun => (
                    <option key={mun.municipio_id} value={mun.municipio_id}>
                      {mun.nombre_municipio || mun.nombre || `Municipio ${mun.municipio_id}`}
                    </option>
                  ))}
                </select>
                <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                  Este campo no se puede modificar en edición
                </small>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="comunidad_id">COMUNIDAD:</label>
                <select 
                  name="comunidad_id" 
                  value={formData.comunidad_id} 
                  onChange={handleChange}
                  disabled // 🆕 DESHABILITADO
                  style={{ backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed' }}
                >
                  <option value="">Seleccione comunidad</option>
                  {comunidadesFiltradas && comunidadesFiltradas.map(com => (
                    <option key={com.comunidad_id} value={com.comunidad_id}>
                      {com.nombre_comunidad || com.nombre || `Comunidad ${com.comunidad_id}`}
                    </option>
                  ))}
                </select>
                <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                  Este campo no se puede modificar en edición
                </small>
              </div>
              <div className="form-group">
                <label htmlFor="numero_vivienda">NÚMERO DE VIVIENDA: *</label>
                <input 
                  type="text" 
                  name="numero_vivienda" 
                  value={formData.numero_vivienda} 
                  onChange={handleChange}
                  disabled // 🆕 DESHABILITADO
                  style={{ backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed' }}
                  required
                />
                <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                  Este campo no se puede modificar en edición
                </small>
              </div>
            </div>
          </div>

          {/* Información de la Vivienda */}
          <div className="form-section">
            <h3>Información de la Vivienda</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="jefe_familia">JEFE DE FAMILIA: *</label>
                <input 
                  type="text" 
                  name="jefe_familia" 
                  value={formData.jefe_familia} 
                  onChange={handleChange}
                  disabled
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="habitantes_protegidos">HABITANTES PROTEGIDOS:</label>
                <input 
                  type="number" 
                  name="habitantes_protegidos" 
                  value={formData.habitantes_protegidos} 
                  onChange={handleChange}
                  min="0"
                  disabled={isViviendaNoDisponible}
                />
              </div>
            </div>
          </div>

          {/* Estado del Rociado */}
          <div className="form-section">
            <h3>Estado del Rociado</h3>
            
            <div className="checkbox-group">
              <div className="checkbox-row">
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    name="rociado" 
                    checked={formData.rociado} 
                    onChange={handleChange}
                    disabled={formData.no_rociado}
                  />
                  <label>ROCIADO</label>
                  {denunciaId && (
                    <small style={{color: '#28a745', marginLeft: '5px', display: 'block'}}>
                      Si marca esto, la denuncia se actualizará a "REALIZADA"
                    </small>
                  )}
                </div>
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    name="no_rociado" 
                    checked={formData.no_rociado} 
                    onChange={handleChange}
                    disabled={formData.rociado}
                  />
                  <label>NO ROCIADO</label>
                </div>
              </div>
              <div className="checkbox-row">
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    name="cerrada" 
                    checked={formData.cerrada} 
                    onChange={handleChange}
                    disabled={formData.renuente}
                  />
                  <label>CERRADA</label>
                </div>
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    name="renuente" 
                    checked={formData.renuente} 
                    onChange={handleChange}
                    disabled={formData.cerrada}
                  />
                  <label>RENUENTE</label>
                </div>
              </div>
            </div>
          </div>

          {/* Información del Rociado */}
          {!isViviendaNoDisponible && (
            <div className="form-section">
              <h3>Información del Rociado</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="habitaciones_rociadas">HABITACIONES ROCIADAS:</label>
                  <input 
                    type="number" 
                    name="habitaciones_rociadas" 
                    value={formData.habitaciones_rociadas} 
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="habitaciones_no_rociadas">HABITACIONES NO ROCIADAS:</label>
                  <input 
                    type="number" 
                    name="habitaciones_no_rociadas" 
                    value={formData.habitaciones_no_rociadas} 
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="habitaciones_total">TOTAL HABITACIONES:</label>
                  <input 
                    type="number" 
                    name="habitaciones_total" 
                    value={formData.habitaciones_total} 
                    readOnly
                    className="readonly"
                  />
                </div>
              </div>

              {/* Peridomicilio */}
              <div className="form-section-inner">
                <h4>Peridomicilio</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="corrales">CORRALES:</label>
                    <input 
                      type="number" 
                      name="corrales" 
                      value={formData.corrales} 
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="gallineros">GALLINEROS:</label>
                    <input 
                      type="number" 
                      name="gallineros" 
                      value={formData.gallineros} 
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="conejeras">CONEJERAS:</label>
                    <input 
                      type="number" 
                      name="conejeras" 
                      value={formData.conejeras} 
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="zarzos_trojes">ZARZOS/TROJES:</label>
                    <input 
                      type="number" 
                      name="zarzos_trojes" 
                      value={formData.zarzos_trojes} 
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="otros_peridomicilio">OTROS:</label>
                    <input 
                      type="number" 
                      name="otros_peridomicilio" 
                      value={formData.otros_peridomicilio} 
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* 🆕 NUEVO: Información del Insecticida actualizada */}
              <div className="form-section-inner">
                <h4>Información del Insecticida</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="insecticida_utilizado">INSECTICIDA UTILIZADO:</label>
                    <select name="insecticida_utilizado" value={formData.insecticida_utilizado} onChange={handleChange}>
                      <option value="">Seleccione insecticida</option>
                      <option value="LAMBDACIALOTRINA">LAMBDACIALOTRINA</option>
                      <option value="BENDIOCARB">BENDIOCARB</option>
                      <option value="OTRO">OTRO INSECTICIDA</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="lote">LOTE:</label>
                    <input 
                      type="text" 
                      name="lote" 
                      value={formData.lote} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="dosis">DOSIS ({formData.insecticida_utilizado === "BENDIOCARB" ? "gr" : "ml"}):</label>
                    <input 
                      type="number" 
                      name="dosis" 
                      value={formData.dosis} 
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      disabled={formData.insecticida_utilizado === "LAMBDACIALOTRINA" || formData.insecticida_utilizado === "BENDIOCARB"}
                      style={formData.insecticida_utilizado === "LAMBDACIALOTRINA" || formData.insecticida_utilizado === "BENDIOCARB" ? 
                        { backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed' } : {}}
                    />
                    {formData.insecticida_utilizado === "LAMBDACIALOTRINA" && (
                      <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                        Dosis automática: 60 ml para LAMBDACIALOTRINA
                      </small>
                    )}
                    {formData.insecticida_utilizado === "BENDIOCARB" && (
                      <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                        Dosis automática: 250 gr para BENDIOCARB
                      </small>
                    )}
                    {formData.insecticida_utilizado === "OTRO" && (
                      <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                        Ingrese manualmente la dosis para otro insecticida
                      </small>
                    )}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="numero_cargas">NÚMERO DE CARGAS:</label>
                    <input 
                      type="number" 
                      name="numero_cargas" 
                      value={formData.numero_cargas} 
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cantidad_insecticida">
                      CANTIDAD DE INSECTICIDA ({getUnidadInsecticida(formData.insecticida_utilizado)}):
                    </label>
                    <input 
                      type="number" 
                      name="cantidad_insecticida" 
                      value={formData.cantidad_insecticida} 
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      readOnly={formData.insecticida_utilizado !== "OTRO"}
                      style={{ 
                        backgroundColor: formData.insecticida_utilizado !== "OTRO" ? '#f5f5f5' : 'white', 
                        color: formData.insecticida_utilizado !== "OTRO" ? '#666' : 'inherit' 
                      }}
                    />
                    <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                      {getTextoCalculoAutomatico()}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Firma de Conformidad */}
          <div className="form-section">
            <h3>Firma de Conformidad</h3>
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="firma_conformidad">FIRMA DE CONFORMIDAD:</label>
                <input 
                  type="text" 
                  name="firma_conformidad" 
                  value={formData.firma_conformidad} 
                  onChange={handleChange}
                  placeholder="Nombre de la persona que firma"
                />
              </div>
            </div>
          </div>

          <div className="action-buttons-bottom">
            <button type="button" onClick={handleCancelar} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Guardando..." : "💾 Guardar Cambios"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default RR1Edit;