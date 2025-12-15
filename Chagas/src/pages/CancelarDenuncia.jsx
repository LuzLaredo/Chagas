import React, { useState, useEffect } from 'react';
import { denunciasService } from '../services/denunciasService';
import '../css/CancelarDenuncia.css';

const CancelarDenuncia = ({ denuncia, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Estados del formulario
  const [motivo, setMotivo] = useState('');
  const [comentarios, setComentarios] = useState('');

  // 🆕 VERIFICAR SI LA DENUNCIA PUEDE SER CANCELADA
  useEffect(() => {
    if (denuncia && (denuncia.estado_denuncia === 'realizada' || denuncia.estado_denuncia === 'cancelada')) {
      setError('Esta denuncia no puede ser cancelada porque ya ha sido verificada o está cancelada');
    }
  }, [denuncia]);

  // Motivos de cancelación disponibles
  const motivos = [
    {
      id: 'error_registro',
      titulo: 'Error en el registro',
      descripcion: 'La denuncia fue registrada por error o con información incorrecta'
    },
    {
      id: 'problema_resuelto',
      titulo: 'Problema resuelto',
      descripcion: 'El avistamiento de vinchucas ya fue atendido o solucionado'
    },
    {
      id: 'falsa_alarma',
      titulo: 'Falsa alarma',
      descripcion: 'Se identificó que no eran vinchucas u otro insecto'
    },
    {
      id: 'denuncia_duplicada',
      titulo: 'Denuncia duplicada',
      descripcion: 'Esta denuncia ya fue registrada anteriormente'
    },
    {
      id: 'cambio_direccion',
      titulo: 'Cambio de dirección',
      descripcion: 'Ya no resido en la dirección donde se reportó el avistamiento'
    },
    {
      id: 'otro_motivo',
      titulo: 'Otro motivo',
      descripcion: 'Especifique el motivo en la sección de comentarios'
    }
  ];

  const handleMotivoChange = (motivoId) => {
    setMotivo(motivoId);
    setError(null);
  };

  const handleComentariosChange = (e) => {
    setComentarios(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 🆕 VALIDAR QUE LA DENUNCIA PUEDA SER CANCELADA
    if (denuncia.estado_denuncia === 'realizada' || denuncia.estado_denuncia === 'cancelada') {
      setError('Esta denuncia no puede ser cancelada porque ya ha sido verificada o está cancelada');
      setLoading(false);
      return;
    }

    // Validar que se haya seleccionado un motivo
    if (!motivo) {
      setError('Debe seleccionar un motivo de cancelación');
      setLoading(false);
      return;
    }

    // Si es "otro motivo", validar que haya comentarios
    if (motivo === 'otro_motivo' && !comentarios.trim()) {
      setError('Debe especificar el motivo en los comentarios adicionales');
      setLoading(false);
      return;
    }

    try {
      // Llamar al servicio para cancelar la denuncia
      const denunciaId = denuncia.denuncia_id || denuncia.id;
      await denunciasService.cancelarDenuncia(denunciaId, motivo, comentarios);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err) {
      console.error('Error al cancelar denuncia:', err);
      setError('Error al cancelar la denuncia. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleVolver = () => {
    onClose();
  };

  if (success) {
    return (
      <div className="cancelar-denuncia-container">
        <div className="success-message">
          <h2>✅ Denuncia Cancelada Exitosamente</h2>
          <p>La denuncia ha sido cancelada correctamente.</p>
          <p>Redirigiendo a la lista de denuncias...</p>
        </div>
      </div>
    );
  }

  if (!denuncia) {
    return (
      <div className="cancelar-denuncia-container">
        <div className="loading-message">
          <p>Cargando datos de la denuncia...</p>
        </div>
      </div>
    );
  }

  // 🆕 MOSTRAR MENSAJE SI LA DENUNCIA NO PUEDE SER CANCELADA
  if (denuncia.estado_denuncia === 'realizada' || denuncia.estado_denuncia === 'cancelada') {
    return (
      <div className="cancelar-denuncia-container">
        <div className="error-message-full">
          <h2>❌ No se puede cancelar esta denuncia</h2>
          <p>
            {denuncia.estado_denuncia === 'realizada' 
              ? 'Esta denuncia ya ha sido verificada y no puede ser cancelada.' 
              : 'Esta denuncia ya está cancelada.'}
          </p>
          <button 
            className="btn-volver"
            onClick={handleVolver}
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cancelar-denuncia-container">
      <div className="cancelar-denuncia-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="header-icon" onClick={handleVolver}>
            <span className="close-icon">✕</span>
          </div>
          <h1>Cancelar Denuncia</h1>
          <p className="header-subtitle">Por favor, proporcione el motivo de la cancelación</p>
        </div>

        <form onSubmit={handleSubmit} className="cancelar-form">
          {/* Detalles de la denuncia */}
          <div className="denuncia-details">
            <h3>Número de denuncia: D-{(denuncia.denuncia_id || denuncia.id || 'N/A').toString().padStart(3, '0')}</h3>
            <p><strong>Jefe de familia:</strong> {denuncia.jefe_familia || 'No especificado'}</p>
            <p><strong>Fecha de registro:</strong> {new Date(denuncia.fecha_creacion).toLocaleDateString('es-ES')}</p>
            <p><strong>Estado actual:</strong> 
              <span className={`estado-indicator ${
                denuncia.estado_denuncia === 'recibida' ? 'estado-sin-revisar' :
                denuncia.estado_denuncia === 'programada' ? 'estado-en-proceso' :
                'estado-verificado'
              }`}>
                {denuncia.estado_denuncia === 'recibida' ? 'Sin revisar' :
                 denuncia.estado_denuncia === 'programada' ? 'En proceso' :
                 denuncia.estado_denuncia}
              </span>
            </p>
          </div>

          {/* Motivo de cancelación */}
          <div className="motivo-section">
            <h3>Motivo de cancelación <span className="required">*</span></h3>
            <div className="motivos-grid">
              {motivos.map((motivoItem) => (
                <div 
                  key={motivoItem.id}
                  className={`motivo-option ${motivo === motivoItem.id ? 'selected' : ''}`}
                  onClick={() => handleMotivoChange(motivoItem.id)}
                >
                  <div className="motivo-radio">
                    <input
                      type="radio"
                      id={motivoItem.id}
                      name="motivo"
                      value={motivoItem.id}
                      checked={motivo === motivoItem.id}
                      onChange={() => handleMotivoChange(motivoItem.id)}
                    />
                    <label htmlFor={motivoItem.id}></label>
                  </div>
                  <div className="motivo-content">
                    <h4>{motivoItem.titulo}</h4>
                    <p>{motivoItem.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comentarios adicionales */}
          <div className="comentarios-section">
            <h3>Comentarios adicionales</h3>
            <p className="comentarios-subtitle">
              Proporcione más detalles sobre el motivo de cancelación (opcional)
            </p>
            <textarea
              value={comentarios}
              onChange={handleComentariosChange}
              placeholder="Describa brevemente por qué está cancelando esta denuncia..."
              rows="4"
              className="comentarios-textarea"
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Botones de acción */}
          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-volver"
              onClick={handleVolver}
            >
              <span className="btn-icon">✕</span>
              Volver
            </button>
            <button 
              type="submit" 
              className="btn-confirmar"
              disabled={loading || !motivo}
            >
              <span className="btn-icon">✓</span>
              {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelarDenuncia;