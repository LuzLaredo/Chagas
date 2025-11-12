import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Importación del archivo CSS (ya creado)
import '../css/Mapas.css'; 

// Importación de servicios (los tipos ya no son necesarios en este archivo JSX)
import entomologicaService from '../services/entomologicaService';
import generalService from '../services/generalService';

// =========================================================================
// CONFIGURACIÓN DE LEAFLET E ICONOS
// =========================================================================
// Fix para que los iconos de Leaflet se carguen correctamente
// Se usa 'as any' para evitar errores de tipado, aunque en JSX esto es JS puro
delete (L.Icon.Default.prototype)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Iconos personalizados para el Mapa EE1 (círculos)
const getCircleIcon = (color) => {
    return new L.DivIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 10px; height: 10px; border-radius: 50%; border: 1px solid white;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
};

const MapasEE1 = () => {
    const navigate = useNavigate();
    // Uso de useState sin tipificación explícita (JavaScript puro)
    const [ee1Data, setEe1Data] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Estados para filtros
    const [selectedMunicipio, setSelectedMunicipio] = useState('todos');
    const [selectedResultado, setSelectedResultado] = useState('todos');
    const [selectedRociado, setSelectedRociado] = useState('todos');

    const [showLegend] = useState(true);
    
    // Referencias para el mapa
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]);

    // =========================================================================
    // LÓGICA DE ESTILOS Y COLORES
    // =========================================================================

    // Colores basados en el resultado de EE1 y el estado del rociado
    const getMarkerColorEE1 = (resultado, estadoRociado) => {
        if (resultado === 'positivo') {
            switch (estadoRociado) {
                case 'Rociado Realizado': return '#007bff'; // Azul
                case 'Pendiente de Rociado': return '#dc3545'; // Rojo
                default: return '#fd7e14'; // Naranja (Positivo, estado indefinido)
            }
        } else if (resultado === 'negativo') {
            return '#28a745'; // Verde
        }
        return '#6c757d'; // Gris por defecto
    };

    const getEstadoTextEE1 = (resultado, estadoRociado) => {
        return `Resultado: ${resultado.toUpperCase()} | Rociado: ${estadoRociado}`;
    };

    // Función de formato de fecha
    const formatFecha = (fecha) => {
        if (!fecha) return 'N/A';
        try {
            return new Date(fecha).toLocaleDateString('es-BO');
        } catch {
            return fecha;
        }
    };
    
    // Función para manejar la navegación a la vista tabular
    const navigateToDatosEE1 = () => {
        navigate('/DatosEE1'); // Esta debe ser la ruta configurada para tu componente DatosEE1.jsx
    };

    // =========================================================================
    // CARGA DE DATOS Y MAPA
    // =========================================================================

    // Cargar datos al montar el componente (EE1 y Municipios)
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // USANDO AMBOS SERVICIOS EXTERNOS
                const [ee1DataResponse, municipiosResponse] = await Promise.all([
                    entomologicaService.getMapaEE1(),
                    generalService.getMunicipios() // Usamos GeneralService para obtener los municipios
                ]);

                setEe1Data(ee1DataResponse || []);
                setMunicipios(municipiosResponse || []);

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar datos.';
                console.error('Error al cargar datos EE1 o Municipios:', err);
                setError(`Error al cargar los datos para el mapa EE1: ${errorMessage}`);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Inicializar el mapa
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
                markersRef.current = [];
                setMapLoaded(false);
            }
        };
    }, []);


    // Función de filtrado de datos combinada
    const filteredData = ee1Data.filter(d => {
        const byMunicipio = selectedMunicipio === 'todos' || d.nombre_municipio === selectedMunicipio;
        const byResultado = selectedResultado === 'todos' || d.resultado === selectedResultado;
        const byRociado = selectedRociado === 'todos' || 
                              d.estado_rociado === selectedRociado;
        
        return byMunicipio && byResultado && byRociado;
    });


    // Actualizar marcadores cuando cambien los datos o los filtros
    useEffect(() => {
        if (mapInstance.current && mapLoaded) {
            
            // Limpiar marcadores existentes
            markersRef.current.forEach(marker => {
                // Usamos ! para indicar que confiamos en que mapInstance.current existe
                mapInstance.current.removeLayer(marker); 
            });
            markersRef.current = [];

            // Agregar marcadores para cada punto filtrado
            filteredData.forEach((punto) => {
                if (punto.latitud && punto.longitud) {
                    const lat = parseFloat(punto.latitud);
                    const lng = parseFloat(punto.longitud);
                    
                    if (!isNaN(lat) && !isNaN(lng)) {
                        const markerColor = getMarkerColorEE1(punto.resultado, punto.estado_rociado);
                        const markerIcon = getCircleIcon(markerColor);
                        
                        const marker = L.marker([lat, lng], {
                            icon: markerIcon
                        }).addTo(mapInstance.current); // Usamos .current directamente

                        // Ruta de detalles (asumiendo que existe una ruta para EE1)
                        const detailPath = `/detalles-ee1/${punto.id}`; 

                        marker.bindPopup(`
                            <div style="text-align: left; min-width: 250px; font-size: 13px;">
                                <h4 style="margin: 0 0 8px 0; color: #333; border-bottom: 2px solid ${markerColor}; padding-bottom: 4px;">
                                    🔬 Evaluación Entomológica #${punto.id}
                                </h4>
                                <p style="margin: 4px 0;"><strong>Municipio:</strong> ${punto.nombre_municipio}</p>
                                <p style="margin: 4px 0;"><strong>Comunidad:</strong> ${punto.nombre_comunidad}</p>
                                <p style="margin: 4px 0;">
                                    <strong>Resultado:</strong> 
                                    <span style="color: ${markerColor}; font-weight: bold;">
                                        ${punto.resultado.toUpperCase()}
                                    </span>
                                </p>
                                <p style="margin: 4px 0;"><strong>Estado Rociado:</strong> ${punto.estado_rociado}</p>
                                <p style="margin: 4px 0;"><strong>Fecha Programada:</strong> ${formatFecha(punto.fecha_programada)}</p>
                                
                                <a href="${detailPath}" 
                                        style="
                                            display: inline-block;
                                            background-color: #45B7D1;
                                            color: white;
                                            text-decoration: none;
                                            border: none;
                                            padding: 6px 12px;
                                            border-radius: 4px;
                                            cursor: pointer;
                                            margin-top: 8px;
                                            font-size: 12px;
                                        ">
                                    Ver Detalles
                                </a>
                            </div>
                        `);

                        markersRef.current.push(marker);
                    }
                }
            });

            // Ajustar la vista si hay marcadores
            if (markersRef.current.length > 0) {
                const group = new L.featureGroup(markersRef.current);
                mapInstance.current.fitBounds(group.getBounds().pad(0.1));
            } else {
                mapInstance.current.setView([-17.3938, -66.1570], 9);
            }
        }
    }, [filteredData, mapLoaded]);

    const centerMapOnDefault = () => {
        if (mapInstance.current) {
            mapInstance.current.setView([-17.3938, -66.1570], 9);
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
                <div style={{ flexGrow: 1 }}>
                    <h1>MAPA DE EVALUACIÓN ENTOMOLÓGICA 1 (EE1)</h1>
                    <p>Visualización de puntos de Evaluación Entomológica y su estado de rociado asociado.</p>
                </div>
                {/* BOTÓN AGREGADO AQUÍ */}
                <button 
                    onClick={navigateToDatosEE1}
                    style={{
                        backgroundColor: '#ffc107', // Color distintivo para el botón alternativo
                        color: '#333',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        marginLeft: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    title="Ver los datos en formato de tabla"
                >
                    📋 Ver Datos Tabulares (Alternativa)
                </button>
            </div>

            {error && (
                <div className="error-box">
                    {error}
                    <button 
                        onClick={() => window.location.reload()} 
                        className="btn-retry"
                    >
                        Reintentar Carga
                    </button>
                </div>
            )}

            <div className="mapas-filters">
                {/* FILTRO POR MUNICIPIO */}
                <div className="filter-group">
                    <label htmlFor="municipio-filter">Filtrar por Municipio:</label>
                    <select 
                        id="municipio-filter"
                        value={selectedMunicipio} 
                        onChange={(e) => setSelectedMunicipio(e.target.value)}
                        className="estado-filter"
                    >
                        <option value="todos">Todos los Municipios</option>
                        {municipios.map(m => (
                            <option key={m.municipio_id} value={m.nombre_municipio}>
                                {m.nombre_municipio}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* FILTRO POR RESULTADO */}
                <div className="filter-group">
                    <label htmlFor="resultado-filter">Filtrar por Resultado:</label>
                    <select 
                        id="resultado-filter"
                        value={selectedResultado} 
                        onChange={(e) => setSelectedResultado(e.target.value)}
                        className="estado-filter"
                    >
                        <option value="todos">Todos los Resultados</option>
                        <option value="positivo">Positivo</option>
                        <option value="negativo">Negativo</option>
                    </select>
                </div>

                {/* FILTRO POR ESTADO DE ROCIADO */}
                <div className="filter-group">
                    <label htmlFor="rociado-filter">Filtrar por Estado de Rociado:</label>
                    <select 
                        id="rociado-filter"
                        value={selectedRociado} 
                        onChange={(e) => setSelectedRociado(e.target.value)}
                        className="estado-filter"
                    >
                        <option value="todos">Todos los Estados</option>
                        <option value="Rociado Realizado">Rociado Realizado</option>
                        <option value="Pendiente de Rociado">Pendiente de Rociado</option>
                        <option value="No Requiere Rociado">No Requiere Rociado</option>
                    </select>
                </div>

                <div className="filter-info">
                    <span>Mostrando: **{filteredData.length}** registros EE1</span>
                </div>
            </div>

            <div className="mapas-content">
                {showLegend && (
                    <div className="mapas-legend">
                        <h3>Leyenda EE1</h3>
                        <div className="legend-items">
                            <p style={{marginTop: '10px', fontWeight: 'bold'}}>Resultado Positivo:</p>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: getMarkerColorEE1('positivo', 'Pendiente de Rociado') }}></span>
                                <span>Pendiente de Rociado (Riesgo Alto)</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: getMarkerColorEE1('positivo', 'Rociado Realizado') }}></span>
                                <span>Rociado Realizado (Positivo Controlado)</span>
                            </div>
                            
                            <p style={{marginTop: '10px', fontWeight: 'bold'}}>Resultado Negativo:</p>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: getMarkerColorEE1('negativo', 'No Requiere Rociado') }}></span>
                                <span>Negativo / No Requiere Rociado</span>
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
                    Los marcadores se colorean según si el resultado fue positivo/negativo y si el rociado ya fue realizado.
                </p>
            </div>
        </div>
    );
};

export default MapasEE1;