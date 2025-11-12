// =============================================
// models/EE3Model.js  (ESM compatible)
// =============================================

// Import de la base de datos (ESM)
import db from "../config/db.js";

// =============================================
// Wrapper promisificado para consultas
// =============================================
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows /* , fields */) => {
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

  if (filters.fechaInicio) {
    where.push("e.fecha_evaluacion >= ?");
    params.push(filters.fechaInicio);
  }
  if (filters.fechaFin) {
    where.push("e.fecha_evaluacion <= ?");
    params.push(filters.fechaFin);
  }
  if (filters.municipioId) {
    where.push("e.municipio_id = ?");
    params.push(Number(filters.municipioId));
  }
  if (filters.sedeId) {
    where.push("e.sede_id = ?");
    params.push(Number(filters.sedeId));
  }
  if (filters.redId) {
    where.push("e.redsalud_id = ?");
    params.push(Number(filters.redId));
  }
  if (filters.establecimientoId) {
    where.push("e.establecimiento_id = ?");
    params.push(Number(filters.establecimientoId));
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return { whereSQL, params };
}

// =============================================
// Listado de evaluaciones
// =============================================
async function listarEvaluaciones(filters = {}) {
  const { whereSQL, params } = buildWhere(filters);

  const sql = `
    SELECT
      e.evaluacion_id, e.municipio_id, e.comunidad_id, e.sede_id, e.redsalud_id, e.establecimiento_id,
      e.fecha_evaluacion AS fecha_ejecucion,
      NULL AS fecha_inicio, NULL AS fecha_final,
      m.nombre_municipio AS municipio,
      c.nombre_comunidad AS comunidad,
      s.nombre_sede AS sede,
      r.nombre_red AS redsalud,
      es.nombre_establecimiento AS establecimiento,
      es.tipo_establecimiento AS establecimiento_tipo,
      COALESCE(e.numero_habitantes, 0) AS total_habitantes,
      COALESCE(e.numero_habitaciones, 0) AS total_habitaciones,
      COALESCE(c.cantidad_viviendas, 0) AS viviendas_existentes,
      CASE WHEN MIN(d.fecha_programada) IS NULL THEN 0 ELSE 1 END AS viviendas_programadas,
      1 AS viviendas_revisadas,
      SUM(e.resultado = 'positivo') AS viv_positivas,
      COALESCE(SUM(d.intra_ninfas),0) AS intra_ninfas,
      COALESCE(SUM(d.intra_adulta),0) AS intra_adulta,
      COALESCE(SUM(d.peri_ninfa),0) AS peri_ninfa,
      COALESCE(SUM(d.peri_adulta),0) AS peri_adulta,
      CASE WHEN (COALESCE(SUM(d.intra_ninfas),0) + COALESCE(SUM(d.intra_adulta),0)) > 0 THEN 1 ELSE 0 END AS viv_pos_intra,
      CASE WHEN (COALESCE(SUM(d.peri_ninfa),0) + COALESCE(SUM(d.peri_adulta),0)) > 0 THEN 1 ELSE 0 END AS viv_pos_peri,
      CASE WHEN COALESCE(SUM(d.intra_ninfas),0) > 0 THEN 1 ELSE 0 END AS viv_ci_intra,
      CASE WHEN COALESCE(SUM(d.peri_ninfa),0) > 0 THEN 1 ELSE 0 END AS viv_ci_peri,
      SUM(e.vivienda_mejorada_intra = 1) AS mej_intra_si,
      SUM(e.vivienda_mejorada_intra = 0) AS mej_intra_no,
      SUM(e.vivienda_mejorada_peri = 1) AS mej_peri_si,
      SUM(e.vivienda_mejorada_peri = 0) AS mej_peri_no,
      COALESCE(SUM(d.intra_pared),0) AS intra_pared,
      COALESCE(SUM(d.intra_techo),0) AS intra_techo,
      COALESCE(SUM(d.intra_cama),0) AS intra_cama,
      COALESCE(SUM(d.intra_otros),0) AS intra_otros,
      COALESCE(SUM(d.peri_corral),0) AS peri_corral,
      COALESCE(SUM(d.peri_gallinero),0) AS peri_gallinero,
      COALESCE(SUM(d.peri_conejera),0) AS peri_conejera,
      COALESCE(SUM(d.peri_zarzo_troje),0) AS peri_zarzo_troje,
      (COALESCE(SUM(d.intra_ninfas),0) + COALESCE(SUM(d.intra_adulta),0) + COALESCE(SUM(d.peri_ninfa),0) + COALESCE(SUM(d.peri_adulta),0)) AS ejemplares_total,
      e.latitud AS lat_prom,
      e.longitud AS lng_prom,
      e.altura AS altura_prom,
      0 AS est_ae_exist, 0 AS est_ae_ejec, 0 AS com_ae_exist, 0 AS com_ae_ejec
    FROM Evaluaciones_Entomologicas e
    LEFT JOIN EE1_Detalles_Capturas d ON d.evaluacion_id = e.evaluacion_id
    LEFT JOIN Municipios m ON m.municipio_id = e.municipio_id
    LEFT JOIN Comunidades c ON c.comunidad_id = e.comunidad_id
    LEFT JOIN Sedes s ON s.sede_id = e.sede_id
    LEFT JOIN RedSalud r ON r.redsalud_id = e.redsalud_id
    LEFT JOIN EstablecimientosSalud es ON es.establecimiento_id = e.establecimiento_id
    ${whereSQL}
    GROUP BY e.evaluacion_id
    ORDER BY e.fecha_evaluacion DESC, e.evaluacion_id DESC
  `;

  return await runQuery(sql, params);
}

// =============================================
// Estadísticas globales
// =============================================
async function estadisticas(filters = {}) {
  const { whereSQL, params } = buildWhere(filters);

  const sql = `
    SELECT
      COUNT(DISTINCT e.evaluacion_id) AS total,
      SUM(e.resultado = 'positivo') AS positivas,
      ROUND(100 * SUM(e.resultado = 'positivo') / NULLIF(COUNT(DISTINCT e.evaluacion_id),0)) AS porc,
      COALESCE(SUM(e.numero_habitantes),0) AS habitantes,
      COALESCE(SUM(e.numero_habitaciones),0) AS habitaciones,
      COALESCE(SUM(d.intra_ninfas),0) AS intraN,
      COALESCE(SUM(d.intra_adulta),0) AS intraA,
      COALESCE(SUM(d.peri_ninfa),0) AS periN,
      COALESCE(SUM(d.peri_adulta),0) AS periA,
      (COALESCE(SUM(d.intra_ninfas),0) + COALESCE(SUM(d.intra_adulta),0) + COALESCE(SUM(d.peri_ninfa),0) + COALESCE(SUM(d.peri_adulta),0)) AS capturas,
      ROUND(AVG(e.latitud),6) AS lat_prom,
      ROUND(AVG(e.longitud),6) AS lng_prom,
      ROUND(AVG(e.altura),2) AS altura_prom
    FROM Evaluaciones_Entomologicas e
    LEFT JOIN EE1_Detalles_Capturas d ON d.evaluacion_id = e.evaluacion_id
    ${whereSQL}
  `;

  const rows = await runQuery(sql, params);
  const row = rows?.[0] ?? {};

  return {
    total: row.total || 0,
    positivas: row.positivas || 0,
    porc: row.porc || 0,
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
// Export por defecto (para poder usar import EE3 from ...)
export default {
  listarEvaluaciones,
  estadisticas
};
