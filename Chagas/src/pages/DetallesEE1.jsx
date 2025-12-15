import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import "../css/DetallesEE1.css";

// Dirección base de tu API
const baseUrl = "http://localhost:5000";

/**
 * Función auxiliar para construir la URL de la imagen de forma segura.
 * Asume que el backend sirve archivos estáticos en /uploads/
 */
const buildImageUrl = (fileName) => {
    if (!fileName) {
        // Devuelve la ruta de la imagen de respaldo si no hay nombre de archivo
        return '/placeholder-vivienda.jpg';
    }
    // Construye la URL completa: http://localhost:5000/uploads/nombre_archivo.jpg
    return `${baseUrl}/uploads/${fileName}`;
};

const DetallesEE1 = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [detalle, setDetalle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    useEffect(() => {
        const URL_API = `${baseUrl}/api/detallesEE1/${id}`;

        const fetchDetalle = async () => {
            try {
                const response = await axios.get(URL_API);
                setDetalle(response.data);
            } catch (err) {
                console.error("Error al cargar detalles de EE1:", err);
                setError("No se pudieron cargar los datos de la evaluación. Verifica la conexión con el backend.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetalle();
    }, [id]);

    // Inicializar el mapa cuando detalle esté disponible
    useEffect(() => {
        if (detalle && mapRef.current) {
            // Limpiar instancia anterior si existe
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }

            const lat = parseFloat(detalle.latitud) || -17.3938;
            const lng = parseFloat(detalle.longitud) || -66.1570;

            // Solo inicializar si la referencia del mapa no está siendo usada
            if (!mapInstance.current) {
                mapInstance.current = L.map(mapRef.current, {
                    center: [lat, lng],
                    zoom: 15,
                    scrollWheelZoom: false
                });

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(mapInstance.current);

                L.marker([lat, lng]).addTo(mapInstance.current);
            }

            // Invalidar el tamaño del mapa para asegurar que se muestre correctamente
            setTimeout(() => {
                if (mapInstance.current) {
                    mapInstance.current.invalidateSize();
                }
            }, 100);

            return () => {
                if (mapInstance.current) {
                    mapInstance.current.remove();
                    mapInstance.current = null;
                }
            };
        }
    }, [detalle]);

    if (loading) return <div className="loading-message">Cargando detalles...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!detalle) return <div className="not-found-message">Detalles de EE1 no encontrados.</div>;

    // Lógica simplificada: solo necesitamos el resultado
    const resultado = detalle.resultado_ee?.toLowerCase() || "";
    const resultClass = `result-${resultado}`;

    // Mostrar aviso si el resultado es positivo
    const mostrarAvisoPositivo = resultado === "positivo";

    // Función para renderizar equipo técnico y jefes de brigada
    const renderEquipo = () => {
        const equipo = [];
        
        // Añadir técnico si existe
        if (detalle.tecnico_nombre) {
            equipo.push(
                <div key="tecnico" className="equipo-item">
                    <span className="equipo-rol">Técnico responsable:</span>
                    <span className="equipo-nombre">{detalle.tecnico_nombre}</span>
                </div>
            );
        }
        
        // Añadir jefes de brigada (hasta 4)
        const jefesBrigada = [
            { id: detalle.jefe1_id, nombre: detalle.jefe1_nombre, numero: 1 },
            { id: detalle.jefe2_id, nombre: detalle.jefe2_nombre, numero: 2 },
            { id: detalle.jefe3_id, nombre: detalle.jefe3_nombre, numero: 3 },
            { id: detalle.jefe4_id, nombre: detalle.jefe4_nombre, numero: 4 }
        ];
        
        jefesBrigada.forEach(jefe => {
            if (jefe.id && jefe.nombre) {
                equipo.push(
                    <div key={`jefe${jefe.numero}`} className="equipo-item">
                        <span className="equipo-rol">Jefe de brigada {jefe.numero}:</span>
                        <span className="equipo-nombre">{jefe.nombre}</span>
                    </div>
                );
            }
        });
        
        return equipo;
    };

    return (
        <div className="detalles-ee1-container">
            <header className="detalles-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    &larr; Volver
                </button>
                <h1 className="title">DETALLE DE EVALUACIÓN</h1>
            </header>

            <div className="content-grid">
                <div className="info-column">
                    <div className="info-panel general-data">
                        <h2 className="panel-title">Datos generales</h2>
                        <p>
                            <strong>Resultado de Evaluación:</strong>
                            <span className={`result-tag ${resultClass}`}>
                                {detalle.resultado_ee ? detalle.resultado_ee.toUpperCase() : 'N/A'}
                            </span>
                        </p>

                        <p><strong>Nombre del jefe de familia:</strong> {detalle.jefe_familia}</p>
                        <p><strong>N° de vivienda:</strong> {detalle.n_vivienda}</p>
                        <p><strong>N° de habitantes:</strong> {detalle.n_habitantes}</p>
                        <p><strong>Comunidad:</strong> {detalle.comunidad}</p>
                        <p><strong>Municipio:</strong> {detalle.municipio}</p>
                    </div>

                    {/* BLOQUE DE EQUIPO QUE LLENÓ EL EE1 */}

                    {/* BLOQUE DE AVISO: Se muestra solo si es POSITIVO */}
                    {mostrarAvisoPositivo && (
                        <div className="info-panel denuncia-box" style={{
                            backgroundColor: '#fff3cd',
                            border: '1px solid #ffeeba',
                            padding: '15px',
                            borderRadius: '8px',
                            marginTop: '20px'
                         }}>
                            <h2 className="panel-title" style={{ color: '#856404', margin: '0 0 10px 0' }}>🚨 Aviso: Resultado Positivo</h2>
                            <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.4' }}>
                                Se requiere una acción de control vectorial.
                                <br/><br/>
                                <b>INSTRUCCION</b> Pida al Jefe de Familia <b>{detalle.jefe_familia}</b> que inicie una <b>Denuncia</b> para proceder con la intervención (Rociado).
                            </p>
                        </div>
                    )}
                </div>

                <div className="media-column">
                    <div className="media-box">
                        <h3 className="media-title">Foto de la Vivienda</h3>
                        <div className="image-container">
                            <img
                                src={buildImageUrl(detalle.foto_entrada)}
                                alt={`Foto de la entrada de la vivienda ${detalle.n_vivienda}`}
                                className="vivienda-image"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/placeholder-vivienda.jpg';
                                }}
                            />
                        </div>
                    </div>

                    <div className="media-box map-container">
                        <h3 className="media-title">Ubicación Geográfica</h3>
                        <div
                            ref={mapRef}
                            style={{ width: '100%', height: '300px', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                        <div className="coords-info">
                            <small>Coordenadas: {detalle.latitud}, {detalle.longitud}</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetallesEE1;