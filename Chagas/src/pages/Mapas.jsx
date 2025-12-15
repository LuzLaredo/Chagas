import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { denunciasService } from '../services/denunciasService';
import { useAuth } from './AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/Mapas.css';
import municipiosDataGeo from '../data/municipiosCochabamba.json';

import { baseUrl } from '../api/BaseUrl';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const Mapas = () => {
    const navigate = useNavigate();
    const { usuario, token } = useAuth();
    const [denuncias, setDenuncias] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedEstado, setSelectedEstado] = useState('todos');
    const [selectedMunicipio, setSelectedMunicipio] = useState('todos');
    const [showLegend] = useState(true);
    const [showMunicipios, setShowMunicipios] = useState(true);

    // Nuevo estado para controlar si hay resultados después de filtrar
    const [hasResults, setHasResults] = useState(true);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [denunciaSeleccionada, setDenunciaSeleccionada] = useState(null);
    const [locationInfo, setLocationInfo] = useState(null);

    const [counters, setCounters] = useState({
        recibida: 0,
        programada: 0,
        realizada: 0,
        totalActivas: 0,
    });

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]);
    const municipiosLayerRef = useRef(null);

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'recibida': return '#dc3545';
            case 'programada':
            case 'reprogramada': return '#ffc107';
            case 'realizada': return '#28a745';
            case 'cancelada': return '#000000';
            default: return '#6c757d';
        }
    };

    const getEstadoText = (estado) => {
        switch (estado) {
            case 'recibida': return 'Sin Revisar';
            case 'programada': return 'Programada';
            case 'reprogramada': return 'Reprogramada';
            case 'realizada': return 'Verificado';
            case 'cancelada': return 'Cancelada';
            default: return estado;
        }
    };

    const abrirModal = (denuncia) => {
        setDenunciaSeleccionada(denuncia);
        setModalAbierto(true);
        obtenerInformacionUbicacion(denuncia.latitud, denuncia.longitud);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setDenunciaSeleccionada(null);
        setLocationInfo(null);
    };

    const obtenerInformacionUbicacion = async (lat, lng) => {
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
            console.error('Error obteniendo información de ubicación:', error);
        }
    };

    const getMunicipioColor = (municipioId) => {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
            '#FFEAA7', '#DDA0DD', '#FFB347', '#98D8C8'
        ];
        return colors[(municipioId - 1) % colors.length];
    };

    const getMunicipioBorderColor = (municipioId) => {
        const borderColors = [
            '#E74C3C', '#16A085', '#2980B9', '#27AE60',
            '#F39C12', '#8E44AD', '#1ABC9C'
        ];
        return borderColors[(municipioId - 1) % borderColors.length];
    };

    const getProvincia = (municipioId) => {
        const provincias = {
            1: 'Tiquipaya',
            2: 'Quillacollo',
            3: 'Cercado',
            4: 'Colcapirhua',
            5: 'Sacaba'
        };
        return provincias[municipioId] || 'No especificada';
    };

    const addMunicipiosLayer = () => {
        if (!mapInstance.current || !showMunicipios) return;

        if (municipiosLayerRef.current) {
            mapInstance.current.removeLayer(municipiosLayerRef.current);
        }

        municipiosLayerRef.current = L.geoJSON(municipiosDataGeo, {
            style: (feature) => ({
                color: getMunicipioBorderColor(feature.properties.municipio_id),
                weight: 2,
                fillColor: getMunicipioColor(feature.properties.municipio_id),
                fillOpacity: 0.15,
                opacity: 1,
                dashArray: '10, 5',
                lineCap: 'round',
                lineJoin: 'round'
            }),
            onEachFeature: (feature, layer) => {
                const props = feature.properties;

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

                layer.on('mouseover', function (e) {
                    this.setStyle({
                        weight: 3,
                        opacity: 1,
                        fillOpacity: 0.25,
                        dashArray: '15, 8'
                    });
                });

                layer.on('mouseout', function (e) {
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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            let municipiosList = [];

            // Si es supervisor, cargar solo su municipio
            if (usuario?.rol === 'supervisor' && (usuario?.usuario_id || usuario?.id)) {
                const usuarioId = usuario.usuario_id || usuario.id;
                const headers = token ? { "Authorization": `Bearer ${token}` } : {};

                try {
                    const municipioRes = await fetch(`${baseUrl}/api/usuarios/${usuarioId}/municipios`, {
                        headers: headers
                    });

                    if (!municipioRes.ok) {
                        console.error(`Error ${municipioRes.status} al obtener municipios:`, municipioRes.statusText);
                        // ⛔ NO FALLBACK PARA SUPERVISORES - SEGURIDAD
                        // Si falla la API, mostramos error en lugar de todos los datos
                        setError("No fue posible verificar su municipio asignado. Por favor revise su conexión.");
                        setMunicipios([]);
                        setSelectedMunicipio('bloqueado'); // Estado especial para bloquear
                    } else {
                        const municipiosData = await municipioRes.json();
                        municipiosList = municipiosData || [];

                        // Si solo hay un municipio, seleccionarlo automáticamente
                        if (municipiosList.length === 1) {
                            setSelectedMunicipio(municipiosList[0].municipio_id); // Usamos ID para el filtro
                        } else if (municipiosList.length === 0) {
                            setError("Su usuario no tiene municipios asignados.");
                            setSelectedMunicipio('bloqueado');
                        }
                    }
                } catch (e) {
                    console.error("Error fetching supervisor municipios", e);
                    setError("Error de conexión al verificar asignación. Intente recargar.");
                    setMunicipios([]);
                    setSelectedMunicipio('bloqueado');
                }
            } else {
                // Si no es supervisor, cargar TODOS los municipios de la base de datos
                try {
                    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
                    const response = await fetch(`${baseUrl}/api/municipios`, { headers });

                    if (response.ok) {
                        const allMunicipios = await response.json();
                        // Mapear para asegurar consistencia en nombres de propiedades
                        municipiosList = allMunicipios.map(m => ({
                            municipio_id: m.municipio_id,
                            nombre_municipio: m.nombre_municipio
                        }));
                    } else {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (apiErr) {
                    console.error("Error cargando lista completa de municipios, usando fallback GeoJSON:", apiErr);
                    // Fallback: usar GeoJSON si falla la API
                    municipiosList = municipiosDataGeo.features.map(f => ({
                        municipio_id: f.properties.municipio_id,
                        nombre_municipio: f.properties.nombre
                    }));
                }
            }
            setMunicipios(municipiosList);

            const data = await denunciasService.getDenuncias();
            setDenuncias(data || []);

        } catch (err) {
            console.error('Error al cargar datos:', err);
            setError('Error al cargar los datos para el mapa');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const counts = denuncias.reduce((acc, denuncia) => {
            // Filtrar también para los contadores si hay municipio seleccionado
            const matchesMunicipio = selectedMunicipio === 'todos' || denuncia.municipio_id == selectedMunicipio;

            if (!matchesMunicipio) return acc;

            const estado = denuncia.estado_denuncia;

            if (estado !== 'cancelada') {
                acc.totalActivas += 1;
            }

            if (estado === 'programada' || estado === 'reprogramada') {
                acc.programada += 1;
            } else if (estado === 'recibida') {
                acc.recibida += 1;
            } else if (estado === 'realizada') {
                acc.realizada += 1;
            }

            return acc;
        }, { recibida: 0, programada: 0, realizada: 0, totalActivas: 0 });

        setCounters(counts);
    }, [denuncias, selectedMunicipio]);

    useEffect(() => {
        const initializeMap = () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markersRef.current = [];
                municipiosLayerRef.current = null;
                setMapLoaded(false);
            }

            setTimeout(() => {
                if (mapRef.current && !mapInstance.current) {
                    // Coordenadas exactas de Cochabamba, Bolivia
                    const defaultLat = -17.3938;
                    const defaultLng = -66.1570;
                    const defaultZoom = 11; // 🔎 Zoom ajustado para ver la ciudad/valle central

                    try {
                        mapInstance.current = L.map(mapRef.current).setView([defaultLat, defaultLng], defaultZoom);

                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '© OpenStreetMap contributors'
                        }).addTo(mapInstance.current);

                        addMunicipiosLayer();

                        setMapLoaded(true);

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

    useEffect(() => {
        if (mapInstance.current && mapLoaded) {

            markersRef.current.forEach(marker => {
                mapInstance.current.removeLayer(marker);
            });
            markersRef.current = [];

            const denunciasSinCanceladas = denuncias.filter(d => d.estado_denuncia !== 'cancelada');

            let denunciasFiltradas = denunciasSinCanceladas;

            if (selectedEstado === 'programada') {
                denunciasFiltradas = denunciasFiltradas.filter(d =>
                    d.estado_denuncia === 'programada' || d.estado_denuncia === 'reprogramada'
                );
            } else if (selectedEstado !== 'todos') {
                denunciasFiltradas = denunciasFiltradas.filter(d => d.estado_denuncia === selectedEstado);
            }

            // Lógica de filtrado y fallback SEGURO para supervisores
            if (selectedMunicipio !== 'todos' && selectedMunicipio !== 'bloqueado') {
                // Si hay un municipio seleccionado, filtrar por él
                denunciasFiltradas = denunciasFiltradas.filter(d => d.municipio_id == selectedMunicipio);
            } else if (usuario?.rol === 'supervisor') {
                // 🔒 SEGURIDAD: Si es supervisor y NO hay municipio seleccionado (o es 'todos' por error), 
                // NO mostrar nada. Evita leak de datos si falla la carga.
                console.warn("Supervisor sin municipio válido seleccionado. Ocultando data.");
                denunciasFiltradas = [];
            } else if (selectedMunicipio === 'bloqueado') {
                denunciasFiltradas = [];
            }

            // Actualizar estado de resultados vacío
            setHasResults(denunciasFiltradas.length > 0);

            denunciasFiltradas.forEach((denuncia, index) => {
                if (denuncia.latitud && denuncia.longitud) {
                    const lat = parseFloat(denuncia.latitud);
                    const lng = parseFloat(denuncia.longitud);

                    // 🛡️ VALIDACIÓN ULTRA ESTRICTA: Solo coordenadas dentro de Bolivia/Cochabamba
                    // Rango aprox Bolivia: Lat -9 a -23, Lng -57 a -70
                    // Filtramos cualquier cosa fuera de un rango seguro para evitar "puntos en África"
                    const isValidLat = lat < -9 && lat > -25;
                    const isValidLng = lng < -57 && lng > -70;

                    if (!isNaN(lat) && !isNaN(lng) && isValidLat && isValidLng) {
                        const estadoColor = getEstadoColor(denuncia.estado_denuncia);
                        const marker = L.circleMarker([lat, lng], {
                            radius: 5,
                            color: estadoColor,
                            weight: 1,
                            fillOpacity: 0.9
                        }).addTo(mapInstance.current);

                        marker.bindPopup(`
                            <div style="text-align: left; min-width: 200px;">
                                <h4 style="margin: 0 0 8px 0; color: #333;">📍 Denuncia #${denuncia.id || denuncia.denuncia_id}</h4>
                                <p style="margin: 4px 0;"><strong>Vivienda:</strong> ${denuncia.numero_vivienda || 'N/A'}</p>
                                <p style="margin: 4px 0;"><strong>Jefe de Familia:</strong> ${denuncia.jefe_familia || 'N/A'}</p>
                                <p style="margin: 4px 0;"><strong>Municipio:</strong> ${denuncia.nombre_municipio || 'N/A'}</p>
                                <p style="margin: 4px 0;"><strong>Estado:</strong> 
                                    <span style="color: ${estadoColor}; font-weight: bold;">
                                        ${getEstadoText(denuncia.estado_denuncia)}
                                    </span>
                                </p>
                                <p style="margin: 4px 0;"><strong>Fecha:</strong> ${formatFecha(denuncia.fecha_denuncia)}</p>
                                <button onclick="window.detallesDenunciaModal(${JSON.stringify(denuncia).replace(/"/g, '&quot;')})" 
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

                        marker.on('click', () => {
                            abrirModal(denuncia);
                        });

                        markersRef.current.push(marker);
                    }
                }
            });

            window.detallesDenunciaModal = (denuncia) => {
                abrirModal(denuncia);
            };

            if (denunciasFiltradas.length > 0 && markersRef.current.length > 0) {
                // ELIMINADO: fitBounds automático causaba zoom lejano.
                // REEMPLAZO: Forzar vista centrada en Cochabamba como pide el usuario.
                mapInstance.current.setView([-17.3938, -66.1570], 11);
            } else if (denunciasFiltradas.length === 0) {
                mapInstance.current.setView([-17.3938, -66.1570], 11);
            }
        }
    }, [denuncias, selectedEstado, selectedMunicipio, mapLoaded]);

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

    const handleMunicipioChange = (municipioId) => {
        setSelectedMunicipio(municipioId);
    };

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
                <div className="header-text">
                    <h1>MAPA DE DENUNCIAS</h1>
                    <p>Visualización geográfica de denuncias por estado</p>
                </div>
                <div className="counter-grid">
                    <div className="counter-card" style={{ '--card-color': getEstadoColor('recibida') }}>
                        <div className="count-number">{counters.recibida}</div>
                        <div className="count-label">Sin Revisar</div>
                    </div>
                    <div className="counter-card" style={{ '--card-color': getEstadoColor('programada') }}>
                        <div className="count-number">{counters.programada}</div>
                        <div className="count-label">Programadas</div>
                    </div>
                    <div className="counter-card" style={{ '--card-color': getEstadoColor('realizada') }}>
                        <div className="count-number">{counters.realizada}</div>
                        <div className="count-label">Verificadas/Rociadas</div>
                    </div>
                    <div className="counter-card total-card" style={{ '--card-color': '#007bff' }}>
                        <div className="count-number">{counters.totalActivas}</div>
                        <div className="count-label">Total Activas</div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error">
                    {error}
                    <button onClick={loadData} className="btn-retry">Reintentar</button>
                </div>
            )}

            <div className="mapas-filters">
                <div className="filter-group">
                    <label htmlFor="municipio-filter">Filtrar por Municipio:</label>
                    <select
                        id="municipio-filter"
                        value={selectedMunicipio === 'bloqueado' ? '' : selectedMunicipio}
                        onChange={(e) => handleMunicipioChange(e.target.value)}
                        className="estado-filter"
                        disabled={selectedMunicipio === 'bloqueado' || (usuario?.rol === 'supervisor' && municipios.length === 1)}
                        style={{ marginRight: '15px' }}
                    >
                        {!(usuario?.rol === 'supervisor' && municipios.length === 1) &&
                            <option value="todos">Todos los Municipios</option>
                        }

                        {municipios.map(m => (
                            <option key={m.municipio_id} value={m.municipio_id}>
                                {m.nombre_municipio}
                            </option>
                        ))}
                    </select>
                    {usuario?.rol === 'supervisor' && municipios.length === 1 && (
                        <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                            (Solo su municipio asignado)
                        </span>
                    )}
                </div>

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
                        <option value="programada">Programada/Reprogramada</option>
                        <option value="realizada">Verificado/Rociado</option>
                    </select>
                </div>
                <div className="filter-info">
                    <span>
                        Mostrando: {counters.totalActivas} denuncias
                    </span>
                </div>
            </div>

            <div className="mapas-content">
                {showLegend && (
                    <div className="mapas-legend">
                        <h3>Leyenda de Estados</h3>
                        <div className="legend-items">
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: getEstadoColor('recibida') }}></span>
                                <span>Sin Revisar</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: getEstadoColor('programada') }}></span>
                                <span>Programada / Reprogramada</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: getEstadoColor('realizada') }}></span>
                                <span>Verificado / Rociado</span>
                            </div>
                        </div>

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
                                {showMunicipios ? '🗺️ Ocultar' : '🗺️ Mostrar'} Municipios
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

                    {/* MENSAJE DE CERO RESULTADOS */}
                    {!loading && !hasResults && mapLoaded && (selectedMunicipio !== 'todos' || usuario?.rol === 'supervisor') && (
                        <div style={{
                            position: 'absolute',
                            zIndex: 1000,
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: 'rgba(255, 255, 255, 0.95)',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                            textAlign: 'center',
                            maxWidth: '400px'
                        }}>
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🗺️</div>
                            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Este municipio no tiene denuncias</h3>
                            <p style={{ margin: 0, color: '#666' }}>
                                No se encontraron registros para el municipio y filtros seleccionados.
                            </p>
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

            {modalAbierto && denunciaSeleccionada && (
                <div className="modal-overlay" onClick={cerrarModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>INFORMACIÓN DE LA DENUNCIA</h2>
                            <button className="modal-close" onClick={cerrarModal}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="modal-columns">
                                <div className="modal-left">
                                    <div className="info-panel">
                                        <h3>Datos generales</h3>
                                        <div className="info-item">
                                            <strong>Nombre del jefe de familia:</strong> {denunciaSeleccionada.jefe_familia || 'No especificado'}
                                        </div>
                                        <div className="info-item">
                                            <strong>N° de vivienda:</strong> {denunciaSeleccionada.numero_vivienda || 'No especificado'}
                                        </div>
                                        <div className="info-item">
                                            <strong>Municipio:</strong> {denunciaSeleccionada.nombre_municipio || 'No especificado'}
                                        </div>
                                        {denunciaSeleccionada.nombre_comunidad && (
                                            <div className="info-item">
                                                <strong>Comunidad:</strong> {denunciaSeleccionada.nombre_comunidad}
                                            </div>
                                        )}
                                        <div className="info-item">
                                            <strong>Descripción:</strong> {denunciaSeleccionada.descripcion || 'Sin descripción'}
                                        </div>
                                    </div>

                                    <div className="info-panel">
                                        <h3>Estado del Servicio</h3>
                                        <div className="info-item">
                                            <strong>Servicio Requerido:</strong> Rocío y Exterminación
                                        </div>
                                        <div className="info-item">
                                            <strong>Fecha de Denuncia:</strong> {formatFecha(denunciaSeleccionada.fecha_denuncia)}
                                        </div>
                                        {denunciaSeleccionada.fecha_programacion && (
                                            <div className="info-item">
                                                <strong>Programación:</strong> {formatFecha(denunciaSeleccionada.fecha_programacion)}
                                            </div>
                                        )}
                                        {denunciaSeleccionada.fecha_ejecucion && (
                                            <div className="info-item">
                                                <strong>Ejecución:</strong> {formatFecha(denunciaSeleccionada.fecha_ejecucion)}
                                            </div>
                                        )}
                                        <div className="info-item">
                                            <strong>Estado:</strong>
                                            <span
                                                className="estado-badge"
                                                style={{ backgroundColor: getEstadoColor(denunciaSeleccionada.estado_denuncia) }}
                                            >
                                                {getEstadoText(denunciaSeleccionada.estado_denuncia)}
                                            </span>
                                        </div>

                                        {denunciaSeleccionada.estado_denuncia === 'reprogramada' && denunciaSeleccionada.motivo_reprogramacion && (
                                            <div className="info-item motivo-reprogramacion">
                                                <strong>Motivo de Reprogramación:</strong>
                                                <div className="motivo-texto">
                                                    {denunciaSeleccionada.motivo_reprogramacion}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-right">
                                    <div className="map-info full-width">
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
                                                    <strong>📍 Dirección:</strong> {denunciaSeleccionada.direccion || 'Cargando información de ubicación...'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="coordenadas-info">
                                            <div className="info-item">
                                                <strong>Coordenadas:</strong>
                                                <span>Lat: {denunciaSeleccionada.latitud || 'N/A'}, Lng: {denunciaSeleccionada.longitud || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Mapas;