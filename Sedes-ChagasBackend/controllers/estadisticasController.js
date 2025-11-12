// controllers/estadisticasController.js
import db from '../config/db.js';

export const getEstadisticasGenerales = (req, res) => {
  try {
    // Consulta para obtener estadísticas generales
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM Viviendas) as viviendas_registradas,
        (SELECT COALESCE(SUM(habitantes_protegidos), 0) FROM Formulario_RR1) as habitantes_protegidos,
        (SELECT COUNT(*) FROM Evaluaciones_Entomologicas) as viviendas_evaluadas,
        (SELECT COUNT(*) FROM Evaluaciones_Entomologicas WHERE resultado = 'positivo') as viviendas_positivas,
        (SELECT COALESCE(SUM(total_ninfas + total_adultas), 0) FROM EE1_Detalles_Capturas) as ejemplares_capturados,
        (SELECT COALESCE(SUM(intra_ninfas + intra_adulta), 0) FROM EE1_Detalles_Capturas) as ejemplares_intra,
        (SELECT COALESCE(SUM(peri_ninfa + peri_adulta), 0) FROM EE1_Detalles_Capturas) as ejemplares_peri,
        (SELECT COUNT(*) FROM Formulario_RR1) as viviendas_rociadas,
        (SELECT COALESCE(SUM(cantidad_insecticida), 0) FROM Formulario_RR1) as total_insecticida,
        (SELECT COALESCE(SUM(habitaciones_no_rociadas), 0) FROM Formulario_RR1) as habitaciones_no_rociadas
    `;

    db.query(query, (err, result) => {
      if (err) {
        console.error('Error al obtener estadísticas generales:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      const stats = result[0];
      
      // Calcular tasas
      const tasaInfestacion = stats.viviendas_evaluadas > 0 
        ? ((stats.viviendas_positivas / stats.viviendas_evaluadas) * 100).toFixed(1)
        : 0;
      
      const coberturaRociado = stats.viviendas_evaluadas > 0
        ? ((stats.viviendas_rociadas / stats.viviendas_evaluadas) * 100).toFixed(1)
        : 0;

      const estadisticas = {
        viviendasRegistradas: stats.viviendas_registradas,
        habitantesProtegidos: stats.habitantes_protegidos,
        viviendasEvaluadas: stats.viviendas_evaluadas,
        viviendasPositivas: stats.viviendas_positivas,
        tasaInfestacion: parseFloat(tasaInfestacion),
        ejemplaresCapturados: stats.ejemplares_capturados,
        ejemplaresIntra: stats.ejemplares_intra,
        ejemplaresPeri: stats.ejemplares_peri,
        viviendasRociadas: stats.viviendas_rociadas,
        coberturaRociado: parseFloat(coberturaRociado),
        totalInsecticida: stats.total_insecticida,
        habitacionesNoRociadas: stats.habitaciones_no_rociadas
      };

      res.json(estadisticas);
    });
  } catch (error) {
    console.error('Error general en estadísticas generales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getDistribucionViviendas = (req, res) => {
  try {
    const query = `
      SELECT 
        'Negativas' as label,
        COUNT(*) as value,
        '#1e40af' as color
      FROM Evaluaciones_Entomologicas 
      WHERE resultado = 'negativo'
      
      UNION ALL
      
      SELECT 
        'Positivas' as label,
        COUNT(*) as value,
        '#6b7280' as color
      FROM Evaluaciones_Entomologicas 
      WHERE resultado = 'positivo'
      
      UNION ALL
      
      SELECT 
        'Pendientes' as label,
        (SELECT COUNT(*) FROM Viviendas) - (SELECT COUNT(*) FROM Evaluaciones_Entomologicas) as value,
        '#ffffff' as color
      
      UNION ALL
      
      SELECT 
        'No accesibles' as label,
        (SELECT COUNT(*) FROM Formulario_RR1 WHERE cerrada = TRUE OR renuente = TRUE) as value,
        '#3b82f6' as color
      
      UNION ALL
      
      SELECT 
        'Renuentes' as label,
        (SELECT COUNT(*) FROM Formulario_RR1 WHERE renuente = TRUE) as value,
        '#10b981' as color
    `;

    db.query(query, (err, result) => {
      if (err) {
        console.error('Error al obtener distribución de viviendas:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      // Calcular porcentajes
      const total = result.reduce((sum, item) => sum + item.value, 0);
      const distribucion = result.map(item => ({
        ...item,
        value: total > 0 ? Math.round((item.value / total) * 100) : 0
      }));

      res.json(distribucion);
    });
  } catch (error) {
    console.error('Error general en distribución de viviendas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getTopComunidades = (req, res) => {
  try {
    const query = `
      SELECT 
        c.nombre_comunidad as nombre,
        COUNT(v.vivienda_id) as valor
      FROM Comunidades c
      LEFT JOIN Viviendas v ON c.comunidad_id = v.comunidad_id
      GROUP BY c.comunidad_id, c.nombre_comunidad
      ORDER BY valor DESC
      LIMIT 4
    `;

    db.query(query, (err, result) => {
      if (err) {
        console.error('Error al obtener top comunidades:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      res.json(result);
    });
  } catch (error) {
    console.error('Error general en top comunidades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getCostosModelos = (req, res) => {
  try {
    // Consulta para obtener costos reales por tipo de intervención/insecticida
    const query = `
      SELECT 
        'Modelo 1 - Insecticida A' as modelo,
        COALESCE(SUM(cantidad_insecticida * 150), 0) as costo
      FROM Formulario_RR1 
      WHERE cantidad_insecticida > 0
      
      UNION ALL
      
      SELECT 
        'Modelo 2 - Insecticida B' as modelo,
        COALESCE(SUM(cantidad_insecticida * 200), 0) as costo
      FROM Formulario_RR1 
      WHERE cantidad_insecticida > 0
      
      UNION ALL
      
      SELECT 
        'Modelo 3 - Personal Técnico' as modelo,
        COALESCE(COUNT(*) * 500, 0) as costo
      FROM Formulario_RR1
      
      UNION ALL
      
      SELECT 
        'Modelo 4 - Equipos' as modelo,
        COALESCE(COUNT(*) * 300, 0) as costo
      FROM Formulario_RR1
      
      UNION ALL
      
      SELECT 
        'Modelo 5 - Transporte' as modelo,
        COALESCE(COUNT(*) * 250, 0) as costo
      FROM Formulario_RR1
      
      UNION ALL
      
      SELECT 
        'Modelo 6 - Evaluaciones' as modelo,
        COALESCE(COUNT(*) * 100, 0) as costo
      FROM Evaluaciones_Entomologicas
      
      UNION ALL
      
      SELECT 
        'Modelo 7 - Administración' as modelo,
        COALESCE(COUNT(*) * 50, 0) as costo
      FROM Denuncias
      
      ORDER BY costo DESC
    `;

    db.query(query, (err, result) => {
      if (err) {
        console.error('Error al obtener costos por modelos:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      res.json(result);
    });
  } catch (error) {
    console.error('Error general en costos modelos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getAllEstadisticas = async (req, res) => {
  try {
    // Obtener todas las estadísticas en paralelo
    const [generales, distribucion, topComunidades, costosModelos] = await Promise.all([
      new Promise((resolve, reject) => {
        getEstadisticasGenerales(req, { json: resolve, status: () => ({ json: reject }) });
      }),
      new Promise((resolve, reject) => {
        getDistribucionViviendas(req, { json: resolve, status: () => ({ json: reject }) });
      }),
      new Promise((resolve, reject) => {
        getTopComunidades(req, { json: resolve, status: () => ({ json: reject }) });
      }),
      new Promise((resolve, reject) => {
        getCostosModelos(req, { json: resolve, status: () => ({ json: reject }) });
      })
    ]);

    // Calcular habitaciones no rociadas como porcentaje
    const habitacionesNoRociadas = generales.habitacionesNoRociadas > 0 
      ? Math.round((generales.habitacionesNoRociadas / (generales.habitacionesNoRociadas + generales.viviendasRociadas)) * 100)
      : 0;

    const estadisticasCompletas = {
      generales,
      distribucionViviendas: distribucion,
      habitacionesNoRociadas,
      topComunidades,
      costosModelos
    };

    res.json(estadisticasCompletas);
  } catch (error) {
    console.error('Error general en todas las estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getEstadisticasPorFechas = (req, res) => {
  try {
    const { inicio, fin } = req.query;
    
    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    // Consulta para obtener estadísticas generales filtradas por fechas
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM Viviendas WHERE fecha_creacion BETWEEN ? AND ?) as viviendas_registradas,
        (SELECT COALESCE(SUM(habitantes_protegidos), 0) FROM Formulario_RR1 WHERE fecha_registro BETWEEN ? AND ?) as habitantes_protegidos,
        (SELECT COUNT(*) FROM Evaluaciones_Entomologicas WHERE fecha_evaluacion BETWEEN ? AND ?) as viviendas_evaluadas,
        (SELECT COUNT(*) FROM Evaluaciones_Entomologicas WHERE resultado = 'positivo' AND fecha_evaluacion BETWEEN ? AND ?) as viviendas_positivas,
        (SELECT COALESCE(SUM(total_ninfas + total_adultas), 0) FROM EE1_Detalles_Capturas ec 
         JOIN Evaluaciones_Entomologicas ee ON ec.evaluacion_id = ee.evaluacion_id 
         WHERE ee.fecha_evaluacion BETWEEN ? AND ?) as ejemplares_capturados,
        (SELECT COALESCE(SUM(intra_ninfas + intra_adulta), 0) FROM EE1_Detalles_Capturas ec 
         JOIN Evaluaciones_Entomologicas ee ON ec.evaluacion_id = ee.evaluacion_id 
         WHERE ee.fecha_evaluacion BETWEEN ? AND ?) as ejemplares_intra,
        (SELECT COALESCE(SUM(peri_ninfa + peri_adulta), 0) FROM EE1_Detalles_Capturas ec 
         JOIN Evaluaciones_Entomologicas ee ON ec.evaluacion_id = ee.evaluacion_id 
         WHERE ee.fecha_evaluacion BETWEEN ? AND ?) as ejemplares_peri,
        (SELECT COUNT(*) FROM Formulario_RR1 WHERE fecha_registro BETWEEN ? AND ?) as viviendas_rociadas,
        (SELECT COALESCE(SUM(cantidad_insecticida), 0) FROM Formulario_RR1 WHERE fecha_registro BETWEEN ? AND ?) as total_insecticida,
        (SELECT COALESCE(SUM(habitaciones_no_rociadas), 0) FROM Formulario_RR1 WHERE fecha_registro BETWEEN ? AND ?) as habitaciones_no_rociadas
    `;

    const params = [inicio, fin, inicio, fin, inicio, fin, inicio, fin, inicio, fin, inicio, fin, inicio, fin, inicio, fin, inicio, fin, inicio, fin];

    db.query(query, params, (err, result) => {
      if (err) {
        console.error('Error al obtener estadísticas por fechas:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      const stats = result[0];
      
      // Calcular tasas
      const tasaInfestacion = stats.viviendas_evaluadas > 0 
        ? ((stats.viviendas_positivas / stats.viviendas_evaluadas) * 100).toFixed(1)
        : 0;
      
      const coberturaRociado = stats.viviendas_evaluadas > 0
        ? ((stats.viviendas_rociadas / stats.viviendas_evaluadas) * 100).toFixed(1)
        : 0;

      const estadisticas = {
        viviendasRegistradas: stats.viviendas_registradas,
        habitantesProtegidos: stats.habitantes_protegidos,
        viviendasEvaluadas: stats.viviendas_evaluadas,
        viviendasPositivas: stats.viviendas_positivas,
        tasaInfestacion: parseFloat(tasaInfestacion),
        ejemplaresCapturados: stats.ejemplares_capturados,
        ejemplaresIntra: stats.ejemplares_intra,
        ejemplaresPeri: stats.ejemplares_peri,
        viviendasRociadas: stats.viviendas_rociadas,
        coberturaRociado: parseFloat(coberturaRociado),
        totalInsecticida: stats.total_insecticida,
        habitacionesNoRociadas: stats.habitaciones_no_rociadas
      };

      // Obtener distribución de viviendas por fechas
      const distribucionQuery = `
        SELECT 
          'Negativas' as label,
          COUNT(*) as value,
          '#1e40af' as color
        FROM Evaluaciones_Entomologicas 
        WHERE resultado = 'negativo' AND fecha_evaluacion BETWEEN ? AND ?
        
        UNION ALL
        
        SELECT 
          'Positivas' as label,
          COUNT(*) as value,
          '#6b7280' as color
        FROM Evaluaciones_Entomologicas 
        WHERE resultado = 'positivo' AND fecha_evaluacion BETWEEN ? AND ?
        
        UNION ALL
        
        SELECT 
          'Pendientes' as label,
          (SELECT COUNT(*) FROM Viviendas WHERE fecha_creacion BETWEEN ? AND ?) - 
          (SELECT COUNT(*) FROM Evaluaciones_Entomologicas WHERE fecha_evaluacion BETWEEN ? AND ?) as value,
          '#ffffff' as color
        
        UNION ALL
        
        SELECT 
          'No accesibles' as label,
          (SELECT COUNT(*) FROM Formulario_RR1 WHERE (cerrada = TRUE OR renuente = TRUE) AND fecha_registro BETWEEN ? AND ?) as value,
          '#3b82f6' as color
        
        UNION ALL
        
        SELECT 
          'Renuentes' as label,
          (SELECT COUNT(*) FROM Formulario_RR1 WHERE renuente = TRUE AND fecha_registro BETWEEN ? AND ?) as value,
          '#10b981' as color
      `;

      const distribucionParams = [inicio, fin, inicio, fin, inicio, fin, inicio, fin, inicio, fin, inicio, fin];

      db.query(distribucionQuery, distribucionParams, (err, distribucionResult) => {
        if (err) {
          console.error('Error al obtener distribución por fechas:', err);
          return res.status(500).json({ error: 'Error en la base de datos' });
        }

        // Calcular porcentajes
        const total = distribucionResult.reduce((sum, item) => sum + item.value, 0);
        const distribucion = distribucionResult.map(item => ({
          ...item,
          value: total > 0 ? Math.round((item.value / total) * 100) : 0
        }));

         // Obtener top comunidades por fechas
         const topComunidadesQuery = `
           SELECT 
             c.nombre_comunidad as nombre,
             COUNT(v.vivienda_id) as valor
           FROM Comunidades c
           LEFT JOIN Viviendas v ON c.comunidad_id = v.comunidad_id
           WHERE v.fecha_creacion BETWEEN ? AND ?
           GROUP BY c.comunidad_id, c.nombre_comunidad
           ORDER BY valor DESC
           LIMIT 4
         `;

        db.query(topComunidadesQuery, [inicio, fin], (err, topResult) => {
          if (err) {
            console.error('Error al obtener top comunidades por fechas:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
          }

          // Obtener costos por modelos con filtros de fecha
          const costosQuery = `
            SELECT 
              'Modelo 1 - Insecticida A' as modelo,
              COALESCE(SUM(cantidad_insecticida * 150), 0) as costo
            FROM Formulario_RR1 
            WHERE cantidad_insecticida > 0 AND fecha_registro BETWEEN ? AND ?
            
            UNION ALL
            
            SELECT 
              'Modelo 2 - Insecticida B' as modelo,
              COALESCE(SUM(cantidad_insecticida * 200), 0) as costo
            FROM Formulario_RR1 
            WHERE cantidad_insecticida > 0 AND fecha_registro BETWEEN ? AND ?
            
            UNION ALL
            
            SELECT 
              'Modelo 3 - Personal Técnico' as modelo,
              COALESCE(COUNT(*) * 500, 0) as costo
            FROM Formulario_RR1
            WHERE fecha_registro BETWEEN ? AND ?
            
            UNION ALL
            
            SELECT 
              'Modelo 4 - Equipos' as modelo,
              COALESCE(COUNT(*) * 300, 0) as costo
            FROM Formulario_RR1
            WHERE fecha_registro BETWEEN ? AND ?
            
            UNION ALL
            
            SELECT 
              'Modelo 5 - Transporte' as modelo,
              COALESCE(COUNT(*) * 250, 0) as costo
            FROM Formulario_RR1
            WHERE fecha_registro BETWEEN ? AND ?
            
            UNION ALL
            
            SELECT 
              'Modelo 6 - Evaluaciones' as modelo,
              COALESCE(COUNT(*) * 100, 0) as costo
            FROM Evaluaciones_Entomologicas
            WHERE fecha_evaluacion BETWEEN ? AND ?
            
            UNION ALL
            
            SELECT 
              'Modelo 7 - Administración' as modelo,
              COALESCE(COUNT(*) * 50, 0) as costo
            FROM Denuncias
            WHERE fecha_denuncia BETWEEN ? AND ?
            
            ORDER BY costo DESC
          `;

          const costosParams = [inicio, fin, inicio, fin, inicio, fin, inicio, fin, inicio, fin, inicio, fin, inicio, fin];

          db.query(costosQuery, costosParams, (err, costosResult) => {
            if (err) {
              console.error('Error al obtener costos por fechas:', err);
              return res.status(500).json({ error: 'Error en la base de datos' });
            }

            // Calcular habitaciones no rociadas como porcentaje
            const habitacionesNoRociadas = estadisticas.habitacionesNoRociadas > 0 
              ? Math.round((estadisticas.habitacionesNoRociadas / (estadisticas.habitacionesNoRociadas + estadisticas.viviendasRociadas)) * 100)
              : 0;

            const estadisticasCompletas = {
              generales: estadisticas,
              distribucionViviendas: distribucion,
              habitacionesNoRociadas,
              topComunidades: topResult,
              costosModelos: costosResult
            };

            res.json(estadisticasCompletas);
          });
        });
      });
    });
  } catch (error) {
    console.error('Error general en estadísticas por fechas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getEvolucionTemporal = (req, res) => {
  try {
    const { inicio, fin, municipio } = req.query;
    
    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    // Obtener evolución temporal REAL de evaluaciones por mes
    const query = `
      SELECT 
        DATE_FORMAT(ee.fecha_evaluacion, '%Y-%m') as mes,
        COUNT(*) as total_evaluaciones,
        SUM(CASE WHEN ee.resultado = 'positivo' THEN 1 ELSE 0 END) as evaluaciones_positivas,
        SUM(CASE WHEN ee.resultado = 'negativo' THEN 1 ELSE 0 END) as evaluaciones_negativas,
        ROUND(
          (SUM(CASE WHEN ee.resultado = 'positivo' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 
          1
        ) as tasa_infestacion
      FROM Evaluaciones_Entomologicas ee
      JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
      WHERE ee.fecha_evaluacion BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(ee.fecha_evaluacion, '%Y-%m')
      ORDER BY mes ASC
    `;

    const queryParams = [inicio, fin];

    db.query(query, queryParams, (err, result) => {
      if (err) {
        console.error('Error al obtener evolución temporal:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      // Si no hay datos, devolver array vacío
      if (result.length === 0) {
        return res.json([]);
      }

      res.json(result);
    });
  } catch (error) {
    console.error('Error general en evolución temporal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getEficaciaRociado = (req, res) => {
  try {
    const { inicio, fin } = req.query;
    
    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    // Obtener eficacia REAL del rociado por comunidad
    const query = `
      SELECT 
        c.nombre_comunidad as comunidad,
        COUNT(DISTINCT fr.id_rr1) as viviendas_rociadas,
        COUNT(DISTINCT ee.evaluacion_id) as viviendas_evaluadas,
        COUNT(DISTINCT CASE WHEN ee.resultado = 'positivo' THEN ee.evaluacion_id END) as viviendas_positivas,
        ROUND(
          CASE 
            WHEN COUNT(DISTINCT ee.evaluacion_id) > 0 
            THEN (COUNT(DISTINCT fr.id_rr1) * 100.0 / COUNT(DISTINCT ee.evaluacion_id))
            ELSE 0 
          END, 1
        ) as cobertura_rociado,
        ROUND(
          CASE 
            WHEN COUNT(DISTINCT ee.evaluacion_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN ee.resultado = 'positivo' THEN ee.evaluacion_id END) * 100.0 / COUNT(DISTINCT ee.evaluacion_id))
            ELSE 0 
          END, 1
        ) as tasa_infestacion
      FROM Comunidades c
      LEFT JOIN Formulario_RR1 fr ON c.comunidad_id = fr.comunidad_id 
        AND fr.fecha_registro BETWEEN ? AND ?
      LEFT JOIN Evaluaciones_Entomologicas ee ON c.comunidad_id = ee.comunidad_id 
        AND ee.fecha_evaluacion BETWEEN ? AND ?
      GROUP BY c.comunidad_id, c.nombre_comunidad
      HAVING viviendas_rociadas > 0 OR viviendas_evaluadas > 0
      ORDER BY viviendas_rociadas DESC
      LIMIT 5
    `;

    db.query(query, [inicio, fin, inicio, fin], (err, result) => {
      if (err) {
        console.error('Error al obtener eficacia de rociado:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      res.json(result);
    });
  } catch (error) {
    console.error('Error general en eficacia de rociado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getDistribucionEjemplares = (req, res) => {
  try {
    const { inicio, fin, municipio } = req.query;
    
    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    // Obtener distribución REAL de ejemplares capturados
    const query = `
      SELECT 
        'Ninfas' as id,
        'Ninfas' as label,
        COALESCE(SUM(ec.total_ninfas), 0) as value,
        '#ff6b6b' as color
      FROM EE1_Detalles_Capturas ec
      JOIN Evaluaciones_Entomologicas ee ON ec.evaluacion_id = ee.evaluacion_id
      JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
      WHERE ee.fecha_evaluacion BETWEEN ? AND ?
      
      UNION ALL
      
      SELECT 
        'Adultas' as id,
        'Adultas' as label,
        COALESCE(SUM(ec.total_adultas), 0) as value,
        '#4ecdc4' as color
      FROM EE1_Detalles_Capturas ec
      JOIN Evaluaciones_Entomologicas ee ON ec.evaluacion_id = ee.evaluacion_id
      JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
      WHERE ee.fecha_evaluacion BETWEEN ? AND ?
      
      UNION ALL
      
      SELECT 
        'Intra-domiciliarias' as id,
        'Intra-domiciliarias' as label,
        COALESCE(SUM(ec.intra_ninfas + ec.intra_adulta), 0) as value,
        '#45b7d1' as color
      FROM EE1_Detalles_Capturas ec
      JOIN Evaluaciones_Entomologicas ee ON ec.evaluacion_id = ee.evaluacion_id
      JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
      WHERE ee.fecha_evaluacion BETWEEN ? AND ?
      
      UNION ALL
      
      SELECT 
        'Peri-domiciliarias' as id,
        'Peri-domiciliarias' as label,
        COALESCE(SUM(ec.peri_ninfa + ec.peri_adulta), 0) as value,
        '#96ceb4' as color
      FROM EE1_Detalles_Capturas ec
      JOIN Evaluaciones_Entomologicas ee ON ec.evaluacion_id = ee.evaluacion_id
      JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
      WHERE ee.fecha_evaluacion BETWEEN ? AND ?
    `;

    const queryParams = [inicio, fin, inicio, fin, inicio, fin, inicio, fin];

    db.query(query, queryParams, (err, result) => {
      if (err) {
        console.error('Error al obtener distribución de ejemplares:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      res.json(result);
    });
  } catch (error) {
    console.error('Error general en distribución de ejemplares:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getMetricasProgreso = (req, res) => {
  try {
    const { inicio, fin, municipio } = req.query;
    
    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    // Obtener métricas de progreso REALES de la base de datos
    const query = `
      SELECT 
        'Denuncias Recibidas' as metrica,
        COUNT(*) as valor,
        '#e74c3c' as color
      FROM Denuncias d
      JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
      JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
      WHERE d.fecha_denuncia BETWEEN ? AND ?
      
      UNION ALL
      
      SELECT 
        'Viviendas Registradas' as metrica,
        COUNT(*) as valor,
        '#3498db' as color
      FROM Viviendas v
      JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
      WHERE v.fecha_creacion BETWEEN ? AND ?
      
      UNION ALL
      
      SELECT 
        'Habitantes Protegidos' as metrica,
        COALESCE(SUM(fr.habitantes_protegidos), 0) as valor,
        '#f39c12' as color
      FROM Formulario_RR1 fr
      JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
      WHERE fr.fecha_registro BETWEEN ? AND ?
      
      UNION ALL
      
      SELECT 
        'Comunidades Atendidas' as metrica,
        COUNT(DISTINCT c.comunidad_id) as valor,
        '#9b59b6' as color
      FROM Comunidades c
      JOIN Viviendas v ON c.comunidad_id = v.comunidad_id
      WHERE v.fecha_creacion BETWEEN ? AND ?
      
      UNION ALL
      
      SELECT 
        'Viviendas Rociadas' as metrica,
        COUNT(*) as valor,
        '#27ae60' as color
      FROM Formulario_RR1 fr
      JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
      WHERE fr.fecha_registro BETWEEN ? AND ?
      
      UNION ALL
      
      SELECT 
        'Evaluaciones Realizadas' as metrica,
        COUNT(*) as valor,
        '#8e44ad' as color
      FROM Evaluaciones_Entomologicas ee
      JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
      WHERE ee.fecha_evaluacion BETWEEN ? AND ?
      
      UNION ALL
      
      SELECT 
        'Viviendas Positivas' as metrica,
        COUNT(*) as valor,
        '#c0392b' as color
      FROM Evaluaciones_Entomologicas ee
      JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
      WHERE ee.resultado = 'positivo' AND ee.fecha_evaluacion BETWEEN ? AND ?
      
      UNION ALL
      
      SELECT 
        'Insecticida Utilizado (L)' as metrica,
        COALESCE(SUM(fr.cantidad_insecticida), 0) as valor,
        '#d35400' as color
      FROM Formulario_RR1 fr
      JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
      WHERE fr.fecha_registro BETWEEN ? AND ?
    `;

    const queryParams = [inicio, fin, inicio, fin, inicio, fin, inicio, fin, inicio, fin, inicio, fin, inicio, fin, inicio, fin];

    db.query(query, queryParams, (err, result) => {
      if (err) {
        console.error('Error al obtener métricas de progreso:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      res.json(result);
    });
  } catch (error) {
    console.error('Error general en métricas de progreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getComparacionFechas = (req, res) => {
  try {
    const { inicio, fin, municipio } = req.query;
    
    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    // Calcular fechas del período anterior para comparación
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);
    const duracion = fechaFin - fechaInicio;
    const fechaInicioAnterior = new Date(fechaInicio.getTime() - duracion);
    const fechaFinAnterior = new Date(fechaInicio);

    // Construir filtros dinámicos
    let whereClause = '';
    let municipioParam = [];
    
    if (municipio && municipio !== 'todos' && municipio !== '') {
      whereClause = `AND c.municipio_id = ?`;
      municipioParam = [municipio];
    }

    // Obtener comparación REAL entre períodos
    const query = `
      SELECT 
        'Denuncias Recibidas' as metrica,
        (SELECT COUNT(*) FROM Denuncias d
         JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
         JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
         WHERE d.fecha_denuncia BETWEEN ? AND ? ${whereClause}) as periodo_actual,
        (SELECT COUNT(*) FROM Denuncias d
         JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
         JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
         WHERE d.fecha_denuncia BETWEEN ? AND ? ${whereClause}) as periodo_anterior,
        '#e74c3c' as color
      
      UNION ALL
      
      SELECT 
        'Viviendas Registradas' as metrica,
        (SELECT COUNT(*) FROM Viviendas v
         JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
         WHERE v.fecha_creacion BETWEEN ? AND ? ${whereClause}) as periodo_actual,
        (SELECT COUNT(*) FROM Viviendas v
         JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
         WHERE v.fecha_creacion BETWEEN ? AND ? ${whereClause}) as periodo_anterior,
        '#3498db' as color
      
      UNION ALL
      
      SELECT 
        'Habitantes Protegidos' as metrica,
        (SELECT COALESCE(SUM(fr.habitantes_protegidos), 0) FROM Formulario_RR1 fr
         JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
         WHERE fr.fecha_registro BETWEEN ? AND ? ${whereClause}) as periodo_actual,
        (SELECT COALESCE(SUM(fr.habitantes_protegidos), 0) FROM Formulario_RR1 fr
         JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
         WHERE fr.fecha_registro BETWEEN ? AND ? ${whereClause}) as periodo_anterior,
        '#f39c12' as color
      
      UNION ALL
      
      SELECT 
        'Viviendas Rociadas' as metrica,
        (SELECT COUNT(*) FROM Formulario_RR1 fr
         JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
         WHERE fr.fecha_registro BETWEEN ? AND ? ${whereClause}) as periodo_actual,
        (SELECT COUNT(*) FROM Formulario_RR1 fr
         JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
         WHERE fr.fecha_registro BETWEEN ? AND ? ${whereClause}) as periodo_anterior,
        '#27ae60' as color
      
      UNION ALL
      
      SELECT 
        'Evaluaciones Realizadas' as metrica,
        (SELECT COUNT(*) FROM Evaluaciones_Entomologicas ee
         JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
         WHERE ee.fecha_evaluacion BETWEEN ? AND ? ${whereClause}) as periodo_actual,
        (SELECT COUNT(*) FROM Evaluaciones_Entomologicas ee
         JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
         WHERE ee.fecha_evaluacion BETWEEN ? AND ? ${whereClause}) as periodo_anterior,
        '#8e44ad' as color
      
      UNION ALL
      
      SELECT 
        'Insecticida Utilizado (L)' as metrica,
        (SELECT COALESCE(SUM(fr.cantidad_insecticida), 0) FROM Formulario_RR1 fr
         JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
         WHERE fr.fecha_registro BETWEEN ? AND ? ${whereClause}) as periodo_actual,
        (SELECT COALESCE(SUM(fr.cantidad_insecticida), 0) FROM Formulario_RR1 fr
         JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
         WHERE fr.fecha_registro BETWEEN ? AND ? ${whereClause}) as periodo_anterior,
        '#d35400' as color
    `;

    const queryParams = [
      inicio, fin, ...municipioParam, fechaInicioAnterior.toISOString().split('T')[0], fechaFinAnterior.toISOString().split('T')[0], ...municipioParam,
      inicio, fin, ...municipioParam, fechaInicioAnterior.toISOString().split('T')[0], fechaFinAnterior.toISOString().split('T')[0], ...municipioParam,
      inicio, fin, ...municipioParam, fechaInicioAnterior.toISOString().split('T')[0], fechaFinAnterior.toISOString().split('T')[0], ...municipioParam,
      inicio, fin, ...municipioParam, fechaInicioAnterior.toISOString().split('T')[0], fechaFinAnterior.toISOString().split('T')[0], ...municipioParam,
      inicio, fin, ...municipioParam, fechaInicioAnterior.toISOString().split('T')[0], fechaFinAnterior.toISOString().split('T')[0], ...municipioParam,
      inicio, fin, ...municipioParam, fechaInicioAnterior.toISOString().split('T')[0], fechaFinAnterior.toISOString().split('T')[0], ...municipioParam
    ];

    db.query(query, queryParams, (err, result) => {
      if (err) {
        console.error('Error al obtener comparación de fechas:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      res.json(result);
    });
  } catch (error) {
    console.error('Error general en comparación de fechas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getEstadisticasPorMunicipio = (req, res) => {
  try {
    const { municipioId } = req.params;
    
    if (!municipioId) {
      return res.status(400).json({ error: 'ID de municipio es requerido' });
    }

    // Consulta para obtener estadísticas generales filtradas por municipio
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM Viviendas v 
         JOIN Comunidades c ON v.comunidad_id = c.comunidad_id 
         WHERE c.municipio_id = ?) as viviendas_registradas,
        (SELECT COALESCE(SUM(fr.habitantes_protegidos), 0) FROM Formulario_RR1 fr
         JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
         WHERE c.municipio_id = ?) as habitantes_protegidos,
        (SELECT COUNT(*) FROM Evaluaciones_Entomologicas ee
         JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
         WHERE c.municipio_id = ?) as viviendas_evaluadas,
        (SELECT COUNT(*) FROM Evaluaciones_Entomologicas ee
         JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
         WHERE ee.resultado = 'positivo' AND c.municipio_id = ?) as viviendas_positivas,
        (SELECT COALESCE(SUM(ec.total_ninfas + ec.total_adultas), 0) FROM EE1_Detalles_Capturas ec 
         JOIN Evaluaciones_Entomologicas ee ON ec.evaluacion_id = ee.evaluacion_id 
         JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
         WHERE c.municipio_id = ?) as ejemplares_capturados,
        (SELECT COALESCE(SUM(ec.intra_ninfas + ec.intra_adulta), 0) FROM EE1_Detalles_Capturas ec 
         JOIN Evaluaciones_Entomologicas ee ON ec.evaluacion_id = ee.evaluacion_id 
         JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
         WHERE c.municipio_id = ?) as ejemplares_intra,
        (SELECT COALESCE(SUM(ec.peri_ninfa + ec.peri_adulta), 0) FROM EE1_Detalles_Capturas ec 
         JOIN Evaluaciones_Entomologicas ee ON ec.evaluacion_id = ee.evaluacion_id 
         JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
         WHERE c.municipio_id = ?) as ejemplares_peri,
        (SELECT COUNT(*) FROM Formulario_RR1 fr
         JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
         WHERE c.municipio_id = ?) as viviendas_rociadas,
        (SELECT COALESCE(SUM(fr.cantidad_insecticida), 0) FROM Formulario_RR1 fr
         JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
         WHERE c.municipio_id = ?) as total_insecticida,
        (SELECT COALESCE(SUM(fr.habitaciones_no_rociadas), 0) FROM Formulario_RR1 fr
         JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
         WHERE c.municipio_id = ?) as habitaciones_no_rociadas
    `;

    const params = [municipioId, municipioId, municipioId, municipioId, municipioId, municipioId, municipioId, municipioId, municipioId, municipioId];

    db.query(query, params, (err, result) => {
      if (err) {
        console.error('Error en consulta de estadísticas por municipio:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: 'No se encontraron estadísticas para el municipio' });
      }

      const stats = result[0];
      
      // Calcular tasa de infestación
      const tasaInfestacion = stats.viviendas_evaluadas > 0 
        ? ((stats.viviendas_positivas / stats.viviendas_evaluadas) * 100).toFixed(1)
        : 0;

      // Calcular cobertura de rociado
      const coberturaRociado = stats.viviendas_registradas > 0 
        ? ((stats.viviendas_rociadas / stats.viviendas_registradas) * 100).toFixed(1)
        : 0;

      const estadisticasGenerales = {
        viviendasRegistradas: stats.viviendas_registradas || 0,
        habitantesProtegidos: stats.habitantes_protegidos || 0,
        viviendasEvaluadas: stats.viviendas_evaluadas || 0,
        viviendasPositivas: stats.viviendas_positivas || 0,
        tasaInfestacion: parseFloat(tasaInfestacion),
        ejemplaresCapturados: stats.ejemplares_capturados || 0,
        ejemplaresIntra: stats.ejemplares_intra || 0,
        ejemplaresPeri: stats.ejemplares_peri || 0,
        viviendasRociadas: stats.viviendas_rociadas || 0,
        coberturaRociado: parseFloat(coberturaRociado),
        totalInsecticida: stats.total_insecticida || 0,
        habitacionesNoRociadas: stats.habitaciones_no_rociadas || 0
      };

      // Obtener distribución de viviendas por municipio
      const distribucionQuery = `
        SELECT 
          'Negativas' as label,
          COUNT(*) as value,
          '#1e40af' as color
        FROM Evaluaciones_Entomologicas ee
        JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
        WHERE ee.resultado = 'negativo' AND c.municipio_id = ?
        
        UNION ALL
        
        SELECT 
          'Pendientes' as label,
          COUNT(*) as value,
          '#ffffff' as color
        FROM Evaluaciones_Entomologicas ee
        JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
        WHERE ee.resultado = 'pendiente' AND c.municipio_id = ?
        
        UNION ALL
        
        SELECT 
          'Positivas' as label,
          COUNT(*) as value,
          '#6b7280' as color
        FROM Evaluaciones_Entomologicas ee
        JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
        WHERE ee.resultado = 'positivo' AND c.municipio_id = ?
        
        UNION ALL
        
        SELECT 
          'No accesibles' as label,
          COUNT(*) as value,
          '#3b82f6' as color
        FROM Evaluaciones_Entomologicas ee
        JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
        WHERE ee.resultado = 'no_accesible' AND c.municipio_id = ?
        
        UNION ALL
        
        SELECT 
          'Renuentes' as label,
          COUNT(*) as value,
          '#10b981' as color
        FROM Evaluaciones_Entomologicas ee
        JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
        WHERE ee.resultado = 'renuente' AND c.municipio_id = ?
      `;

      const distribucionParams = [municipioId, municipioId, municipioId, municipioId, municipioId];

      db.query(distribucionQuery, distribucionParams, (err, distribucionResult) => {
        if (err) {
          console.error('Error al obtener distribución por municipio:', err);
          return res.status(500).json({ error: 'Error en la base de datos' });
        }

        // Obtener top comunidades por municipio
        const topComunidadesQuery = `
          SELECT 
            c.nombre_comunidad as nombre,
            COUNT(v.vivienda_id) as valor
          FROM Comunidades c
          LEFT JOIN Viviendas v ON c.comunidad_id = v.comunidad_id
          WHERE c.municipio_id = ?
          GROUP BY c.comunidad_id, c.nombre_comunidad
          ORDER BY valor DESC
          LIMIT 4
        `;

        db.query(topComunidadesQuery, [municipioId], (err, topResult) => {
          if (err) {
            console.error('Error al obtener top comunidades por municipio:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
          }

          // Obtener costos por modelos por municipio
          const costosQuery = `
            SELECT 
              'Modelo 1 - Insecticida A' as modelo,
              COALESCE(SUM(fr.cantidad_insecticida * 150), 0) as costo
            FROM Formulario_RR1 fr
        JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
            WHERE fr.cantidad_insecticida > 0 AND c.municipio_id = ?
            
            UNION ALL
            
            SELECT 
              'Modelo 2 - Insecticida B' as modelo,
              COALESCE(SUM(fr.cantidad_insecticida * 200), 0) as costo
            FROM Formulario_RR1 fr
        JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
            WHERE fr.cantidad_insecticida > 0 AND c.municipio_id = ?
            
            UNION ALL
            
            SELECT 
              'Modelo 3 - Personal Técnico' as modelo,
              COALESCE(COUNT(*) * 500, 0) as costo
            FROM Formulario_RR1 fr
        JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
            WHERE c.municipio_id = ?
            
            UNION ALL
            
            SELECT 
              'Modelo 4 - Equipos' as modelo,
              COALESCE(COUNT(*) * 300, 0) as costo
            FROM Formulario_RR1 fr
        JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
            WHERE c.municipio_id = ?
            
            UNION ALL
            
            SELECT 
              'Modelo 5 - Transporte' as modelo,
              COALESCE(COUNT(*) * 250, 0) as costo
            FROM Formulario_RR1 fr
        JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
            WHERE c.municipio_id = ?
            
            UNION ALL
            
            SELECT 
              'Modelo 6 - Evaluaciones' as modelo,
              COALESCE(COUNT(*) * 100, 0) as costo
            FROM Evaluaciones_Entomologicas ee
            JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
            WHERE c.municipio_id = ?
            
            UNION ALL
            
            SELECT 
              'Modelo 7 - Administración' as modelo,
              COALESCE(COUNT(*) * 50, 0) as costo
            FROM Denuncias d
            JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
            JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
            WHERE c.municipio_id = ?
            
            ORDER BY costo DESC
          `;

          const costosParams = [municipioId, municipioId, municipioId, municipioId, municipioId, municipioId, municipioId];

          db.query(costosQuery, costosParams, (err, costosResult) => {
            if (err) {
              console.error('Error al obtener costos por municipio:', err);
              return res.status(500).json({ error: 'Error en la base de datos' });
            }

            const response = {
              generales: estadisticasGenerales,
              distribucionViviendas: distribucionResult || [],
              habitacionesNoRociadas: estadisticasGenerales.habitacionesNoRociadas,
              topComunidades: topResult || [],
              costosModelos: costosResult || []
            };

            res.json(response);
          });
        });
      });
    });
  } catch (error) {
    console.error('Error general en estadísticas por municipio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getEstadisticasPorFechasYMunicipio = (req, res) => {
  try {
    const { inicio, fin, municipio } = req.query;
    
    if (!inicio || !fin || !municipio) {
      return res.status(400).json({ error: 'Fechas de inicio, fin y municipio son requeridos' });
    }

    // Consulta para obtener estadísticas generales filtradas por fechas y municipio
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM Viviendas v 
         JOIN Comunidades c ON v.comunidad_id = c.comunidad_id 
         WHERE c.municipio_id = ? AND v.fecha_creacion BETWEEN ? AND ?) as viviendas_registradas,
        (SELECT COALESCE(SUM(fr.habitantes_protegidos), 0) FROM Formulario_RR1 fr
        JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
         WHERE c.municipio_id = ? AND fr.fecha_registro BETWEEN ? AND ?) as habitantes_protegidos,
        (SELECT COUNT(*) FROM Evaluaciones_Entomologicas ee
         JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
         WHERE c.municipio_id = ? AND ee.fecha_evaluacion BETWEEN ? AND ?) as viviendas_evaluadas,
        (SELECT COUNT(*) FROM Evaluaciones_Entomologicas ee
         JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
         WHERE ee.resultado = 'positivo' AND c.municipio_id = ? AND ee.fecha_evaluacion BETWEEN ? AND ?) as viviendas_positivas,
        (SELECT COALESCE(SUM(ec.total_ninfas + ec.total_adultas), 0) FROM EE1_Detalles_Capturas ec 
         JOIN Evaluaciones_Entomologicas ee ON ec.evaluacion_id = ee.evaluacion_id 
         JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
         WHERE c.municipio_id = ? AND ee.fecha_evaluacion BETWEEN ? AND ?) as ejemplares_capturados,
        (SELECT COALESCE(SUM(ec.intra_ninfas + ec.intra_adulta), 0) FROM EE1_Detalles_Capturas ec 
         JOIN Evaluaciones_Entomologicas ee ON ec.evaluacion_id = ee.evaluacion_id 
         JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
         WHERE c.municipio_id = ? AND ee.fecha_evaluacion BETWEEN ? AND ?) as ejemplares_intra,
        (SELECT COALESCE(SUM(ec.peri_ninfa + ec.peri_adulta), 0) FROM EE1_Detalles_Capturas ec 
         JOIN Evaluaciones_Entomologicas ee ON ec.evaluacion_id = ee.evaluacion_id 
         JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
         WHERE c.municipio_id = ? AND ee.fecha_evaluacion BETWEEN ? AND ?) as ejemplares_peri,
        (SELECT COUNT(*) FROM Formulario_RR1 fr
        JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
         WHERE c.municipio_id = ? AND fr.fecha_registro BETWEEN ? AND ?) as viviendas_rociadas,
        (SELECT COALESCE(SUM(fr.cantidad_insecticida), 0) FROM Formulario_RR1 fr
        JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
         WHERE c.municipio_id = ? AND fr.fecha_registro BETWEEN ? AND ?) as total_insecticida,
        (SELECT COALESCE(SUM(fr.habitaciones_no_rociadas), 0) FROM Formulario_RR1 fr
        JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
         WHERE c.municipio_id = ? AND fr.fecha_registro BETWEEN ? AND ?) as habitaciones_no_rociadas
    `;

    const params = [
      municipio, inicio, fin, // viviendas_registradas
      municipio, inicio, fin, // habitantes_protegidos
      municipio, inicio, fin, // viviendas_evaluadas
      municipio, inicio, fin, // viviendas_positivas
      municipio, inicio, fin, // ejemplares_capturados
      municipio, inicio, fin, // ejemplares_intra
      municipio, inicio, fin, // ejemplares_peri
      municipio, inicio, fin, // viviendas_rociadas
      municipio, inicio, fin, // total_insecticida
      municipio, inicio, fin  // habitaciones_no_rociadas
    ];

    db.query(query, params, (err, result) => {
      if (err) {
        console.error('Error en consulta de estadísticas por fechas y municipio:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: 'No se encontraron estadísticas para el municipio y fechas especificados' });
      }

      const stats = result[0];
      
      // Calcular tasa de infestación
      const tasaInfestacion = stats.viviendas_evaluadas > 0 
        ? ((stats.viviendas_positivas / stats.viviendas_evaluadas) * 100).toFixed(1)
        : 0;

      // Calcular cobertura de rociado
      const coberturaRociado = stats.viviendas_registradas > 0 
        ? ((stats.viviendas_rociadas / stats.viviendas_registradas) * 100).toFixed(1)
        : 0;

      const estadisticasGenerales = {
        viviendasRegistradas: stats.viviendas_registradas || 0,
        habitantesProtegidos: stats.habitantes_protegidos || 0,
        viviendasEvaluadas: stats.viviendas_evaluadas || 0,
        viviendasPositivas: stats.viviendas_positivas || 0,
        tasaInfestacion: parseFloat(tasaInfestacion),
        ejemplaresCapturados: stats.ejemplares_capturados || 0,
        ejemplaresIntra: stats.ejemplares_intra || 0,
        ejemplaresPeri: stats.ejemplares_peri || 0,
        viviendasRociadas: stats.viviendas_rociadas || 0,
        coberturaRociado: parseFloat(coberturaRociado),
        totalInsecticida: stats.total_insecticida || 0,
        habitacionesNoRociadas: stats.habitaciones_no_rociadas || 0
      };

      // Obtener distribución de viviendas por fechas y municipio
      const distribucionQuery = `
        SELECT 
          'Negativas' as label,
          COUNT(*) as value,
          '#1e40af' as color
        FROM Evaluaciones_Entomologicas ee
        JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
        WHERE ee.resultado = 'negativo' AND c.municipio_id = ? AND ee.fecha_evaluacion BETWEEN ? AND ?
        
        UNION ALL
        
        SELECT 
          'Pendientes' as label,
          COUNT(*) as value,
          '#ffffff' as color
        FROM Evaluaciones_Entomologicas ee
        JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
        WHERE ee.resultado = 'pendiente' AND c.municipio_id = ? AND ee.fecha_evaluacion BETWEEN ? AND ?
        
        UNION ALL
        
        SELECT 
          'Positivas' as label,
          COUNT(*) as value,
          '#6b7280' as color
        FROM Evaluaciones_Entomologicas ee
        JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
        WHERE ee.resultado = 'positivo' AND c.municipio_id = ? AND ee.fecha_evaluacion BETWEEN ? AND ?
        
        UNION ALL
        
        SELECT 
          'No accesibles' as label,
          COUNT(*) as value,
          '#3b82f6' as color
        FROM Evaluaciones_Entomologicas ee
        JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
        WHERE ee.resultado = 'no_accesible' AND c.municipio_id = ? AND ee.fecha_evaluacion BETWEEN ? AND ?
        
        UNION ALL
        
        SELECT 
          'Renuentes' as label,
          COUNT(*) as value,
          '#10b981' as color
        FROM Evaluaciones_Entomologicas ee
        JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
        WHERE ee.resultado = 'renuente' AND c.municipio_id = ? AND ee.fecha_evaluacion BETWEEN ? AND ?
      `;

      const distribucionParams = [
        municipio, inicio, fin, // Negativas
        municipio, inicio, fin, // Pendientes
        municipio, inicio, fin, // Positivas
        municipio, inicio, fin, // No accesibles
        municipio, inicio, fin  // Renuentes
      ];

      db.query(distribucionQuery, distribucionParams, (err, distribucionResult) => {
        if (err) {
          console.error('Error al obtener distribución por fechas y municipio:', err);
          return res.status(500).json({ error: 'Error en la base de datos' });
        }

        // Obtener top comunidades por fechas y municipio
        const topComunidadesQuery = `
          SELECT 
            c.nombre_comunidad as nombre,
            COUNT(v.vivienda_id) as valor
          FROM Comunidades c
          LEFT JOIN Viviendas v ON c.comunidad_id = v.comunidad_id
          WHERE c.municipio_id = ? AND v.fecha_creacion BETWEEN ? AND ?
          GROUP BY c.comunidad_id, c.nombre_comunidad
          ORDER BY valor DESC
          LIMIT 4
        `;

        db.query(topComunidadesQuery, [municipio, inicio, fin], (err, topResult) => {
          if (err) {
            console.error('Error al obtener top comunidades por fechas y municipio:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
          }

          // Obtener costos por modelos por fechas y municipio
          const costosQuery = `
            SELECT 
              'Modelo 1 - Insecticida A' as modelo,
              COALESCE(SUM(fr.cantidad_insecticida * 150), 0) as costo
            FROM Formulario_RR1 fr
        JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
            WHERE fr.cantidad_insecticida > 0 AND c.municipio_id = ? AND fr.fecha_registro BETWEEN ? AND ?
            
            UNION ALL
            
            SELECT 
              'Modelo 2 - Insecticida B' as modelo,
              COALESCE(SUM(fr.cantidad_insecticida * 200), 0) as costo
            FROM Formulario_RR1 fr
        JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
            WHERE fr.cantidad_insecticida > 0 AND c.municipio_id = ? AND fr.fecha_registro BETWEEN ? AND ?
            
            UNION ALL
            
            SELECT 
              'Modelo 3 - Personal Técnico' as modelo,
              COALESCE(COUNT(*) * 500, 0) as costo
            FROM Formulario_RR1 fr
        JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
            WHERE c.municipio_id = ? AND fr.fecha_registro BETWEEN ? AND ?
            
            UNION ALL
            
            SELECT 
              'Modelo 4 - Equipos' as modelo,
              COALESCE(COUNT(*) * 300, 0) as costo
            FROM Formulario_RR1 fr
        JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
            WHERE c.municipio_id = ? AND fr.fecha_registro BETWEEN ? AND ?
            
            UNION ALL
            
            SELECT 
              'Modelo 5 - Transporte' as modelo,
              COALESCE(COUNT(*) * 250, 0) as costo
            FROM Formulario_RR1 fr
        JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
            WHERE c.municipio_id = ? AND fr.fecha_registro BETWEEN ? AND ?
            
            UNION ALL
            
            SELECT 
              'Modelo 6 - Evaluaciones' as modelo,
              COALESCE(COUNT(*) * 100, 0) as costo
            FROM Evaluaciones_Entomologicas ee
            JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
            WHERE c.municipio_id = ? AND ee.fecha_evaluacion BETWEEN ? AND ?
            
            UNION ALL
            
            SELECT 
              'Modelo 7 - Administración' as modelo,
              COALESCE(COUNT(*) * 50, 0) as costo
            FROM Denuncias d
            JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
            JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
            WHERE c.municipio_id = ? AND d.fecha_denuncia BETWEEN ? AND ?
            
            ORDER BY costo DESC
          `;

          const costosParams = [
            municipio, inicio, fin, // Modelo 1
            municipio, inicio, fin, // Modelo 2
            municipio, inicio, fin, // Modelo 3
            municipio, inicio, fin, // Modelo 4
            municipio, inicio, fin, // Modelo 5
            municipio, inicio, fin, // Modelo 6
            municipio, inicio, fin  // Modelo 7
          ];

          db.query(costosQuery, costosParams, (err, costosResult) => {
            if (err) {
              console.error('Error al obtener costos por fechas y municipio:', err);
              return res.status(500).json({ error: 'Error en la base de datos' });
            }

            const response = {
              generales: estadisticasGenerales,
              distribucionViviendas: distribucionResult || [],
              habitacionesNoRociadas: estadisticasGenerales.habitacionesNoRociadas,
              topComunidades: topResult || [],
              costosModelos: costosResult || []
            };

            res.json(response);
          });
        });
      });
    });
  } catch (error) {
    console.error('Error general en estadísticas por fechas y municipio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getMunicipios = (req, res) => {
  try {
    const query = 'SELECT municipio_id, nombre_municipio, departamento FROM Municipios ORDER BY nombre_municipio';
    
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error al obtener municipios:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }
      
      res.json(result);
    });
  } catch (error) {
    console.error('Error general al obtener municipios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Nueva función para obtener estadísticas de denuncias por estado
export const getEstadisticasDenuncias = (req, res) => {
  try {
    const { inicio, fin, municipio } = req.query;
    
    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    // Construir filtros dinámicos
    let whereClause = '';
    let params = [];
    
    if (municipio && municipio !== 'todos') {
      whereClause = `AND c.municipio_id = ?`;
      params = [municipio, municipio, municipio, municipio, municipio];
    }

    // Obtener estadísticas REALES de denuncias por estado
    const query = `
      SELECT 
        'Recibidas' as estado,
        COUNT(*) as cantidad,
        '#ffc107' as color
      FROM Denuncias d
      JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
      JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
      WHERE d.estado_denuncia = 'recibida' AND d.fecha_denuncia BETWEEN ? AND ?
      ${whereClause}
      
      UNION ALL
      
      SELECT 
        'Programadas' as estado,
        COUNT(*) as cantidad,
        '#6f42c1' as color
      FROM Denuncias d
      JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
      JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
      WHERE d.estado_denuncia = 'programada' AND d.fecha_denuncia BETWEEN ? AND ?
      ${whereClause}
      
      UNION ALL
      
      SELECT 
        'Realizadas' as estado,
        COUNT(*) as cantidad,
        '#20c997' as color
      FROM Denuncias d
      JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
      JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
      WHERE d.estado_denuncia = 'realizada' AND d.fecha_denuncia BETWEEN ? AND ?
      ${whereClause}
      
      UNION ALL
      
      SELECT 
        'Canceladas' as estado,
        COUNT(*) as cantidad,
        '#dc3545' as color
      FROM Denuncias d
      JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
      JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
      WHERE d.estado_denuncia = 'cancelada' AND d.fecha_denuncia BETWEEN ? AND ?
      ${whereClause}
    `;

    const queryParams = municipio && municipio !== 'todos' 
      ? [inicio, fin, inicio, fin, inicio, fin, inicio, fin, inicio, fin, ...params]
      : [inicio, fin, inicio, fin, inicio, fin, inicio, fin, inicio, fin];

    db.query(query, queryParams, (err, result) => {
      if (err) {
        console.error('Error al obtener estadísticas de denuncias:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      res.json(result);
    });
  } catch (error) {
    console.error('Error general en estadísticas de denuncias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Nueva función para obtener estadísticas de eficiencia del rociado
export const getEficienciaRociado = (req, res) => {
  try {
    const { inicio, fin, municipio } = req.query;
    
    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    // Construir filtros dinámicos
    let whereClause = '';
    
    if (municipio && municipio !== 'todos' && municipio !== '') {
      whereClause = `AND c.municipio_id = ?`;
    }

    // Obtener estadísticas REALES de eficiencia del rociado
    const query = `
      SELECT 
        'Viviendas Cerradas' as tipo,
        COUNT(*) as cantidad,
        '#dc3545' as color
      FROM Formulario_RR1 fr
      JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
      WHERE fr.cerrada = TRUE AND fr.fecha_registro BETWEEN ? AND ?
      ${whereClause}
      
      UNION ALL
      
      SELECT 
        'Viviendas Renuentes' as tipo,
        COUNT(*) as cantidad,
        '#fd7e14' as color
      FROM Formulario_RR1 fr
      JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
      WHERE fr.renuente = TRUE AND fr.fecha_registro BETWEEN ? AND ?
      ${whereClause}
      
      UNION ALL
      
      SELECT 
        'Habitaciones No Rociadas' as tipo,
        COALESCE(SUM(fr.habitaciones_no_rociadas), 0) as cantidad,
        '#6c757d' as color
      FROM Formulario_RR1 fr
      JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
      WHERE fr.fecha_registro BETWEEN ? AND ?
      ${whereClause}
      
      UNION ALL
      
      SELECT 
        'Viviendas Exitosas' as tipo,
        COUNT(*) as cantidad,
        '#198754' as color
      FROM Formulario_RR1 fr
      JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
      WHERE fr.cerrada = FALSE AND fr.renuente = FALSE AND fr.fecha_registro BETWEEN ? AND ?
      ${whereClause}
    `;

    const queryParams = municipio && municipio !== 'todos' && municipio !== ''
      ? [inicio, fin, municipio, inicio, fin, municipio, inicio, fin, municipio, inicio, fin, municipio]
      : [inicio, fin, inicio, fin, inicio, fin, inicio, fin];

    db.query(query, queryParams, (err, result) => {
      if (err) {
        console.error('Error al obtener eficiencia de rociado:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      res.json(result);
    });
  } catch (error) {
    console.error('Error general en eficiencia de rociado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Nuevas métricas avanzadas
export const getAnalisisTemporal = (req, res) => {
  try {
    const { inicio, fin, municipio } = req.query;
    
    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    let whereClause = '';
    let params = [];
    
    if (municipio && municipio !== 'todos') {
      whereClause = `AND c.municipio_id = ?`;
      params = [municipio, municipio, municipio, municipio];
    }

    const query = `
      SELECT 
        DATE_FORMAT(d.fecha_denuncia, '%Y-%m') as mes,
        COUNT(DISTINCT d.denuncia_id) as denuncias,
        COUNT(DISTINCT CASE WHEN d.estado_denuncia = 'realizada' THEN d.denuncia_id END) as denuncias_atendidas,
        COUNT(DISTINCT ee.evaluacion_id) as evaluaciones,
        COUNT(DISTINCT CASE WHEN ee.resultado = 'positivo' THEN ee.evaluacion_id END) as evaluaciones_positivas,
        COUNT(DISTINCT fr.id_rr1) as rociados,
        ROUND(COUNT(DISTINCT CASE WHEN d.estado_denuncia = 'realizada' THEN d.denuncia_id END) * 100.0 / COUNT(DISTINCT d.denuncia_id), 2) as tasa_atencion,
        ROUND(COUNT(DISTINCT CASE WHEN ee.resultado = 'positivo' THEN ee.evaluacion_id END) * 100.0 / COUNT(DISTINCT ee.evaluacion_id), 2) as tasa_infestacion
      FROM Comunidades c
      LEFT JOIN Viviendas v ON c.comunidad_id = v.comunidad_id
      LEFT JOIN Denuncias d ON v.vivienda_id = d.vivienda_id AND d.fecha_denuncia BETWEEN ? AND ?
      LEFT JOIN Evaluaciones_Entomologicas ee ON c.comunidad_id = ee.comunidad_id AND ee.fecha_evaluacion BETWEEN ? AND ?
      LEFT JOIN Formulario_RR1 fr ON c.comunidad_id = fr.comunidad_id AND fr.fecha_registro BETWEEN ? AND ?
      WHERE 1=1 ${whereClause}
      GROUP BY DATE_FORMAT(d.fecha_denuncia, '%Y-%m')
      ORDER BY mes DESC
    `;

    const queryParams = municipio && municipio !== 'todos' 
      ? [inicio, fin, inicio, fin, inicio, fin, ...params]
      : [inicio, fin, inicio, fin, inicio, fin];

    db.query(query, queryParams, (err, result) => {
      if (err) {
        console.error('Error al obtener análisis temporal:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      res.json(result);
    });
  } catch (error) {
    console.error('Error general en análisis temporal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getDistribucionGeografica = (req, res) => {
  try {
    const { inicio, fin, municipio } = req.query;
    
    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    let whereClause = '';
    let params = [];
    
    if (municipio && municipio !== 'todos') {
      whereClause = `AND m.municipio_id = ?`;
      params = [municipio, municipio, municipio, municipio];
    }

    const query = `
      SELECT 
        m.nombre_municipio,
        COUNT(DISTINCT c.comunidad_id) as comunidades,
        COUNT(DISTINCT v.vivienda_id) as viviendas,
        COUNT(DISTINCT d.denuncia_id) as denuncias,
        COUNT(DISTINCT ee.evaluacion_id) as evaluaciones,
        COUNT(DISTINCT CASE WHEN ee.resultado = 'positivo' THEN ee.evaluacion_id END) as evaluaciones_positivas,
        COUNT(DISTINCT fr.id_rr1) as rociados,
        SUM(fr.habitantes_protegidos) as habitantes_protegidos,
        SUM(fr.cantidad_insecticida) as insecticida_utilizado,
        ROUND(COUNT(DISTINCT CASE WHEN ee.resultado = 'positivo' THEN ee.evaluacion_id END) * 100.0 / COUNT(DISTINCT ee.evaluacion_id), 2) as tasa_infestacion
      FROM Municipios m
      LEFT JOIN Comunidades c ON m.municipio_id = c.municipio_id
      LEFT JOIN Viviendas v ON c.comunidad_id = v.comunidad_id
      LEFT JOIN Denuncias d ON v.vivienda_id = d.vivienda_id AND d.fecha_denuncia BETWEEN ? AND ?
      LEFT JOIN Evaluaciones_Entomologicas ee ON c.comunidad_id = ee.comunidad_id AND ee.fecha_evaluacion BETWEEN ? AND ?
      LEFT JOIN Formulario_RR1 fr ON c.comunidad_id = fr.comunidad_id AND fr.fecha_registro BETWEEN ? AND ?
      WHERE 1=1 ${whereClause}
      GROUP BY m.municipio_id, m.nombre_municipio
      ORDER BY denuncias DESC
    `;

    const queryParams = municipio && municipio !== 'todos' 
      ? [inicio, fin, inicio, fin, inicio, fin, ...params]
      : [inicio, fin, inicio, fin, inicio, fin];

    db.query(query, queryParams, (err, result) => {
      if (err) {
        console.error('Error al obtener distribución geográfica:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      res.json(result);
    });
  } catch (error) {
    console.error('Error general en distribución geográfica:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getAnalisisEjemplares = (req, res) => {
  try {
    const { inicio, fin, municipio } = req.query;
    
    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    let whereClause = '';
    let params = [];
    
    if (municipio && municipio !== 'todos') {
      whereClause = `AND c.municipio_id = ?`;
      params = [municipio, municipio, municipio];
    }

    const query = `
      SELECT 
        ee.resultado,
        SUM(det.total_ninfas + det.total_adultas) as total_ejemplares,
        SUM(det.intra_ninfas + det.intra_adulta) as ejemplares_intra,
        SUM(det.peri_ninfa + det.peri_adulta) as ejemplares_peri,
        AVG(det.total_ninfas + det.total_adultas) as promedio_por_evaluacion,
        MAX(det.total_ninfas + det.total_adultas) as maximo_encontrado,
        COUNT(DISTINCT det.evaluacion_id) as evaluaciones_con_ejemplares,
        ROUND(SUM(det.intra_ninfas + det.intra_adulta) * 100.0 / SUM(det.total_ninfas + det.total_adultas), 2) as porcentaje_intra,
        ROUND(SUM(det.peri_ninfa + det.peri_adulta) * 100.0 / SUM(det.total_ninfas + det.total_adultas), 2) as porcentaje_peri
      FROM Evaluaciones_Entomologicas ee
      JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
      JOIN EE1_Detalles_Capturas det ON ee.evaluacion_id = det.evaluacion_id
      WHERE ee.fecha_evaluacion BETWEEN ? AND ?
      ${whereClause}
      GROUP BY ee.resultado
      ORDER BY total_ejemplares DESC
    `;

    const queryParams = municipio && municipio !== 'todos' 
      ? [inicio, fin, ...params]
      : [inicio, fin];

    db.query(query, queryParams, (err, result) => {
      if (err) {
        console.error('Error al obtener análisis de ejemplares:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      res.json(result);
    });
  } catch (error) {
    console.error('Error general en análisis de ejemplares:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getIndicadoresRendimiento = (req, res) => {
  try {
    const { inicio, fin, municipio } = req.query;
    
    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    let whereClause = '';
    let municipioParam = [];
    
    if (municipio && municipio !== 'todos' && municipio !== '') {
      whereClause = `AND c.municipio_id = ?`;
      municipioParam = [municipio];
    }

    const query = `
      SELECT 
        'Tiempo Promedio de Atención' as indicador,
        ROUND(AVG(TIMESTAMPDIFF(HOUR, d.fecha_denuncia, d.fecha_ejecucion)), 2) as valor,
        'horas' as unidad,
        '#3498db' as color
      FROM Denuncias d
      JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
      JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
      WHERE d.fecha_denuncia BETWEEN ? AND ? AND d.fecha_ejecucion IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'Eficiencia de Evaluación' as indicador,
        ROUND(COUNT(DISTINCT ee.evaluacion_id) * 100.0 / COUNT(DISTINCT d.denuncia_id), 2) as valor,
        '%' as unidad,
        '#2ecc71' as color
      FROM Denuncias d
      JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
      JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
      LEFT JOIN Evaluaciones_Entomologicas ee ON c.comunidad_id = ee.comunidad_id AND ee.fecha_evaluacion BETWEEN ? AND ?
      WHERE d.fecha_denuncia BETWEEN ? AND ?
      
      UNION ALL
      
      SELECT 
        'Cobertura de Rociado' as indicador,
        ROUND(COUNT(DISTINCT fr.id_rr1) * 100.0 / COUNT(DISTINCT CASE WHEN ee.resultado = 'positivo' THEN ee.evaluacion_id END), 2) as valor,
        '%' as unidad,
        '#e74c3c' as color
      FROM Evaluaciones_Entomologicas ee
      JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
      LEFT JOIN Formulario_RR1 fr ON c.comunidad_id = fr.comunidad_id AND fr.fecha_registro BETWEEN ? AND ?
      WHERE ee.fecha_evaluacion BETWEEN ? AND ? AND ee.resultado = 'positivo'
      
      UNION ALL
      
      SELECT 
        'Habitantes Protegidos por Litro' as indicador,
        ROUND(SUM(fr.habitantes_protegidos) / SUM(fr.cantidad_insecticida), 2) as valor,
        'personas/L' as unidad,
        '#f39c12' as color
      FROM Formulario_RR1 fr
      JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
      WHERE fr.fecha_registro BETWEEN ? AND ? AND fr.cantidad_insecticida > 0
    `;

    const queryParams = [
      inicio, fin, ...municipioParam, inicio, fin, ...municipioParam, 
      inicio, fin, ...municipioParam, inicio, fin, ...municipioParam, 
      inicio, fin, ...municipioParam, inicio, fin, ...municipioParam
    ];

    db.query(query, queryParams, (err, result) => {
      if (err) {
        console.error('Error al obtener indicadores de rendimiento:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      res.json(result);
    });
  } catch (error) {
    console.error('Error general en indicadores de rendimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
