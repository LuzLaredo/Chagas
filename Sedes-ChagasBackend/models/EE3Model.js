// =============================================
// models/EE3Model.js  (ESM compatible)
// =============================================

import db from "../config/db.js";

// =============================================
// Wrapper promisificado para consultas
// =============================================
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// =============================================
// Construcción dinámica del WHERE
// =============================================
function buildWhere(filters = {}) {
  const where = [];
  const params = [];

  const inicio = filters.fechaInicio;
  const fin = filters.fechaFin;
  const municipioId = filters.municipioId;

  // Filtro de Fecha (Aplicar a la tabla de evaluaciones 'e' si existe, o 'ee')
  // Usaremos 'e' por consistencia con la query principal
  if (inicio && fin) {
    where.push("e.fecha_evaluacion BETWEEN ? AND ?");
    params.push(inicio, fin);
  }

  // Filtro de Municipio
  if (municipioId) {
    if (Array.isArray(municipioId)) {
      if (municipioId.length > 0) {
        where.push(`m.municipio_id IN (${municipioId.join(',')})`);
      } else {
        where.push("1=0"); // Array vacío, no mostrar nada
      }
    } else {
      where.push("m.municipio_id = ?");
      params.push(municipioId);
    }
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return { whereSQL, params };
}

// =============================================
// LISTAR EVALUACIONES — CORREGIDO (LEFT JOIN MUNICIPIOS)
// =============================================
async function listarEvaluaciones(filters = {}) {
  const { whereSQL, params } = buildWhere(filters);

  // NOTA IMPORTANTE: Para mostrar TODOS los municipios, debemos empezar desde Municipios.
  // Sin embargo, listarEvaluaciones devuelve filas por evaluación.
  // Si un municipio NO tiene evaluaciones, ¿qué devolvemos?
  // Si devolvemos una fila con NULLs, el frontend debe saber renderizarlo.
  // Como el usuario pidió "Que salgan todos los municipios", asumiremos que quiere ver
  // al menos una fila por municipio indicando "Sin datos" o con 0s.

  const sql = `
    SELECT
      e.evaluacion_id, 
      m.municipio_id, 
      c.comunidad_id, 
      e.sede_id, 
      e.redsalud_id, 
      e.establecimiento_id,

      e.fecha_evaluacion AS fecha_ejecucion,
      NULL AS fecha_inicio,
      NULL AS fecha_final,

      m.nombre_municipio AS municipio,
      COALESCE(c.nombre_comunidad, 'Sin Comunidad') AS comunidad,
      s.nombre_sede AS sede,
      r.nombre_red AS redsalud,
      es.nombre_establecimiento AS establecimiento,
      es.tipo_establecimiento AS establecimiento_tipo,

      COALESCE(e.numero_habitantes, 0) AS total_habitantes,
      COALESCE(e.numero_habitaciones, 0) AS total_habitaciones,

      COALESCE(c.cantidad_viviendas, 0) AS viviendas_existentes,

      0 AS viviendas_programadas,   -- 🔥 ESTE CAMPO YA NO EXISTE

      CASE WHEN e.evaluacion_id IS NOT NULL THEN 1 ELSE 0 END AS viviendas_revisadas,

      SUM(CASE WHEN e.resultado = 'positivo' THEN 1 ELSE 0 END) AS viv_positivas,

      COALESCE(SUM(d.intra_ninfas),0) AS intra_ninfas,
      COALESCE(SUM(d.intra_adulta),0) AS intra_adulta,
      COALESCE(SUM(d.peri_ninfa),0) AS peri_ninfa,
      COALESCE(SUM(d.peri_adulta),0) AS peri_adulta,

      CASE WHEN (COALESCE(SUM(d.intra_ninfas),0) + COALESCE(SUM(d.intra_adulta),0)) > 0 THEN 1 ELSE 0 END AS viv_pos_intra,
      CASE WHEN (COALESCE(SUM(d.peri_ninfa),0) + COALESCE(SUM(d.peri_adulta),0)) > 0 THEN 1 ELSE 0 END AS viv_pos_peri,

      CASE WHEN COALESCE(SUM(d.intra_ninfas),0) > 0 THEN 1 ELSE 0 END AS viv_ci_intra,
      CASE WHEN COALESCE(SUM(d.peri_ninfa),0) > 0 THEN 1 ELSE 0 END AS viv_ci_peri,

      SUM(CASE WHEN e.vivienda_mejorada_intra = 1 THEN 1 ELSE 0 END) AS mej_intra_si,
      SUM(CASE WHEN e.vivienda_mejorada_intra = 0 THEN 1 ELSE 0 END) AS mej_intra_no,
      SUM(CASE WHEN e.vivienda_mejorada_peri = 1 THEN 1 ELSE 0 END) AS mej_peri_si,
      SUM(CASE WHEN e.vivienda_mejorada_peri = 0 THEN 1 ELSE 0 END) AS mej_peri_no,

      COALESCE(SUM(d.intra_pared),0) AS intra_pared,
      COALESCE(SUM(d.intra_techo),0) AS intra_techo,
      COALESCE(SUM(d.intra_cama),0) AS intra_cama,
      COALESCE(SUM(d.intra_otros),0) AS intra_otros,

      COALESCE(SUM(d.peri_corral),0) AS peri_corral,
      COALESCE(SUM(d.peri_gallinero),0) AS peri_gallinero,
      COALESCE(SUM(d.peri_conejera),0) AS peri_conejera,
      COALESCE(SUM(d.peri_zarzo_troje),0) AS peri_zarzo_troje,

      ( 
        COALESCE(SUM(d.intra_ninfas),0) +
        COALESCE(SUM(d.intra_adulta),0) +
        COALESCE(SUM(d.peri_ninfa),0) +
        COALESCE(SUM(d.peri_adulta),0)
      ) AS ejemplares_total,

      e.latitud AS lat_prom,
      e.longitud AS lng_prom,
      e.altura AS altura_prom,

      0 AS est_ae_exist,
      0 AS est_ae_ejec,
      0 AS com_ae_exist,
      0 AS com_ae_ejec

    FROM Municipios m
    LEFT JOIN Comunidades c 
      ON c.municipio_id = m.municipio_id
    LEFT JOIN Evaluaciones_Entomologicas e
      ON e.comunidad_id = c.comunidad_id
    LEFT JOIN EE1_Detalles_Capturas d 
      ON d.evaluacion_id = e.evaluacion_id
    LEFT JOIN Sedes s 
      ON s.sede_id = e.sede_id
    LEFT JOIN RedSalud r 
      ON r.redsalud_id = e.redsalud_id
    LEFT JOIN EstablecimientosSalud es 
      ON es.establecimiento_id = e.establecimiento_id

    ${whereSQL}

    GROUP BY m.municipio_id, c.comunidad_id, e.evaluacion_id
    ORDER BY m.nombre_municipio, e.fecha_evaluacion DESC
  `;

  return await runQuery(sql, params);
}

// =============================================
// Estadísticas
// =============================================
async function estadisticas(filters = {}) {
  const { whereSQL, params } = buildWhere(filters);

  const sql = `
    SELECT
      COUNT(DISTINCT e.evaluacion_id) AS total,
      SUM(CASE WHEN e.resultado = 'positivo' THEN 1 ELSE 0 END) AS positivas,
      
      COALESCE(SUM(e.numero_habitantes),0) AS habitantes,
      COALESCE(SUM(e.numero_habitaciones),0) AS habitaciones,

      COALESCE(SUM(d.intra_ninfas),0) AS intraN,
      COALESCE(SUM(d.intra_adulta),0) AS intraA,
      COALESCE(SUM(d.peri_ninfa),0) AS periN,
      COALESCE(SUM(d.peri_adulta),0) AS periA,

      ( 
        COALESCE(SUM(d.intra_ninfas),0) +
        COALESCE(SUM(d.intra_adulta),0) +
        COALESCE(SUM(d.peri_ninfa),0) +
        COALESCE(SUM(d.peri_adulta),0)
      ) AS capturas,

      ROUND(AVG(e.latitud),6) AS lat_prom,
      ROUND(AVG(e.longitud),6) AS lng_prom,
      ROUND(AVG(e.altura),2) AS altura_prom

    FROM Municipios m
    LEFT JOIN Comunidades c ON c.municipio_id = m.municipio_id
    LEFT JOIN Evaluaciones_Entomologicas e ON e.comunidad_id = c.comunidad_id
    LEFT JOIN EE1_Detalles_Capturas d ON d.evaluacion_id = e.evaluacion_id
    ${whereSQL}
  `;

  const rows = await runQuery(sql, params);
  const row = rows?.[0] ?? {};

  // Recalcular porcentaje en JS para evitar división por cero en SQL (más seguro)
  const total = row.total || 0;
  const positivas = row.positivas || 0;
  const porc = total > 0 ? Math.round((positivas / total) * 100) : 0;

  return {
    total: total,
    positivas: positivas,
    porc: porc,
    habitantes: row.habitantes || 0,
    habitaciones: row.habitaciones || 0,
    intraN: row.intraN || 0,
    intraA: row.intraA || 0,
    periN: row.periN || 0,
    periA: row.periA || 0,
    capturas: row.capturas || 0,
    lat_prom: row.lat_prom ?? null,
    lng_prom: row.lng_prom ?? null,
    altura_prom: row.altura_prom ?? null
  };
}

// =============================================
// Export
// =============================================
export default {
  listarEvaluaciones,
  estadisticas
};
