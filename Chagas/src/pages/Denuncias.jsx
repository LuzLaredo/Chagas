import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { denunciasService } from '../services/denunciasService';
import { useAuth } from './AuthContext';
import CancelarDenuncia from './CancelarDenuncia';
import generalService from '../services/generalService';
import '../css/Denuncias.css';

const Denuncias = () => {
  const navigate = useNavigate();
  const { usuario, isAuthenticated } = useAuth();
  const [denuncias, setDenuncias] = useState([]);
  const [allDenuncias, setAllDenuncias] = useState([]); // Todas las denuncias
  const [municipios, setMunicipios] = useState([]);
  const [selectedMunicipio, setSelectedMunicipio] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('edit'); // 'edit', 'view'
  const [selectedDenuncia, setSelectedDenuncia] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [denunciaToCancel, setDenunciaToCancel] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    descripcion: '',
    fotos_vinchucas: '',
    fecha_denuncia: new Date().toISOString().split('T')[0],
    latitud: '',
    longitud: '',
    altura: '',
    estado_denuncia: 'recibida',
    fecha_programacion: '',
    fecha_ejecucion: '',
    vivienda_id: '',
    comunidad_id: ''
  });

  // Cargar denuncias del usuario al montar el componente
  useEffect(() => {
    loadDenuncias();
    loadMunicipios();
  }, []);

  const loadMunicipios = async () => {
    try {
      const data = await generalService.getMunicipios();
      setMunicipios(data || []);
    } catch (err) {
      console.error("Error cargando municipios:", err);
    }
  };

  const loadDenuncias = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificación más robusta
      if (!isAuthenticated || !usuario) {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Debe iniciar sesión para ver sus denuncias');
          setDenuncias([]);
          setLoading(false);
          return;
        }
        // Si hay token pero el contexto no está sincronizado, forzar recarga
        window.location.reload();
        return;
      }

      console.log('👤 Usuario autenticado:', usuario);
      console.log('🔐 Token en localStorage:', localStorage.getItem('token') ? 'Presente' : 'Ausente');

      const data = await denunciasService.getDenunciasByUser();
      console.log('✅ Denuncias del usuario cargadas:', data);

      setDenuncias(data || []);
    } catch (err) {
      console.error('❌ Error al cargar denuncias del usuario:', err);

      if (err.message.includes('401') || err.message.includes('Sesión expirada')) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        // Limpiar token expirado
        localStorage.removeItem('token');
        // Redirigir al login después de un tiempo
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Error al cargar sus denuncias. Verifica que el servidor esté funcionando.');
      }
      setDenuncias([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type, denuncia = null) => {
    setModalType(type);
    setSelectedDenuncia(denuncia);
    if (denuncia) {
      setFormData({
        descripcion: denuncia.descripcion || '',
        fotos_vinchucas: denuncia.fotos_vinchucas || '',
        fecha_denuncia: denuncia.fecha_denuncia || new Date().toISOString().split('T')[0],
        latitud: denuncia.latitud || '',
        longitud: denuncia.longitud || '',
        altura: denuncia.altura || '',
        estado_denuncia: denuncia.estado_denuncia || 'recibida',
        fecha_programacion: denuncia.fecha_programacion || '',
        fecha_ejecucion: denuncia.fecha_ejecucion || '',
        vivienda_id: denuncia.vivienda_id || '',
        comunidad_id: denuncia.comunidad_id || ''
      });
    }
    setShowModal(true);
  };

  const handleOpenCancelModal = (denuncia) => {
    setDenunciaToCancel(denuncia);
    setShowCancelModal(true);
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setDenunciaToCancel(null);
  };

  const handleCancelSuccess = () => {
    setShowCancelModal(false);
    setDenunciaToCancel(null);
    // Recargar la lista de denuncias
    loadDenuncias();
  };

  // Manejar cambio de municipio
  const handleMunicipioChange = (e) => {
    const municipio = e.target.value;
    setSelectedMunicipio(municipio);
    setCurrentPage(1); // Reset a primera página

    if (municipio === 'todos') {
      setDenuncias(allDenuncias);
    } else {
      const filtered = allDenuncias.filter(d => d.nombre_municipio === municipio);
      setDenuncias(filtered);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDenuncia(null);
    setFormData({
      descripcion: '',
      fotos_vinchucas: '',
      fecha_denuncia: new Date().toISOString().split('T')[0],
      latitud: '',
      longitud: '',
      altura: '',
      estado_denuncia: 'recibida',
      fecha_programacion: '',
      fecha_ejecucion: '',
      vivienda_id: '',
      comunidad_id: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (modalType === 'edit') {
        await denunciasService.updateDenuncia({
          denuncia_id: selectedDenuncia.denuncia_id,
          ...formData,
          vivienda_id: formData.vivienda_id ? parseInt(formData.vivienda_id) : null,
          comunidad_id: formData.comunidad_id ? parseInt(formData.comunidad_id) : null,
          latitud: formData.latitud ? parseFloat(formData.latitud) : null,
          longitud: formData.longitud ? parseFloat(formData.longitud) : null,
          altura: formData.altura ? parseFloat(formData.altura) : null
        });
        await loadDenuncias();
        handleCloseModal();
      }
    } catch (err) {
      console.error('Error al guardar denuncia:', err);
      setError('Error al guardar la denuncia. Verifica que el servidor esté funcionando.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta denuncia?')) {
      try {
        setError(null);
        await denunciasService.deleteDenuncia(id);
        await loadDenuncias();
      } catch (err) {
        console.error('Error al eliminar denuncia:', err);
        setError('Error al eliminar la denuncia. Verifica que el servidor esté funcionando.');
      }
    }
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'recibida': return 'estado-sin-revisar';
      case 'programada': return 'estado-en-proceso';
      case 'realizada': return 'estado-verificado';
      case 'cancelada': return 'estado-cancelada';
      case 'reprogramada': return 'estado-reprogramada';
      default: return '';
    }
  };


  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';

    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatFechaHora = (fecha) => {
    if (!fecha) return 'Sin fecha asignada aún';

    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Funciones de paginación
  const totalPages = Math.ceil(denuncias.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDenuncias = denuncias.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll suave hacia arriba de la tabla
    const tableContainer = document.querySelector('.denuncias-table-container');
    if (tableContainer) {
      tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      // Scroll suave hacia arriba de la tabla
      const tableContainer = document.querySelector('.denuncias-table-container');
      if (tableContainer) {
        tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      // Scroll suave hacia arriba de la tabla
      const tableContainer = document.querySelector('.denuncias-table-container');
      if (tableContainer) {
        tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  if (loading) {
    return (
      <div className="denuncias-container">
        <div className="loading">Cargando denuncias...</div>
      </div>
    );
  }

  return (
    <>
      <div className="denuncias-container">
        <div className="denuncias-header">
          <div>
            <h1>MIS DENUNCIAS</h1>
            {denuncias.length > 0 && (
              <p className="denuncias-count">
                Mostrando {startIndex + 1}-{Math.min(endIndex, denuncias.length)} de {denuncias.length} denuncias
              </p>
            )}
          </div>

          <div className="denuncias-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={selectedMunicipio}
              onChange={handleMunicipioChange}
              className="municipio-filter"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="todos">Todos los municipios</option>
              {municipios.map(m => (
                <option key={m.municipio_id} value={m.nombre_municipio}>
                  {m.nombre_municipio}
                </option>
              ))}
            </select>

            <button
              className="btn-add-denuncia"
              onClick={() => navigate('/registrar-denuncia')}
            >
              + Añadir Denuncia
            </button>
          </div>
        </div>

        {error && (
          <div className="error">
            {error}
            <button
              onClick={loadDenuncias}
              className="btn-retry"
              style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="denuncias-legend">
          <div className="legend-item">
            <span className="legend-dot estado-sin-revisar"></span>
            <span>Sin revisar</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot estado-en-proceso"></span>
            <span>En proceso</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot estado-verificado"></span>
            <span>Verificado</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot estado-cancelada"></span>
            <span>Cancelada</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot estado-reprogramada"></span>
            <span>ReProgramada</span>
          </div>
        </div>

        <div className="denuncias-table-container">
          {denuncias.length === 0 ? (
            <div className="no-denuncias">
              <p>No tienes denuncias registradas.</p>
              <p>Haz clic en "+ Añadir Denuncia" para crear tu primera denuncia.</p>
            </div>
          ) : currentDenuncias.length === 0 ? (
            <div className="no-denuncias">
              <p>No hay denuncias en esta página.</p>
              <p>Intenta cambiar de página o crear una nueva denuncia.</p>
            </div>
          ) : (
            <table className="denuncias-table">
              <thead>
                <tr>
                  <th>Jefe de Familia</th>
                  <th>N° Vivienda</th>
                  <th>Comunidad</th>
                  <th>Municipio</th>
                  <th>Descripción</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Visita programada</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentDenuncias.map((denuncia) => (
                  <tr key={denuncia.id || denuncia.denuncia_id}>
                    <td>{denuncia.jefe_familia || 'N/A'}</td>
                    <td>{denuncia.numero_vivienda || 'N/A'}</td>
                    <td>{denuncia.nombre_comunidad || 'N/A'}</td>
                    <td>{denuncia.nombre_municipio || 'N/A'}</td>
                    <td className="descripcion-cell">{denuncia.descripcion}</td>
                    {/* SOLO FECHA */}
                    <td>{formatFecha(denuncia.fecha_denuncia)}</td>
                    <td>
                      <span className={`estado-indicator ${getEstadoClass(denuncia.estado_denuncia)}`}>
                        {denuncia.estado_denuncia === 'recibida' ? 'Sin revisar' :
                          denuncia.estado_denuncia === 'programada' ? 'En proceso' :
                            denuncia.estado_denuncia === 'realizada' ? 'Verificado' :
                              denuncia.estado_denuncia === 'cancelada' ? 'Cancelada' : denuncia.estado_denuncia}
                      </span>
                    </td>
                    {/* FECHA Y HORA COMPLETA */}
                    <td>{formatFechaHora(denuncia.fecha_programacion)}</td>
                    <td className="acciones-cell">
                      <button
                        className="btn-action btn-view"
                        onClick={() => {
                          console.log('ID de denuncia:', denuncia.id, 'Denuncia completa:', denuncia);
                          navigate(`/detalles-denuncia/${denuncia.id}`);
                        }}
                        title="Ver detalles"
                      >
                        Ver Detalles
                      </button>

                      {/* 🆕 MOSTRAR BOTÓN CANCELAR SOLO SI NO ESTÁ VERIFICADA NI CANCELADA */}
                      {denuncia.estado_denuncia !== 'realizada' && denuncia.estado_denuncia !== 'cancelada' && (
                        <button
                          className="btn-action btn-cancel"
                          onClick={() => handleOpenCancelModal(denuncia)}
                          title="Cancelar denuncia"
                        >
                          X Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación - Solo se muestra si hay más de 10 registros */}
        {denuncias.length > itemsPerPage && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              ‹
            </button>

            {/* Mostrar páginas - Máximo 5 páginas visibles */}
            {(() => {
              const maxVisiblePages = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

              // Ajustar si estamos cerca del final
              if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }

              const pages = [];
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
                    onClick={() => handlePageChange(i)}
                  >
                    {i}
                  </button>
                );
              }
              return pages;
            })()}

            <button
              className="pagination-btn"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              ›
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {modalType === 'edit' && 'Editar Denuncia'}
                  {modalType === 'view' && 'Detalles de la Denuncia'}
                </h2>
                <button className="modal-close" onClick={handleCloseModal}>×</button>
              </div>

              {modalType === 'view' ? (
                <div className="modal-body">
                  <div className="form-group">
                    <label>Jefe de Familia:</label>
                    <p>{selectedDenuncia?.jefe_familia || 'N/A'}</p>
                  </div>
                  <div className="form-group">
                    <label>N° Vivienda:</label>
                    <p>{selectedDenuncia?.numero_vivienda || 'N/A'}</p>
                  </div>
                  <div className="form-group">
                    <label>Comunidad:</label>
                    <p>{selectedDenuncia?.nombre_comunidad || 'N/A'}</p>
                  </div>
                  <div className="form-group">
                    <label>Municipio:</label>
                    <p>{selectedDenuncia?.nombre_municipio || 'N/A'}</p>
                  </div>
                  <div className="form-group">
                    <label>Descripción:</label>
                    <p>{selectedDenuncia?.descripcion}</p>
                  </div>
                  <div className="form-group">
                    <label>Estado:</label>
                    <p className={getEstadoClass(selectedDenuncia?.estado_denuncia)}>
                      {selectedDenuncia?.estado_denuncia === 'recibida' ? 'Sin revisar' :
                        selectedDenuncia?.estado_denuncia === 'programada' ? 'En proceso' :
                          selectedDenuncia?.estado_denuncia === 'realizada' ? 'Verificado' :
                            selectedDenuncia?.estado_denuncia === 'cancelada' ? 'Cancelada' : selectedDenuncia?.estado_denuncia}
                    </p>
                  </div>
                  <div className="form-group">
                    <label>Fecha de denuncia:</label>
                    <p>{formatFecha(selectedDenuncia?.fecha_denuncia)}</p> {/* Solo fecha */}
                  </div>
                  <div className="form-group">
                    <label>Fecha programada:</label>
                    <p>{formatFechaHora(selectedDenuncia?.fecha_programacion)}</p> {/* Fecha y hora */}
                  </div>
                  <div className="form-group">
                    <label>Fecha de ejecución:</label>
                    <p>{formatFechaHora(selectedDenuncia?.fecha_ejecucion)}</p> {/* Fecha y hora */}
                  </div>
                  {selectedDenuncia?.fotos_vinchucas && (
                    <div className="form-group">
                      <label>Fotos de vinchucas:</label>
                      <p>{selectedDenuncia.fotos_vinchucas}</p>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="modal-body">
                  <div className="form-group">
                    <label htmlFor="vivienda_id">ID de Vivienda</label>
                    <input
                      type="number"
                      id="vivienda_id"
                      name="vivienda_id"
                      value={formData.vivienda_id}
                      onChange={handleInputChange}
                      placeholder="Opcional - ID de la vivienda"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="descripcion">Descripción *</label>
                    <textarea
                      id="descripcion"
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      rows="4"
                      required
                      placeholder="Describe el problema encontrado..."
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fotos_vinchucas">Fotos de Vinchucas</label>
                    <input
                      type="text"
                      id="fotos_vinchucas"
                      name="fotos_vinchucas"
                      value={formData.fotos_vinchucas}
                      onChange={handleInputChange}
                      placeholder="URL o descripción de las fotos"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fecha_denuncia">Fecha de Denuncia</label>
                    <input
                      type="date"
                      id="fecha_denuncia"
                      name="fecha_denuncia"
                      value={formData.fecha_denuncia}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="estado_denuncia">Estado</label>
                    <select
                      id="estado_denuncia"
                      name="estado_denuncia"
                      value={formData.estado_denuncia}
                      onChange={handleInputChange}
                    >
                      <option value="recibida">Sin revisar</option>
                      <option value="programada">En proceso</option>
                      <option value="realizada">Verificado</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="fecha_programacion">Fecha Programada</label>
                    <input
                      type="date"
                      id="fecha_programacion"
                      name="fecha_programacion"
                      value={formData.fecha_programacion}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fecha_ejecucion">Fecha de Ejecución</label>
                    <input
                      type="date"
                      id="fecha_ejecucion"
                      name="fecha_ejecucion"
                      value={formData.fecha_ejecucion}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="latitud">Latitud</label>
                    <input
                      type="number"
                      step="any"
                      id="latitud"
                      name="latitud"
                      value={formData.latitud}
                      onChange={handleInputChange}
                      placeholder="Ej: -17.3938"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="longitud">Longitud</label>
                    <input
                      type="number"
                      step="any"
                      id="longitud"
                      name="longitud"
                      value={formData.longitud}
                      onChange={handleInputChange}
                      placeholder="Ej: -66.1570"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="altura">Altura (metros)</label>
                    <input
                      type="number"
                      step="any"
                      id="altura"
                      name="altura"
                      value={formData.altura}
                      onChange={handleInputChange}
                      placeholder="Ej: 2550"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="comunidad_id">ID de Comunidad</label>
                    <input
                      type="number"
                      id="comunidad_id"
                      name="comunidad_id"
                      value={formData.comunidad_id}
                      onChange={handleInputChange}
                      placeholder="Opcional - ID de la comunidad"
                    />
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-save">
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Modal de Cancelar Denuncia - Renderizado fuera del contenedor principal */}
      {showCancelModal && denunciaToCancel && (
        <CancelarDenuncia
          denuncia={denunciaToCancel}
          onClose={handleCloseCancelModal}
          onSuccess={handleCancelSuccess}
        />
      )}
    </>
  );
};

export default Denuncias;