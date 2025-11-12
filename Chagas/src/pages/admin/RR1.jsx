import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { useRouteAccess } from "../AuthContext";
import SinAcceso from "../SinAcceso";
import "../../css/RR1.css";
import { baseUrl } from "../../api/BaseUrl"; 


function RR1() {
  const { usuario, logout, isAuthenticated } = useAuth();
  
  const { hasAccess, isLoading: accessLoading } = useRouteAccess(["tecnico", "jefe_grupo", "administrador"]);

  const [catalogos, setCatalogos] = useState({ 
    municipios: [], 
    comunidades: [], 
    sedes: [],
    redesSalud: [],
    establecimientos: [],
    jefesGrupo: [],
    tecnicos: []
  });
  const [loading, setLoading] = useState(false);
  const [comunidadesFiltradas, setComunidadesFiltradas] = useState([]);
  const [redesFiltradas, setRedesFiltradas] = useState([]);
  const [establecimientosFiltrados, setEstablecimientosFiltrados] = useState([]);
  const [catalogosCargados, setCatalogosCargados] = useState(false);

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

  // Calcular total de habitaciones automáticamente
  useEffect(() => {
    const total = parseInt(formData.habitaciones_rociadas || 0) + 
                  parseInt(formData.habitaciones_no_rociadas || 0);
    setFormData(prev => ({
      ...prev,
      habitaciones_total: total
    }));
  }, [formData.habitaciones_rociadas, formData.habitaciones_no_rociadas]);

  // Calcular cantidad de insecticida automáticamente basado en cargas
  useEffect(() => {
    if (formData.numero_cargas > 0) {
      const cantidad = formData.numero_cargas * 10000;
      setFormData(prev => ({
        ...prev,
        cantidad_insecticida: cantidad
      }));
    }
  }, [formData.numero_cargas]);

  // Auto-set dosis cuando se selecciona insecticida
  useEffect(() => {
    if (formData.insecticida_utilizado === "LAMBDACIALOTRINA") {
      setFormData(prev => ({
        ...prev,
        dosis: 200
      }));
    } else if (formData.insecticida_utilizado) {
      setFormData(prev => ({
        ...prev,
        dosis: 0
      }));
    }
  }, [formData.insecticida_utilizado]);

  // Auto-seleccionar técnico si el usuario es técnico
  useEffect(() => {
    if (usuario && usuario.rol === 'tecnico') {
      setFormData(prev => ({
        ...prev,
        tecnico1_id: usuario.usuario_id
      }));
    }
  }, [usuario]);

  // Filtrar comunidades cuando cambia el municipio
  useEffect(() => {
    if (formData.municipio_id) {
      const comunidades = catalogos.comunidades.filter(
        com => com.municipio_id === parseInt(formData.municipio_id)
      );
      setComunidadesFiltradas(comunidades);
      
      if (formData.comunidad_id && !comunidades.some(com => com.comunidad_id === parseInt(formData.comunidad_id))) {
        setFormData(prev => ({ ...prev, comunidad_id: "" }));
      }
    } else {
      setComunidadesFiltradas([]);
      setFormData(prev => ({ ...prev, comunidad_id: "" }));
    }
  }, [formData.municipio_id, catalogos.comunidades]);

  // Filtrar redes de salud cuando cambia la sede
  useEffect(() => {
    if (formData.sede_id) {
      const redes = catalogos.redesSalud.filter(
        red => red.sede_id === parseInt(formData.sede_id)
      );
      setRedesFiltradas(redes);
      
      if (formData.redsalud_id && !redes.some(red => red.redsalud_id === parseInt(formData.redsalud_id))) {
        setFormData(prev => ({ ...prev, redsalud_id: "", establecimiento_id: "" }));
      }
    } else {
      setRedesFiltradas([]);
      setFormData(prev => ({ ...prev, redsalud_id: "", establecimiento_id: "" }));
    }
  }, [formData.sede_id, catalogos.redesSalud]);

  // Filtrar establecimientos cuando cambia la red de salud
  useEffect(() => {
    if (formData.redsalud_id) {
      const establecimientos = catalogos.establecimientos.filter(
        est => est.redsalud_id === parseInt(formData.redsalud_id)
      );
      setEstablecimientosFiltrados(establecimientos);
      
      if (formData.establecimiento_id && !establecimientos.some(est => est.establecimiento_id === parseInt(formData.establecimiento_id))) {
        setFormData(prev => ({ ...prev, establecimiento_id: "" }));
      }
    } else {
      setEstablecimientosFiltrados([]);
      setFormData(prev => ({ ...prev, establecimiento_id: "" }));
    }
  }, [formData.redsalud_id, catalogos.establecimientos]);

  // Cargar catalogos al montar el componente
  useEffect(() => {
    document.body.classList.add('rr1-page', 'rr1-background');
    
    // Pequeño delay para dar tiempo al backend de inicializar
    const timer = setTimeout(() => {
      cargarCatalogos();
    }, 1000);

    return () => {
      document.body.classList.remove('rr1-page', 'rr1-background');
      clearTimeout(timer);
    };
  }, []);

  const cargarCatalogos = async (intentos = 3) => {
    try {
      const token = localStorage.getItem('token');
      console.log("📋 Cargando catálogos desde la base de datos...");
      
      if (!token) {
        console.error("❌ No hay token");
        alert("Por favor, inicie sesión nuevamente.");
        logout();
        return;
      }


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

      console.log("📡 Estados de respuesta:");
      console.log("  - Catálogos:", catalogosResponse.status);
      console.log("  - Jefes grupo:", jefesGrupoResponse.status);
      console.log("  - Técnicos:", tecnicosResponse.status);

      // Verificar si alguna petición falló por autenticación
      if (catalogosResponse.status === 401 || catalogosResponse.status === 403) {
        console.error("❌ Token inválido o expirado");
        alert("Su sesión ha expirado. Por favor, inicie sesión nuevamente.");
        logout();
        return;
      }

      if (!catalogosResponse.ok) {
        throw new Error(`Error ${catalogosResponse.status} al cargar catálogos`);
      }

      // Procesar todas las respuestas
      const data = await catalogosResponse.json();
      
      let jefesGrupo = [];
      let tecnicos = [];

      if (jefesGrupoResponse.ok) {
        jefesGrupo = await jefesGrupoResponse.json();
        console.log("✅ Jefes grupo cargados:", jefesGrupo.length);
      } else {
        console.warn("⚠️ No se pudieron cargar jefes de grupo:", jefesGrupoResponse.status);
      }

      if (tecnicosResponse.ok) {
        tecnicos = await tecnicosResponse.json();
        console.log("✅ Técnicos cargados:", tecnicos.length);
      } else {
        console.warn("⚠️ No se pudieron cargar técnicos:", tecnicosResponse.status);
      }

      setCatalogos({
        ...data,
        jefesGrupo,
        tecnicos
      });
      setCatalogosCargados(true);

      console.log("✅ Todos los catálogos cargados correctamente");
      console.log("  - Municipios:", data.municipios?.length || 0);
      console.log("  - Comunidades:", data.comunidades?.length || 0);
      console.log("  - Sedes:", data.sedes?.length || 0);
      console.log("  - Redes de salud:", data.redesSalud?.length || 0);
      console.log("  - Establecimientos:", data.establecimientos?.length || 0);
    
    } catch (error) {
      console.warn("⚠️ Intento de conexión fallido:", error.message);
      
      // Reintentar automáticamente sin mostrar alerta intrusiva
      if (intentos > 1) {
        console.log(`🔄 Reintentando en 2 segundos... (${intentos - 1} intentos restantes)`);
        setTimeout(() => cargarCatalogos(intentos - 1), 2000);
      } else {
        console.error("❌ Todos los intentos fallaron después de 3 intentos");
        alert("Error de conexión persistente. Verifique que el servidor esté ejecutándose y recargue la página.");
      }
    }
  };

  const handleChange = e => {
    const { name, value, type, checked, files } = e.target;

    if (type === "checkbox") {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      
      // Lógica para rociado/no_rociado (excluyentes)
      if (name === 'rociado' && checked) {
        setFormData(prev => ({ ...prev, no_rociado: false }));
      } else if (name === 'no_rociado' && checked) {
        setFormData(prev => ({ ...prev, rociado: false }));
      }
      
      // Lógica para cerrada/renuente (excluyentes)
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
    setLoading(true);

    // OBTENER TOKEN ANTES DE ENVIAR - CORREGIDO
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Sesión expirada. Por favor, inicie sesión nuevamente.");
      logout();
      setLoading(false);
      return;
    }

    // Validaciones básicas
    if (!formData.numero_vivienda || !formData.jefe_familia || !formData.tecnico1_id) {
      alert("Por favor, complete los campos obligatorios: Número de Vivienda, Jefe de Familia y Técnico 1.");
      setLoading(false);
      return;
    }

    // Validar que se haya seleccionado rociado o no rociado
    if (!formData.rociado && !formData.no_rociado) {
      alert("Por favor, seleccione si la vivienda fue rociada o no.");
      setLoading(false);
      return;
    }

    // Si la vivienda no fue rociada, está cerrada o es renuente, poner todos los valores en 0
    const isViviendaNoDisponible = formData.no_rociado || formData.cerrada || formData.renuente;

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
      cerrada: formData.cerrada ? 1 : 0,
      renuente: formData.renuente ? 1 : 0,
      rociado: formData.rociado ? 1 : 0,
      no_rociado: formData.no_rociado ? 1 : 0,
      estado: formData.rociado ? 'activo' : 'inactivo'
    };

   
    try {      
      console.log("📤 Enviando formulario RR1...", datosEnviar);
      
      const response = await fetch(`${baseUrl}/api/rr1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosEnviar)
      });

      if (response.status === 401 || response.status === 403) {
        alert("Su sesión ha expirado. Por favor, inicie sesión nuevamente.");
        logout();
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        alert("✅ Formulario RR1 guardado exitosamente");
        resetForm();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      alert("❌ Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      sede_id: "",
      redsalud_id: "",
      establecimiento_id: "",
      municipio_id: "",
      comunidad_id: "",
      jefe_grupo_id: "",
      tecnico1_id: usuario?.rol === 'tecnico' ? usuario.usuario_id : "",
      tecnico2_id: "",
      tecnico3_id: "",
      tecnico4_id: "",
      numero_vivienda: "",
      jefe_familia: "",
      habitantes_protegidos: "",
      cerrada: false,
      renuente: false,
      rociado: false,
      no_rociado: false,
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
      lote: "",
      dosis: 0,
      firma_conformidad: ""
    });
    setComunidadesFiltradas([]);
    setRedesFiltradas([]);
    setEstablecimientosFiltrados([]);
  };

  const calcularTotalHabitaciones = () => {
    return parseInt(formData.habitaciones_rociadas || 0) + 
           parseInt(formData.habitaciones_no_rociadas || 0);
  };

  // CONDICIONALES DE ACCESO MOVIDOS DESPUÉS DE TODOS LOS HOOKS
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

  const isViviendaNoDisponible = formData.no_rociado || formData.cerrada || formData.renuente;
  const isUserTecnico = usuario?.rol === 'tecnico';

  return (
    <div className="container">
      <div className="header">
        <h1>FORMULARIO RR1 - REGISTRO DE ROCIADO</h1>
        <p>Sistema de Registro de Actividades de Rociado</p>
        {usuario && <p style={{color: '#666', fontSize: '0.9em'}}>Usuario: {usuario.nombre_completo} - Rol: {usuario.rol}</p>}
      </div>

      {!catalogosCargados && catalogos.municipios.length === 0 && (
        <div className="loading-container">
          <p>🔄 Cargando catálogos...</p>
        </div>
      )}

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
              >
                <option value="">Seleccione jefe de grupo</option>
                {catalogos.jefesGrupo.map(jefe => (
                  <option key={jefe.usuario_id} value={jefe.usuario_id}>
                    {jefe.nombre_completo}
                  </option>
                ))}
              </select>
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
                disabled={isUserTecnico}
              >
                <option value="">Seleccione técnico</option>
                {catalogos.tecnicos.map(tecnico => (
                  <option key={tecnico.usuario_id} value={tecnico.usuario_id}>
                    {tecnico.nombre_completo}
                  </option>
                ))}
              </select>
              {isUserTecnico && (
                <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                  Tu usuario está auto-seleccionado como Técnico 1
                </small>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="tecnico2_id">TÉCNICO 2:</label>
              <select name="tecnico2_id" value={formData.tecnico2_id} onChange={handleChange}>
                <option value="">Seleccione técnico</option>
                {catalogos.tecnicos.map(tecnico => (
                  <option key={tecnico.usuario_id} value={tecnico.usuario_id}>
                    {tecnico.nombre_completo}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tecnico3_id">TÉCNICO 3:</label>
              <select name="tecnico3_id" value={formData.tecnico3_id} onChange={handleChange}>
                <option value="">Seleccione técnico</option>
                {catalogos.tecnicos.map(tecnico => (
                  <option key={tecnico.usuario_id} value={tecnico.usuario_id}>
                    {tecnico.nombre_completo}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="tecnico4_id">TÉCNICO 4:</label>
              <select name="tecnico4_id" value={formData.tecnico4_id} onChange={handleChange}>
                <option value="">Seleccione técnico</option>
                {catalogos.tecnicos.map(tecnico => (
                  <option key={tecnico.usuario_id} value={tecnico.usuario_id}>
                    {tecnico.nombre_completo}
                  </option>
                ))}
              </select>
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
                {catalogos.sedes.map(sede => (
                  <option key={sede.sede_id} value={sede.sede_id}>{sede.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="redsalud_id">RED DE SALUD:</label>
              <select name="redsalud_id" value={formData.redsalud_id} onChange={handleChange} disabled={!formData.sede_id}>
                <option value="">Seleccione red de salud</option>
                {redesFiltradas.map(red => (
                  <option key={red.redsalud_id} value={red.redsalud_id}>{red.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="establecimiento_id">ESTABLECIMIENTO DE SALUD:</label>
              <select name="establecimiento_id" value={formData.establecimiento_id} onChange={handleChange} disabled={!formData.redsalud_id}>
                <option value="">Seleccione establecimiento</option>
                {establecimientosFiltrados.map(est => (
                  <option key={est.establecimiento_id} value={est.establecimiento_id}>{est.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="municipio_id">MUNICIPIO:</label>
              <select name="municipio_id" value={formData.municipio_id} onChange={handleChange}>
                <option value="">Seleccione municipio</option>
                {catalogos.municipios.map(mun => (
                  <option key={mun.municipio_id} value={mun.municipio_id}>{mun.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="comunidad_id">COMUNIDAD:</label>
              <select name="comunidad_id" value={formData.comunidad_id} onChange={handleChange} disabled={!formData.municipio_id}>
                <option value="">Seleccione comunidad</option>
                {comunidadesFiltradas.map(com => (
                  <option key={com.comunidad_id} value={com.comunidad_id}>{com.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Datos de la Vivienda */}
        <div className="form-section">
          <h3>Datos de la Vivienda</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="numero_vivienda">Número de Vivienda: *</label>
              <input type="text" name="numero_vivienda" value={formData.numero_vivienda} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="jefe_familia">Jefe de Familia: *</label>
              <input type="text" name="jefe_familia" value={formData.jefe_familia} onChange={handleChange} required />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="habitantes_protegidos">Número de Habitantes Protegidos:</label>
              <input type="number" name="habitantes_protegidos" value={formData.habitantes_protegidos} onChange={handleChange} min="0" />
            </div>
          </div>
        </div>

        {/* Estado del Rociado */}
        <div className="form-section">
          <h3>Estado del Rociado</h3>
          <div className="checkbox-group">
            <div className="checkbox-subgroup">
              <h4>¿La vivienda fue rociada?</h4>
              <div className="checkbox-item">
                <input type="checkbox" id="rociado" name="rociado" checked={formData.rociado} onChange={handleChange}/>
                <label htmlFor="rociado">Sí, fue rociada</label>
              </div>
              <div className="checkbox-item">
                <input type="checkbox" id="no_rociado" name="no_rociado" checked={formData.no_rociado} onChange={handleChange}/>
                <label htmlFor="no_rociado">No, no fue rociada</label>
              </div>
            </div>
            
            <div className="checkbox-subgroup">
              <h4>Estado de la vivienda</h4>
              <div className="checkbox-item">
                <input type="checkbox" id="cerrada" name="cerrada" checked={formData.cerrada} onChange={handleChange}/>
                <label htmlFor="cerrada">Vivienda Cerrada</label>
              </div>
              <div className="checkbox-item">
                <input type="checkbox" id="renuente" name="renuente" checked={formData.renuente} onChange={handleChange}/>
                <label htmlFor="renuente">Renuente al Rociado</label>
              </div>
            </div>
          </div>
          
          {isViviendaNoDisponible && (
            <div style={{ 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              padding: '10px', 
              borderRadius: '5px', 
              marginTop: '10px',
              color: '#856404'
            }}>
              ⚠️ La vivienda está marcada como no disponible. Los datos de rociado se establecerán en 0.
            </div>
          )}
        </div>

        {/* Intradomicilio */}
        <div className="form-section">
          <h3>Intradomicilio</h3>
          <div className="table-container">
            <table>
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
                  <td>Número de Habitaciones</td>
                  <td>
                    <input 
                      type="number" 
                      name="habitaciones_rociadas" 
                      value={formData.habitaciones_rociadas} 
                      onChange={handleChange} 
                      min="0" 
                      disabled={isViviendaNoDisponible}
                      style={isViviendaNoDisponible ? { backgroundColor: '#f8f9fa', color: '#6c757d' } : {}}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      name="habitaciones_no_rociadas" 
                      value={formData.habitaciones_no_rociadas} 
                      onChange={handleChange} 
                      min="0" 
                      disabled={isViviendaNoDisponible}
                      style={isViviendaNoDisponible ? { backgroundColor: '#f8f9fa', color: '#6c757d' } : {}}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={calcularTotalHabitaciones()} 
                      readOnly 
                      style={{
                        background: '#f5f5f5',
                        ...(isViviendaNoDisponible ? { color: '#6c757d' } : {})
                      }} 
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Peridomicilio */}
        <div className="form-section">
          <h3>Peridomicilio</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Corrales</td>
                  <td>
                    <input 
                      type="number" 
                      name="corrales" 
                      value={formData.corrales} 
                      onChange={handleChange} 
                      min="0" 
                      disabled={isViviendaNoDisponible}
                      style={isViviendaNoDisponible ? { backgroundColor: '#f8f9fa', color: '#6c757d' } : {}}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Gallineros</td>
                  <td>
                    <input 
                      type="number" 
                      name="gallineros" 
                      value={formData.gallineros} 
                      onChange={handleChange} 
                      min="0" 
                      disabled={isViviendaNoDisponible}
                      style={isViviendaNoDisponible ? { backgroundColor: '#f8f9fa', color: '#6c757d' } : {}}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Conejeras</td>
                  <td>
                    <input 
                      type="number" 
                      name="conejeras" 
                      value={formData.conejeras} 
                      onChange={handleChange} 
                      min="0" 
                      disabled={isViviendaNoDisponible}
                      style={isViviendaNoDisponible ? { backgroundColor: '#f8f9fa', color: '#6c757d' } : {}}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Zarzos/Trojes</td>
                  <td>
                    <input 
                      type="number" 
                      name="zarzos_trojes" 
                      value={formData.zarzos_trojes} 
                      onChange={handleChange} 
                      min="0" 
                      disabled={isViviendaNoDisponible}
                      style={isViviendaNoDisponible ? { backgroundColor: '#f8f9fa', color: '#6c757d' } : {}}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Otros</td>
                  <td>
                    <input 
                      type="number" 
                      name="otros_peridomicilio" 
                      value={formData.otros_peridomicilio} 
                      onChange={handleChange} 
                      min="0" 
                      disabled={isViviendaNoDisponible}
                      style={isViviendaNoDisponible ? { backgroundColor: '#f8f9fa', color: '#6c757d' } : {}}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Datos del Rociado */}
        <div className="form-section">
          <h3>Datos del Rociado</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="insecticida_utilizado">Insecticida Utilizado:</label>
              <select 
                name="insecticida_utilizado" 
                value={formData.insecticida_utilizado} 
                onChange={handleChange}
                disabled={isViviendaNoDisponible}
                style={isViviendaNoDisponible ? { backgroundColor: '#f8f9fa', color: '#6c757d' } : {}}
              >
                <option value="">Seleccione insecticida</option>
                <option value="LAMBDACIALOTRINA">LAMBDACIALOTRINA</option>
                <option value="OTRO">OTRO INSECTICIDA</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="lote">Lote:</label>
              <input 
                type="text" 
                name="lote" 
                value={formData.lote} 
                onChange={handleChange}
                disabled={isViviendaNoDisponible}
                style={isViviendaNoDisponible ? { backgroundColor: '#f8f9fa', color: '#6c757d' } : {}}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dosis">Dosis (ml):</label>
              <input 
                type="number" 
                name="dosis" 
                value={formData.dosis} 
                onChange={handleChange} 
                min="0" 
                step="0.01" 
                disabled={isViviendaNoDisponible || formData.insecticida_utilizado === "LAMBDACIALOTRINA"}
                style={isViviendaNoDisponible ? { backgroundColor: '#f8f9fa', color: '#6c757d' } : {}}
              />
              {formData.insecticida_utilizado === "LAMBDACIALOTRINA" && (
                <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                  Dosis automática: 200 ml para LAMBDACIALOTRINA
                </small>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="numero_cargas">Número de Cargas:</label>
              <input 
                type="number" 
                name="numero_cargas" 
                value={formData.numero_cargas} 
                onChange={handleChange} 
                min="0" 
                disabled={isViviendaNoDisponible}
                style={isViviendaNoDisponible ? { backgroundColor: '#f8f9fa', color: '#6c757d' } : {}}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cantidad_insecticida">Cantidad de Insecticida (ml):</label>
              <input 
                type="number" 
                name="cantidad_insecticida" 
                value={formData.cantidad_insecticida} 
                onChange={handleChange} 
                min="0" 
                step="0.01" 
                readOnly
                style={{ backgroundColor: '#f5f5f5', color: '#666' }}
              />
              <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                Calculado automáticamente: 10,000 ml por carga
              </small>
            </div>
          </div>
        </div>

        {/* Firma de Conformidad */}
        <div className="form-section">
          <h3>Firma de Conformidad</h3>
          <div className="form-group">
            <label htmlFor="firma_conformidad">Subir firma (PDF o imagen): *</label>
            <input 
              type="file" 
              id="firma_conformidad" 
              name="firma_conformidad" 
              onChange={handleChange}
              accept=".pdf,image/*"
              required
            />
            {formData.firma_conformidad && (
              <p style={{ marginTop: '5px', color: '#28a745', fontSize: '0.9em' }}>
                Archivo seleccionado: {formData.firma_conformidad}
              </p>
            )}
            <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
              Formatos permitidos: PDF, JPG, PNG, GIF
            </small>
          </div>
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Formulario RR1"}
        </button>
      </form>
    </div>
  );
}

export default RR1;