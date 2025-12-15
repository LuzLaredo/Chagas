import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/Mapas.css';
import entomologicaService from '../services/entomologicaService';
import generalService from '../services/generalService';
import { baseUrl } from '../api/BaseUrl';

// ====================================================
// CONFIGURACIÓN GLOBALES - FIJAR ICONOS
// ====================================================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Icono circular personalizado
const getCircleIcon = (color) => {
    return new L.DivIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
};

const MapasEE1 = () => {
    const navigate = useNavigate();
    const { usuario, token } = useAuth();
    const [ee1Data, setEe1Data] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedMunicipio, setSelectedMunicipio] = useState('todos');
    const [selectedResultado, setSelectedResultado] = useState('todos');
    const [showLegend] = useState(true);

    // Referencias para el mapa
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]);

    // Colores
    const COLOR_POSITIVO = '#dc3545';
    const COLOR_NEGATIVO = '#28a745';

    const getMarkerColorEE1 = (resultado) => {
        if (resultado === 'positivo') return COLOR_POSITIVO;
        if (resultado === 'negativo') return COLOR_NEGATIVO;
        return '#6c757d';
    };

    const formatFecha = (fecha) => {
        if (!fecha) return 'N/A';
        try {
            return new Date(fecha).toLocaleDateString('es-BO');
        } catch {
            return fecha;
        }
    };

    const navigateToDatosEE1 = () => navigate('/DatosEE1');

    // ====================================================
    // 1. CARGA DE DATOS
    // ====================================================
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Si es supervisor, cargar solo su municipio
            if (usuario?.rol === 'supervisor' && (usuario?.usuario_id || usuario?.id)) {
                const usuarioId = usuario.usuario_id || usuario.id;
                const headers = token ? { "Authorization": `Bearer ${token}` } : {};

                // Obtener municipio del supervisor
                const municipioRes = await fetch(`${baseUrl}/api/usuarios/${usuarioId}/municipios`, {
                    headers: headers
                });

                if (!municipioRes.ok) {
                    console.error(`Error ${municipioRes.status} al obtener municipios:`, municipioRes.statusText);
                    if (municipioRes.status === 401) {
                        console.error('Token inválido o expirado. Por favor, inicia sesión nuevamente.');
                    }
                } else {
                    const municipiosData = await municipioRes.json();
                    setMunicipios(municipiosData || []);

                    // Si solo hay un municipio, seleccionarlo automáticamente
                    if (municipiosData.length === 1) {
                        setSelectedMunicipio(municipiosData[0].nombre_municipio);
                    }
                }

                // Los datos del mapa ya vienen filtrados por el backend
                const ee1DataResponse = await entomologicaService.getMapaEE1();
                const formattedData = (ee1DataResponse || []).map(item => ({
                    ...item,
                    resultado: item.resultado ? item.resultado.toLowerCase() : 'desconocido'
                }));
                setEe1Data(formattedData);
            } else {
                // Para otros roles, cargar todos los datos
                const [ee1DataResponse, municipiosResponse] = await Promise.all([
                    entomologicaService.getMapaEE1(),
                    generalService.getMunicipios()
                ]);

                const formattedData = (ee1DataResponse || []).map(item => ({
                    ...item,
                    resultado: item.resultado ? item.resultado.toLowerCase() : 'desconocido'
                }));

                setEe1Data(formattedData);
                setMunicipios(municipiosResponse || []);
            }
        } catch (err) {
            console.error('Error cargando datos:', err);
            setError(`Error al cargar los datos: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // ====================================================
    // 2. INICIALIZACIÓN DEL MAPA
    // ====================================================
    useEffect(() => {
        const initializeMap = () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markersRef.current = [];
                setMapLoaded(false);
            }

            setTimeout(() => {
                if (mapRef.current && !mapInstance.current) {
                    // Coordenadas exactas de Cochabamba, Bolivia
                    const defaultLat = -17.3938;
                    const defaultLng = -66.1570;
                    const defaultZoom = 11; // 🔎 Zoom ajustado para el valle central

                    try {
                        mapInstance.current = L.map(mapRef.current).setView([defaultLat, defaultLng], defaultZoom);

                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '© OpenStreetMap contributors'
                        }).addTo(mapInstance.current);

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
                setMapLoaded(false);
            }
        };
    }, []);

    // ====================================================
    // 3. ACTUALIZACIÓN DE MARCADORES
    // ====================================================
    useEffect(() => {
        if (mapInstance.current && mapLoaded) {

            // Limpiar marcadores existentes
            markersRef.current.forEach(marker => {
                mapInstance.current.removeLayer(marker);
            });
            markersRef.current = [];

            // Filtrar datos según los filtros seleccionados
            let datosFiltrados;

            if (selectedMunicipio === 'todos' && selectedResultado === 'todos') {
                datosFiltrados = ee1Data;
            } else {
                datosFiltrados = ee1Data.filter(d => {
                    const byMunicipio = selectedMunicipio === 'todos' || d.nombre_municipio === selectedMunicipio;
                    const byResultado = selectedResultado === 'todos' || d.resultado === selectedResultado;
                    return byMunicipio && byResultado;
                });
            }

            // Agregar marcadores para cada punto EE1
            datosFiltrados.forEach((punto, index) => {
                if (punto.latitud && punto.longitud) {
                    const lat = parseFloat(punto.latitud);
                    const lng = parseFloat(punto.longitud);

                    // 🛡️ VALIDACIÓN ULTRA ESTRICTA: Solo coordenadas dentro de Bolivia
                    const isValidLat = lat < -9 && lat > -25;
                    const isValidLng = lng < -57 && lng > -70;

                    if (!isNaN(lat) && !isNaN(lng) && isValidLat && isValidLng) {
                        const markerColor = getMarkerColorEE1(punto.resultado);
                        const markerIcon = getCircleIcon(markerColor);

                        const marker = L.marker([lat, lng], {
                            icon: markerIcon
                        }).addTo(mapInstance.current);

                        // Agregar popup al marcador
                        marker.bindPopup(`
                            <div style="text-align: left; min-width: 250px;">
                                <h4 style="margin: 0 0 8px 0; color: #333; border-bottom: 2px solid ${markerColor}; padding-bottom: 4px;">
                                    🔬 Evaluación Entomológica #${punto.id}
                                </h4>
                                <p style="margin: 4px 0;"><strong>Municipio:</strong> ${punto.nombre_municipio || 'N/A'}</p>
                                <p style="margin: 4px 0;"><strong>Comunidad:</strong> ${punto.nombre_comunidad || 'N/A'}</p>
                                <p style="margin: 4px 0;"><strong>Resultado:</strong>
                                    <span style="color: ${markerColor}; font-weight: bold;">
                                        ${(punto.resultado || 'desconocido').toUpperCase()}
                                    </span>
                                </p>
                                <p style="margin: 4px 0;"><strong>Estado Rociado:</strong> ${punto.estado_rociado || 'N/A'}</p>
                                <p style="margin: 4px 0;"><strong>Fecha Programada:</strong> ${formatFecha(punto.fecha_programada)}</p>
                                <button onclick="window.detailNavigation(${punto.id})"
                                        style="
                                            background-color: #45B7D1;
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

            // Ajustar la vista si hay marcadores
            if (datosFiltrados.length > 0 && markersRef.current.length > 0) {
                // ELIMINADO: fitBounds automático.
                // REEMPLAZO: Vista fija Cochabamba.
                mapInstance.current.setView([-17.3938, -66.1570], 11);
            } else if (datosFiltrados.length === 0) {
                mapInstance.current.setView([-17.3938, -66.1570], 11);
            }
        }
    }, [ee1Data, selectedMunicipio, selectedResultado, mapLoaded]);

    // Configurar navegación global para popups
    useEffect(() => {
        window.detailNavigation = (id) => {
            navigate(`/DetallesEE1/${id}`);
        };
    }, [navigate]);

    // Calcular contadores
    const datosFiltrados = ee1Data.filter(d => {
        const byMunicipio = selectedMunicipio === 'todos' || d.nombre_municipio === selectedMunicipio;
        const byResultado = selectedResultado === 'todos' || d.resultado === selectedResultado;
        return byMunicipio && byResultado;
    });

    const totalPositivos = datosFiltrados.filter(d => d.resultado === 'positivo').length;
    const totalNegativos = datosFiltrados.filter(d => d.resultado === 'negativo').length;

    const handleMunicipioChange = (municipio) => {
        setSelectedMunicipio(municipio);
    };

    const handleResultadoChange = (resultado) => {
        setSelectedResultado(resultado);
    };

    const centerMapOnDefault = () => {
        if (mapInstance.current) {
            mapInstance.current.setView([-17.3938, -66.1570], 10);
        }
    };

    if (loading) {
        return (
            <div className="mapas-container">
                <div className="loading">Cargando mapa EE1...</div>
            </div>
        );
    }

    return (
        <div className="mapas-container">
            <div className="mapas-header">
                <div className="header-text">
                    <h1>MAPA DE EVALUACIÓN ENTOMOLÓGICA 1 (EE1)</h1>
                    <p>Visualización de puntos de Evaluación Entomológica y su estado de rociado asociado</p>
                </div>

                <button
                    onClick={navigateToDatosEE1}
                    className="btn-tabular"
                >
                    📋 Ver Datos Tabulares
                </button>
            </div>

            {error && (
                <div className="error">
                    {error}
                    <button
                        onClick={loadData}
                        className="btn-retry"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            <div className="mapas-filters">
                <div className="filter-group">
                    <label htmlFor="municipio-filter">Filtrar por Municipio:</label>
                    <select
                        id="municipio-filter"
                        value={selectedMunicipio}
                        onChange={(e) => handleMunicipioChange(e.target.value)}
                        className="estado-filter"
                        disabled={usuario?.rol === 'supervisor' && municipios.length === 1}
                    >
                        {usuario?.rol === 'supervisor' && municipios.length === 1 ? (
                            municipios.map(m => (
                                <option key={m.municipio_id} value={m.nombre_municipio}>
                                    {m.nombre_municipio}
                                </option>
                            ))
                        ) : (
                            <>
                                <option value="todos">Todos los Municipios</option>
                                {municipios.map(m => (
                                    <option key={m.municipio_id} value={m.nombre_municipio}>
                                        {m.nombre_municipio}
                                    </option>
                                ))}
                            </>
                        )}
                    </select>
                    {usuario?.rol === 'supervisor' && municipios.length === 1 && (
                        <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                            (Solo su municipio asignado)
                        </span>
                    )}
                </div>
                <div className="filter-group">
                    <label htmlFor="resultado-filter">Filtrar por Resultado:</label>
                    <select
                        id="resultado-filter"
                        value={selectedResultado}
                        onChange={(e) => handleResultadoChange(e.target.value)}
                        className="estado-filter"
                    >
                        <option value="todos">Todos los Resultados</option>
                        <option value="positivo">Positivo</option>
                        <option value="negativo">Negativo</option>
                    </select>
                </div>
                <div className="filter-info">
                    <span>Mostrando: <strong>{datosFiltrados.length}</strong> registros EE1</span>
                </div>
            </div>

            {/* Contadores */}
            <div className="mapas-counter">
                {/* Tarjeta Positivos */}
                <div className="counter-card positivo">
                    {/* Usar un icono (ejemplo: un pulgar arriba si usas Font Awesome) */}
                    {/* <i className="counter-icon fas fa-thumbs-up"></i> */}
                    <div className="counter-label">Positivos</div>
                    <div className="counter-number">{totalPositivos}</div>
                </div>

                {/* Tarjeta Negativos */}
                <div className="counter-card negativo">
                    {/* Usar un icono (ejemplo: un pulgar abajo si usas Font Awesome) */}
                    {/* <i className="counter-icon fas fa-thumbs-down"></i> */}
                    <div className="counter-label">Negativos</div>
                    <div className="counter-number">{totalNegativos}</div>
                </div>
            </div>

            <div className="mapas-content">
                {showLegend && (
                    <div className="mapas-legend">
                        <h3>Leyenda EE1</h3>
                        <div className="legend-items">
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: COLOR_POSITIVO }}></span>
                                <span>Positivo</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: COLOR_NEGATIVO }}></span>
                                <span>Negativo</span>
                            </div>
                        </div>

                        <div className="mapas-controls">
                            <button
                                className="btn-center-map"
                                onClick={centerMapOnDefault}
                                title="Centrar Mapa"
                            >
                                🎯 Centrar Mapa
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
                    <strong>Instrucciones:</strong> Este mapa muestra los resultados de las Evaluaciones Entomológicas (EE1).
                    Los marcadores se colorean según si el resultado fue positivo (Rojo) o negativo (Verde).
                </p>
            </div>
        </div>
    );
};

export default MapasEE1;