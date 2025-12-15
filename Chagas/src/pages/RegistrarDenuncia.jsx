import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { denunciasService } from '../services/denunciasService';
import { useAuth } from './AuthContext';
import generalService from '../services/generalService';
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
    municipio_id: '',
    comunidad_id: '',
    direccion: '',
    descripcion: '',
    fotos_vinchucas: '',
    latitud: -17.3938,
    longitud: -66.1570,
    altura: 2550,
    vivienda_id: '',
    codigo_pais: '+591',
    numero_telefono: ''
  });

  const [municipios, setMunicipios] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(true);
  const [loadingComunidades, setLoadingComunidades] = useState(false);

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

  const MAX_VINCHUCAS_FOTOS = 4;
  const MAX_VIVIENDA_FOTOS = 1;

  useEffect(() => {
    return () => {
      Object.values(imagePreviews).forEach(url => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

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

  useEffect(() => {
    const loadMunicipios = async () => {
      try {
        setLoadingMunicipios(true);
        const data = await generalService.getMunicipios();
        setMunicipios(data || []);
      } catch (err) {
        console.error('Error al cargar municipios:', err);
        setError('Error al cargar la lista de municipios');
      } finally {
        setLoadingMunicipios(false);
      }
    };
    loadMunicipios();
  }, []);

  useEffect(() => {
    const loadComunidades = async () => {
      if (formData.municipio_id) {
        try {
          setLoadingComunidades(true);
          const data = await generalService.getComunidadesByMunicipio(formData.municipio_id);
          setComunidades(data || []);
          
          setFormData(prev => ({
            ...prev,
            comunidad_id: ''
          }));
        } catch (err) {
          console.error('Error al cargar comunidades:', err);
          setError('Error al cargar la lista de comunidades');
          setComunidades([]);
        } finally {
          setLoadingComunidades(false);
        }
      } else {
        setComunidades([]);
        setFormData(prev => ({
          ...prev,
          comunidad_id: ''
        }));
      }
    };

    loadComunidades();
  }, [formData.municipio_id]);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([-17.3938, -66.1570], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance.current);
      
      markerRef.current = L.marker([-17.3938, -66.1570]).addTo(mapInstance.current);
      
      mapInstance.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setFormData(prev => ({
          ...prev,
          latitud: lat.toFixed(4),
          longitud: lng.toFixed(4)
        }));
        
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
      });
      
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

  const validarTelefono = (codigo, numero) => {
    const numeroLimpio = numero.replace(/\s/g, '');
    if (codigo === '+591') {
      return /^[0-9]{8}$/.test(numeroLimpio);
    } else if (codigo === '+51') {
      return /^[0-9]{9}$/.test(numeroLimpio);
    }
    return false;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTelefonoChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      numero_telefono: valor
    }));
  };

  const handleCodigoPaisChange = (e) => {
    const nuevoCodigo = e.target.value;
    setFormData(prev => ({
      ...prev,
      codigo_pais: nuevoCodigo,
      numero_telefono: ''
    }));
  };

  const handleFileChange = (type, e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
      if (type === 'vinchucas') {
        const currentCount = selectedFiles.vinchucas.length;
        const availableSlots = MAX_VINCHUCAS_FOTOS - currentCount;
        
        if (availableSlots <= 0) {
          setError(`Máximo ${MAX_VINCHUCAS_FOTOS} fotos permitidas para vinchucas`);
          return;
        }
        
        const filesToAdd = files.slice(0, availableSlots);
        const newFiles = [...selectedFiles.vinchucas, ...filesToAdd];
        const newPreviews = [...imagePreviews.vinchucas, ...filesToAdd.map(file => URL.createObjectURL(file))];
        
        setSelectedFiles(prev => ({
          ...prev,
          [type]: newFiles
        }));
        
        setImagePreviews(prev => ({
          ...prev,
          [type]: newPreviews
        }));

        if (files.length > availableSlots) {
          setError(`Solo se agregaron ${filesToAdd.length} fotos. Máximo ${MAX_VINCHUCAS_FOTOS} permitidas.`);
        }
      } else {
        if (selectedFiles.vivienda) {
          setError('Ya tienes una foto de vivienda. Elimina la actual para subir una nueva.');
          return;
        }
        
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
    URL.revokeObjectURL(imagePreviews.vinchucas[index]);
    
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

  const removeViviendaImage = () => {
    if (imagePreviews.vivienda) {
      URL.revokeObjectURL(imagePreviews.vivienda);
    }
    
    setSelectedFiles(prev => ({
      ...prev,
      vivienda: null
    }));
    
    setImagePreviews(prev => ({
      ...prev,
      vivienda: null
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

    if (!usuario || !usuario.usuario_id) {
      setError('Debes iniciar sesión para registrar una denuncia');
      setLoading(false);
      return;
    }
    
    if (!formData.descripcion || formData.descripcion.trim() === '') {
      setError('La descripción del hallazgo es obligatoria');
      setLoading(false);
      return;
    }

    if (!formData.municipio_id) {
      setError('Debes seleccionar un municipio');
      setLoading(false);
      return;
    }

    if (!formData.comunidad_id) {
      setError('Debes seleccionar una comunidad');
      setLoading(false);
      return;
    }

    if (!formData.direccion || formData.direccion.trim() === '') {
      setError('La dirección es obligatoria');
      setLoading(false);
      return;
    }

    if (!formData.numero_telefono || formData.numero_telefono.trim() === '') {
      setError('El número de teléfono es obligatorio');
      setLoading(false);
      return;
    }

    if (!validarTelefono(formData.codigo_pais, formData.numero_telefono)) {
      setError(
        formData.codigo_pais === '+591' 
          ? 'El número de teléfono para Bolivia debe tener 8 dígitos' 
          : 'El número de teléfono para Perú debe tener 9 dígitos'
      );
      setLoading(false);
      return;
    }

    if (!selectedFiles.vivienda) {
      setError('La foto de la vivienda (exterior) es obligatoria');
      setLoading(false);
      return;
    }

    if (selectedFiles.vinchucas.length === 0) {
      setError('Debe subir al menos una foto de vinchucas');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('jefe_familia', formData.jefe_familia);
      formDataToSend.append('numero_vivienda', formData.numero_vivienda);
      formDataToSend.append('municipio_id', formData.municipio_id);
      formDataToSend.append('comunidad_id', formData.comunidad_id);
      formDataToSend.append('direccion', formData.direccion);
      formDataToSend.append('descripcion', formData.descripcion);
      formDataToSend.append('usuario_id', usuario.usuario_id);
      
      formDataToSend.append('codigo_pais', formData.codigo_pais);
      formDataToSend.append('numero_telefono', formData.numero_telefono || '');
      
      if (formData.vivienda_id && formData.vivienda_id.trim() !== '') {
        formDataToSend.append('vivienda_id', formData.vivienda_id);
      }
      
      formDataToSend.append('latitud', formData.latitud);
      formDataToSend.append('longitud', formData.longitud);
      formDataToSend.append('altura', formData.altura);
      formDataToSend.append('fecha_denuncia', new Date().toLocaleString('sv-SE', { timeZone: 'America/La_Paz' }).replace(' ', ' '));
      formDataToSend.append('estado_denuncia', 'recibida');
      
      if (selectedFiles.vivienda) {
        formDataToSend.append('foto_vivienda', selectedFiles.vivienda);
      }
      
      selectedFiles.vinchucas.forEach(file => {
        formDataToSend.append('fotos_vinchucas', file);
      });

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
    if (imagePreviews.vivienda) {
      URL.revokeObjectURL(imagePreviews.vivienda);
    }
    imagePreviews.vinchucas.forEach(url => {
      URL.revokeObjectURL(url);
    });
    
    setFormData({
      jefe_familia: '',
      numero_vivienda: '',
      municipio_id: '',
      comunidad_id: '',
      direccion: '',
      descripcion: '',
      fotos_vinchucas: '',
      latitud: -17.3938,
      longitud: -66.1570,
      altura: 2550,
      vivienda_id: '',
      codigo_pais: '+591',
      numero_telefono: ''
    });
    setSelectedFiles({
      vivienda: null,
      vinchucas: []
    });
    setImagePreviews({
      vivienda: null,
      vinchucas: []
    });
    setComunidades([]);
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
              <label htmlFor="jefe_familia">Jefe de Familia *</label>
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
              <label htmlFor="numero_vivienda">N° de vivienda *</label>
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
              <label htmlFor="municipio_id">Municipio *</label>
              {loadingMunicipios ? (
                <select id="municipio_id" name="municipio_id" disabled>
                  <option>Cargando municipios...</option>
                </select>
              ) : (
                <select
                  id="municipio_id"
                  name="municipio_id"
                  value={formData.municipio_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione un municipio</option>
                  {municipios.map((municipio) => (
                    <option key={municipio.municipio_id} value={municipio.municipio_id}>
                      {municipio.nombre_municipio}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="comunidad_id">Comunidad *</label>
              {loadingComunidades ? (
                <select id="comunidad_id" name="comunidad_id" disabled>
                  <option>Cargando comunidades...</option>
                </select>
              ) : (
                <select
                  id="comunidad_id"
                  name="comunidad_id"
                  value={formData.comunidad_id}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.municipio_id || comunidades.length === 0}
                >
                  <option value="">
                    {!formData.municipio_id 
                      ? 'Primero seleccione un municipio' 
                      : comunidades.length === 0 
                        ? 'No hay comunidades disponibles' 
                        : 'Seleccione una comunidad'
                    }
                  </option>
                  {comunidades.map((comunidad) => (
                    <option key={comunidad.comunidad_id} value={comunidad.comunidad_id}>
                      {comunidad.nombre_comunidad}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="direccion">Dirección *</label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              placeholder="Ej: Calle Principal #123, Zona Central"
              required
            />
            <small className="field-help">Ingrese la dirección exacta de la vivienda</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="codigo_pais">Código de País *</label>
              <select
                id="codigo_pais"
                name="codigo_pais"
                value={formData.codigo_pais}
                onChange={handleCodigoPaisChange}
                className="codigo-pais-select"
                required
              >
                <option value="+591">🇧🇴 +591 (Bolivia)</option>
                <option value="+51">🇵🇪 +51 (Perú)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="numero_telefono">Número de Teléfono *</label>
              <input
                type="tel"
                id="numero_telefono"
                name="numero_telefono"
                value={formData.numero_telefono}
                onChange={handleTelefonoChange}
                placeholder={formData.codigo_pais === '+591' ? "71234567" : "987654321"}
                maxLength={formData.codigo_pais === '+591' ? 8 : 9}
                className="numero-telefono-input"
                required
              />
              <small className="field-help">
                {formData.codigo_pais === '+591' 
                  ? "Formato: 71234567 (8 dígitos)" 
                  : "Formato: 987654321 (9 dígitos)"}
              </small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Foto de la vivienda (exterior) *</label>
              <small className="field-help">Foto de la fachada de la vivienda (obligatoria)</small>
              <div className="file-upload">
                <input
                  type="file"
                  id="foto_vivienda"
                  accept="image/*"
                  onChange={(e) => handleFileChange('vivienda', e)}
                  style={{ display: 'none' }}
                  disabled={selectedFiles.vivienda !== null}
                  required
                />
                <label 
                  htmlFor="foto_vivienda" 
                  className={`file-upload-button ${selectedFiles.vivienda ? 'disabled' : ''}`}
                >
                  {selectedFiles.vivienda ? 'Foto seleccionada' : 'Seleccionar archivo *'}
                </label>
                <span className="file-name">
                  {selectedFiles.vivienda ? selectedFiles.vivienda.name : '1 archivo obligatorio'}
                </span>
                
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
                        onClick={removeViviendaImage}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Fotos de las vinchucas *</label>
              <small className="field-help">Fotos de las vinchucas encontradas (mínimo 1)</small>
              <div className="file-upload">
                <input
                  type="file"
                  id="fotos_vinchucas"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileChange('vinchucas', e)}
                  style={{ display: 'none' }}
                  disabled={selectedFiles.vinchucas.length >= MAX_VINCHUCAS_FOTOS}
                />
                <label 
                  htmlFor="fotos_vinchucas" 
                  className={`file-upload-button ${selectedFiles.vinchucas.length >= MAX_VINCHUCAS_FOTOS ? 'disabled' : ''}`}
                >
                  {selectedFiles.vinchucas.length >= MAX_VINCHUCAS_FOTOS 
                    ? 'Máximo alcanzado' 
                    : selectedFiles.vinchucas.length > 0
                      ? 'Agregar más fotos'
                      : 'Seleccionar archivos *'}
                </label>
                <span className="file-name">
                  {selectedFiles.vinchucas.length > 0 
                    ? `${selectedFiles.vinchucas.length}/${MAX_VINCHUCAS_FOTOS} archivos seleccionados` 
                    : `Mínimo 1 archivo, máximo ${MAX_VINCHUCAS_FOTOS}`}
                </span>
                
                {imagePreviews.vinchucas.length > 0 && (
                  <div className="image-preview-container">
                    <h4>Vista previa ({imagePreviews.vinchucas.length}/{MAX_VINCHUCAS_FOTOS}):</h4>
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
            <label htmlFor="descripcion">
              Descripción del hallazgo * 
              <span className="help-text">(describa el problema con las vinchucas o algún punto importante)</span>
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Describa el problema con las vinchucas o algún punto importante. Ej: Se encontraron vinchucas en el dormitorio, especialmente durante la noche. También se observaron en el corral de animales."
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
                <li><strong>Municipio:</strong> selecciona el municipio donde se encuentra la vivienda.</li>
                <li><strong>Comunidad:</strong> selecciona la comunidad a la que pertenece la vivienda.</li>
                <li><strong>Dirección:</strong> <strong style={{color: 'red'}}>OBLIGATORIO</strong> - Ingresa la dirección exacta de la vivienda.</li>
                <li><strong>Teléfono:</strong> <strong style={{color: 'red'}}>OBLIGATORIO</strong> - Proporciona un número de contacto válido.</li>
                <li><strong>Fotos:</strong> 
                  <ul>
                    <li>Vivienda: <strong style={{color: 'red'}}>OBLIGATORIO (1 foto)</strong> de la fachada</li>
                    <li>Vinchucas: <strong style={{color: 'red'}}>OBLIGATORIO (mínimo 1, máximo 4)</strong> de las vinchucas encontradas</li>
                  </ul>
                </li>
                <li><strong>Descripción:</strong> describe el problema con las vinchucas o algún punto importante.</li>
                <li><strong>Mapa:</strong> arrastra el pin a la ubicación más cercana posible de tu casa.</li>
              </ol>
              <div className="help-note">
                <p><strong>Nota:</strong> Los campos marcados con * son obligatorios.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrarDenuncia;