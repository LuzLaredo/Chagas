import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Importación del archivo CSS (ya creado, se asume que contiene estilos para 'mapas-container', etc.)
import '../css/DatosEE1.css'; 

// Importación de servicios
import entomologicaService from '../services/entomologicaService';
import generalService from '../services/generalService';

// =========================================================================
// FUNCIONES AUXILIARES (Copiadas/Adaptadas de MapasEE1.jsx)
// =========================================================================

// Función de formato de fecha
const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
        // Formato para Bolivia (es-BO)
        return new Date(fecha).toLocaleDateString('es-BO'); 
    } catch {
        return fecha;
    }
};

// Función para obtener el color del marcador/texto (adaptada para usar en texto de la tabla)
const getMarkerColorEE1 = (resultado, estadoRociado) => {
    if (resultado === 'positivo') {
        switch (estadoRociado) {
            case 'Rociado Realizado': return '#007bff'; // Azul (Positivo Controlado)
            case 'Pendiente de Rociado': return '#dc3545'; // Rojo (Riesgo Alto)
            default: return '#fd7e14'; // Naranja (Positivo, estado indefinido)
        }
    } else if (resultado === 'negativo') {
        return '#28a745'; // Verde (Negativo)
    }
    return '#6c757d'; // Gris por defecto
};

// =========================================================================
// COMPONENTE DATOSEE1
// =========================================================================

const DatosEE1 = () => {
    const navigate = useNavigate();
    const [ee1Data, setEe1Data] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para filtros
    const [selectedMunicipio, setSelectedMunicipio] = useState('todos');
    const [selectedResultado, setSelectedResultado] = useState('todos');
    const [selectedRociado, setSelectedRociado] = useState('todos');
    
    // Función de navegación para el botón
    const handleViewDetails = (id) => {
        // Navega a la ruta de detalles, como se definió en MapasEE1
        navigate(`/detalles-ee1/${id}`);
    };

    // =========================================================================
    // CARGA DE DATOS
    // =========================================================================

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Carga de datos de EE1 y Municipios en paralelo
                const [ee1DataResponse, municipiosResponse] = await Promise.all([
                    entomologicaService.getMapaEE1(),
                    generalService.getMunicipios() 
                ]);

                setEe1Data(ee1DataResponse || []);
                setMunicipios(municipiosResponse || []);

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar datos.';
                console.error('Error al cargar datos EE1 o Municipios:', err);
                setError(`Error al cargar los datos de EE1: ${errorMessage}`);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // =========================================================================
    // LÓGICA DE FILTRADO
    // =========================================================================

    // Función de filtrado de datos combinada (misma lógica que MapasEE1)
    const filteredData = ee1Data.filter(d => {
        const byMunicipio = selectedMunicipio === 'todos' || d.nombre_municipio === selectedMunicipio;
        const byResultado = selectedResultado === 'todos' || d.resultado === selectedResultado;
        const byRociado = selectedRociado === 'todos' || d.estado_rociado === selectedRociado;
        
        return byMunicipio && byResultado && byRociado;
    });

    // =========================================================================
    // VISTAS DE ESTADO (Loading y Error)
    // =========================================================================

    if (loading) {
        return (
            <div className="mapas-container" style={{ textAlign: 'center', padding: '50px' }}>
                <div className="loading">Cargando datos tabulares EE1...</div>
            </div>
        );
    }
    
    // =========================================================================
    // RENDERIZADO DEL COMPONENTE
    // =========================================================================
    
    // Estilos básicos para la tabla (simulando una tabla moderna)
    const tableStyle = {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        marginTop: '20px'
    };

    const thStyle = {
        backgroundColor: '#45B7D1', // Azul claro, tono corporativo
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
        backgroundColor: '#ffc107', // Amarillo/Naranja similar al botón "Edit" original
        color: 'black',
        border: 'none',
        padding: '6px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '12px',
        transition: 'background-color 0.2s',
    };
    
    // Aplica el color de fondo para filas pares/impares
    const getRowStyle = (index) => ({
        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9',
    });


    return (
        <div className="mapas-container" style={{ padding: '20px' }}>
            <div className="mapas-header">
                <div>
                    <h1>DATOS DE EVALUACIÓN ENTOMOLÓGICA 1 (EE1)</h1>
                    <p>Visualización tabular de registros EE1. Use los filtros para ver datos específicos.</p>
                </div>
            </div>

            {error && (
                <div className="error-box" style={{ padding: '15px', border: '1px solid #dc3545', color: '#dc3545', margin: '20px 0', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
                    {error}
                    <button 
                        onClick={() => window.location.reload()} 
                        className="btn-retry"
                        style={{ marginLeft: '15px', padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Reintentar Carga
                    </button>
                </div>
            )}

            {/* FILTROS */}
            <div className="mapas-filters" style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                
                {/* FILTRO POR MUNICIPIO */}
                <div className="filter-group">
                    <label htmlFor="municipio-filter" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filtrar por Municipio:</label>
                    <select 
                        id="municipio-filter"
                        value={selectedMunicipio} 
                        onChange={(e) => setSelectedMunicipio(e.target.value)}
                        className="estado-filter"
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' }}
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
                    <label htmlFor="resultado-filter" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filtrar por Resultado:</label>
                    <select 
                        id="resultado-filter"
                        value={selectedResultado} 
                        onChange={(e) => setSelectedResultado(e.target.value)}
                        className="estado-filter"
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' }}
                    >
                        <option value="todos">Todos los Resultados</option>
                        <option value="positivo">Positivo</option>
                        <option value="negativo">Negativo</option>
                    </select>
                </div>

                {/* FILTRO POR ESTADO DE ROCIADO */}
                <div className="filter-group">
                    <label htmlFor="rociado-filter" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filtrar por Estado de Rociado:</label>
                    <select 
                        id="rociado-filter"
                        value={selectedRociado} 
                        onChange={(e) => setSelectedRociado(e.target.value)}
                        className="estado-filter"
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' }}
                    >
                        <option value="todos">Todos los Estados</option>
                        <option value="Rociado Realizado">Rociado Realizado</option>
                        <option value="Pendiente de Rociado">Pendiente de Rociado</option>
                        <option value="No Requiere Rociado">No Requiere Rociado</option>
                    </select>
                </div>

                <div className="filter-info">
                    <span style={{ fontWeight: 'bold' }}>Mostrando: {filteredData.length} registros EE1</span>
                </div>
            </div>

            {/* TABLA DE DATOS */}
            <div className="datos-table-container" style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, borderTopLeftRadius: '8px' }}>ID</th>
                            <th style={thStyle}>Municipio</th>
                            <th style={thStyle}>Comunidad</th>
                            <th style={thStyle}>Resultado</th>
                            <th style={thStyle}>Estado Rociado</th>
                            <th style={thStyle}>Fecha Programada</th>
                            <th style={{ ...thStyle, borderTopRightRadius: '8px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ ...tdStyle, textAlign: 'center', padding: '30px' }}>
                                    No se encontraron registros que coincidan con los filtros aplicados.
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((punto, index) => {
                                // Obtiene el color para resaltar el resultado
                                const resultadoColor = getMarkerColorEE1(punto.resultado, punto.estado_rociado);
                                
                                return (
                                    <tr key={punto.id} style={getRowStyle(index)}>
                                        <td style={tdStyle}>{punto.id}</td>
                                        <td style={tdStyle}>{punto.nombre_municipio}</td>
                                        <td style={tdStyle}>{punto.nombre_comunidad}</td>
                                        <td style={{ ...tdStyle, fontWeight: 'bold', color: resultadoColor }}>
                                            {punto.resultado.toUpperCase()}
                                        </td>
                                        <td style={tdStyle}>{punto.estado_rociado}</td>
                                        <td style={tdStyle}>{formatFecha(punto.fecha_programada)}</td>
                                        <td style={tdStyle}>
                                            <button 
                                                onClick={() => handleViewDetails(punto.id)}
                                                style={buttonStyle}
                                                // Manejar el hover directamente en el código del componente si fuera necesario, 
                                                // pero se recomienda usar CSS para el :hover.
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

            <div className="mapas-info" style={{ marginTop: '30px', padding: '15px', borderTop: '1px solid #ddd' }}>
                <p>
                    <strong>Nota:</strong> Los colores en la columna **Resultado** corresponden a la leyenda del mapa: <span style={{color: '#dc3545', fontWeight: 'bold'}}>Rojo</span> para Positivo pendiente de Rociado, <span style={{color: '#007bff', fontWeight: 'bold'}}>Azul</span> para Positivo Rociado Realizado, y <span style={{color: '#28a745', fontWeight: 'bold'}}>Verde</span> para Negativo.
                </p>
            </div>
        </div>
    );
};

export default DatosEE1;