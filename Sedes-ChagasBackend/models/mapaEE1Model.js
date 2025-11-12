import db from "../config/db.js";

/**
 * Obtiene todos los registros de Evaluaciones Entomológicas (EE1)
 * junto con su geolocalización, fecha, y nombres de municipio/comunidad.
 * Compatible con mysql2 (sin /promise).
 */
export const getAllMapaEE1 = () => {
  return new Promise((resolve, reject) => {
    const query = `
 SELECT 
        ee.evaluacion_id AS id,
        ee.latitud,
        ee.longitud,
        ee.altura,
        dc.fecha_programada,
        dc.hora_programada,
        ee.resultado,
        m.nombre_municipio,
        c.nombre_comunidad,
        rr1.fecha_registro AS fecha_rociado,
        CASE 
          WHEN ee.resultado = 'positivo' 
               AND rr1.id_rr1 IS NOT NULL 
               AND rr1.fecha_registro > ee.fecha_evaluacion 
            THEN 'Rociado Realizado'
          WHEN ee.resultado = 'positivo' 
               AND (rr1.id_rr1 IS NULL OR rr1.fecha_registro <= ee.fecha_evaluacion)
            THEN 'Pendiente de Rociado'
          ELSE 'No Requiere Rociado'
        END AS estado_rociado
      FROM Evaluaciones_Entomologicas ee
      LEFT JOIN EE1_Detalles_Capturas dc 
        ON ee.evaluacion_id = dc.evaluacion_id
      LEFT JOIN Municipios m 
        ON ee.municipio_id = m.municipio_id
      LEFT JOIN Comunidades c 
        ON ee.comunidad_id = c.comunidad_id
      LEFT JOIN Formulario_RR1 rr1 
        ON ee.numero_vivienda = rr1.numero_vivienda 
        AND ee.comunidad_id = rr1.comunidad_id;
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("❌ Error en getAllMapaEE1 (Modelo):", err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};
