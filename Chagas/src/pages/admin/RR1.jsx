import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useRouteAccess } from "../AuthContext";
import SinAcceso from "../SinAcceso";
import "../../css/RR1.css";
import { baseUrl } from "../../api/BaseUrl"; 
import { useLocation } from "react-router-dom";

function RR1() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const datosVivienda = location.state?.datosVivienda || null;
  const [formularioHabilitado, setFormularioHabilitado] = useState(false);
  const [mostrarRedireccion, setMostrarRedireccion] = useState(false);
  const [destinoRedireccion, setDestinoRedireccion] = useState('');
  
  const { hasAccess, isLoading: accessLoading } = useRouteAccess(["tecnico", "jefe_grupo", "administrador", "supervisor"]);

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
  
  const [camposEditables, setCamposEditables] = useState({
    municipio: true,
    comunidad: true,
    numero_vivienda: true,
    jefe_familia: true
  });

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

  const [enviandoFormulario, setEnviandoFormulario] = useState(false);
  const [usuarioAbrioRR1, setUsuarioAbrioRR1] = useState(null);

  useEffect(() => {
    if (datosVivienda) {
      setFormularioHabilitado(true);
      if (datosVivienda.usuario_id) {
        setUsuarioAbrioRR1(datosVivienda.usuario_id);
      }
    } else {
      setFormularioHabilitado(false);
    }
  }, [datosVivienda]);

  useEffect(() => {
    const total = parseInt(formData.habitaciones_rociadas || 0) + 
                  parseInt(formData.habitaciones_no_rociadas || 0);
    setFormData(prev => ({
      ...prev,
      habitaciones_total: total
    }));
  }, [formData.habitaciones_rociadas, formData.habitaciones_no_rociadas]);

  useEffect(() => {
    if (formData.numero_cargas > 0 && formData.insecticida_utilizado) {
      let cantidadPorCarga = 0;
      
      switch(formData.insecticida_utilizado) {
        case "LAMBDACIALOTRINA":
          cantidadPorCarga = 60;
          break;
        case "BENDIOCARB":
          cantidadPorCarga = 250;
          break;
        case "OTRO":
          cantidadPorCarga = 0;
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

  useEffect(() => {
    if (formData.insecticida_utilizado) {
      let nuevaDosis = 0;
      
      switch(formData.insecticida_utilizado) {
        case "LAMBDACIALOTRINA":
          nuevaDosis = 60;
          break;
        case "BENDIOCARB":
          nuevaDosis = 250;
          break;
        case "OTRO":
          nuevaDosis = formData.dosis || 0;
          break;
        default:
          nuevaDosis = 0;
      }
      
      setFormData(prev => ({
        ...prev,
        dosis: nuevaDosis
      }));
    }
  }, [formData.insecticida_utilizado]);

  useEffect(() => {
    if (usuarioAbrioRR1 && catalogosCargados) {
      const jefeEncontrado = catalogos.jefesGrupo.find(
        jefe => jefe.usuario_id === parseInt(usuarioAbrioRR1)
      );
      
      const tecnicoEncontrado = catalogos.tecnicos.find(
        tecnico => tecnico.usuario_id === parseInt(usuarioAbrioRR1)
      );
      
      if (jefeEncontrado) {
        setFormData(prev => ({
          ...prev,
          jefe_grupo_id: jefeEncontrado.usuario_id
        }));
      } else if (tecnicoEncontrado) {
        setFormData(prev => ({
          ...prev,
          tecnico1_id: tecnicoEncontrado.usuario_id
        }));
      }
    }
  }, [usuarioAbrioRR1, catalogosCargados, catalogos.jefesGrupo, catalogos.tecnicos]);

  useEffect(() => {
    if (usuario && !usuarioAbrioRR1) {
      if (usuario.rol === 'tecnico') {
        setFormData(prev => ({
          ...prev,
          tecnico1_id: usuario.usuario_id
        }));
      }
      
      if (usuario.rol === 'jefe_grupo') {
        setFormData(prev => ({
          ...prev,
          jefe_grupo_id: usuario.usuario_id
        }));
      }
    }
  }, [usuario, usuarioAbrioRR1]);

  useEffect(() => {
    if (datosVivienda && catalogosCargados) {
      setCamposEditables({
        municipio: true,
        comunidad: true,
        numero_vivienda: true,
        jefe_familia: true
      });

      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          municipio_id: datosVivienda.municipio_id ? String(datosVivienda.municipio_id) : "",
          comunidad_id: datosVivienda.comunidad_id ? String(datosVivienda.comunidad_id) : "",
          numero_vivienda: datosVivienda.numero_vivienda || "",
          jefe_familia: datosVivienda.jefe_familia || ""
        }));

        if (datosVivienda.municipio_id) {
          const comunidadesFiltradas = catalogos.comunidades.filter(
            com => com.municipio_id === parseInt(datosVivienda.municipio_id)
          );
          setComunidadesFiltradas(comunidadesFiltradas);
          
          const comunidadExiste = comunidadesFiltradas.some(
            com => com.comunidad_id === parseInt(datosVivienda.comunidad_id)
          );
          
          if (comunidadExiste) {
            setTimeout(() => {
              setCamposEditables({
                municipio: false,
                comunidad: false,
                numero_vivienda: false,
                jefe_familia: false
              });
            }, 200);
          }
        }
      }, 100);
    }
  }, [datosVivienda, catalogosCargados, catalogos.comunidades]);

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

  useEffect(() => {
    if (datosVivienda && catalogosCargados && formData.municipio_id) {
      const comunidadesFiltradas = catalogos.comunidades.filter(
        com => com.municipio_id === parseInt(formData.municipio_id)
      );
      setComunidadesFiltradas(comunidadesFiltradas);
    }
  }, [datosVivienda, catalogosCargados, formData.municipio_id, catalogos.comunidades]);

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

  useEffect(() => {
    document.body.classList.add('rr1-page', 'rr1-background');
    
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
      
      if (!token) {
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

      if (catalogosResponse.status === 401 || catalogosResponse.status === 403) {
        alert("Su sesión ha expirado. Por favor, inicie sesión nuevamente.");
        logout();
        return;
      }

      if (!catalogosResponse.ok) {
        throw new Error(`Error ${catalogosResponse.status} al cargar catálogos`);
      }

      const data = await catalogosResponse.json();
      
      let jefesGrupo = [];
      let tecnicos = [];

      if (jefesGrupoResponse.ok) {
        jefesGrupo = await jefesGrupoResponse.json();
      }

      if (tecnicosResponse.ok) {
        tecnicos = await tecnicosResponse.json();
      }

      setCatalogos({
        ...data,
        jefesGrupo,
        tecnicos
      });
      setCatalogosCargados(true);
    
    } catch (error) {
      if (intentos > 1) {
        setTimeout(() => cargarCatalogos(intentos - 1), 2000);
      } else {
        alert("Error de conexión persistente. Verifique que el servidor esté ejecutándose y recargue la página.");
      }
    }
  };

  const getNombreTecnico = (tecnicoId) => {
    const tecnico = catalogos.tecnicos.find(t => t.usuario_id === parseInt(tecnicoId));
    return tecnico ? tecnico.nombre_completo : "Desconocido";
  };

  const getNombreJefeGrupo = (jefeId) => {
    const jefe = catalogos.jefesGrupo.find(j => j.usuario_id === parseInt(jefeId));
    return jefe ? jefe.nombre_completo : "Desconocido";
  };

  const validarTecnicosDuplicados = () => {
    const idsSeleccionados = new Set();
    const camposTecnicos = ['tecnico1_id', 'tecnico2_id', 'tecnico3_id', 'tecnico4_id'];
    const errores = [];

    camposTecnicos.forEach(campo => {
      const id = formData[campo];
      if (id && id !== "") {
        if (idsSeleccionados.has(id)) {
          errores.push(campo);
        }
        idsSeleccionados.add(id);
      }
    });

    return errores;
  };

  const handleChange = e => {
    const { name, value, type, checked, files } = e.target;

    if (name.includes('tecnico') && value !== "") {
      const camposTecnicos = ['tecnico1_id', 'tecnico2_id', 'tecnico3_id', 'tecnico4_id'];
      const otrosCampos = camposTecnicos.filter(campo => campo !== name);
      
      const duplicado = otrosCampos.some(campo => formData[campo] === value);
      
      if (duplicado) {
        const nombreTecnico = getNombreTecnico(value);
        alert(`⚠️ El técnico "${nombreTecnico}" ya ha sido seleccionado en otro campo. Por favor, seleccione un técnico diferente.`);
        return;
      }
    }

    if (datosVivienda) {
      const camposNoEditables = ['municipio_id', 'comunidad_id', 'numero_vivienda', 'jefe_familia'];
      if (camposNoEditables.includes(name) && !camposEditables[name.replace('_id', '')]) {
        return;
      }
    }

    if (type === "checkbox") {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      
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

  const validarYCorregirDatos = () => {
    const correcciones = [];

    if (formData.insecticida_utilizado && formData.numero_cargas > 0) {
      let cantidadEsperada = 0;
      
      switch(formData.insecticida_utilizado) {
        case "LAMBDACIALOTRINA":
          cantidadEsperada = formData.numero_cargas * 60;
          break;
        case "BENDIOCARB":
          cantidadEsperada = formData.numero_cargas * 250;
          break;
        case "OTRO":
          break;
      }
      
      if (cantidadEsperada > 0 && parseFloat(formData.cantidad_insecticida) !== cantidadEsperada) {
        correcciones.push({
          campo: 'cantidad_insecticida',
          valorAnterior: formData.cantidad_insecticida,
          valorNuevo: cantidadEsperada,
          mensaje: `Cantidad corregida: ${cantidadEsperada} ${formData.insecticida_utilizado === "BENDIOCARB" ? "gr" : "ml"}`
        });
        
        setFormData(prev => ({
          ...prev,
          cantidad_insecticida: cantidadEsperada
        }));
      }
    }

    if (formData.insecticida_utilizado && formData.insecticida_utilizado !== "OTRO") {
      let dosisEsperada = 0;
      
      switch(formData.insecticida_utilizado) {
        case "LAMBDACIALOTRINA":
          dosisEsperada = 60;
          break;
        case "BENDIOCARB":
          dosisEsperada = 250;
          break;
      }
      
      if (dosisEsperada > 0 && parseFloat(formData.dosis) !== dosisEsperada) {
        correcciones.push({
          campo: 'dosis',
          valorAnterior: formData.dosis,
          valorNuevo: dosisEsperada,
          mensaje: `Dosis corregida: ${dosisEsperada} ${formData.insecticida_utilizado === "BENDIOCARB" ? "gr" : "ml"}`
        });
        
        setFormData(prev => ({
          ...prev,
          dosis: dosisEsperada
        }));
      }
    }

    return correcciones;
  };

  const enviarFormulario = async () => {
    setEnviandoFormulario(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Sesión expirada. Por favor, inicie sesión nuevamente.");
        logout();
        return;
      }

      if (!formData.numero_vivienda || !formData.jefe_familia || !formData.tecnico1_id) {
        alert("Por favor, complete los campos obligatorios: Número de Vivienda, Jefe de Familia y Jefe/Técnico 1.");
        setEnviandoFormulario(false);
        return;
      }

      if (!formData.rociado && !formData.no_rociado) {
        alert("Por favor, seleccione si la vivienda fue rociada o no.");
        setEnviandoFormulario(false);
        return;
      }

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
        estado: formData.rociado ? 'activo' : 'inactivo',
        vivienda_id: datosVivienda?.vivienda_id || null,
        denuncia_id: datosVivienda?.denuncia_id || null
      };
      
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
        setEnviandoFormulario(false);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        alert("✅ Formulario RR1 guardado exitosamente");
        
        let redireccionDestino = "/admin/rr2";
        
        if (usuario?.rol === 'tecnico') {
          redireccionDestino = "/CargaRociado";
        } else if (usuario?.rol === 'jefe_grupo' || usuario?.rol === 'administrador') {
          redireccionDestino = "/admin/rr2";
        }
        
        setDestinoRedireccion(redireccionDestino);
        setMostrarRedireccion(true);
        
        setTimeout(() => {
          navigate(redireccionDestino);
        }, 3000);
        
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert("❌ Error de conexión con el servidor");
    } finally {
      setEnviandoFormulario(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    const erroresDuplicados = validarTecnicosDuplicados();
    if (erroresDuplicados.length > 0) {
      alert("❌ Error: Hay técnicos duplicados seleccionados. Por favor, corrija antes de enviar.");
      setLoading(false);
      return;
    }

    const correcciones = validarYCorregirDatos();
    
    if (correcciones.length > 0) {
      const mensajeCorrecciones = correcciones.map(c => c.mensaje).join('\n');
      alert(`⚠️ Se realizaron correcciones automáticas:\n\n${mensajeCorrecciones}\n\nEl formulario se enviará con los valores corregidos.`);
      
      setTimeout(() => {
        enviarFormulario();
      }, 500);
    } else {
      enviarFormulario();
    }
  };

  const resetForm = () => {
    setFormData({
      sede_id: "",
      redsalud_id: "",
      establecimiento_id: "",
      municipio_id: "",
      comunidad_id: "",
      jefe_grupo_id: usuario?.rol === 'jefe_grupo' ? usuario.usuario_id : "",
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
    
    setCamposEditables({
      municipio: true,
      comunidad: true,
      numero_vivienda: true,
      jefe_familia: true
    });
  };

  const calcularTotalHabitaciones = () => {
    return parseInt(formData.habitaciones_rociadas || 0) + 
           parseInt(formData.habitaciones_no_rociadas || 0);
  };

  const getNombreMunicipio = () => {
    if (!formData.municipio_id) return datosVivienda?.nombre_municipio || "";
    
    const municipio = catalogos.municipios.find(m => m.municipio_id === parseInt(formData.municipio_id));
    return municipio ? municipio.nombre : datosVivienda?.nombre_municipio || "";
  };

  const getNombreComunidad = () => {
    if (formData.comunidad_id && comunidadesFiltradas.length > 0) {
      const comunidad = comunidadesFiltradas.find(c => c.comunidad_id === parseInt(formData.comunidad_id));
      if (comunidad) return comunidad.nombre;
    }
    
    if (formData.comunidad_id) {
      const comunidad = catalogos.comunidades.find(c => c.comunidad_id === parseInt(formData.comunidad_id));
      if (comunidad) return comunidad.nombre;
    }
    
    return datosVivienda?.nombre_comunidad || "Cargando...";
  };

  const getUnidadInsecticida = (insecticida) => {
    switch(insecticida) {
      case "LAMBDACIALOTRINA": return "ml";
      case "BENDIOCARB": return "gr";
      case "OTRO": return "unidades";
      default: return "ml";
    }
  };

  const getTextoCalculoAutomatico = () => {
    switch(formData.insecticida_utilizado) {
      case "LAMBDACIALOTRINA":
        return "Calculado automáticamente: 60 ml por carga (1 carga = 60 ml)";
      case "BENDIOCARB":
        return "Calculado automáticamente: 250 gr por carga (1 carga = 250 gr)";
      case "OTRO":
        return "Ingrese manualmente la cantidad para otro insecticida";
      default:
        return "Seleccione un insecticida para calcular automáticamente";
    }
  };

  const renderAdvertenciaDuplicados = () => {
    const errores = validarTecnicosDuplicados();
    
    if (errores.length === 0) return null;
    
    return (
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        padding: '10px',
        borderRadius: '5px',
        margin: '10px 0',
        color: '#856404'
      }}>
        <strong>⚠️ Advertencia:</strong> Tienes técnicos duplicados seleccionados. 
        {errores.map(campo => {
          const id = formData[campo];
          const nombre = getNombreTecnico(id);
          return (
            <div key={campo} style={{ marginLeft: '10px', marginTop: '5px' }}>
              • {campo.replace('_id', '').toUpperCase()}: {nombre}
            </div>
          );
        })}
      </div>
    );
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

  const isViviendaNoDisponible = formData.no_rociado || formData.cerrada || formData.renuente;
  const isUserTecnico = usuario?.rol === 'tecnico';
  const isUserJefeGrupo = usuario?.rol === 'jefe_grupo';
  const unidadInsecticida = getUnidadInsecticida(formData.insecticida_utilizado);

  return (
    <div className="container" style={{ position: 'relative' }}>
      {mostrarRedireccion && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#4caf50',
          color: 'white',
          padding: '15px',
          borderRadius: '5px',
          zIndex: 1000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          maxWidth: '300px'
        }}>
          ✅ Formulario guardado. Redirigiendo a {destinoRedireccion} en 3 segundos...
        </div>
      )}

      <div className="header">
        <h1>FORMULARIO RR1 - REGISTRO DE ROCIADO</h1>
        <p>Sistema de Registro de Actividades de Rociado</p>
        {usuario && <p style={{color: '#666', fontSize: '0.9em'}}>Usuario: {usuario.nombre_completo} - Rol: {usuario.rol}</p>}
        
        {datosVivienda && (
          <div style={{
            backgroundColor: '#e8f5e8',
            border: '1px solid #4caf50',
            padding: '15px',
            borderRadius: '8px',
            marginTop: '15px',
            marginBottom: '15px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ 
                fontSize: '20px', 
                marginRight: '10px' 
              }}>✅</span>
              <strong style={{ fontSize: '16px', color: '#2e7d32' }}>
                Vivienda cargada automáticamente desde CargaRociado
              </strong>
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '10px',
              fontSize: '14px'
            }}>
              <div>
                <strong>Municipio:</strong> {getNombreMunicipio()}
              </div>
              <div>
                <strong>Comunidad:</strong> {getNombreComunidad()}
              </div>
              <div>
                <strong>N° Vivienda:</strong> {formData.numero_vivienda}
              </div>
              <div>
                <strong>Jefe de Familia:</strong> {formData.jefe_familia}
              </div>
            </div>
            <div style={{ 
              marginTop: '10px', 
              padding: '8px', 
              backgroundColor: '#fff3cd', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#856404'
            }}>
              <strong>Nota:</strong> Los campos de ubicación y vivienda están bloqueados para mantener la consistencia de los datos.
            </div>
          </div>
        )}

        {!datosVivienda && (
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '15px',
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <span style={{ 
                fontSize: '24px', 
                marginRight: '10px' 
              }}>⚠️</span>
              <strong style={{ fontSize: '18px', color: '#856404' }}>
                Formulario No Disponible
              </strong>
            </div>
            <p style={{ margin: '10px 0', color: '#856404' }}>
              Para completar el formulario RR1, primero debe seleccionar una vivienda desde el módulo de <strong>CargaRociado</strong>.
            </p>
            <p style={{ margin: '0', color: '#856404', fontSize: '14px' }}>
              Diríjase al módulo correspondiente y seleccione una vivienda para habilitar este formulario.
            </p>
          </div>
        )}
        
      </div>

      {!catalogosCargados && catalogos.municipios.length === 0 && (
        <div className="loading-container">
          <p>🔄 Cargando catálogos...</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
  <h3>Información del Personal</h3>
  
  {renderAdvertenciaDuplicados()}
  
  <div className="form-row">
    <div className="form-group">
      <label htmlFor="jefe_grupo_id">JEFE DE GRUPO o TECNICO QUE ESTA LLENANDO EL FORMULARIO:</label>
      <select 
        name="jefe_grupo_id" 
        value={formData.jefe_grupo_id} 
        onChange={handleChange}
        disabled={isUserJefeGrupo}
        style={isUserJefeGrupo ? { 
          backgroundColor: '#f5f5f5', 
          color: '#666', 
          cursor: 'not-allowed' 
        } : {}}
      >
        <option value="">Seleccione jefe de grupo</option>
        {catalogos.jefesGrupo.map(jefe => (
          <option key={jefe.usuario_id} value={jefe.usuario_id}>
            {jefe.nombre_completo} - JEFE
          </option>
        ))}
      </select>
      {isUserJefeGrupo && (
        <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
          Tu usuario está auto-seleccionado como Jefe de Grupo
        </small>
      )}
    </div>
  </div>
  
  <div className="form-row">
    <div className="form-group">
      <label htmlFor="tecnico1_id">JEFE/TÉCNICO 1: *</label>
      <select 
        name="tecnico1_id" 
        value={formData.tecnico1_id} 
        onChange={handleChange}
        required
        disabled={isUserTecnico}
      >
        <option value="">Seleccione técnico</option>
        {catalogos.jefesGrupo.map(jefe => {
          const esRegistrador = formData.jefe_grupo_id === String(jefe.usuario_id);
          const yaSeleccionado = ['tecnico2_id', 'tecnico3_id', 'tecnico4_id']
            .some(campo => formData[campo] === String(jefe.usuario_id));
          
          if (esRegistrador) return null;
          
          return (
            <option 
              key={`jefe-${jefe.usuario_id}`}
              value={jefe.usuario_id}
              disabled={yaSeleccionado}
              style={yaSeleccionado ? { color: '#999', backgroundColor: '#f5f5f5' } : {}}
            >
              {jefe.nombre_completo} - JEFE {yaSeleccionado ? '(Ya seleccionado)' : ''}
            </option>
          );
        })}
        {catalogos.tecnicos.map(tecnico => {
          const esRegistrador = formData.jefe_grupo_id === String(tecnico.usuario_id);
          const yaSeleccionado = ['tecnico2_id', 'tecnico3_id', 'tecnico4_id']
            .some(campo => formData[campo] === String(tecnico.usuario_id));
          
          if (esRegistrador) return null;
          
          return (
            <option 
              key={`tecnico-${tecnico.usuario_id}`}
              value={tecnico.usuario_id}
              disabled={yaSeleccionado}
              style={yaSeleccionado ? { color: '#999', backgroundColor: '#f5f5f5' } : {}}
            >
              {tecnico.nombre_completo} - TÉCNICO {yaSeleccionado ? '(Ya seleccionado)' : ''}
            </option>
          );
        })}
      </select>
      {isUserTecnico && (
        <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
          Tu usuario está auto-seleccionado como Jefe/Técnico 1
        </small>
      )}
    </div>
    <div className="form-group">
      <label htmlFor="tecnico2_id">JEFE/TÉCNICO 2:</label>
      <select 
        name="tecnico2_id" 
        value={formData.tecnico2_id} 
        onChange={handleChange}
      >
        <option value="">Seleccione técnico</option>
        {catalogos.jefesGrupo.map(jefe => {
          const esRegistrador = formData.jefe_grupo_id === String(jefe.usuario_id);
          const yaSeleccionado = ['tecnico1_id', 'tecnico3_id', 'tecnico4_id']
            .some(campo => formData[campo] === String(jefe.usuario_id));
          
          if (esRegistrador) return null;
          
          return (
            <option 
              key={`jefe-${jefe.usuario_id}`}
              value={jefe.usuario_id}
              disabled={yaSeleccionado}
              style={yaSeleccionado ? { color: '#999', backgroundColor: '#f5f5f5' } : {}}
            >
              {jefe.nombre_completo} - JEFE {yaSeleccionado ? '(Ya seleccionado)' : ''}
            </option>
          );
        })}
        {catalogos.tecnicos.map(tecnico => {
          const esRegistrador = formData.jefe_grupo_id === String(tecnico.usuario_id);
          const yaSeleccionado = ['tecnico1_id', 'tecnico3_id', 'tecnico4_id']
            .some(campo => formData[campo] === String(tecnico.usuario_id));
          
          if (esRegistrador) return null;
          
          return (
            <option 
              key={`tecnico-${tecnico.usuario_id}`}
              value={tecnico.usuario_id}
              disabled={yaSeleccionado}
              style={yaSeleccionado ? { color: '#999', backgroundColor: '#f5f5f5' } : {}}
            >
              {tecnico.nombre_completo} - TÉCNICO {yaSeleccionado ? '(Ya seleccionado)' : ''}
            </option>
          );
        })}
      </select>
    </div>
  </div>
  
  <div className="form-row">
    <div className="form-group">
      <label htmlFor="tecnico3_id">JEFE/TÉCNICO 3:</label>
      <select 
        name="tecnico3_id" 
        value={formData.tecnico3_id} 
        onChange={handleChange}
      >
        <option value="">Seleccione técnico</option>
        {catalogos.jefesGrupo.map(jefe => {
          const esRegistrador = formData.jefe_grupo_id === String(jefe.usuario_id);
          const yaSeleccionado = ['tecnico1_id', 'tecnico2_id', 'tecnico4_id']
            .some(campo => formData[campo] === String(jefe.usuario_id));
          
          if (esRegistrador) return null;
          
          return (
            <option 
              key={`jefe-${jefe.usuario_id}`}
              value={jefe.usuario_id}
              disabled={yaSeleccionado}
              style={yaSeleccionado ? { color: '#999', backgroundColor: '#f5f5f5' } : {}}
            >
              {jefe.nombre_completo} - JEFE {yaSeleccionado ? '(Ya seleccionado)' : ''}
            </option>
          );
        })}
        {catalogos.tecnicos.map(tecnico => {
          const esRegistrador = formData.jefe_grupo_id === String(tecnico.usuario_id);
          const yaSeleccionado = ['tecnico1_id', 'tecnico2_id', 'tecnico4_id']
            .some(campo => formData[campo] === String(tecnico.usuario_id));
          
          if (esRegistrador) return null;
          
          return (
            <option 
              key={`tecnico-${tecnico.usuario_id}`}
              value={tecnico.usuario_id}
              disabled={yaSeleccionado}
              style={yaSeleccionado ? { color: '#999', backgroundColor: '#f5f5f5' } : {}}
            >
              {tecnico.nombre_completo} - TÉCNICO {yaSeleccionado ? '(Ya seleccionado)' : ''}
            </option>
          );
        })}
      </select>
    </div>
    <div className="form-group">
      <label htmlFor="tecnico4_id">JEFE/TÉCNICO 4:</label>
      <select 
        name="tecnico4_id" 
        value={formData.tecnico4_id} 
        onChange={handleChange}
      >
        <option value="">Seleccione técnico</option>
        {catalogos.jefesGrupo.map(jefe => {
          const esRegistrador = formData.jefe_grupo_id === String(jefe.usuario_id);
          const yaSeleccionado = ['tecnico1_id', 'tecnico2_id', 'tecnico3_id']
            .some(campo => formData[campo] === String(jefe.usuario_id));
          
          if (esRegistrador) return null;
          
          return (
            <option 
              key={`jefe-${jefe.usuario_id}`}
              value={jefe.usuario_id}
              disabled={yaSeleccionado}
              style={yaSeleccionado ? { color: '#999', backgroundColor: '#f5f5f5' } : {}}
            >
              {jefe.nombre_completo} - JEFE {yaSeleccionado ? '(Ya seleccionado)' : ''}
            </option>
          );
        })}
        {catalogos.tecnicos.map(tecnico => {
          const esRegistrador = formData.jefe_grupo_id === String(tecnico.usuario_id);
          const yaSeleccionado = ['tecnico1_id', 'tecnico2_id', 'tecnico3_id']
            .some(campo => formData[campo] === String(tecnico.usuario_id));
          
          if (esRegistrador) return null;
          
          return (
            <option 
              key={`tecnico-${tecnico.usuario_id}`}
              value={tecnico.usuario_id}
              disabled={yaSeleccionado}
              style={yaSeleccionado ? { color: '#999', backgroundColor: '#f5f5f5' } : {}}
            >
              {tecnico.nombre_completo} - TÉCNICO {yaSeleccionado ? '(Ya seleccionado)' : ''}
            </option>
          );
        })}
      </select>
    </div>
  </div>
</div>

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
              <label htmlFor="municipio_id">MUNICIPIO: {datosVivienda && "🔒"}</label>
              <select 
                name="municipio_id" 
                value={formData.municipio_id} 
                onChange={handleChange}
                disabled={!camposEditables.municipio && datosVivienda}
                style={!camposEditables.municipio && datosVivienda ? { 
                  backgroundColor: '#f5f5f5', 
                  color: '#666', 
                  cursor: 'not-allowed' 
                } : {}}
              >
                <option value="">Seleccione municipio</option>
                {catalogos.municipios.map(mun => (
                  <option key={mun.municipio_id} value={mun.municipio_id}>
                    {mun.nombre}
                  </option>
                ))}
              </select>
              {!camposEditables.municipio && datosVivienda && (
                <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                  Municipio cargado automáticamente desde CargaRociado
                </small>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="comunidad_id">COMUNIDAD: {datosVivienda && "🔒"}</label>
              <select 
                name="comunidad_id" 
                value={formData.comunidad_id} 
                onChange={handleChange} 
                disabled={!formData.municipio_id || (!camposEditables.comunidad && datosVivienda)}
                style={!camposEditables.comunidad && datosVivienda ? { 
                  backgroundColor: '#f5f5f5', 
                  color: '#666', 
                  cursor: 'not-allowed' 
                } : {}}
              >
                <option value="">Seleccione comunidad</option>
                {comunidadesFiltradas.map(com => (
                  <option key={com.comunidad_id} value={com.comunidad_id}>
                    {com.nombre}
                  </option>
                ))}
              </select>
              {!camposEditables.comunidad && datosVivienda && (
                <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                  Comunidad cargada automáticamente desde CargaRociado
                </small>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Datos de la Vivienda</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="numero_vivienda">Número de Vivienda: * {datosVivienda && "🔒"}</label>
              <input 
                type="text" 
                name="numero_vivienda" 
                value={formData.numero_vivienda} 
                onChange={handleChange} 
                required 
                disabled={!camposEditables.numero_vivienda}
                style={!camposEditables.numero_vivienda ? { backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed' } : {}}
                placeholder="Ej: VIV-001"
              />
              {!camposEditables.numero_vivienda && (
                <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                  Número de vivienda cargado automáticamente desde CargaRociado
                </small>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="jefe_familia">Jefe de Familia: * {datosVivienda && "🔒"}</label>
              <input 
                type="text" 
                name="jefe_familia" 
                value={formData.jefe_familia} 
                onChange={handleChange} 
                required 
                disabled={!camposEditables.jefe_familia}
                style={!camposEditables.jefe_familia ? { backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed' } : {}}
                placeholder="Ej: Juan Pérez"
              />
              {!camposEditables.jefe_familia && (
                <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                  Jefe de familia cargado automáticamente desde CargaRociado
                </small>
              )}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="habitantes_protegidos">Número de Habitantes Protegidos:</label>
              <input type="number" name="habitantes_protegidos" value={formData.habitantes_protegidos} onChange={handleChange} min="0" />
            </div>
          </div>
        </div>

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

        <div className="form-section">
          <div style={{ 
            backgroundColor: '#e8f4fd', 
            padding: '15px', 
            borderRadius: '5px', 
            marginBottom: '20px',
            border: '1px solid #b6d7f2'
          }}>
            <strong>💡 Información sobre insecticidas:</strong>
            <div style={{ fontSize: '14px', marginTop: '8px', lineHeight: '1.5' }}>
              • <strong>LAMBDACIALOTRINA:</strong> 60 ml por carga, dosis fija 60 ml<br/>
              • <strong>BENDIOCARB:</strong> 250 gr por carga, dosis fija 250 gr<br/>
              • <strong>OTRO INSECTICIDA:</strong> Ingreso manual de dosis y cantidad
            </div>
          </div>

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
                <option value="BENDIOCARB">BENDIOCARB</option>
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
              <label htmlFor="dosis">Dosis ({unidadInsecticida}):</label>
              <input 
                type="number" 
                name="dosis" 
                value={formData.dosis} 
                onChange={handleChange} 
                min="0" 
                step="0.01" 
                disabled={isViviendaNoDisponible || 
                  formData.insecticida_utilizado === "LAMBDACIALOTRINA" || 
                  formData.insecticida_utilizado === "BENDIOCARB"}
                style={isViviendaNoDisponible ? { backgroundColor: '#f8f9fa', color: '#6c757d' } : {}}
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
              <label htmlFor="cantidad_insecticida">
                Cantidad de Insecticida ({unidadInsecticida}):
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

        <button 
          type="submit" 
          className="btn" 
          disabled={enviandoFormulario || !formularioHabilitado}
          style={!formularioHabilitado ? { 
            backgroundColor: '#6c757d', 
            cursor: 'not-allowed',
            opacity: 0.6 
          } : {}}
        >
          {enviandoFormulario ? "Guardando..." : 
           !formularioHabilitado ? "Esperando datos de CargaRociado..." : 
           "Guardar Formulario RR1"}
        </button>
      </form>
    </div>
  );
}

export default RR1;