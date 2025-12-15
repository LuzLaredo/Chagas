import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "../css/CargaRociado.css";
import { Header } from "../components/header";
import { ServiceCard } from "../components/service-card";
import { ActionButtons } from "../components/action-buttons";
import { Icon } from "@iconify/react";
import { baseUrl } from "../api/BaseUrl";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from "./AuthContext";

// 🗺️ CONFIGURACIÓN CRÍTICA DE ICONOS DE LEAFLET
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function CargaRociado() {
  const { denunciaId } = useParams();
  const { userType, usuario, isAuthenticated } = useAuth();

  const [viviendaData, setViviendaData] = useState(null);
  const [denunciaData, setDenunciaData] = useState(null);
  const [viviendasList, setViviendasList] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viviendaId, setViviendaId] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [locationInfo, setLocationInfo] = useState(null);
  const [mapKey, setMapKey] = useState(0);

  // 🆕 ESTADOS PARA EL MODAL DE DESCRIPCIÓN
  const [showDescripcionModal, setShowDescripcionModal] = useState(false);
  const [descripcionCompleta, setDescripcionCompleta] = useState("");

  // Referencias para el mapa
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  // 🆕 EFECTO PARA IR AL PRINCIPIO DE LA PÁGINA AL CARGAR
  useEffect(() => {
    // Ir al principio de la página cuando se carga el componente
    window.scrollTo(0, 0);
  }, []); // Se ejecuta solo al montar el componente

  // 🆕 EFECTO PARA IR AL PRINCIPIO CUANDO CAMBIA LA DENUNCIA
  useEffect(() => {
    if (denunciaId) {
      window.scrollTo(0, 0);
    }
  }, [denunciaId]); // Se ejecuta cuando cambia el denunciaId

  // 🆕 EFECTO PARA IR AL PRINCIPIO CUANDO CAMBIA LA VIVIENDA
  useEffect(() => {
    if (viviendaId) {
      window.scrollTo(0, 0);
    }
  }, [viviendaId]); // Se ejecuta cuando cambia la vivienda

  const fetchData = async (endpoint, options = {}) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${baseUrl}/api/${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("❌ Error 401: No autorizado para:", endpoint);
          // Si hay error 401, intentar sin token para endpoints públicos
          if (endpoint.startsWith('viviendas/') || endpoint.startsWith('denuncias/')) {
            const publicResponse = await fetch(`${baseUrl}/api/${endpoint}`);
            if (!publicResponse.ok) throw new Error(`Error al obtener datos de ${endpoint}`);
            return await publicResponse.json();
          }
          throw new Error(`No autorizado para acceder a ${endpoint}`);
        }
        throw new Error(`Error ${response.status} al obtener datos de ${endpoint}`);
      }

      return await response.json();
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      return null;
    }
  };

  // ✅ CARGAR MUNICIPIOS - MODIFICADO PARA FILTRAR POR USUARIO
  const loadMunicipios = async () => {
    try {
      // Si es administrador, cargar todos los municipios
      if (userType === 'administrador') {
        const municipiosData = await fetchData("viviendas/municipios");
        if (municipiosData?.length > 0) {
          setMunicipios(municipiosData);
          console.log(`✅ Administrador: cargados ${municipiosData.length} municipios`);
        }
        return null;
      }

      // Si es técnico, jefe_grupo o supervisor, cargar solo municipios asignados
      if (usuario?.usuario_id && (userType === 'tecnico' || userType === 'jefe_grupo' || userType === 'supervisor')) {
        console.log(`🔄 Cargando municipios para usuario ${usuario.usuario_id} (${userType})`);

        // Primero intentar con el endpoint protegido
        const municipiosData = await fetchData(`usuarios/${usuario.usuario_id}/municipios`);

        if (municipiosData?.length > 0) {
          setMunicipios(municipiosData);
          console.log(`✅ Usuario ${usuario.usuario_id} tiene acceso a ${municipiosData.length} municipio(s):`,
            municipiosData.map(m => m.nombre_municipio));
        } else {
          console.log(`⚠️ Usuario ${usuario.usuario_id} no tiene municipios asignados o error al cargar`);

          // Si no hay datos o hay error, intentar obtener municipios de otra manera
          // Opción 1: Intentar con query directa a viviendas/municipios
          const todosMunicipios = await fetchData("viviendas/municipios");
          if (todosMunicipios?.length > 0) {
            // Si el usuario tiene un municipio_id en su registro
            if (usuario.municipio_id) {
              const municipioUsuario = todosMunicipios.find(m => m.municipio_id == usuario.municipio_id);
              if (municipioUsuario) {
                setMunicipios([municipioUsuario]);
                console.log(`📍 Usuario tiene municipio_id: ${municipioUsuario.nombre_municipio}`);
              }
            }
          }

          if (municipios.length === 0) {
            setMunicipios([]);
            console.log(`❌ Usuario ${usuario.usuario_id} no tiene acceso a ningún municipio`);
          }
        }
        return null;
      }

      // Para otros roles (usuario), cargar todos los municipios
      if (userType === 'usuario') {
        const municipiosData = await fetchData("viviendas/municipios");
        if (municipiosData?.length > 0) {
          setMunicipios(municipiosData);
          console.log(`👤 Usuario regular: cargados ${municipiosData.length} municipios`);
        }
        return null;
      }

      // Para invitados o si no hay usuario, no cargar municipios
      setMunicipios([]);
      return null;

    } catch (error) {
      console.error("❌ Error al cargar municipios:", error);

      // En caso de error, intentar cargar todos los municipios como fallback
      try {
        const municipiosData = await fetchData("viviendas/municipios");
        if (municipiosData?.length > 0) {
          setMunicipios(municipiosData);
          console.log(`🔄 Fallback: cargados ${municipiosData.length} municipios`);
        }
      } catch (fallbackError) {
        console.error("❌ Error en fallback de municipios:", fallbackError);
        setMunicipios([]);
      }

      return null;
    }
  };


  // ✅ CARGAR VIVIENDAS POR MUNICIPIO - FILTRADAS
  const loadViviendasByMunicipio = async (municipioId) => {
    if (!municipioId) return null;

    const viviendas = await fetchData(`viviendas/municipio/${municipioId}`);

    if (viviendas?.length > 0) {
      // Filtrar viviendas que tengan denuncias activas (sin verificar o en proceso)
      const viviendasFiltradas = await filtrarViviendasActivas(viviendas);
      setViviendasList(viviendasFiltradas);

      return viviendasFiltradas.length > 0 ? viviendasFiltradas[0].vivienda_id : null;
    } else {
      setViviendasList([]);
      setViviendaId("");
    }
    return null;
  };

  // ✅ FILTRAR VIVIENDAS CON DENUNCIAS ACTIVAS
  const filtrarViviendasActivas = async (viviendas) => {
    try {
      const viviendasConDenuncias = await Promise.all(
        viviendas.map(async (vivienda) => {
          const denuncias = await fetchData(`denuncias/vivienda/${vivienda.vivienda_id}`);

          if (denuncias && denuncias.length > 0) {
            // Obtener la denuncia más reciente
            const denunciaReciente = denuncias.sort((a, b) =>
              new Date(b.fecha_denuncia) - new Date(a.fecha_denuncia)
            )[0];

            // Verificar si la denuncia está en estado activo
            const estado = denunciaReciente.estado_denuncia;
            const estadosActivos = ['recibida', 'programada', 'reprogramada'];
            const estadosExcluidos = ['realizada', 'cancelada'];

            if (estadosActivos.includes(estado) && !estadosExcluidos.includes(estado)) {
              return {
                ...vivienda,
                estado_denuncia: estado,
                denuncia_reciente: denunciaReciente
              };
            }
          }
          return null;
        })
      );

      return viviendasConDenuncias.filter(v => v !== null);
    } catch (error) {
      console.error("Error filtrando viviendas:", error);
      return viviendas;
    }
  };

  // ✅ INICIALIZAR MAPA - VERSIÓN MEJORADA Y ROBUSTA
  const initializeMap = (lat, lng, viviendaInfo) => {
    console.log("🔄 Inicializando mapa...");

    // Limpiar mapa existente de forma segura
    if (mapInstance.current) {
      try {
        mapInstance.current.off(); // Remover event listeners
        mapInstance.current.remove();
      } catch (e) {
        console.warn("Advertencia al limpiar mapa:", e);
      }
      mapInstance.current = null;
      markerRef.current = null;
    }

    // Esperar a que el contenedor del mapa esté listo
    setTimeout(() => {
      if (!mapRef.current) {
        console.error("❌ Contenedor del mapa no encontrado");
        return;
      }

      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);

      console.log("📍 Coordenadas para mapa:", { lat: latNum, lng: lngNum });

      if (isNaN(latNum) || isNaN(lngNum)) {
        console.error("❌ Coordenadas inválidas:", { lat, lng });
        return;
      }

      try {
        // Crear el mapa
        mapInstance.current = L.map(mapRef.current).setView([latNum, lngNum], 16);

        // Agregar capa de tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(mapInstance.current);

        // Crear marcador
        markerRef.current = L.marker([latNum, lngNum]).addTo(mapInstance.current);

        // Agregar popup
        markerRef.current.bindPopup(`
          <div style="text-align: center; padding: 8px;">
            <strong style="color: #dc2626; font-size: 14px;">📍 Ubicación Exacta</strong><br>
            <span style="font-size: 12px;">${viviendaInfo?.jefe_familia || 'N/A'}</span><br>
            <span style="font-size: 11px; color: #666;">Vivienda: ${viviendaInfo?.numero_vivienda || 'N/A'}</span>
          </div>
        `).openPopup();

        // 🔄 FIX CRÍTICO: Forzar redibujado múltiples veces para asegurar que no quede gris
        const forceRedraw = () => {
          if (mapInstance.current) {
            mapInstance.current.invalidateSize();
          }
        };

        // Redibujar inmediatamente, a los 300ms y a 1s
        setTimeout(forceRedraw, 100);
        setTimeout(forceRedraw, 500);
        setTimeout(forceRedraw, 1500);

        // Obtener información de ubicación
        getLocationDetails(latNum, lngNum);

      } catch (error) {
        console.error("❌ Error inicializando mapa:", error);
      }
    }, 100);
  };

  // ✅ OBTENER INFORMACIÓN DE UBICACIÓN
  const getLocationDetails = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.display_name) {
        const info = {
          address: data.display_name,
          road: data.address?.road || 'Calle no identificada',
          houseNumber: data.address?.house_number || '',
          suburb: data.address?.suburb || data.address?.neighbourhood || '',
          city: data.address?.city || data.address?.town || data.address?.village || '',
          postcode: data.address?.postcode || '',
          country: data.address?.country || 'Bolivia'
        };
        setLocationInfo(info);
      }
    } catch (error) {
      console.error('❌ Error obteniendo información de ubicación:', error);
    }
  };

  // ✅ CARGAR DATOS POR DENUNCIA ID
  const loadDataByDenunciaId = async (id) => {
    try {
      setLoading(true);

      // 1. Cargar municipios primero
      await loadMunicipios();

      // 2. Cargar datos específicos de la denuncia
      const denuncia = await fetchData(`denuncias/${id}`);
      console.log("📋 Denuncia cargada:", denuncia);

      if (denuncia) {
        setDenunciaData(denuncia);

        // 3. Extraer nombres de municipio y comunidad
        const nombreMunicipio = denuncia.nombre_municipio || "No disponible";
        const nombreComunidad = denuncia.nombre_comunidad || "No disponible";

        // 4. Determinar municipio_id para filtrar
        let municipioIdParaFiltrar = denuncia.denuncia_municipio_id ||
          denuncia.comunidad_municipio_id ||
          denuncia.municipio_id_final;

        // 5. Verificar si el usuario tiene acceso a este municipio
        if (municipioIdParaFiltrar && userType !== 'administrador' && municipios.length > 0) {
          const usuarioTieneAcceso = municipios.some(m => m.municipio_id == municipioIdParaFiltrar);
          if (!usuarioTieneAcceso) {
            // Si no tiene acceso, usar el primer municipio disponible
            municipioIdParaFiltrar = municipios[0].municipio_id;
            console.log(`⚠️ Usuario no tiene acceso al municipio de la denuncia. Usando: ${municipios[0].nombre_municipio}`);
          }
        }

        // 5. PRIORIDAD: Cargar datos de la VIVIENDA (coordenadas exactas)
        if (denuncia.vivienda_id) {
          const vivienda = await fetchData(`viviendas/${denuncia.vivienda_id}`);
          console.log("🏠 Vivienda cargada desde denuncia:", vivienda);

          if (vivienda) {
            const viviendaConNombres = {
              ...vivienda,
              nombre_municipio: nombreMunicipio,
              nombre_comunidad: nombreComunidad,
              direccion: denuncia.denuncia_direccion || vivienda.direccion
            };

            setViviendaData(viviendaConNombres);
            setViviendaId(denuncia.vivienda_id);

            // 🗺️ INICIALIZAR MAPA CON COORDENADAS EXACTAS DE LA VIVIENDA
            if (vivienda.latitud && vivienda.longitud) {
              console.log("📍 Usando coordenadas EXACTAS de VIVIENDA:", vivienda.latitud, vivienda.longitud);
              // Forzar re-render del mapa
              setMapKey(prev => prev + 1);
              setTimeout(() => {
                initializeMap(vivienda.latitud, vivienda.longitud, viviendaConNombres);
              }, 500);
            }
          }
        } else {
          // Si no hay vivienda_id, usar datos de la denuncia
          const viviendaTemporal = {
            vivienda_id: null,
            numero_vivienda: denuncia.numero_vivienda || "N/A",
            jefe_familia: denuncia.jefe_familia || "N/A",
            direccion: denuncia.denuncia_direccion || "No especificada",
            latitud: denuncia.latitud,
            longitud: denuncia.longitud,
            altura: denuncia.altura,
            nombre_comunidad: nombreComunidad,
            nombre_municipio: nombreMunicipio
          };

          setViviendaData(viviendaTemporal);

          // 🗺️ INICIALIZAR MAPA CON COORDENADAS DE LA DENUNCIA
          if (denuncia.latitud && denuncia.longitud) {
            console.log("📍 Usando coordenadas de DENUNCIA:", denuncia.latitud, denuncia.longitud);
            setMapKey(prev => prev + 1);
            setTimeout(() => {
              initializeMap(denuncia.latitud, denuncia.longitud, viviendaTemporal);
            }, 500);
          }
        }

        // 6. Cargar viviendas del municipio correspondiente
        if (municipioIdParaFiltrar) {
          setSelectedMunicipio(municipioIdParaFiltrar.toString());
          await loadViviendasByMunicipio(municipioIdParaFiltrar);
        } else {
          const firstMunicipioId = await loadMunicipios();
          if (firstMunicipioId) {
            setSelectedMunicipio(firstMunicipioId.toString());
            await loadViviendasByMunicipio(firstMunicipioId);
          }
        }
      }
    } catch (err) {
      console.error("❌ Error al cargar denuncia:", err);
      setError(`Error al cargar denuncia: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CARGAR DATOS NORMALES (SIN DENUNCIA)
  const loadNormalData = async () => {
    try {
      // Solo cargar municipios, NO seleccionar automáticamente el primero
      await loadMunicipios();

      // Dejar selectedMunicipio vacío para que el usuario elija
      setSelectedMunicipio("");
      setViviendasList([]);
      setViviendaId("");
      setViviendaData(null);

      // Si el usuario solo tiene un municipio, seleccionarlo automáticamente
      if (municipios.length === 1 && userType !== 'administrador') {
        const municipioId = municipios[0].municipio_id;
        setSelectedMunicipio(municipioId.toString());
        await loadViviendasByMunicipio(municipioId);
      }

    } catch (err) {
      console.error("❌ Error al cargar datos iniciales:", err);
      setError(`Error al cargar datos iniciales: ${err.message}`);
    }
  };

  // ✅ CARGAR DATOS DE VIVIENDA
  const loadViviendaData = async (id) => {
    if (!id) return;

    const vivienda = await fetchData(`viviendas/${id}`);
    console.log("🏠 Datos vivienda cargados:", vivienda);

    if (vivienda) {
      let viviendaConNombres = { ...vivienda };

      if ((!vivienda.nombre_municipio || !vivienda.nombre_comunidad) && denunciaData) {
        viviendaConNombres = {
          ...viviendaConNombres,
          nombre_comunidad: denunciaData.nombre_comunidad || vivienda.nombre_comunidad || "No disponible",
          nombre_municipio: denunciaData.nombre_municipio || vivienda.nombre_municipio || "No disponible"
        };
      }

      setViviendaData(viviendaConNombres);

      // 🗺️ INICIALIZAR MAPA CON COORDENADAS EXACTAS DE LA VIVIENDA
      if (vivienda.latitud && vivienda.longitud) {
        console.log("📍 Usando coordenadas EXACTAS de VIVIENDA:", vivienda.latitud, vivienda.longitud);
        setMapKey(prev => prev + 1);
        setTimeout(() => {
          initializeMap(vivienda.latitud, vivienda.longitud, viviendaConNombres);
        }, 500);
      }
    }

    // Cargar denuncias relacionadas con esta vivienda
    const denuncias = await fetchData(`denuncias/vivienda/${id}`);
    if (denuncias && denuncias.length > 0) {
      const denunciaReciente = denuncias.sort((a, b) =>
        new Date(b.fecha_denuncia) - new Date(a.fecha_denuncia)
      )[0];
      setDenunciaData(denunciaReciente);
    } else {
      setDenunciaData(null);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (denunciaId) {
          await loadDataByDenunciaId(denunciaId);
        } else {
          await loadNormalData();
        }
      } catch (err) {
        console.error("❌ Error en loadData:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Solo cargar datos si el usuario está autenticado
    if (isAuthenticated) {
      loadData();
    } else {
      setLoading(false);
      setError("Debe iniciar sesión para acceder a esta página");
    }

    // Limpiar mapa cuando el componente se desmonte
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [denunciaId, isAuthenticated]);

  // ✅ MANEJAR CAMBIO DE MUNICIPIO
  const handleMunicipioChange = async (e) => {
    const newMunicipioId = e.target.value;
    setSelectedMunicipio(newMunicipioId);
    setLoading(true);
    try {
      await loadViviendasByMunicipio(newMunicipioId);
      setViviendaData(null);
      setDenunciaData(null);
      setCurrentImageIndex(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ MANEJAR CAMBIO DE VIVIENDA
  const handleViviendaChange = async (e) => {
    const newId = e.target.value;
    setViviendaId(newId);
    setLoading(true);
    try {
      await loadViviendaData(newId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIONES PARA EL CARRUSEL - CORREGIDAS
  const handleImageNext = () => {
    if (!denunciaData) return;

    const fotosVinchucas = denunciaData.fotos_vinchucas ?
      denunciaData.fotos_vinchucas.split(',').filter(foto => foto.trim()) : [];

    const fotoVivienda = denunciaData.foto_vivienda ? [denunciaData.foto_vivienda] : [];

    const todasLasFotos = [...fotoVivienda, ...fotosVinchucas];

    if (todasLasFotos.length > 0) {
      setCurrentImageIndex((prev) => {
        const newIndex = (prev + 1) % todasLasFotos.length;
        return newIndex;
      });
    }
  };

  const handleImagePrev = () => {
    if (!denunciaData) return;

    const fotosVinchucas = denunciaData.fotos_vinchucas ?
      denunciaData.fotos_vinchucas.split(',').filter(foto => foto.trim()) : [];

    const fotoVivienda = denunciaData.foto_vivienda ? [denunciaData.foto_vivienda] : [];

    const todasLasFotos = [...fotoVivienda, ...fotosVinchucas];

    if (todasLasFotos.length > 0) {
      setCurrentImageIndex((prev) => {
        const newIndex = (prev - 1 + todasLasFotos.length) % todasLasFotos.length;
        return newIndex;
      });
    }
  };

  // ✅ PREPARAR DATOS PARA LAS CARDS
  const getDatosGenerales = () => {
    if (!viviendaData) return [];

    const items = [
      {
        label: "Nombre del jefe de familia:",
        value: viviendaData.jefe_familia || denunciaData?.jefe_familia || "No disponible"
      },
      {
        label: "Nº de vivienda:",
        value: viviendaData.numero_vivienda || denunciaData?.numero_vivienda || "No disponible"
      },
      {
        label: "Dirección:",
        value: viviendaData.direccion || denunciaData?.denuncia_direccion || "No especificada"
      },
      {
        label: "Comunidad:",
        value: viviendaData.nombre_comunidad || denunciaData?.nombre_comunidad || "No disponible"
      },
      {
        label: "Municipio:",
        value: viviendaData.nombre_municipio || denunciaData?.nombre_municipio || "No disponible"
      }
    ];

    // 🆕 AGREGAR DESCRIPCIÓN CON BOTÓN "VER MÁS" SI ES NECESARIO
    if (denunciaData?.descripcion) {
      const descripcion = denunciaData.descripcion;
      const necesitaVerMas = descripcion.length > 60;
      const descripcionCorta = necesitaVerMas ? `${descripcion.substring(0, 60)}...` : descripcion;

      items.push({
        label: "Descripción de Denuncia:",
        value: descripcionCorta,
        necesitaVerMas: necesitaVerMas,
        descripcionCompleta: descripcion
      });
    }

    // 🆕 AGREGAR NÚMERO TELEFÓNICO SI EXISTE
    if (denunciaData?.numero_telefono) {
      const telefonoCompleto = denunciaData.codigo_pais
        ? `${denunciaData.codigo_pais} ${denunciaData.numero_telefono}`
        : denunciaData.numero_telefono;

      items.push({
        label: "Número de Teléfono:",
        value: telefonoCompleto
      });
    }

    return items;
  };

  // ✅ FUNCIÓN GET ESTADO SERVICIO ACTUALIZADA
  const getEstadoServicio = () => {
    const items = [
      { label: "Servicio Requerido:", value: "Rocio y Exterminacion" }
    ];

    if (denunciaData?.fecha_programacion) {
      const fechaProgramacion = new Date(denunciaData.fecha_programacion);

      // 🆕 FORMATO COMPLETO CON FECHA Y HORA
      const fechaFormateada = fechaProgramacion.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      const horaFormateada = fechaProgramacion.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });

      items.push({
        label: "Programación:",
        value: `${fechaFormateada} - ${horaFormateada}`
      });
    } else {
      items.push({ label: "Programación:", value: "No programado" });
    }

    // 🆕 MEJORAR LOS TEXTOS DE ESTADO INCLUYENDO "reprogramada"
    const estadoTexto =
      denunciaData?.estado_denuncia === 'recibida' ? 'Sin revisar' :
        denunciaData?.estado_denuncia === 'programada' ? 'En proceso' :
          denunciaData?.estado_denuncia === 'reprogramada' ? 'En proceso reprogramado' : // 🆕 NUEVO ESTADO
            denunciaData?.estado_denuncia === 'realizada' ? 'Verificado' :
              denunciaData?.estado_denuncia === 'cancelada' ? 'Cancelada' : 'Pendiente';

    items.push({
      label: "Estado:",
      value: estadoTexto
    });

    return items;
  };

  // 🆕 COMPONENTE SERVICE CARD PERSONALIZADO CON FUNCIONALIDAD "VER MÁS"
  const CustomServiceCard = ({ title, items, className }) => {
    const handleVerMasClick = (descripcionCompleta) => {
      setDescripcionCompleta(descripcionCompleta);
      setShowDescripcionModal(true);
    };

    return (
      <div className={`service-card ${className || ''}`}>
        <h4>{title}</h4>
        <div className="card-items">
          {items.map((item, index) => (
            <div key={index} className="card-item">
              <label>{item.label}</label>
              <div className="card-value-container">
                <span className="card-value">{item.value}</span>
                {item.necesitaVerMas && (
                  <button
                    className="btn-ver-mas"
                    onClick={() => handleVerMasClick(item.descripcionCompleta)}
                  >
                    Ver más
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 🆕 MODAL PARA DESCRIPCIÓN COMPLETA
  const DescripcionModal = () => {
    if (!showDescripcionModal) return null;

    const handleCloseModal = () => {
      setShowDescripcionModal(false);
      setDescripcionCompleta("");
    };

    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
        handleCloseModal();
      }
    };

    return (
      <div className="modal-overlay" onClick={handleBackdropClick}>
        <div className="modal-content descripcion-modal">
          <div className="modal-header">
            <h3>Descripción Completa de la Denuncia</h3>
            <button className="modal-close" onClick={handleCloseModal}>
              <Icon icon="mdi:close" />
            </button>
          </div>
          <div className="modal-body">
            <div className="descripcion-completa">
              {descripcionCompleta}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-cerrar" onClick={handleCloseModal}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 🎠 CARRUSEL DE FOTOS - FUNCIONAL
  const ImageCarousel = () => {
    if (!denunciaData) {
      return (
        <div className="image-carousel">
          <div className="no-image">
            <img src="/src/assets/images/vinchuca.png" alt="Sin imagen" />
            <p>No hay datos de denuncia</p>
          </div>
        </div>
      );
    }

    const fotosVinchucas = denunciaData.fotos_vinchucas ?
      denunciaData.fotos_vinchucas.split(',').filter(foto => foto.trim()) : [];

    const fotoVivienda = denunciaData.foto_vivienda ? [denunciaData.foto_vivienda] : [];

    const todasLasFotos = [...fotoVivienda, ...fotosVinchucas];

    return (
      <div className="image-carousel">
        {todasLasFotos.length > 0 ? (
          <>
            <div className="carousel-image">
              <img
                src={`${baseUrl}/uploads/${todasLasFotos[currentImageIndex]}`}
                alt={`${currentImageIndex < fotoVivienda.length ? 'Vivienda' : 'Vinchucas'} ${currentImageIndex + 1}`}
                onError={(e) => {
                  e.target.src = '/src/assets/images/vinchuca.png';
                }}
              />
            </div>
            {todasLasFotos.length > 1 && (
              <>
                <button
                  className="carousel-btn prev"
                  onClick={handleImagePrev}
                >
                  ‹
                </button>
                <button
                  className="carousel-btn next"
                  onClick={handleImageNext}
                >
                  ›
                </button>
                <div className="carousel-indicators">
                  {todasLasFotos.map((_, index) => (
                    <span
                      key={index}
                      className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="no-image">
            <img src="/src/assets/images/vinchuca.png" alt="Sin imagen" />
            <p>No hay imágenes disponibles</p>
          </div>
        )}
      </div>
    );
  };

  // ✅ COMPONENTE MINIMAP AISLADO - SOLUCIÓN ROBUSTA
  const MiniMap = ({ lat, lng, text }) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);

    // Función para forzar ajuste (definida dentro o fuera, pero la pondré dentro del componente después)
    // Aquí el useEffect
    useEffect(() => {
      if (!mapContainerRef.current || !lat || !lng) return;

      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);

      if (isNaN(latNum) || isNaN(lngNum)) return;

      console.log("📍 MiniMap: Init", { latNum, lngNum });

      // Limpiar instancia previa
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      try {
        const map = L.map(mapContainerRef.current).setView([latNum, lngNum], 16);
        mapInstanceRef.current = map;

        // CARTO DB
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        const marker = L.marker([latNum, lngNum]).addTo(map);
        if (text) {
          marker.bindPopup(text).openPopup();
        }

        // CSS INLINE FORZADO
        const style = document.createElement('style');
        style.innerHTML = `
          .leaflet-tile { max-width: none !important; max-height: none !important; visibility: visible !important; }
          .leaflet-pane { z-index: 400; }
        `;
        mapContainerRef.current.appendChild(style);

        const resizeObserver = new ResizeObserver(() => {
          map.invalidateSize();
        });
        resizeObserver.observe(mapContainerRef.current);

        setTimeout(() => map.invalidateSize(), 200);
        setTimeout(() => map.invalidateSize(), 1000);

        return () => {
          resizeObserver.disconnect();
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
        };
      } catch (err) {
        console.error("❌ Error MiniMap:", err);
      }
    }, [lat, lng, text]);

    return (
      <div style={{ position: 'relative', width: '100%', height: '250px' }}>
        <div
          ref={mapContainerRef}
          style={{ width: '100%', height: '100%', zIndex: 1, background: '#f0f0f0' }}
          className="leaflet-map-container"
        />
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              console.log("🔄 Recarga manual solicitada");
              mapInstanceRef.current.invalidateSize();
              const ln = parseFloat(lat);
              const lg = parseFloat(lng);
              if (!isNaN(ln) && !isNaN(lg)) {
                mapInstanceRef.current.setView([ln, lg], 16);
              }
            }
          }}
          title="Recargar mapa si se ve gris"
          style={{
            position: 'absolute', top: '5px', right: '5px', zIndex: 401, // Mayor que leaflet pane
            background: 'white', border: '1px solid #999', padding: '4px 8px',
            borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          🔄
        </button>
      </div>
    );
  };

  // 🗺️ COMPONENTE MAPA - VISIBLE
  const LocationMapSection = () => {
    const hasCoords = viviendaData?.latitud && viviendaData?.longitud;
    const popupContent = `
      <div style="text-align: center;">
        <strong>📍 Ubicación</strong><br>
        <span style="font-size: 12px;">${viviendaData?.jefe_familia || ''}</span>
      </div>
    `;

    return (
      <div className="map-container">
        <div className="map-info">
          <div className="location-header">
            <span className="pin-icon">📍</span>
            <span>Ubicación Exacta de la Vivienda</span>
          </div>
          <div className="location-details">
            {locationInfo ? (
              <div className="location-detail">
                <strong>📍 Dirección completa:</strong>
                <p style={{ margin: '5px 0', fontSize: '13px', color: '#666' }}>{locationInfo.address}</p>
              </div>
            ) : (
              <div className="location-detail">
                <strong>📍 Dirección:</strong> {viviendaData?.direccion || 'Cargando...'}
              </div>
            )}
            {hasCoords && (
              <div className="location-detail">
                <strong>📌 Coordenadas:</strong> Lat: {viviendaData.latitud}, Lng: {viviendaData.longitud}
              </div>
            )}
          </div>
        </div>
        <div className="mini-map" style={{ minHeight: '250px' }}>
          {hasCoords ? (
            <MiniMap
              key={`${viviendaData.latitud}-${viviendaData.longitud}`}
              lat={viviendaData.latitud}
              lng={viviendaData.longitud}
              text={popupContent}
            />
          ) : (
            <div className="no-map"><p>No hay coordenadas</p></div>
          )}
        </div>
      </div>
    );
  };

  // 🆕 COMPONENTE PARA MOSTRAR INFORMACIÓN DE FILTRADO
  const renderFilterInfo = () => {
    if (userType === 'administrador') {
      return (
        <div className="filter-info admin-info">
          <Icon icon="mdi:shield-crown" className="info-icon" />
          <span>Administrador: Acceso completo a todos los municipios</span>
        </div>
      );
    }

    if (userType === 'tecnico' || userType === 'jefe_grupo') {
      if (municipios.length === 1) {
        return (
          <div className="filter-info restricted-info">
            <Icon icon="mdi:map-marker-check" className="info-icon" />
            <span>
              Acceso restringido al municipio: <strong>{municipios[0]?.nombre_municipio}</strong>
            </span>
          </div>
        );
      }

      if (municipios.length > 0) {
        return (
          <div className="filter-info restricted-info">
            <Icon icon="mdi:filter" className="info-icon" />
            <span>
              Acceso restringido a {municipios.length} municipio(s)
            </span>
          </div>
        );
      }

      if (municipios.length === 0) {
        return (
          <div className="filter-info no-access-info">
            <Icon icon="mdi:alert-circle" className="info-icon" />
            <span>No tiene municipios asignados. Contacte al administrador.</span>
          </div>
        );
      }
    }

    return null;
  };

  if (loading && viviendasList.length === 0) {
    return (
      <div className="home-container">
        <div className="loading-container">
          <Icon icon="eos-icons:loading" className="loading-icon" />
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error-container">
          <Icon icon="ion:alert-circle-outline" className="error-icon" />
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()} className="btn-retry">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Si no está autenticado
  if (!isAuthenticated) {
    return (
      <div className="home-container">
        <div className="error-container">
          <Icon icon="ion:alert-circle-outline" className="error-icon" />
          <p>Debe iniciar sesión para acceder a esta página</p>
          <button onClick={() => window.location.href = '/login'} className="btn-retry">
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container carga-rr1-container">
      <main className="home-main">
        <div className="home-title-container">
          <Icon icon="ci:menu-alt-03" className="menu-icon" />
          <h1 className="home-title">ROCIADO CRUD</h1>
          {denunciaId && (
            <div className="denuncia-info-badge">
              <Icon icon="mdi:alert-circle" className="badge-icon" />
              <span>Cargado desde Denuncia #{denunciaId}</span>
            </div>
          )}
          <button
            onClick={() => {
              // 🆕 Ir al principio antes de navegar
              window.scrollTo(0, 0);
              window.location.href = '/admin/rr1/crud';
            }}
            className="btn-ver-rr1"
          >
            Ver Todos los RR1
          </button>
        </div>

        {/* 🆕 INFO DE FILTRADO POR USUARIO */}
        {renderFilterInfo()}

        {/* FILTROS DE MUNICIPIO Y VIVIENDA */}
        <div className="filters-container">
          <div className="filter-group">
            <label htmlFor="municipio-select" className="filter-label">Municipio:</label>
            <select
              id="municipio-select"
              className="filter-input"
              value={selectedMunicipio}
              onChange={handleMunicipioChange}
              disabled={loading || municipios.length === 0}
            >
              <option value="">Seleccionar municipio</option>
              {municipios.map((m) => (
                <option key={m.municipio_id} value={m.municipio_id}>
                  {m.nombre_municipio}
                </option>
              ))}
            </select>
            {municipios.length === 0 && (
              <div className="no-data-info">
                <Icon icon="mdi:alert" />
                <span>No hay municipios disponibles para su usuario</span>
              </div>
            )}
          </div>

          <div className="filter-group">
            <label htmlFor="vivienda-select" className="filter-label">Vivienda:</label>
            <select
              id="vivienda-select"
              className="filter-input"
              value={viviendaId}
              onChange={handleViviendaChange}
              disabled={!selectedMunicipio || loading || viviendasList.length === 0}
            >
              <option value="">Seleccionar vivienda</option>
              {viviendasList.map((v) => (
                <option key={v.vivienda_id} value={v.vivienda_id}>
                  {v.numero_vivienda || 'N/A'} - {v.jefe_familia || 'N/A'}
                  {v.nombre_comunidad ? ` (${v.nombre_comunidad})` : ''}
                </option>
              ))}
            </select>
            {viviendasList.length === 0 && selectedMunicipio && (
              <div className="no-data-info">
                No hay viviendas registradas en este municipio
              </div>
            )}
          </div>
        </div>

        {viviendaData && (
          <div className="home-content">
            <div className="home-left">
              {/* 🆕 USAR CUSTOM SERVICE CARD EN LUGAR DE SERVICE CARD */}
              <CustomServiceCard
                title="Datos generales"
                items={getDatosGenerales()}
                className="service-card-general"
              />

              <ServiceCard
                title="Estado del Servicio"
                items={getEstadoServicio()}
                className="service-card-status"
              />
            </div>

            <div className="home-right">
              {/* 🎠 CARRUSEL FUNCIONAL */}
              <ImageCarousel />

              {/* 🗺️ MAPA VISIBLE */}
              <LocationMapSection />
            </div>
          </div>
        )}

        {/* 🔹 MOVER ACTION BUTTONS FUERA DEL home-content PARA QUE ESTÉN DEBAJO */}
        {viviendaData && (
          <div className="action-buttons-section">
            <ActionButtons
              viviendaId={viviendaId}
              denunciaData={denunciaData}
              viviendaData={viviendaData}
            />
          </div>
        )}

        {!viviendaData && !loading && selectedMunicipio && viviendasList.length > 0 && (
          <div className="no-data-message">
            <p>Selecciona una vivienda del listado para ver los detalles.</p>
          </div>
        )}

        {!selectedMunicipio && !loading && municipios.length > 0 && (
          <div className="no-data-message">
            <p>Selecciona un municipio para cargar las viviendas disponibles.</p>
          </div>
        )}

        {/* 🆕 AGREGAR EL MODAL DE DESCRIPCIÓN */}
        <DescripcionModal />
      </main>
    </div>
  );
}