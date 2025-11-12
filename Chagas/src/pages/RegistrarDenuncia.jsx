//pendiente ver
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { denunciasService } from '../services/denunciasService';
import { useAuth } from './AuthContext';
import '../css/RegistrarDenuncia.css';
import L from 'leaflet';

const RegistrarDenuncia = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    jefe_familia: '',
    numero_vivienda: '',
    comunidad: '',
    descripcion: '',
    fotos_vinchucas: '',
    latitud: -17.3938,
    longitud: -66.1570,
    altura: 2550,
    vivienda_id: ''
  });

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const successRef = useRef(null);
  const errorRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState({
    vivienda: null,
    vinchucas: []
  });

  const [imagePreviews, setImagePreviews] = useState({
    vivienda: null,
    vinchucas: []
  });

  const [showHelp, setShowHelp] = useState(false);

  // Limpiar URLs de preview cuando el componente se desmonte
  useEffect(() => {
    return () => {
      // Limpiar URLs de preview para evitar memory leaks
      Object.values(imagePreviews).forEach(url => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // Scroll hacia la alerta de éxito cuando aparezca
  useEffect(() => {
    if (success && successRef.current) {
      setTimeout(() => {
        successRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [success]);

  // Scroll hacia la alerta de error cuando aparezca
  useEffect(() => {
    if (error && errorRef.current) {
      setTimeout(() => {
        errorRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [error]);

  // Inicializar el mapa con Leaflet
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      // Crear el mapa
      mapInstance.current = L.map(mapRef.current).setView([-17.3938, -66.1570], 13);
      
      // Agregar capa de tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance.current);
      
      // Crear marcador inicial
      markerRef.current = L.marker([-17.3938, -66.1570]).addTo(mapInstance.current);
      
      // Evento de clic en el mapa
      mapInstance.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setFormData(prev => ({
          ...prev,
          latitud: lat.toFixed(4),
          longitud: lng.toFixed(4)
        }));
        
        // Mover marcador
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
      });
      
      // Evento de arrastrar marcador
      markerRef.current.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        setFormData(prev => ({
          ...prev,
          latitud: lat.toFixed(4),
          longitud: lng.toFixed(4)
        }));
      });
      
      setMapLoaded(true);
    }
    
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
        setMapLoaded(false);
      }
    };
  }, []);

  // Sincronizar marcador con coordenadas del formulario
  useEffect(() => {
    if (mapInstance.current && markerRef.current && mapLoaded) {
      const lat = parseFloat(formData.latitud);
      const lng = parseFloat(formData.longitud);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        markerRef.current.setLatLng([lat, lng]);
        mapInstance.current.setView([lat, lng], mapInstance.current.getZoom());
      }
    }
  }, [formData.latitud, formData.longitud, mapLoaded]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (type, e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
      if (type === 'vinchucas') {
        // Para vinchucas, permitir múltiples archivos
        const newFiles = [...selectedFiles.vinchucas, ...files];
        const newPreviews = [...imagePreviews.vinchucas, ...files.map(file => URL.createObjectURL(file))];
        
        setSelectedFiles(prev => ({
          ...prev,
          [type]: newFiles
        }));
        
        setImagePreviews(prev => ({
          ...prev,
          [type]: newPreviews
        }));
      } else {
        // Para vivienda, solo un archivo
        const file = files[0];
        const previewUrl = URL.createObjectURL(file);
        
        setSelectedFiles(prev => ({
          ...prev,
          [type]: file
        }));
        
        setImagePreviews(prev => ({
          ...prev,
          [type]: previewUrl
        }));
      }
    }
  };

  const removeVinchucaImage = (index) => {
    // Limpiar URL de preview
    URL.revokeObjectURL(imagePreviews.vinchucas[index]);
    
    // Remover archivo y preview
    const newFiles = selectedFiles.vinchucas.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.vinchucas.filter((_, i) => i !== index);
    
    setSelectedFiles(prev => ({
      ...prev,
      vinchucas: newFiles
    }));
    
    setImagePreviews(prev => ({
      ...prev,
      vinchucas: newPreviews
    }));
  };

  const useMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(4);
          const lng = position.coords.longitude.toFixed(4);
          
          setFormData(prev => ({
            ...prev,
            latitud: lat,
            longitud: lng
          }));
          
          if (mapInstance.current) {
            mapInstance.current.setView([lat, lng], 18);
          }
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          setError('No se pudo obtener tu ubicación');
        }
      );
    } else {
      setError('Geolocalización no soportada por este navegador');
    }
  };

  const centerMap = () => {
    if (mapInstance.current) {
      const lat = parseFloat(formData.latitud);
      const lng = parseFloat(formData.longitud);
      mapInstance.current.setView([lat, lng], 18);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Verificar si el usuario está autenticado
    if (!usuario || !usuario.usuario_id) {
      setError('Debes iniciar sesión para registrar una denuncia');
      setLoading(false);
      return;
    }
    
    // Verificar que se haya proporcionado una descripción
    if (!formData.descripcion || formData.descripcion.trim() === '') {
      setError('La descripción del hallazgo es obligatoria');
      setLoading(false);
      return;
    }

    try {
      // Preparar FormData para envío de archivos
      const formDataToSend = new FormData();
      
      // Agregar datos de texto
      formDataToSend.append('jefe_familia', formData.jefe_familia);
      formDataToSend.append('numero_vivienda', formData.numero_vivienda);
      formDataToSend.append('comunidad', formData.comunidad);
      formDataToSend.append('descripcion', formData.descripcion);
      formDataToSend.append('usuario_id', usuario?.usuario_id || null);
      formDataToSend.append('vivienda_id', formData.vivienda_id ? parseInt(formData.vivienda_id) : null);
      formDataToSend.append('latitud', formData.latitud);
      formDataToSend.append('longitud', formData.longitud);
      formDataToSend.append('altura', formData.altura);
      formDataToSend.append('fecha_denuncia', new Date().toLocaleString('sv-SE', { timeZone: 'America/La_Paz' }).replace(' ', ' '));
      formDataToSend.append('estado_denuncia', 'recibida');
      
      // Agregar archivos
      if (selectedFiles.vivienda) {
        formDataToSend.append('foto_vivienda', selectedFiles.vivienda);
      }
      
      selectedFiles.vinchucas.forEach(file => {
        formDataToSend.append('fotos_vinchucas', file);
      });

      console.log('Enviando denuncia con archivos:');
      console.log('Archivo de vivienda:', selectedFiles.vivienda);
      console.log('Archivos de vinchucas:', selectedFiles.vinchucas);
      
      await denunciasService.createDenuncia(formDataToSend);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/denuncia');
      }, 2000);

    } catch (err) {
      console.error('Error al registrar denuncia:', err);
      setError(err.message || 'Error al registrar la denuncia. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    // Limpiar URLs de preview existentes
    if (imagePreviews.vivienda) {
      URL.revokeObjectURL(imagePreviews.vivienda);
    }
    imagePreviews.vinchucas.forEach(url => {
      URL.revokeObjectURL(url);
    });
    
    setFormData({
      jefe_familia: '',
      numero_vivienda: '',
      comunidad: '',
      descripcion: '',
      fotos_vinchucas: '',
      latitud: -17.3938,
      longitud: -66.1570,
      altura: 2550,
      vivienda_id: ''
    });
    setSelectedFiles({
      vivienda: null,
      vinchucas: []
    });
    setImagePreviews({
      vivienda: null,
      vinchucas: []
    });
    setError(null);
    setSuccess(false);
  };

  if (success) {
    return (
      <div className="registrar-denuncia-container">
        <div ref={successRef} className="success-message">
          <h2>✅ Denuncia Registrada Exitosamente</h2>
          <p>La denuncia ha sido registrada correctamente.</p>
          <p>Redirigiendo a la lista de denuncias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="registrar-denuncia-container">
      <div className="registrar-denuncia-header">
        <h1>REGISTRAR DENUNCIA</h1>
        <button 
          className="help-button-header" 
          title="Ayuda"
          onClick={() => setShowHelp(!showHelp)}
        >
          ?
        </button>
      </div>

      <div className="registrar-denuncia-form">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="jefe_familia">Jefe de Familia</label>
              <input
                type="text"
                id="jefe_familia"
                name="jefe_familia"
                value={formData.jefe_familia}
                onChange={handleInputChange}
                placeholder="Nombre y apellido"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="numero_vivienda">N° de vivienda</label>
              <input
                type="text"
                id="numero_vivienda"
                name="numero_vivienda"
                value={formData.numero_vivienda}
                onChange={handleInputChange}
                placeholder="Ej..123"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="comunidad">Comunidad</label>
              <input
                type="text"
                id="comunidad"
                name="comunidad"
                value={formData.comunidad}
                onChange={handleInputChange}
                placeholder="Ej..Villa Granado"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Foto de la vivienda (exterior)</label>
              <div className="file-upload">
                <input
                  type="file"
                  id="foto_vivienda"
                  accept="image/*"
                  onChange={(e) => handleFileChange('vivienda', e)}
                  style={{ display: 'none' }}
                />
                <label htmlFor="foto_vivienda" className="file-upload-button">
                  Seleccionar archivo
                </label>
                <span className="file-name">
                  {selectedFiles.vivienda ? selectedFiles.vivienda.name : 'Ningún archivo seleccionado'}
                </span>
                
                {/* Preview de imagen de vivienda */}
                {imagePreviews.vivienda && (
                  <div className="image-preview-container">
                    <h4>Vista previa:</h4>
                    <div className="image-preview">
                      <img 
                        src={imagePreviews.vivienda} 
                        alt="Preview vivienda" 
                        className="preview-image"
                      />
                      <button 
                        type="button" 
                        className="remove-image-btn"
                        onClick={() => {
                          setSelectedFiles(prev => ({ ...prev, vivienda: null }));
                          setImagePreviews(prev => ({ ...prev, vivienda: null }));
                          URL.revokeObjectURL(imagePreviews.vivienda);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Fotos de la vinchucas</label>
              <div className="file-upload">
                <input
                  type="file"
                  id="fotos_vinchucas"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileChange('vinchucas', e)}
                  style={{ display: 'none' }}
                />
                <label htmlFor="fotos_vinchucas" className="file-upload-button">
                  Seleccionar archivos
                </label>
                <span className="file-name">
                  {selectedFiles.vinchucas.length > 0 
                    ? `${selectedFiles.vinchucas.length} archivo(s) seleccionado(s)` 
                    : 'Ningún archivo seleccionado'}
                </span>
                
                {/* Preview de imágenes de vinchucas */}
                {imagePreviews.vinchucas.length > 0 && (
                  <div className="image-preview-container">
                    <h4>Vista previa ({imagePreviews.vinchucas.length} imagen{imagePreviews.vinchucas.length > 1 ? 'es' : ''}):</h4>
                    <div className="vinchucas-gallery">
                      {imagePreviews.vinchucas.map((preview, index) => (
                        <div key={index} className="image-preview">
                          <img 
                            src={preview} 
                            alt={`Preview vinchucas ${index + 1}`} 
                            className="preview-image"
                          />
                          <button 
                            type="button" 
                            className="remove-image-btn"
                            onClick={() => removeVinchucaImage(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="descripcion">Descripción del hallazgo *</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Describe el hallazgo, ambientes afectados, horarios, etc"
              rows="4"
              required
            />
          </div>

          <div className="map-section">
            <h3>Ubicación en el mapa</h3>
            <div className="map-controls">
              <button 
                type="button" 
                className="map-button" 
                onClick={useMyLocation}
                disabled={loading}
              >
                {loading ? '⏳ Obteniendo...' : '📍 Usar mi ubicación'}
              </button>
              <button type="button" className="map-button" onClick={centerMap}>
                🎯 Centrar Mapa
              </button>
            </div>
            
            <div className="map-container">
              <div 
                ref={mapRef}
                style={{ 
                  width: '100%', 
                  height: '300px',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              />
            </div>
            
            <div className="coordinates">
              <div className="coordinate-item">
                <label>Latitud:</label>
                <span>{formData.latitud}</span>
              </div>
              <div className="coordinate-item">
                <label>Longitud:</label>
                <span>{formData.longitud}</span>
              </div>
              <div className="coordinate-item">
                <label>Altura:</label>
                <span>{formData.altura} m</span>
              </div>
            </div>
            
          </div>

          {error && (
            <div ref={errorRef} className="error-message">
              <p>❌ {error}</p>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-clear" 
              onClick={handleClear}
              disabled={loading}
            >
              Limpiar
            </button>
            <button 
              type="submit" 
              className="btn-submit" 
              disabled={loading}
            >
              {loading ? '⏳ Enviando...' : '📤 Enviar Denuncia'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Ayuda */}
      {showHelp && (
        <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="help-modal-header">
              <h2>Ayuda para llenar la denuncia</h2>
              <button 
                className="close-help-button" 
                onClick={() => setShowHelp(false)}
              >
                ×
              </button>
            </div>
            <div className="help-modal-body">
              <ol>
                <li><strong>Jefe de familia:</strong> escribe el nombre completo.</li>
                <li><strong>Nº de vivienda:</strong> coloca el número asignado en tu comunidad.</li>
                <li><strong>Fotos:</strong> sube 1 foto de la fachada de la vivienda y fotos claras de las vinchucas encontradas.</li>
                <li><strong>Descripción:</strong> explica dónde las viste (habitaciones, corrales, etc.).</li>
                <li><strong>Mapa:</strong> arrastra el pin a la ubicación más cercana posible de tu casa.</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrarDenuncia;