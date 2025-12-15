import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { denunciasService } from '../services/denunciasService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/DetallesDenuncia.css';
import { baseUrl } from "../api/BaseUrl"; 

const DetallesDenuncia = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [denuncia, setDenuncia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locationInfo, setLocationInfo] = useState(null);
  
  // Referencias para el mapa
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const cargarDenuncia = async () => {
      try {
        setLoading(true);
        
        let denunciaEncontrada;
        
        // Obtener información del usuario
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Roles que pueden ver cualquier denuncia
        const rolesConAccesoTotal = ['jefe_grupo', 'administrador', 'tecnico'];
        
        if (userInfo && userInfo.rol && rolesConAccesoTotal.includes(userInfo.rol)) {
          // Si tiene rol especial, cargar cualquier denuncia directamente
          console.log(`🎯 Usuario con rol ${userInfo.rol} - Cargando cualquier denuncia`);
          denunciaEncontrada = await denunciasService.getDenunciaById(parseInt(id));
        } else {
          // Para usuarios normales, usar la lógica original (solo sus denuncias)
          try {
            const denuncias = await denunciasService.getDenunciasByUser();
            denunciaEncontrada = denuncias.find(d => d.id === parseInt(id));
          } catch (authError) {
            console.log('No autenticado, intentando cargar denuncia pública...');
            denunciaEncontrada = await denunciasService.getDenunciaById(parseInt(id));
          }
        }
        
        if (denunciaEncontrada) {
          setDenuncia(denunciaEncontrada);
        } else {
          setError('Denuncia no encontrada');
        }
      } catch (err) {
        console.error('Error al cargar la denuncia:', err);
        setError('Error al cargar la denuncia: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      cargarDenuncia();
    }
  }, [id]);

  // Inicializar el mapa cuando se cargan los datos de la denuncia
  useEffect(() => {
    if (denuncia && denuncia.latitud && denuncia.longitud && mapRef.current && !mapInstance.current) {
      const lat = parseFloat(denuncia.latitud);
      const lng = parseFloat(denuncia.longitud);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // Crear el mapa centrado en las coordenadas de la denuncia
        mapInstance.current = L.map(mapRef.current).setView([lat, lng], 15);
        
        // Agregar capa de tiles (igual que en RegistrarDenuncia)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance.current);
        
        // Crear marcador en la ubicación de la denuncia (igual que en RegistrarDenuncia)
        markerRef.current = L.marker([lat, lng]).addTo(mapInstance.current);
        
        // Agregar popup al marcador
        markerRef.current.bindPopup(`
          <div style="text-align: center; padding: 5px;">
            <strong style="color: #dc2626;">📍 Ubicación de la Denuncia</strong><br>
            <small>${denuncia.jefe_familia || 'N/A'} - ${denuncia.numero_vivienda || 'N/A'}</small>
          </div>
        `).openPopup();
        
        // Obtener información detallada de la ubicación
        getLocationDetails(lat, lng);
        
        setMapLoaded(true);
      }
    }
    
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
        setMapLoaded(false);
      }
    };
  }, [denuncia]);

  // Función para obtener información detallada de la ubicación
  const getLocationDetails = async (lat, lng) => {
    try {
      // Usar Nominatim (OpenStreetMap) para geocodificación inversa
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
      console.error('Error obteniendo información de ubicación:', error);
    }
  };

  const handleImageNext = () => {
    const todasLasFotos = [...fotoVivienda, ...fotosVinchucas];
    if (todasLasFotos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % todasLasFotos.length);
    }
  };

  const handleImagePrev = () => {
    const todasLasFotos = [...fotoVivienda, ...fotosVinchucas];
    if (todasLasFotos.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + todasLasFotos.length) % todasLasFotos.length);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'recibida': return '#dc3545';
      case 'programada': return '#fd7e14';
      case 'realizada': return '#28a745';
      case 'cancelada': return '#000000';
      case 'reprogramada': return '#ffc107'; // Color amarillo para reprogramada
      default: return '#6c757d';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'recibida': return 'Sin revisar';
      case 'programada': return 'En proceso';
      case 'realizada': return 'Verificado';
      case 'cancelada': return 'Cancelada';
      case 'reprogramada': return 'Reprogramada';
      default: return estado;
    }
  };

  if (loading) {
    return (
      <div className="detalles-denuncia-container">
        <div className="loading-message">
          <p>Cargando detalles de la denuncia...</p>
        </div>
      </div>
    );
  }

  if (error || !denuncia) {
    return (
      <div className="detalles-denuncia-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error || 'Denuncia no encontrada'}</p>
          <button onClick={() => navigate('/denuncia')} className="btn-back">
            Volver a Denuncias
          </button>
        </div>
      </div>
    );
  }

  const fotosVinchucas = denuncia.fotos_vinchucas ? 
    denuncia.fotos_vinchucas.split(',').filter(foto => foto.trim()) : [];
  
  const fotoVivienda = denuncia.foto_vivienda ? [denuncia.foto_vivienda] : [];

  return (
    <div className="detalles-denuncia-container">
      {/* Header similar a Denuncias */}
      <div className="detalles-header">
        <div>
          <h1>INFORMACIÓN CASA</h1>
        </div>
        <div className="header-actions">
          <button 
            className="btn-back"
            onClick={() => navigate('/denuncia')}
          >
            ← Volver a Denuncias
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="detalles-main">
        {/* Left Section - Information Panels */}
        <div className="detalles-left">
          {/* Datos Generales Panel */}
          <div className="info-panel datos-generales">
            <h3>Datos generales</h3>
            <div className="info-item">
              <strong>Nombre del jefe de familia:</strong> {denuncia.jefe_familia || 'No especificado'}
            </div>
            <div className="info-item">
              <strong>N° de vivienda:</strong> {denuncia.numero_vivienda || 'No especificado'}
            </div>
            <div className="info-item">
              <strong>Municipio:</strong> {denuncia.nombre_municipio || 'No especificado'}
            </div>
            {denuncia.nombre_comunidad && (
              <div className="info-item">
                <strong>Comunidad:</strong> {denuncia.nombre_comunidad}
              </div>
            )}
            <div className="info-item">
              <strong>Descripción:</strong> {denuncia.descripcion || 'Sin descripción'}
            </div>
          </div>

          {/* Estado del Servicio Panel */}
          <div className="info-panel estado-servicio">
            <h3>Estado del Servicio</h3>
            <div className="info-item">
              <strong>Servicio Requerido:</strong> Rocío y Exterminación
            </div>
            <div className="info-item">
              <strong>Fecha de Denuncia:</strong> {new Date(denuncia.fecha_denuncia).toLocaleDateString('es-ES')}
            </div>
            {denuncia.fecha_programacion && (
              <div className="info-item">
                <strong>Programación:</strong> {new Date(denuncia.fecha_programacion).toLocaleDateString('es-ES')}
              </div>
            )}
            {denuncia.fecha_ejecucion && (
              <div className="info-item">
                <strong>Ejecución:</strong> {new Date(denuncia.fecha_ejecucion).toLocaleDateString('es-ES')}
              </div>
            )}
            <div className="info-item">
              <strong>Estado:</strong> 
              <span 
                className="estado-badge" 
                style={{ backgroundColor: getEstadoColor(denuncia.estado_denuncia) }}
              >
                {getEstadoTexto(denuncia.estado_denuncia)}
              </span>
            </div>

            {/* 🆕 MOSTRAR MOTIVO DE REPROGRAMACIÓN SOLO SI EL ESTADO ES "reprogramada" */}
            {denuncia.estado_denuncia === 'reprogramada' && denuncia.motivo_reprogramacion && (
              <div className="info-item motivo-reprogramacion">
                <strong>Motivo de Reprogramación:</strong> 
                <div className="motivo-texto">
                  {denuncia.motivo_reprogramacion}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Visuals */}
        <div className="detalles-right">
          {/* Image Carousel */}
          <div className="image-carousel">
            {(() => {
              const todasLasFotos = [...fotoVivienda, ...fotosVinchucas];
              return todasLasFotos.length > 0 ? (
                <>
                  <div className="carousel-image">
                    <img 
                      src={`${baseUrl}/uploads/${todasLasFotos[currentImageIndex]}`} 
                      alt={`${currentImageIndex < fotoVivienda.length ? 'Exterior' : 'Vinchucas'} ${currentImageIndex + 1}`}
                      onError={(e) => {
                        console.log('Error cargando imagen:', todasLasFotos[currentImageIndex]);
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
                    </>
                  )}
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
              ) : (
                <div className="no-image">
                  <img src="/src/assets/images/vinchuca.png" alt="Sin imagen" />
                  <p>No hay imágenes disponibles</p>
                </div>
              );
            })()}
          </div>

          {/* Map */}
          <div className="map-container">
            <div className="map-info">
              <div className="location-header">
                <span className="pin-icon">📍</span>
                <span>Ubicación de la Denuncia</span>
              </div>
              <div className="location-details">
                {locationInfo ? (
                  <div className="location-detail">
                    <strong>📍 Dirección completa:</strong>
                    <p style={{ margin: '5px 0', fontSize: '13px', color: '#666' }}>
                      {locationInfo.address}
                    </p>
                  </div>
                ) : (
                  <div className="location-detail">
                    <strong>📍 Dirección:</strong> {denuncia.direccion || 'Cargando información de ubicación...'}
                  </div>
                )}
              </div>
            </div>
            <div className="mini-map">
              {denuncia.latitud && denuncia.longitud ? (
                <div 
                  ref={mapRef}
                  style={{ 
                    width: '100%', 
                    height: '200px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
              ) : (
                <div className="no-map">
                  <span className="map-icon">🗺️</span>
                  <p>No hay coordenadas disponibles</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetallesDenuncia;