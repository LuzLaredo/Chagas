// models/evaluacionesModel.js
import db from '../config/db.js';

/** Normaliza el payload de jefes para obtener hasta 4 IDs (mínimo 1) */
function normalizarJefes(jefesInput) {
  // Puede venir como string JSON '["1","2"]' o como array
  let arr = [];
  if (Array.isArray(jefesInput)) {
    arr = jefesInput;
  } else if (typeof jefesInput === 'string' && jefesInput.trim() !== '') {
    try {
      const parsed = JSON.parse(jefesInput);
      if (Array.isArray(parsed)) arr = parsed;
    } catch (e) {
      // también podría venir como "1,2,3"
      arr = jefesInput.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  // Convertir a números, quitar nulos/repetidos
  const unicos = [...new Set(arr.map(v => Number(v)).filter(v => Number.isInteger(v) && v > 0))];

  // Exigir al menos 1
  if (unicos.length < 1) {
    throw new Error('Debe especificarse al menos un jefe de grupo.');
  }

  // Limitar a 4 (jefe1..jefe4)
  const [jefe1_id, jefe2_id, jefe3_id, jefe4_id] = [...unicos, null, null, null].slice(0, 4);
  return { jefe1_id, jefe2_id, jefe3_id, jefe4_id };
}

export const EvaluacionesModel = {
  // Crear nueva evaluación
  crearEvaluacion: async (evaluacionData) => {
    try {
      const {
        tecnico_id,
        municipio_id,
        comunidad_id,
        jefe_familia,
        hora_inicio,
        hora_final,
        hora_total,
        numero_habitantes,
        numero_habitaciones,
        fecha_ultimo_rociado,
        vivienda_mejorada_intra,
        vivienda_mejorada_peri,
        fecha_evaluacion,
        numero_vivienda,
        latitud,
        longitud,
        altura,
        resultado,
        foto_entrada,
        sede_id,
        redsalud_id,
        establecimiento_id,
        // NUEVO: jefes (array o string JSON)
        jefes
      } = evaluacionData;

      // ---- Normalizar y validar jefes ----
      const { jefe1_id, jefe2_id, jefe3_id, jefe4_id } = normalizarJefes(jefes);

      console.log('📝 Creando evaluación con foto:', foto_entrada);
      console.log('👥 Jefes:', { jefe1_id, jefe2_id, jefe3_id, jefe4_id });
      console.log('🏥 Datos de salud - Sede:', sede_id, 'Red:', redsalud_id, 'Establecimiento:', establecimiento_id);

      const query = `
        INSERT INTO Evaluaciones_Entomologicas 
        (tecnico_id, jefe1_id, jefe2_id, jefe3_id, jefe4_id,
         municipio_id, comunidad_id, jefe_familia, hora_inicio, 
         hora_final, hora_total, numero_habitantes, numero_habitaciones, 
         fecha_ultimo_rociado, vivienda_mejorada_intra, vivienda_mejorada_peri, 
         fecha_evaluacion, numero_vivienda, latitud, longitud, altura, resultado, 
         foto_entrada, sede_id, redsalud_id, establecimiento_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.promise().execute(query, [
        tecnico_id || null,
        jefe1_id,
        jefe2_id,
        jefe3_id,
        jefe4_id,
        municipio_id || null,
        comunidad_id || null,
        jefe_familia || '',
        hora_inicio || null,
        hora_final || null,
        hora_total || null,
        numero_habitantes ?? 0,
        numero_habitaciones ?? 0,
        fecha_ultimo_rociado || null,
        Boolean(vivienda_mejorada_intra),
        Boolean(vivienda_mejorada_peri),
        fecha_evaluacion || null,
        numero_vivienda || '',
        latitud ?? 0,
        longitud ?? 0,
        altura ?? 0,
        resultado || 'negativo',
        foto_entrada || null,
        sede_id || null,
        redsalud_id || null,
        establecimiento_id || null
      ]);

      console.log('✅ Evaluación insertada con ID:', result.insertId);
      return result.insertId;
    } catch (error) {
      console.error('❌ Error en crearEvaluacion:', error);
      throw error;
    }
  },

  // Crear detalles de capturas EE1
  crearDetallesCapturas: async (evaluacion_id, detallesData) => {
    try {
      const {
        fecha_programada,
        hora_programada,
        intra_ninfas = 0,
        intra_adulta = 0,
        peri_ninfa = 0,
        peri_adulta = 0,
        intra_pared = 0,
        intra_techo = 0,
        intra_cama = 0,
        intra_otros = 0,
        peri_pared = 0,
        peri_corral = 0,
        peri_gallinero = 0,
        peri_conejera = 0,
        peri_zarzo_troje = 0,
        peri_otros = 0
      } = detallesData;

      console.log('📋 Creando detalles para evaluación:', evaluacion_id, detallesData);

      // Validar y formatear fecha_programada
      let fechaProgramadaFormateada = null;
      if (fecha_programada && fecha_programada.length === 10) {
        fechaProgramadaFormateada = fecha_programada;
      } else if (fecha_programada && fecha_programada.length === 4) {
        fechaProgramadaFormateada = `${fecha_programada}-01-01`;
      }

      // Calcular totales
      const total_ninfas = Number(intra_ninfas) + Number(peri_ninfa);
      const total_adultas = Number(intra_adulta) + Number(peri_adulta);

      const query = `
        INSERT INTO EE1_Detalles_Capturas 
        (evaluacion_id, fecha_programada, hora_programada, intra_ninfas, intra_adulta,
         peri_ninfa, peri_adulta, total_ninfas, total_adultas, intra_pared, intra_techo,
         intra_cama, intra_otros, peri_pared, peri_corral, peri_gallinero, peri_conejera,
         peri_zarzo_troje, peri_otros)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.promise().execute(query, [
        evaluacion_id,
        fechaProgramadaFormateada,
        hora_programada || null,
        intra_ninfas ?? 0,
        intra_adulta ?? 0,
        peri_ninfa ?? 0,
        peri_adulta ?? 0,
        total_ninfas,
        total_adultas,
        intra_pared ?? 0,
        intra_techo ?? 0,
        intra_cama ?? 0,
        intra_otros ?? 0,
        peri_pared ?? 0,
        peri_corral ?? 0,
        peri_gallinero ?? 0,
        peri_conejera ?? 0,
        peri_zarzo_troje ?? 0,
        peri_otros ?? 0
      ]);

      console.log('✅ Detalles creados con ID:', result.insertId);
      return result.insertId;
    } catch (error) {
      console.error('❌ Error en crearDetallesCapturas:', error);
      throw error;
    }
  },

  // Obtener todas las evaluaciones (CON LOS JOINS CORRECTOS + jefes)
  obtenerEvaluaciones: async () => {
    try {
      const query = `
        SELECT 
          ee.*, 
          u.nombre_completo as tecnico_nombre,
          j1.nombre_completo as jefe1_nombre,
          j2.nombre_completo as jefe2_nombre,
          j3.nombre_completo as jefe3_nombre,
          j4.nombre_completo as jefe4_nombre,
          m.nombre_municipio as municipio_nombre,
          c.nombre_comunidad as comunidad_nombre,
          s.nombre_sede as sede_nombre,
          rs.nombre_red as red_salud_nombre,
          es.nombre_establecimiento as establecimiento_nombre,
          edc.fecha_programada, 
          edc.hora_programada,
          edc.total_ninfas, 
          edc.total_adultas
        FROM Evaluaciones_Entomologicas ee
        LEFT JOIN Usuarios u  ON ee.tecnico_id = u.usuario_id
        LEFT JOIN Usuarios j1 ON ee.jefe1_id   = j1.usuario_id
        LEFT JOIN Usuarios j2 ON ee.jefe2_id   = j2.usuario_id
        LEFT JOIN Usuarios j3 ON ee.jefe3_id   = j3.usuario_id
        LEFT JOIN Usuarios j4 ON ee.jefe4_id   = j4.usuario_id
        LEFT JOIN Municipios m ON ee.municipio_id = m.municipio_id
        LEFT JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
        LEFT JOIN Sedes s ON ee.sede_id = s.sede_id
        LEFT JOIN RedSalud rs ON ee.redsalud_id = rs.redsalud_id
        LEFT JOIN EstablecimientosSalud es ON ee.establecimiento_id = es.establecimiento_id
        LEFT JOIN EE1_Detalles_Capturas edc ON ee.evaluacion_id = edc.evaluacion_id
        ORDER BY ee.fecha_creacion DESC
      `;

      const [rows] = await db.promise().execute(query);
      return rows;
    } catch (error) {
      console.error('Error en obtenerEvaluaciones:', error);
      throw error;
    }
  },

  // Obtener evaluación por ID (incluye nombres de jefes)
  obtenerEvaluacionPorId: async (evaluacion_id) => {
    try {
      const query = `
        SELECT 
          ee.*, 
          u.nombre_completo as tecnico_nombre,
          j1.nombre_completo as jefe1_nombre,
          j2.nombre_completo as jefe2_nombre,
          j3.nombre_completo as jefe3_nombre,
          j4.nombre_completo as jefe4_nombre,
          m.nombre_municipio as municipio_nombre,
          c.nombre_comunidad as comunidad_nombre,
          s.nombre_sede as sede_nombre,
          rs.nombre_red as red_salud_nombre,
          es.nombre_establecimiento as establecimiento_nombre,
          edc.*
        FROM Evaluaciones_Entomologicas ee
        LEFT JOIN Usuarios u  ON ee.tecnico_id = u.usuario_id
        LEFT JOIN Usuarios j1 ON ee.jefe1_id   = j1.usuario_id
        LEFT JOIN Usuarios j2 ON ee.jefe2_id   = j2.usuario_id
        LEFT JOIN Usuarios j3 ON ee.jefe3_id   = j3.usuario_id
        LEFT JOIN Usuarios j4 ON ee.jefe4_id   = j4.usuario_id
        LEFT JOIN Municipios m ON ee.municipio_id = m.municipio_id
        LEFT JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
        LEFT JOIN Sedes s ON ee.sede_id = s.sede_id
        LEFT JOIN RedSalud rs ON ee.redsalud_id = rs.redsalud_id
        LEFT JOIN EstablecimientosSalud es ON ee.establecimiento_id = es.establecimiento_id
        LEFT JOIN EE1_Detalles_Capturas edc ON ee.evaluacion_id = edc.evaluacion_id
        WHERE ee.evaluacion_id = ?
      `;

      const [rows] = await db.promise().execute(query, [evaluacion_id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error en obtenerEvaluacionPorId:', error);
      throw error;
    }
  },

  // Obtener evaluaciones por técnico
  obtenerEvaluacionesPorTecnico: async (tecnico_id) => {
    try {
      const query = `
        SELECT 
          ee.*, 
          u.nombre_completo as tecnico_nombre,
          j1.nombre_completo as jefe1_nombre,
          j2.nombre_completo as jefe2_nombre,
          j3.nombre_completo as jefe3_nombre,
          j4.nombre_completo as jefe4_nombre,
          m.nombre_municipio as municipio_nombre,
          c.nombre_comunidad as comunidad_nombre,
          s.nombre_sede as sede_nombre,
          rs.nombre_red as red_salud_nombre,
          es.nombre_establecimiento as establecimiento_nombre,
          edc.total_ninfas, 
          edc.total_adultas
        FROM Evaluaciones_Entomologicas ee
        LEFT JOIN Usuarios u  ON ee.tecnico_id = u.usuario_id
        LEFT JOIN Usuarios j1 ON ee.jefe1_id   = j1.usuario_id
        LEFT JOIN Usuarios j2 ON ee.jefe2_id   = j2.usuario_id
        LEFT JOIN Usuarios j3 ON ee.jefe3_id   = j3.usuario_id
        LEFT JOIN Usuarios j4 ON ee.jefe4_id   = j4.usuario_id
        LEFT JOIN Municipios m ON ee.municipio_id = m.municipio_id
        LEFT JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
        LEFT JOIN Sedes s ON ee.sede_id = s.sede_id
        LEFT JOIN RedSalud rs ON ee.redsalud_id = rs.redsalud_id
        LEFT JOIN EstablecimientosSalud es ON ee.establecimiento_id = es.establecimiento_id
        LEFT JOIN EE1_Detalles_Capturas edc ON ee.evaluacion_id = edc.evaluacion_id
        WHERE ee.tecnico_id = ?
        ORDER BY ee.fecha_creacion DESC
      `;

      const [rows] = await db.promise().execute(query, [tecnico_id]);
      return rows;
    } catch (error) {
      console.error('Error en obtenerEvaluacionesPorTecnico:', error);
      throw error;
    }
  },

  // Actualizar evaluación (incluye posibilidad de actualizar jefes)
  actualizarEvaluacion: async (evaluacion_id, evaluacionData) => {
    try {
      const {
        jefe_familia,
        hora_inicio,
        hora_final,
        hora_total,
        numero_habitantes,
        numero_habitaciones,
        fecha_ultimo_rociado,
        vivienda_mejorada_intra,
        vivienda_mejorada_peri,
        fecha_evaluacion,
        numero_vivienda,
        latitud,
        longitud,
        altura,
        resultado,
        foto_entrada,
        sede_id,
        redsalud_id,
        establecimiento_id,
        // opcional en update
        jefes
      } = evaluacionData;

      // Construcción dinámica del SET
      const sets = [
        'jefe_familia = ?',
        'hora_inicio = ?',
        'hora_final = ?',
        'hora_total = ?',
        'numero_habitantes = ?',
        'numero_habitaciones = ?',
        'fecha_ultimo_rociado = ?',
        'vivienda_mejorada_intra = ?',
        'vivienda_mejorada_peri = ?',
        'fecha_evaluacion = ?',
        'numero_vivienda = ?',
        'latitud = ?',
        'longitud = ?',
        'altura = ?',
        'resultado = ?',
        'foto_entrada = ?',
        'sede_id = ?',
        'redsalud_id = ?',
        'establecimiento_id = ?'
      ];
      const params = [
        jefe_familia,
        hora_inicio || null,
        hora_final || null,
        hora_total || null,
        numero_habitantes ?? 0,
        numero_habitaciones ?? 0,
        fecha_ultimo_rociado || null,
        Boolean(vivienda_mejorada_intra),
        Boolean(vivienda_mejorada_peri),
        fecha_evaluacion || null,
        numero_vivienda || '',
        latitud ?? 0,
        longitud ?? 0,
        altura ?? 0,
        resultado || 'negativo',
        foto_entrada || null,
        sede_id || null,
        redsalud_id || null,
        establecimiento_id || null
      ];

      // Si vienen jefes, los actualizamos también
      if (typeof jefes !== 'undefined') {
        const { jefe1_id, jefe2_id, jefe3_id, jefe4_id } = normalizarJefes(jefes);
        sets.unshift('jefe4_id = ?');
        sets.unshift('jefe3_id = ?');
        sets.unshift('jefe2_id = ?');
        sets.unshift('jefe1_id = ?');
        params.unshift(jefe1_id, jefe2_id, jefe3_id, jefe4_id);
      }

      const query = `
        UPDATE Evaluaciones_Entomologicas 
        SET ${sets.join(', ')},
            fecha_modificacion = CURRENT_TIMESTAMP
        WHERE evaluacion_id = ?
      `;

      params.push(evaluacion_id);

      const [result] = await db.promise().execute(query, params);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en actualizarEvaluacion:', error);
      throw error;
    }
  },

  // Eliminar evaluación
  eliminarEvaluacion: async (evaluacion_id) => {
    try {
      // Primero eliminar detalles de capturas
      await db.promise().execute(
        'DELETE FROM EE1_Detalles_Capturas WHERE evaluacion_id = ?',
        [evaluacion_id]
      );

      // Luego eliminar la evaluación
      const [result] = await db.promise().execute(
        'DELETE FROM Evaluaciones_Entomologicas WHERE evaluacion_id = ?',
        [evaluacion_id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en eliminarEvaluacion:', error);
      throw error;
    }
  }
};
