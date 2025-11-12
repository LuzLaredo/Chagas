import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/Mapas.css'; 

import { baseUrl } from "../api/BaseUrl"; 
// Asegúrate de tener estilos en Mapas.css para las clases:
// .mapas-filters, .filter-group, .filter-group label, .estado-filter, .filter-info

// =========================================================================
// CONFIGURACIÓN DE SERVICIO (API REAL)
// =========================================================================

const API_BASE_URL = `${baseUrl}`; // Base URL

const generalService = {
    getMapaGeneral: async () => {
        const response = await fetch(`${API_BASE_URL}/api/mapageneral`);
        if (!response.ok) {
            throw new Error(`Error HTTP! Estado: ${response.status} al cargar datos generales.`);
        }
        return response.json();
    },
    getMunicipios: async () => {
        const response = await fetch(`${API_BASE_URL}/api/municipios`);
        if (!response.ok) {
            throw new Error(`Error HTTP! Estado: ${response.status} al cargar lista de municipios.`);
        }
        return response.json();
    }
};

// =========================================================================
// CONFIGURACIÓN DE LEAFLET E ICONOS
// =========================================================================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const getCircleIcon = (color) => {
    return new L.DivIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 10px; height: 10px; border-radius: 50%; border: 1px solid white;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
};

const MapasGeneral = () => {
    const navigate = useNavigate();
    const [generalData, setGeneralData] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    const [selectedMunicipio, setSelectedMunicipio] = useState('todos');
    const [selectedTipoRegistro, setSelectedTipoRegistro] = useState('todos');
    const [selectedEstadoDetalle, setSelectedEstadoDetalle] = useState('todos'); 

    const [showLegend] = useState(true);
    
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]);

// =========================================================================
// LÓGICA DE ESTILOS Y COLORES 
// =========================================================================

    const getMarkerColorGeneral = (tipoRegistro, estadoResultado, rociado) => {
        if (tipoRegistro === 'denuncia') {
            switch (estadoResultado) {
                case 'recibida': return '#dc3545'; // ROJO 
                case 'programada': return '#ffc107'; // AMARILLO 
                case 'realizada': return '#28a745'; // VERDE 
                case 'cancelada': return '#343a40'; // NEGRO 
                default: return '#6c757d'; // Gris
            }
        } else if (tipoRegistro === 'evaluacion_entomologica') {
            const esPositivo = estadoResultado === 'positivo';
            const rociadoRealizado = rociado === 'Sí'; 
            
            if (esPositivo && !rociadoRealizado) return '#ffc107'; // AMARILLO 
            if (esPositivo && rociadoRealizado) return '#28a745'; // VERDE 
            if (estadoResultado === 'negativo') return '#343a40'; // NEGRO 
            
            return '#6c757d'; // Gris
        }
        return '#6c757d'; // Gris general
    };

    const getEstadoTextGeneral = (tipoRegistro, estadoResultado, rociado) => {
        const estado = estadoResultado ? estadoResultado.charAt(0).toUpperCase() + estadoResultado.slice(1) : 'N/A';
        if (tipoRegistro === 'denuncia') {
            const estadoTexto = {
                'recibida': 'Recibida (Sin revisar)',
                'programada': 'Programada (En proceso)',
                'realizada': 'Verificada (Realizada)',
                'cancelada': 'Cancelada'
            }[estadoResultado] || estado;
            return `Denuncia: ${estadoTexto}`;
        } else if (tipoRegistro === 'evaluacion_entomologica') {
            if (estadoResultado === 'positivo') {
                return `EE: Positiva - Rociado: ${rociado === 'Sí' ? 'Realizado' : 'Pendiente'}`;
            } else if (estadoResultado === 'negativo') {
                return `EE: Negativa - Rociado: No Requerido`;
            }
        }
        return 'Registro Desconocido';
    };

    const formatFecha = (fecha) => {
        if (!fecha) return 'N/A';
        try {
            return new Date(fecha).toLocaleDateString('es-BO');
        } catch {
            return fecha;
        }
    };
    
// =========================================================================
// CARGA DE DATOS, MAPA Y FILTRADO
// =========================================================================

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const [generalDataResponse, municipiosResponse] = await Promise.all([
                    generalService.getMapaGeneral(),
                    generalService.getMunicipios()
                ]);

                setGeneralData(generalDataResponse || []);
                setMunicipios(municipiosResponse || []);

            } catch (err) {
                console.error('Error al cargar datos General o Municipios:', err);
                setError(`Error al cargar los datos del servidor. Revise las URLs de API: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // ... [Efectos para inicializar el mapa y manejar la navegación se mantienen iguales] ...
    useEffect(() => {
        const initializeMap = () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                setMapLoaded(false);
            }

            setTimeout(() => {
                if (mapRef.current && !mapInstance.current) {
                    const defaultLat = -17.3938; 
                    const defaultLng = -66.1570;
                    
                    try {
                        mapInstance.current = L.map(mapRef.current).setView([defaultLat, defaultLng], 9);
                        
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
            }
        };
    }, []);

    const filteredData = generalData.filter(d => {
        const byMunicipio = selectedMunicipio === 'todos' || d.nombre_municipio === selectedMunicipio;
        const byTipoRegistro = selectedTipoRegistro === 'todos' || d.tipo_registro === selectedTipoRegistro;
        
        let byEstadoDetalle = true;

        if (selectedEstadoDetalle !== 'todos') {
            if (d.tipo_registro === 'evaluacion_entomologica') {
                const requiredRociado = selectedEstadoDetalle === 'si' ? 'Sí' : 'No';
                byEstadoDetalle = d.rociado === requiredRociado;
            } else if (d.tipo_registro === 'denuncia') {
                byEstadoDetalle = d.estado_resultado === selectedEstadoDetalle;
            } else {
                byEstadoDetalle = false; 
            }
        }
        
        return byMunicipio && byTipoRegistro && byEstadoDetalle;
    });

    useEffect(() => {
        if (mapInstance.current && mapLoaded) {
            markersRef.current.forEach(marker => {
                mapInstance.current.removeLayer(marker);
            });
            markersRef.current = [];

            filteredData.forEach((punto) => {
                if (punto.latitud && punto.longitud) {
                    const lat = parseFloat(punto.latitud);
                    const lng = parseFloat(punto.longitud);
                    
                    if (!isNaN(lat) && !isNaN(lng)) {
                        const markerColor = getMarkerColorGeneral(punto.tipo_registro, punto.estado_resultado, punto.rociado);
                        const markerIcon = getCircleIcon(markerColor);
                        
                        const marker = L.marker([lat, lng], {
                            icon: markerIcon
                        }).addTo(mapInstance.current);

                        const detailPath = punto.tipo_registro === 'denuncia' 
                                                 ? `/detalles-denuncia/${punto.id}` 
                                                 : `/detalles-ee1/${punto.id}`;

                        marker.bindPopup(`
                            <div style="text-align: left; min-width: 250px; font-size: 13px;">
                                <h4 style="margin: 0 0 8px 0; color: #333; border-bottom: 2px solid ${markerColor}; padding-bottom: 4px;">
                                    📍 ${punto.tipo_registro === 'denuncia' ? 'Denuncia' : 'EE'} #${punto.id}
                                </h4>
                                <p style="margin: 4px 0;"><strong>Municipio:</strong> ${punto.nombre_municipio}</p>
                                <p style="margin: 4px 0;"><strong>Comunidad:</strong> ${punto.nombre_comunidad}</p>
                                <p style="margin: 4px 0;">
                                    <strong>Estado:</strong> 
                                    <span style="color: ${markerColor}; font-weight: bold;">
                                        ${getEstadoTextGeneral(punto.tipo_registro, punto.estado_resultado, punto.rociado)}
                                    </span>
                                </p>
                                <p style="margin: 4px 0;"><strong>Fecha Registro:</strong> ${formatFecha(punto.fecha_registro)}</p>
                                
                                <button 
                                    class="btn-ver-detalles-mapa"
                                    data-path="${detailPath}"
                                    style="
                                        background-color: #45B7D1;
                                        color: white;
                                        border: none;
                                        padding: 6px 12px;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        margin-top: 8px;
                                        font-size: 12px;
                                    "
                                >
                                    Ver Detalles
                                </button>
                            </div>
                        `);

                        markersRef.current.push(marker);
                    }
                }
            });

            if (markersRef.current.length > 0) {
                const group = new L.featureGroup(markersRef.current);
                mapInstance.current.fitBounds(group.getBounds().pad(0.1));
            } else {
                mapInstance.current.setView([-17.3938, -66.1570], 9);
            }
        }
    }, [filteredData, mapLoaded]);
    
    // ... [Efecto para manejar la navegación se mantiene igual] ...
    useEffect(() => {
        const handlePopupClick = (event) => {
            if (event.target.classList.contains('btn-ver-detalles-mapa')) {
                const path = event.target.getAttribute('data-path');

                if (path) {
                    navigate(path); 
                    
                    if (mapInstance.current) {
                        mapInstance.current.closePopup();
                    }
                }
            }
        };

        document.addEventListener('click', handlePopupClick);

        return () => {
            document.removeEventListener('click', handlePopupClick);
        };
    }, [navigate]);

    const centerMapOnDefault = () => {
        if (mapInstance.current) {
            mapInstance.current.setView([-17.3938, -66.1570], 9);
        }
    };


    if (loading) {
        return (
            <div className="mapas-container">
                <div className="loading">Cargando mapa General desde la API... 🌍</div>
            </div>
        );
    }

// =========================================================================
// RENDERIZADO DEL COMPONENTE Y FILTROS (DISEÑO MEJORADO)
// =========================================================================

    const renderEstadoDetalleOptions = () => {
        if (selectedTipoRegistro === 'evaluacion_entomologica') {
            return (
                <>
                    <option value="todos">Todos los Estados de Rociado</option>
                    <option value="si">Rociado Realizado (Sí)</option>
                    <option value="no">Rociado Pendiente (No)</option>
                </>
            );
        } else if (selectedTipoRegistro === 'denuncia') {
            return (
                <>
                    <option value="todos">Todos los Estados de Denuncia</option>
                    <option value="recibida">Denuncia Recibida (Rojo)</option>
                    <option value="programada">Denuncia Programada (Amarillo)</option>
                    <option value="realizada">Denuncia Verificada/Realizada (Verde)</option>
                    <option value="cancelada">Denuncia Cancelada (Negro)</option>
                </>
            );
        } else {
            return (
                <option value="todos">N/A - Seleccione Tipo de Registro</option>
            );
        }
    };

    const estadoDetalleLabel = selectedTipoRegistro === 'denuncia' 
        ? 'Estado de Denuncia:' 
        : 'Rociado (EE):';
    
    return (
        <div className="mapas-container">
            <div className="mapas-header">
                <div>
                    <h1>MAPA GENERAL DE CHAGAS</h1>
                    <p>Visualización combinada de Evaluaciones Entomológicas y Denuncias.</p>
                </div>
            </div>

            {error && (
                <div className="error">
                    Error de conexión: {error}
                    <button 
                        onClick={() => window.location.reload()} 
                        className="btn-retry"
                    >
                        Reintentar Carga
                    </button>
                </div>
            )}

            {/* SECCIÓN DE FILTROS (DISEÑO MEJORADO) */}
            <div className="mapas-filters">
                
                {/* FILTRO 1: MUNICIPIO */}
                <div className="filter-group">
                    <label htmlFor="municipio-filter">Municipio:</label>
                    <select 
                        id="municipio-filter"
                        value={selectedMunicipio} 
                        onChange={(e) => setSelectedMunicipio(e.target.value)}
                        className="estado-filter"
                    >
                        <option value="todos">Todos</option>
                        {municipios.map(m => (
                            <option key={m.municipio_id} value={m.nombre_municipio}>
                                {m.nombre_municipio}
                            </option>
                        ))}
                        {municipios.length === 0 && !loading && <option disabled>No se cargaron municipios</option>}
                    </select>
                </div>
                
                {/* FILTRO 2: TIPO DE REGISTRO */}
                <div className="filter-group">
                    <label htmlFor="tipo-registro-filter">Tipo de Registro:</label>
                    <select 
                        id="tipo-registro-filter"
                        value={selectedTipoRegistro} 
                        onChange={(e) => {
                            setSelectedTipoRegistro(e.target.value);
                            setSelectedEstadoDetalle('todos');
                        }}
                        className="estado-filter"
                    >
                        <option value="todos">Todos</option>
                        <option value="evaluacion_entomologica">Evaluación Entomológica (EE)</option>
                        <option value="denuncia">Denuncia</option>
                    </select>
                </div>

                {/* FILTRO 3: ESTADO/DETALLE DINÁMICO */}
                <div className="filter-group">
                    <label htmlFor="estado-detalle-filter">{estadoDetalleLabel}</label>
                    <select 
                        id="estado-detalle-filter"
                        value={selectedEstadoDetalle} 
                        onChange={(e) => setSelectedEstadoDetalle(e.target.value)}
                        className="estado-filter"
                        disabled={selectedTipoRegistro === 'todos'} 
                    >
                        {renderEstadoDetalleOptions()}
                    </select>
                </div>

                {/* INFO DE REGISTROS (SE ELIMINAN LOS **) */}
                <div className="filter-info">
                    <span>Mostrando: {filteredData.length} registros</span>
                </div>
            </div>
            {/* FIN SECCIÓN DE FILTROS */}

            <div className="mapas-content">
                {showLegend && (
                    <div className="mapas-legend">
                        <h3>Leyenda General</h3>
                        <div className="legend-items">
                            <p style={{marginTop: '10px', fontWeight: 'bold'}}>Evaluación Entomológica (EE):</p>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: getMarkerColorGeneral('evaluacion_entomologica', 'positivo', 'No') }}></span>
                                <span>Positivo / Rociado Pendiente (Amarillo)</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: getMarkerColorGeneral('evaluacion_entomologica', 'positivo', 'Sí') }}></span>
                                <span>Positivo / Rociado Realizado (Verde)</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: getMarkerColorGeneral('evaluacion_entomologica', 'negativo', 'No') }}></span>
                                <span>Negativo / No Requiere Rociado (Negro)</span>
                            </div>
                            
                            <p style={{marginTop: '10px', fontWeight: 'bold'}}>Denuncias:</p>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: getMarkerColorGeneral('denuncia', 'recibida') }}></span>
                                <span>Denuncia Recibida (Rojo)</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: getMarkerColorGeneral('denuncia', 'programada') }}></span>
                                <span>Denuncia Programada (Amarillo)</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: getMarkerColorGeneral('denuncia', 'realizada') }}></span>
                                <span>Denuncia Verificada/Realizada (Verde)</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: getMarkerColorGeneral('denuncia', 'cancelada') }}></span>
                                <span>Denuncia Cancelada (Negro)</span>
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
                    <strong>Instrucciones:</strong> Este mapa combina datos de Evaluación Entomológica (EE) y Denuncias. 
                    El color del punto y el texto del popup se adaptan al tipo de registro. El filtro de Estado/Rociado es dinámico.
                </p>
            </div>
        </div>
    );
};

export default MapasGeneral;