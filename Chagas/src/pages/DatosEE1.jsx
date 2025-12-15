import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import '../css/DatosEE1.css';
 
import entomologicaService from '../services/entomologicaService';
import generalService from '../services/generalService';
import { baseUrl } from '../api/BaseUrl';
 
// =========================================================================
// FUNCIONES AUXILIARES
// =========================================================================
 
const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
        return new Date(fecha).toLocaleDateString('es-BO');
    } catch {
        return fecha;
    }
};
 
const getMarkerColorEE1 = (resultado, estadoRociado) => {
    if (resultado === 'positivo') {
        switch (estadoRociado) {
            case 'Rociado Realizado': return '#007bff';
            case 'Pendiente de Rociado': return '#dc3545';
            default: return '#fd7e14';
        }
    } else if (resultado === 'negativo') {
        return '#28a745';
    }
    return '#6c757d';
};
 
// =========================================================================
// COMPONENTE PRINCIPAL
// =========================================================================
 
const DatosEE1 = () => {
    const navigate = useNavigate();
    const { usuario, token } = useAuth();
    const [ee1Data, setEe1Data] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedMunicipio, setSelectedMunicipio] = useState('todos');
    const [selectedResultado, setSelectedResultado] = useState('todos');
 
    const handleViewDetails = (id) => {
        navigate(`/DetallesEE1/${id}`);
    };
 
    // =========================================================================
    // CARGA DE DATOS
    // =========================================================================
 
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                
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
                    setEe1Data(ee1DataResponse || []);
                } else {
                    // Para otros roles, cargar todos los datos
                    const [ee1DataResponse, municipiosResponse] = await Promise.all([
                        entomologicaService.getMapaEE1(),
                        generalService.getMunicipios()
                    ]);

                    setEe1Data(ee1DataResponse || []);
                    setMunicipios(municipiosResponse || []);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar datos.';
                console.error('Error al cargar datos EE1 o Municipios:', err);
                setError(`Error al cargar los datos de EE1: ${errorMessage}`);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [usuario, token]);
 
    // =========================================================================
    // FILTRADO
    // =========================================================================
 
    const filteredData = ee1Data.filter(d => {
        const byMunicipio = selectedMunicipio === 'todos' || d.nombre_municipio === selectedMunicipio;
        const byResultado = selectedResultado === 'todos' || d.resultado === selectedResultado;
        return byMunicipio && byResultado;
    });
 
    // =========================================================================
    // ESTADOS DE CARGA Y ERROR
    // =========================================================================
 
    if (loading) {
        return (
            <div className="mapas-container" style={{ textAlign: 'center', padding: '50px' }}>
                <div className="loading">Cargando datos tabulares EE1...</div>
            </div>
        );
    }
 
    if (error) {
        return (
            <div className="mapas-container" style={{ textAlign: 'center', padding: '50px' }}>
                <div className="error">{error}</div>
            </div>
        );
    }
 
    // =========================================================================
    // ESTILOS DE TABLA
    // =========================================================================
 
    const tableStyle = {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginTop: '20px'
    };
 
    const thStyle = {
        backgroundColor: '#45B7D1',
        color: 'white',
        padding: '12px 15px',
        textAlign: 'left',
        fontSize: '14px',
    };
 
    const tdStyle = {
        padding: '12px 15px',
        borderBottom: '1px solid #f0f0f0',
        textAlign: 'left',
        fontSize: '13px',
    };
 
    const buttonStyle = {
        backgroundColor: '#ffc107',
        color: 'black',
        border: 'none',
        padding: '6px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '12px'
    };
 
    const getRowStyle = (index) => ({
        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9'
    });
 
    // =========================================================================
    // RENDERIZADO
    // =========================================================================
 
    return (
        <div className="mapas-container" style={{ padding: '20px' }}>
            <div className="mapas-header">
                <h1>DATOS DE EVALUACIÓN ENTOMOLÓGICA 1 (EE1)</h1>
                <p>Visualización tabular de registros. Use los filtros para ver datos específicos.</p>
            </div>
 
            {/* FILTROS */}
            <div className="mapas-filters" style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
               
                <div>
                    <label>Municipio:</label>
                    <select
                        value={selectedMunicipio}
                        onChange={(e) => setSelectedMunicipio(e.target.value)}
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
                                <option value="todos">Todos</option>
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
 
                <div>
                    <label>Resultado:</label>
                    <select
                        value={selectedResultado}
                        onChange={(e) => setSelectedResultado(e.target.value)}
                    >
                        <option value="todos">Todos</option>
                        <option value="positivo">Positivo</option>
                        <option value="negativo">Negativo</option>
                    </select>
                </div>
            </div>
 
            {/* TABLA */}
            <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, borderTopLeftRadius: '8px' }}>ID</th>
                            <th style={thStyle}>Municipio</th>
                            <th style={thStyle}>Comunidad</th>
                            <th style={thStyle}>Resultado</th>
                            <th style={{ ...thStyle, borderTopRightRadius: '8px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ ...tdStyle, textAlign: 'center' }}>
                                    No se encontraron coincidencias.
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((punto, index) => {
                                const resultadoColor = getMarkerColorEE1(punto.resultado, punto.estado_rociado);
 
                                return (
                                    <tr key={punto.id} style={getRowStyle(index)}>
                                        <td style={tdStyle}>{punto.id}</td>
                                        <td style={tdStyle}>{punto.nombre_municipio}</td>
                                        <td style={tdStyle}>{punto.nombre_comunidad}</td>
                                        <td style={{ ...tdStyle, fontWeight: 'bold', color: resultadoColor }}>
                                            {punto.resultado ? punto.resultado.toUpperCase() : 'N/A'}
                                        </td>
                                        <td style={tdStyle}>
                                            <button
                                                onClick={() => handleViewDetails(punto.id)}
                                                style={buttonStyle}
                                            >
                                                Ver Más Información
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
 
export default DatosEE1;