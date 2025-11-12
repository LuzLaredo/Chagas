// controllers/evaluacionesController.js
import { EvaluacionesModel } from '../models/evaluacionesModel.js';
import db from '../config/db.js';

/** 
 * Extrae IDs de jefes desde el body:
 * - acepta 'jefes' (JSON string o "1,2,3")
 * - o bien 'jefes_grupo[0]', 'jefes_grupo[1]', ...
 * Devuelve un array de strings/nums.
 */
function recogerJefesDesdeBody(body) {
  // 1) Si viene como 'jefes'
  if (typeof body.jefes !== 'undefined' && body.jefes !== null) {
    const raw = body.jefes;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      // Intentar parsear JSON
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Caer a split por coma
        return raw.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
  }

  // 2) Si viene como 'jefes_grupo[0..n]'
  const patron = /^jefes_grupo\[(\d+)\]$/;
  const pares = Object.keys(body)
    .map(k => {
      const m = k.match(patron);
      if (!m) return null;
      return { idx: Number(m[1]), val: body[k] };
    })
    .filter(Boolean)
    .sort((a, b) => a.idx - b.idx);

  if (pares.length > 0) {
    return pares.map(p => p.val).filter(v => v !== '' && v !== null && typeof v !== 'undefined');
  }

  // 3) Nada
  return [];
}

export const EvaluacionesController = {
  // Crear nueva evaluación entomológica
  crearEvaluacion: async (req, res) => {
    try {
      console.log('📥 Datos recibidos (body):', req.body);
      console.log('🖼️ Archivo recibido:', req.file);

      // --- recoger jefes desde el body (al menos 1 obligatorio) ---
      const jefesSeleccionados = recogerJefesDesdeBody(req.body);
      if (!jefesSeleccionados || jefesSeleccionados.length < 1) {
        return res.status(400).json({
          success: false,
          message: 'Debe seleccionar al menos un jefe de grupo.'
        });
      }

      // Preparar datos de evaluación desde FormData
      const evaluacionData = {
        tecnico_id: req.body.tecnico_id,
        municipio_id: req.body.municipio_id,
        comunidad_id: req.body.comunidad_id,
        jefe_familia: req.body.jefe_familia,
        hora_inicio: req.body.hora_inicio,
        hora_final: req.body.hora_final,
        hora_total: req.body.hora_total,
        numero_habitantes: req.body.numero_habitantes,
        numero_habitaciones: req.body.numero_habitaciones,
        fecha_ultimo_rociado: req.body.fecha_ultimo_rociado,
        vivienda_mejorada_intra: req.body.vivienda_mejorada_intra === 'true',
        vivienda_mejorada_peri: req.body.vivienda_mejorada_peri === 'true',
        fecha_evaluacion: req.body.fecha_evaluacion,
        numero_vivienda: req.body.numero_vivienda,
        latitud: req.body.latitud,
        longitud: req.body.longitud,
        altura: req.body.altura,
        resultado: req.body.resultado,
        foto_entrada: req.file ? req.file.filename : null,
        sede_id: req.body.sede_id,
        redsalud_id: req.body.redsalud_id,
        establecimiento_id: req.body.establecimiento_id,

        // NUEVO: pasar jefes al model
        jefes: jefesSeleccionados
      };

      console.log('📝 Datos procesados:', evaluacionData);

      // Validar datos requeridos mínimos
      if (!evaluacionData.tecnico_id || !evaluacionData.municipio_id || 
          !evaluacionData.comunidad_id || !evaluacionData.jefe_familia || 
          !evaluacionData.numero_vivienda || !evaluacionData.fecha_evaluacion ||
          !evaluacionData.sede_id || !evaluacionData.redsalud_id || !evaluacionData.establecimiento_id) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos en la evaluación'
        });
      }

      // Crear evaluación principal
      const evaluacion_id = await EvaluacionesModel.crearEvaluacion(evaluacionData);
      console.log('✅ Evaluación creada con ID:', evaluacion_id);

      // Preparar detalles de capturas
      let detallesData = {};
      
      // Si el resultado es positivo, crear detalles de capturas
      if (evaluacionData.resultado === 'positivo') {
        console.log('🪲 Creando detalles para resultado positivo');
        detallesData = {
          fecha_programada: req.body.fecha_programada,
          hora_programada: req.body.hora_programada,
          intra_ninfas: req.body.intra_ninfas || 0,
          intra_adulta: req.body.intra_adulta || 0,
          peri_ninfa: req.body.peri_ninfa || 0,
          peri_adulta: req.body.peri_adulta || 0,
          intra_pared: req.body.intra_pared || 0,
          intra_techo: req.body.intra_techo || 0,
          intra_cama: req.body.intra_cama || 0,
          intra_otros: req.body.intra_otros || 0,
          peri_pared: req.body.peri_pared || 0,
          peri_corral: req.body.peri_corral || 0,
          peri_gallinero: req.body.peri_gallinero || 0,
          peri_conejera: req.body.peri_conejera || 0,
          peri_zarzo_troje: req.body.peri_zarzo_troje || 0,
          peri_otros: req.body.peri_otros || 0
        };
      } else {
        // Para resultado negativo, si deseas NO crear detalles, comenta la siguiente llamada.
        // Por consistencia con tu código previo, se crea con ceros.
        console.log('❌ Creando detalles vacíos para resultado negativo');
        detallesData = {};
      }

      await EvaluacionesModel.crearDetallesCapturas(evaluacion_id, detallesData);

      res.status(201).json({
        success: true,
        message: 'Evaluación EE1 creada exitosamente',
        data: { evaluacion_id }
      });

    } catch (error) {
      console.error('❌ Error en crearEvaluacion:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor: ' + error.message,
        error: error.message
      });
    }
  },

  // Obtener todas las evaluaciones
  obtenerEvaluaciones: async (req, res) => {
    try {
      const evaluaciones = await EvaluacionesModel.obtenerEvaluaciones();
      res.json({ success: true, data: evaluaciones });
    } catch (error) {
      console.error('Error en obtenerEvaluaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener evaluaciones',
        error: error.message
      });
    }
  },

  // Obtener evaluación por ID
  obtenerEvaluacionPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const evaluacion = await EvaluacionesModel.obtenerEvaluacionPorId(id);

      if (!evaluacion) {
        return res.status(404).json({
          success: false,
          message: 'Evaluación no encontrada'
        });
      }

      res.json({ success: true, data: evaluacion });
    } catch (error) {
      console.error('Error en obtenerEvaluacionPorId:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener evaluación',
        error: error.message
      });
    }
  },

  // Obtener evaluaciones por técnico
  obtenerEvaluacionesPorTecnico: async (req, res) => {
    try {
      const { tecnico_id } = req.params;
      const evaluaciones = await EvaluacionesModel.obtenerEvaluacionesPorTecnico(tecnico_id);
      res.json({ success: true, data: evaluaciones });
    } catch (error) {
      console.error('Error en obtenerEvaluacionesPorTecnico:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener evaluaciones del técnico',
        error: error.message
      });
    }
  },

  // Actualizar evaluación
  actualizarEvaluacion: async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log('📥 Datos de actualización recibidos:', req.body);
      console.log('🖼️ Archivo de actualización:', req.file);

      // recoger jefes si vienen en update (opcionales)
      const jefesSeleccionados = recogerJefesDesdeBody(req.body);
      // Si el frontend no envía jefes en update, no los tocamos. 
      // Si sí envía, exigimos al menos 1.
      let jefesParaActualizar = undefined;
      if (jefesSeleccionados.length > 0) {
        jefesParaActualizar = jefesSeleccionados;
      } else if (Object.keys(req.body).some(k => k.startsWith('jefes_grupo[')) || typeof req.body.jefes !== 'undefined') {
        // Señal de que quisieron actualizar jefes pero enviaron vacío
        return res.status(400).json({
          success: false,
          message: 'Debe seleccionar al menos un jefe de grupo.'
        });
      }

      // Preparar datos de evaluación desde FormData
      const evaluacionData = {
        jefe_familia: req.body.jefe_familia,
        hora_inicio: req.body.hora_inicio,
        hora_final: req.body.hora_final,
        hora_total: req.body.hora_total,
        numero_habitantes: req.body.numero_habitantes,
        numero_habitaciones: req.body.numero_habitaciones,
        fecha_ultimo_rociado: req.body.fecha_ultimo_rociado,
        vivienda_mejorada_intra: req.body.vivienda_mejorada_intra === 'true',
        vivienda_mejorada_peri: req.body.vivienda_mejorada_peri === 'true',
        fecha_evaluacion: req.body.fecha_evaluacion,
        numero_vivienda: req.body.numero_vivienda,
        latitud: req.body.latitud,
        longitud: req.body.longitud,
        altura: req.body.altura,
        resultado: req.body.resultado,
        foto_entrada: req.file ? req.file.filename : req.body.foto_entrada_existente,
        sede_id: req.body.sede_id,
        redsalud_id: req.body.redsalud_id,
        establecimiento_id: req.body.establecimiento_id,
        // si hay jefes, se incluyen; si no, no se tocan
        ...(typeof jefesParaActualizar !== 'undefined' ? { jefes: jefesParaActualizar } : {})
      };

      // Verificar si la evaluación existe
      const evaluacionExistente = await EvaluacionesModel.obtenerEvaluacionPorId(id);
      if (!evaluacionExistente) {
        return res.status(404).json({
          success: false,
          message: 'Evaluación no encontrada'
        });
      }

      // Actualizar evaluación principal
      const actualizado = await EvaluacionesModel.actualizarEvaluacion(id, evaluacionData);
      if (!actualizado) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo actualizar la evaluación'
        });
      }

      res.json({
        success: true,
        message: 'Evaluación actualizada exitosamente'
      });

    } catch (error) {
      console.error('Error en actualizarEvaluacion:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar evaluación',
        error: error.message
      });
    }
  },

  // Eliminar evaluación
  eliminarEvaluacion: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar si la evaluación existe
      const evaluacionExistente = await EvaluacionesModel.obtenerEvaluacionPorId(id);
      if (!evaluacionExistente) {
        return res.status(404).json({
          success: false,
          message: 'Evaluación no encontrada'
        });
      }

      const eliminado = await EvaluacionesModel.eliminarEvaluacion(id);

      if (!eliminado) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo eliminar la evaluación'
        });
      }

      res.json({
        success: true,
        message: 'Evaluación eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error en eliminarEvaluacion:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar evaluación',
        error: error.message
      });
    }
  },

  // ======================== MÉTODOS PARA COMBOBOX ========================

  // Obtener todos los técnicos
  obtenerTecnicos: async (req, res) => {
    try {
      const query = `
        SELECT usuario_id as id, nombre_completo as nombre 
        FROM Usuarios 
        WHERE rol IN ('tecnico', 'técnico', 'jefe_grupo', 'administrador') 
          AND estado = 'activo'
        ORDER BY nombre_completo
      `;
      const [tecnicos] = await db.promise().execute(query);
      res.json({ success: true, data: tecnicos });
    } catch (error) {
      console.error('Error en obtenerTecnicos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener técnicos',
        error: error.message
      });
    }
  },

  // Obtener todos los municipios
  obtenerMunicipios: async (req, res) => {
    try {
      const query = `
        SELECT municipio_id as id, nombre_municipio as nombre 
        FROM Municipios 
        ORDER BY nombre_municipio
      `;
      const [municipios] = await db.promise().execute(query);
      res.json({ success: true, data: municipios });
    } catch (error) {
      console.error('Error en obtenerMunicipios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener municipios',
        error: error.message
      });
    }
  },

  // Obtener comunidades por municipio
  obtenerComunidades: async (req, res) => {
    try {
      const { municipio_id } = req.params;
      const query = `
        SELECT comunidad_id as id, nombre_comunidad as nombre 
        FROM Comunidades 
        WHERE municipio_id = ? 
          AND estado = 'activo'
        ORDER BY nombre_comunidad
      `;
      const [comunidades] = await db.promise().execute(query, [municipio_id]);
      res.json({ success: true, data: comunidades });
    } catch (error) {
      console.error('Error en obtenerComunidades:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener comunidades',
        error: error.message
      });
    }
  },

  // Obtener todas las comunidades
  obtenerTodasComunidades: async (req, res) => {
    try {
      const query = `
        SELECT 
          c.comunidad_id as id, 
          c.nombre_comunidad as nombre, 
          m.nombre_municipio as municipio,
          c.municipio_id
        FROM Comunidades c 
        LEFT JOIN Municipios m ON c.municipio_id = m.municipio_id
        WHERE c.estado = 'activo'
        ORDER BY m.nombre_municipio, c.nombre_comunidad
      `;
      const [comunidades] = await db.promise().execute(query);
      res.json({ success: true, data: comunidades });
    } catch (error) {
      console.error('Error en obtenerTodasComunidades:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener comunidades',
        error: error.message
      });
    }
  },

  // ======================== NUEVOS MÉTODOS PARA SEDES, REDES Y ESTABLECIMIENTOS ========================

  // Obtener todas las sedes
  obtenerSedes: async (req, res) => {
    try {
      const query = `
        SELECT sede_id as id, nombre_sede as nombre 
        FROM Sedes 
        ORDER BY nombre_sede
      `;
      const [sedes] = await db.promise().execute(query);
      res.json({ success: true, data: sedes });
    } catch (error) {
      console.error('Error en obtenerSedes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener sedes',
        error: error.message
      });
    }
  },

  // Obtener todas las redes de salud
  obtenerRedesSalud: async (req, res) => {
    try {
      const query = `
        SELECT redsalud_id as id, nombre_red as nombre, sede_id
        FROM RedSalud 
        ORDER BY nombre_red
      `;
      const [redes] = await db.promise().execute(query);
      res.json({ success: true, data: redes });
    } catch (error) {
      console.error('Error en obtenerRedesSalud:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener redes de salud',
        error: error.message
      });
    }
  },

  // Obtener todos los establecimientos
  obtenerEstablecimientos: async (req, res) => {
    try {
      const query = `
        SELECT 
          establecimiento_id as id, 
          nombre_establecimiento as nombre,
          tipo_establecimiento as tipo,
          redsalud_id
        FROM EstablecimientosSalud 
        ORDER BY nombre_establecimiento
      `;
      const [establecimientos] = await db.promise().execute(query);
      res.json({ success: true, data: establecimientos });
    } catch (error) {
      console.error('Error en obtenerEstablecimientos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener establecimientos',
        error: error.message
      });
    }
  },

  // ======================== NUEVO: JEFES DE GRUPO ========================
  obtenerJefesGrupo: async (req, res) => {
    try {
      // Solo rol jefe_grupo activos
      const query = `
        SELECT usuario_id as id, nombre_completo as nombre
        FROM Usuarios
        WHERE rol = 'jefe_grupo'
          AND estado = 'activo'
        ORDER BY nombre_completo
      `;
      const [jefes] = await db.promise().execute(query);
      res.json({ success: true, data: jefes });
    } catch (error) {
      console.error('Error en obtenerJefesGrupo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener jefes de grupo',
        error: error.message
      });
    }
  }
};
