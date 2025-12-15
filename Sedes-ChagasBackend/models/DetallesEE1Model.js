import db from "../config/db.js"; // Asegúrate de que esta ruta es correcta

/**
 * Obtiene todos los detalles de una Evaluación Entomológica (EE1) 
 * y determina el estado del servicio basándose en EE.resultado y Formulario_RR1.
 * @param {number} evaluacionId - El ID de la Evaluación Entomológica a consultar.
 */
export const getDetalleEE1ById = (evaluacionId) => {
    return new Promise((resolve, reject) => {
        const sqlQuery = `
            SELECT
                -- 1. Datos Generales de Vivienda y Ubicación
                EE.jefe_familia,
                EE.numero_vivienda AS n_vivienda,
                EE.numero_habitantes AS n_habitantes,
                C.nombre_comunidad AS comunidad,
                M.nombre_municipio AS municipio,
                
                -- 2. Resultado Entomológico
                EE.resultado AS resultado_ee, 

                -- 3. Programación y Estado del Servicio
               
                CASE 
                    -- Condición 1: Si es negativo, el servicio concluye.
                    WHEN EE.resultado = 'negativo' THEN 'Negativo' 
                    
                    
                END AS estado_servicio,

                -- 4. Ubicación y Visual
                EE.foto_entrada,
                EE.latitud,
                EE.longitud
            FROM
                Evaluaciones_Entomologicas EE
            JOIN
                Comunidades C ON EE.comunidad_id = C.comunidad_id
            JOIN
                Municipios M ON EE.municipio_id = M.municipio_id
            LEFT JOIN
                EE1_Detalles_Capturas DTC ON EE.evaluacion_id = DTC.evaluacion_id
            LEFT JOIN
                Formulario_RR1 RR1 ON EE.comunidad_id = RR1.comunidad_id 
                    AND EE.numero_vivienda = RR1.numero_vivienda
            WHERE
                EE.evaluacion_id = ?; 
        `;

        db.query(sqlQuery, [evaluacionId], (err, results) => {
            if (err) {
                console.error("❌ Error en getDetalleEE1ById (Modelo):", err);
                reject(err);
            } else {
                resolve(results.length > 0 ? results[0] : null);
            }
        });
    });
};