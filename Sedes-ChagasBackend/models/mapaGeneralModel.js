// C:\PS3-CHAGAS\Sedes-ChagasBackend\models\mapaGeneralModel.js
import db from "../config/db.js";

/**
 * Obtiene un conjunto de datos unificado de Denuncias y Evaluaciones Entomológicas (EE1),
 * excluyendo registros con estado 'negativo' (EE1) y 'cancelada' (Denuncias).
 * Compatible con mysql.createConnection (sin mysql2/promise).
 * @returns {Promise<Array>} Array de objetos con datos de Denuncias y EE1.
 */
export const getAllMapaGeneral = (municipioId = null) => {
  const query = `
SELECT * FROM (
  (
    SELECT
      ee.evaluacion_id AS id,
      ee.latitud,
      ee.longitud,
      ee.altura,
      COALESCE(dc.fecha_programada) AS fecha_registro,
      'evaluacion_entomologica' AS tipo_registro,
      ee.resultado AS estado_resultado,
      m.nombre_municipio,
      c.nombre_comunidad,
      m.municipio_id,
      -- ✅ Nuevo: si existe un registro en Formulario_RR1 con la misma vivienda, entonces ya fue rociado
      CASE  
        WHEN rr1.id_rr1 IS NOT NULL THEN 'Sí'
        ELSE 'No'
      END AS rociado
    FROM Evaluaciones_Entomologicas ee
    LEFT JOIN EE1_Detalles_Capturas dc ON ee.evaluacion_id = dc.evaluacion_id
    LEFT JOIN Municipios m ON ee.municipio_id = m.municipio_id
    LEFT JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
    LEFT JOIN Formulario_RR1 rr1 
           ON rr1.numero_vivienda = ee.numero_vivienda
           AND rr1.comunidad_id = ee.comunidad_id
    WHERE ee.latitud IS NOT NULL AND ee.longitud IS NOT NULL
    ${municipioId ? 'AND m.municipio_id = ?' : ''}
  )

  UNION ALL

  (
    SELECT
      d.denuncia_id AS id,
      d.latitud,
      d.longitud,
      d.altura,
      COALESCE(d.fecha_programacion) AS fecha_registro,
      'denuncia' AS tipo_registro,
      d.estado_denuncia AS estado_resultado,
      m.nombre_municipio,
      c.nombre_comunidad,
      m.municipio_id,
      NULL AS rociado -- Las denuncias no aplican
    FROM Denuncias d
    JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
    JOIN Comunidades c ON v.comunidad_id = c.comunidad_id
    JOIN Municipios m ON c.municipio_id = m.municipio_id
    WHERE d.latitud IS NOT NULL AND d.longitud IS NOT NULL
    ${municipioId ? 'AND m.municipio_id = ?' : ''}
  )
) AS T;

  `;

  return new Promise((resolve, reject) => {
    // Si hay municipioId, duplicar el parámetro para ambas partes del UNION
    const queryParams = municipioId ? [municipioId, municipioId] : [];
    
    db.query(query, queryParams, (error, results) => {
      if (error) {
        console.error("❌ Error en getAllMapaGeneral (Modelo):", error);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};
