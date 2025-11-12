import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { denunciasService } from '../services/denunciasService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/Mapas.css';
import municipiosData from '../data/municipiosCochabamba.json';

// Configurar iconos por defecto de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const Mapas = () => {
  const navigate = useNavigate();
  const [denuncias, setDenuncias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState('todos');
  const [showLegend] = useState(true);
  const [showMunicipios, setShowMunicipios] = useState(true);
  
  // Referencias para el mapa
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const municipiosLayerRef = useRef(null);

  // Colores de estado (igual que en Denuncias.jsx)
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'recibida': return '#dc3545'; // Rojo
      case 'programada': return '#fd7e14'; // Naranja
      case 'realizada': return '#28a745'; // Verde
      case 'cancelada': return '#000000'; // Negro
      default: return '#6c757d'; // Gris
    }
  };

  const getEstadoText = (estado) => {
    switch (estado) {
      case 'recibida': return 'Sin revisar';
      case 'programada': return 'En proceso';
      case 'realizada': return 'Verificado';
      case 'cancelada': return 'Cancelada';
      default: return estado;
    }
  };

  // Función para agregar la capa de municipios
  const addMunicipiosLayer = () => {
    if (!mapInstance.current || !showMunicipios) return;

    // Remover capa anterior si existe
    if (municipiosLayerRef.current) {
      mapInstance.current.removeLayer(municipiosLayerRef.current);
    }

    // Crear capa GeoJSON para municipios
    municipiosLayerRef.current = L.geoJSON(municipiosData, {
      style: (feature) => ({
        color: getMunicipioBorderColor(feature.properties.municipio_id),
        weight: 2,
        fillColor: getMunicipioColor(feature.properties.municipio_id),
        fillOpacity: 0.15,
        opacity: 1,
        dashArray: '10, 5', // Borde punteado
        lineCap: 'round',
        lineJoin: 'round'
      }),
      onEachFeature: (feature, layer) => {
        // Agregar popup con información del municipio
        const props = feature.properties;
        // Función para obtener la provincia según el municipio
        const getProvincia = (municipioId) => {
          const provincias = {
            1: 'Quillacollo',    // Tiquipaya
            2: 'Quillacollo',    // Quillacollo
            3: 'Cercado',        // Cochabamba
            4: 'Quillacollo',    // Colcapirhua
            5: 'Chapare'         // Sacaba
          };
          return provincias[municipioId] || 'No especificada';
        };

        layer.bindPopup(`
          <div style="font-family: Arial, sans-serif; padding: 10px; min-width: 200px;">
            <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px; border-bottom: 2px solid ${getMunicipioColor(props.municipio_id)}; padding-bottom: 5px;">
              🏛️ ${props.nombre}
            </h4>
            <p style="margin: 6px 0; font-size: 13px; color: #34495e;">
              <strong>Departamento:</strong> ${props.departamento}
            </p>
            <p style="margin: 6px 0; font-size: 13px; color: #34495e;">
              <strong>Provincia:</strong> ${getProvincia(props.municipio_id)}
            </p>
          </div>
        `);

        // Agregar hover effect mejorado
        layer.on('mouseover', function(e) {
          this.setStyle({
            weight: 3,
            opacity: 1,
            fillOpacity: 0.25,
            dashArray: '15, 8' // Puntos más grandes al hacer hover
          });
        });

        layer.on('mouseout', function(e) {
          this.setStyle({
            weight: 2,
            opacity: 1,
            fillOpacity: 0.15,
            dashArray: '10, 5'
          });
        });
      }
    }).addTo(mapInstance.current);

  };

  // Función para obtener color del municipio (colores atractivos y distintos)
  const getMunicipioColor = (municipioId) => {
    const colors = [
      '#FF6B6B', // Rojo coral vibrante
      '#4ECDC4', // Turquesa moderno
      '#45B7D1', // Azul cielo profundo
      '#96CEB4', // Verde menta suave
      '#FFEAA7', // Amarillo dorado
      '#DDA0DD', // Púrpura lavanda
      '#FFB347', // Naranja melocotón
      '#98D8C8'  // Verde agua
    ];
    return colors[(municipioId - 1) % colors.length];
  };

  // Función para obtener color del borde (más oscuro que el relleno)
  const getMunicipioBorderColor = (municipioId) => {
    const borderColors = [
      '#E74C3C', // Rojo más oscuro
      '#16A085', // Verde esmeralda oscuro
      '#2980B9', // Azul oscuro
      '#27AE60', // Verde oscuro
      '#F39C12', // Naranja oscuro
      '#8E44AD', // Púrpura oscuro
      '#E67E22', // Naranja oscuro
      '#1ABC9C'  // Turquesa oscuro
    ];
    return borderColors[(municipioId - 1) % borderColors.length];
  };


  // Cargar denuncias al montar el componente
  useEffect(() => {
    loadDenuncias();
  }, []);

  const loadDenuncias = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await denunciasService.getDenuncias();
      setDenuncias(data || []);
    } catch (err) {
      console.error('Error al cargar denuncias:', err);
      setError('Error al cargar las denuncias para el mapa');
    } finally {
      setLoading(false);
    }
  };

  // Inicializar el mapa automáticamente
  useEffect(() => {
    const initializeMap = () => {
      // Limpiar instancia anterior si existe
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markersRef.current = [];
        municipiosLayerRef.current = null;
        setMapLoaded(false);
      }

      // Esperar un poco más para asegurar que el DOM esté listo
      setTimeout(() => {
        if (mapRef.current && !mapInstance.current) {
          const defaultLat = -17.3938;
          const defaultLng = -66.1570;
          
          try {
            // Crear el mapa centrado en Cochabamba
            mapInstance.current = L.map(mapRef.current).setView([defaultLat, defaultLng], 10);
            
            // Agregar capa de tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(mapInstance.current);
            
            // Agregar capa de municipios
            addMunicipiosLayer();
            
            setMapLoaded(true);
            
            // Forzar redimensionamiento del mapa después de un pequeño delay
            setTimeout(() => {
              if (mapInstance.current) {
                mapInstance.current.invalidateSize();
              }
            }, 200);
          } catch (error) {
            console.error('Error al inicializar el mapa:', error);
            setMapLoaded(false);
          }
        }
      }, 100);
    };

    // Inicializar automáticamente al cargar con un delay mayor
    const timer = setTimeout(initializeMap, 1000);
    
    return () => {
      clearTimeout(timer);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markersRef.current = [];
        municipiosLayerRef.current = null;
        setMapLoaded(false);
      }
    };
  }, []);

  // Actualizar marcadores cuando cambien las denuncias o el filtro
  useEffect(() => {
    if (mapInstance.current && mapLoaded) {
      
      // Limpiar marcadores existentes
      markersRef.current.forEach(marker => {
        mapInstance.current.removeLayer(marker);
      });
      markersRef.current = [];

      // Filtrar denuncias según el estado seleccionado (excluir canceladas)
      const denunciasSinCanceladas = denuncias.filter(d => d.estado_denuncia !== 'cancelada');
      const denunciasFiltradas = selectedEstado === 'todos' 
        ? denunciasSinCanceladas 
        : denunciasSinCanceladas.filter(d => d.estado_denuncia === selectedEstado);


      // Agregar marcadores para cada denuncia
      denunciasFiltradas.forEach((denuncia, index) => {
        if (denuncia.latitud && denuncia.longitud) {
          const lat = parseFloat(denuncia.latitud);
          const lng = parseFloat(denuncia.longitud);
          
          
          if (!isNaN(lat) && !isNaN(lng)) {
            // Crear círculo marcador con el color del estado
            const estadoColor = getEstadoColor(denuncia.estado_denuncia);
            const marker = L.circleMarker([lat, lng], {
              radius: 5,
              color: estadoColor,
              weight: 1,
              fillOpacity: 0.9
            }).addTo(mapInstance.current);

            // Agregar popup al marcador
            marker.bindPopup(`
              <div style="text-align: left; min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: #333;">📍 Denuncia #${denuncia.id || denuncia.denuncia_id}</h4>
                <p style="margin: 4px 0;"><strong>Vivienda:</strong> ${denuncia.numero_vivienda || 'N/A'}</p>
                <p style="margin: 4px 0;"><strong>Jefe de Familia:</strong> ${denuncia.jefe_familia || 'N/A'}</p>
                <p style="margin: 4px 0;"><strong>Estado:</strong> 
                  <span style="color: ${estadoColor}; font-weight: bold;">
                    ${getEstadoText(denuncia.estado_denuncia)}
                  </span>
                </p>
                <p style="margin: 4px 0;"><strong>Fecha:</strong> ${formatFecha(denuncia.fecha_denuncia)}</p>
                <p style="margin: 4px 0;"><strong>Descripción:</strong> ${denuncia.descripcion ? 
                  (denuncia.descripcion.length > 100 ? 
                    denuncia.descripcion.substring(0, 100) + '...' : 
                    denuncia.descripcion) : 'Sin descripción'}</p>
                <button onclick="window.open('/detalles-denuncia/${denuncia.id || denuncia.denuncia_id}', '_blank')" 
                        style="
                          background-color: #007bff;
                          color: white;
                          border: none;
                          padding: 6px 12px;
                          border-radius: 4px;
                          cursor: pointer;
                          margin-top: 8px;
                          font-size: 12px;
                        ">
                  Ver Detalles
                </button>
              </div>
            `);

            markersRef.current.push(marker);
          }
        }
      });

      // Solo ajustar la vista si hay marcadores y no es la carga inicial
      if (denunciasFiltradas.length > 0 && markersRef.current.length > 0) {
        // Verificar si el mapa está en la posición inicial de Cochabamba
        const currentCenter = mapInstance.current.getCenter();
        const cochabambaLat = -17.3938;
        const cochabambaLng = -66.1570;
        const isAtInitialPosition = Math.abs(currentCenter.lat - cochabambaLat) < 0.1 && 
                                   Math.abs(currentCenter.lng - cochabambaLng) < 0.1;
        
        // Solo ajustar si no está en la posición inicial
        if (!isAtInitialPosition) {
          const group = new L.featureGroup(markersRef.current);
          mapInstance.current.fitBounds(group.getBounds().pad(0.1));
        }
      } else if (denunciasFiltradas.length === 0) {
        // Si no hay denuncias, centrar en Cochabamba
        mapInstance.current.setView([-17.3938, -66.1570], 10);
      }
    }
  }, [denuncias, selectedEstado, mapLoaded]);

  // Efecto para manejar el toggle de municipios
  useEffect(() => {
    if (mapInstance.current && mapLoaded) {
      if (showMunicipios) {
        addMunicipiosLayer();
      } else {
        if (municipiosLayerRef.current) {
          mapInstance.current.removeLayer(municipiosLayerRef.current);
          municipiosLayerRef.current = null;
        }
      }
    }
  }, [showMunicipios, mapLoaded]);

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      return new Date(fecha).toLocaleDateString('es-BO');
    } catch {
      return fecha;
    }
  };

  const handleEstadoChange = (estado) => {
    setSelectedEstado(estado);
  };

  const centerMapOnCochabamba = () => {
    if (mapInstance.current) {
      mapInstance.current.setView([-17.3938, -66.1570], 10);
    }
  };


  if (loading) {
    return (
      <div className="mapas-container">
        <div className="loading">Cargando mapa de denuncias...</div>
      </div>
    );
  }

  return (
    <div className="mapas-container">
      <div className="mapas-header">
        <div>
          <h1>MAPA DE DENUNCIAS</h1>
          <p>Visualización geográfica de denuncias por estado</p>
        </div>
      </div>

      {error && (
        <div className="error">
          {error}
          <button 
            onClick={loadDenuncias} 
            className="btn-retry"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="mapas-filters">
        <div className="filter-group">
          <label htmlFor="estado-filter">Filtrar por Estado:</label>
          <select 
            id="estado-filter"
            value={selectedEstado} 
            onChange={(e) => handleEstadoChange(e.target.value)}
            className="estado-filter"
          >
            <option value="todos">Todos los Estados</option>
            <option value="recibida">Sin Revisar</option>
            <option value="programada">En Proceso</option>
            <option value="realizada">Verificado</option>
          </select>
        </div>
        <div className="filter-info">
          <span>Mostrando: {selectedEstado === 'todos' ? 
            denuncias.filter(d => d.estado_denuncia !== 'cancelada').length : 
            denuncias.filter(d => d.estado_denuncia === selectedEstado).length} denuncias</span>
        </div>
      </div>

      <div className="mapas-content">
        {showLegend && (
          <div className="mapas-legend">
            <h3>Leyenda de Estados</h3>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#dc3545' }}></span>
                <span>Sin Revisar</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#fd7e14' }}></span>
                <span>En Proceso</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#28a745' }}></span>
                <span>Verificado</span>
              </div>
            </div>
            
            {/* Controles del mapa debajo de la leyenda */}
            <div className="mapas-controls">
              <button 
                className="btn-center-map"
                onClick={centerMapOnCochabamba}
                title="Centrar en Cochabamba"
              >
                🎯 Centrar Mapa
              </button>
              <button 
                className="btn-toggle-municipios"
                onClick={() => setShowMunicipios(!showMunicipios)}
                title="Mostrar/Ocultar Municipios"
              >
                {showMunicipios ? '🗺️' : '🗺️'} Municipios
              </button>
            </div>
          </div>
        )}

        <div className="mapas-map-container">
          {!mapLoaded && (
            <div className="map-loading">
              <div className="loading-spinner"></div>
              <p>Cargando mapa...</p>
            </div>
          )}
          <div 
            ref={mapRef} 
            className="mapas-map"
            style={{ 
              height: '600px', 
              width: '100%',
              display: mapLoaded ? 'block' : 'none'
            }}
          ></div>
        </div>
      </div>

      <div className="mapas-info">
        <p>
          <strong>Instrucciones:</strong> Haz clic en los marcadores para ver detalles de cada denuncia. 
          Usa los filtros para mostrar solo denuncias de un estado específico.
        </p>
      </div>
    </div>
  );
};

export default Mapas;
