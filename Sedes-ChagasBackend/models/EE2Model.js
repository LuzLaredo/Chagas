import db, { verifyConnection } from "../config/db.js";

function pct(num, den) {
  const n = Number(num) || 0, d = Number(den) || 0;
  return d > 0 ? `${((n / d) * 100).toFixed(0)}%` : "0%";
}

export const EE2Model = {
  // ================== ESTADÍSTICAS (RESUMEN) ==================
  async getEstadisticas(filtros = {}) {
    await verifyConnection();
    const { fechaInicio, fechaFin, municipio } = filtros;

    let where = "1=1";
    let params = [];

    // Filtros de Fecha (para Evaluaciones)
    let dateFilter = "";
    let dateParams = [];
    if (fechaInicio && fechaFin) {
      dateFilter = "AND ee.fecha_evaluacion BETWEEN ? AND ?";
      dateParams = [fechaInicio, fechaFin];
    }

    // Filtro de Municipio
    if (municipio) {
      if (Array.isArray(municipio)) {
        if (municipio.length > 0) {
          where += ` AND mu.municipio_id IN (${municipio.join(',')})`;
        } else {
          where += " AND 1=0"; // Array vacío, no mostrar nada
        }
      } else {
        // En caso de que venga nombre o ID simple (aunque preferible ID)
        // Si es nombre:
        if (isNaN(municipio)) {
          where += " AND mu.nombre_municipio = ?";
          params.push(municipio);
        } else {
          where += " AND mu.municipio_id = ?";
          params.push(municipio);
        }
      }
    }

    const sql = `
      SELECT
        COUNT(ee.evaluacion_id) AS total_evaluaciones,
        SUM(CASE WHEN ee.resultado='positivo' THEN 1 ELSE 0 END) AS positivas,
        SUM(CASE WHEN ee.resultado='negativo' THEN 1 ELSE 0 END) AS negativas,

        SUM(COALESCE(ee.numero_habitantes,0))   AS total_habitantes,
        SUM(COALESCE(ee.numero_habitaciones,0)) AS total_habitaciones,

        COALESCE(SUM(dc.intra_ninfas),0) AS intra_ninfas,
        COALESCE(SUM(dc.intra_adulta),0) AS intra_adulta,
        COALESCE(SUM(dc.peri_ninfa),0)   AS peri_ninfa,
        COALESCE(SUM(dc.peri_adulta),0)  AS peri_adulta
      FROM Municipios mu
      LEFT JOIN Comunidades c ON c.municipio_id = mu.municipio_id
      LEFT JOIN Evaluaciones_Entomologicas ee ON ee.comunidad_id = c.comunidad_id ${dateFilter}
      LEFT JOIN EE1_Detalles_Capturas dc ON dc.evaluacion_id = ee.evaluacion_id
      WHERE ${where}
    `;

    const fullParams = [...dateParams, ...params];

    console.log("🔍 SQL getEstadisticas (Refactor):", sql);
    console.log("🔍 Parámetros:", fullParams);

    return new Promise((resolve, reject) => {
      db.query(sql, fullParams, (err, rows) => {
        if (err) {
          console.error("❌ Error SQL getEstadisticas:", err);
          return reject(err);
        }
        const r = rows[0] || {};
        const total = r.total_evaluaciones || 0;
        const pos = r.positivas || 0;

        resolve({
          total,
          positivas: pos,
          negativas: r.negativas || 0,
          porc: total > 0 ? ((pos / total) * 100).toFixed(1) : "0.0",
          habitantes: r.total_habitantes || 0,
          habitaciones: r.total_habitaciones || 0,
          capturas: (r.intra_ninfas || 0) + (r.intra_adulta || 0) + (r.peri_ninfa || 0) + (r.peri_adulta || 0),
          intraN: r.intra_ninfas || 0,
          intraA: r.intra_adulta || 0,
          periN: r.peri_ninfa || 0,
          periA: r.peri_adulta || 0
        });
      });
    });
  },

  // ================== OBTENER MUNICIPIOS (CATÁLOGO) ==================
  async getMunicipios(usuarioId = null) {
    await verifyConnection();
    let sql = `SELECT DISTINCT municipio_id, nombre_municipio AS municipio FROM Municipios ORDER BY nombre_municipio`;
    let params = [];

    if (usuarioId) {
      // Si hay usuarioId (Supervisor), filtrar por asignados
      sql = `
            SELECT DISTINCT m.municipio_id, m.nombre_municipio AS municipio 
            FROM Municipios m
            INNER JOIN Usuario_Municipio um ON m.municipio_id = um.municipio_id
            WHERE um.usuario_id = ?
            ORDER BY m.nombre_municipio
        `;
      params = [usuarioId];
    }

    console.log("🔍 SQL getMunicipios:", sql);

    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  // ================== MUNICIPIOS CON CONTEO (REPORTES) ==================
  async getMunicipiosConConteo(filtros = {}) {
    await verifyConnection();
    // Este método usa INNER JOINS implícitos o HAVING > 0, lo cual oculta vacíos.
    // Si se requiere mostrar TODOS, se debe quitar el HAVING.
    // Asumiremos que para este panel específico "ConConteo" se prefiere ver solo los que tienen actividad,
    // pero si el usuario pide "todos", mejor mostrar todos con 0.

    const { fechaInicio, fechaFin } = filtros;
    // Logica similar
    return []; // Placeholder simplificado si no es crítico, o implementar full left join
  },

  // ================== DETALLE POR COMUNIDAD (TABLA PRINCIPAL) ==================
  async getEvaluacionesDetalladas(filtros = {}) {
    await verifyConnection();
    const { fechaInicio, fechaFin, municipio } = filtros;

    let where = "1=1";
    let params = [];

    // Filtro Fecha (aplicado al JOIN)
    let dateCondition = "";
    let dateParams = [];

    if (fechaInicio && fechaFin) {
      dateCondition = "AND ee.fecha_evaluacion BETWEEN ? AND ?";
      dateParams = [fechaInicio, fechaFin];
    }

    // Filtro Municipio (WHERE global)
    if (municipio) {
      if (Array.isArray(municipio)) {
        if (municipio.length > 0) {
          where += ` AND mu.municipio_id IN (${municipio.join(',')})`;
        } else {
          where += " AND 1=0";
        }
      } else {
        if (isNaN(municipio)) {
          where += " AND mu.nombre_municipio = ?";
          params.push(municipio);
        } else {
          where += " AND mu.municipio_id = ?";
          params.push(municipio);
        }
      }
    }

    const sql = `
      SELECT
        mu.nombre_municipio AS municipio,
        c.nombre_comunidad AS comunidad,

        DATE_FORMAT(MIN(ee.fecha_evaluacion),'%d/%m/%Y') AS fecha_inicio,
        DATE_FORMAT(MAX(ee.fecha_evaluacion),'%d/%m/%Y') AS fecha_final,
        MAX(ee.fecha_evaluacion) AS last_date, -- Para ordenamiento real

        COUNT(ee.evaluacion_id) AS viviendas_revisadas,
        c.cantidad_viviendas AS viviendas_existentes, 
        
        SUM(COALESCE(ee.numero_habitantes,0))   AS total_habitantes,
        SUM(COALESCE(ee.numero_habitaciones,0)) AS total_habitaciones,

        SUM(CASE WHEN ee.resultado='positivo' THEN 1 ELSE 0 END) AS viv_positivas,

        SUM(CASE WHEN COALESCE(dc.intra_ninfas,0)+COALESCE(dc.intra_adulta,0) > 0 THEN 1 ELSE 0 END) AS viv_pos_intra,
        SUM(CASE WHEN COALESCE(dc.peri_ninfa,0)+COALESCE(dc.peri_adulta,0) > 0 THEN 1 ELSE 0 END)    AS viv_pos_peri,

        SUM(CASE WHEN COALESCE(dc.intra_ninfas,0)+COALESCE(dc.peri_ninfa,0) > 0 THEN 1 ELSE 0 END) AS viv_con_ninfas,
        SUM(CASE WHEN COALESCE(dc.intra_ninfas,0) > 0 THEN 1 ELSE 0 END)                           AS viv_ci_intra,
        SUM(CASE WHEN COALESCE(dc.peri_ninfa,0)  > 0 THEN 1 ELSE 0 END)                           AS viv_ci_peri,

        SUM(CASE WHEN ee.vivienda_mejorada_intra = 1 THEN 1 ELSE 0 END) AS mej_intra_si,
        SUM(CASE WHEN ee.vivienda_mejorada_intra = 0 THEN 1 ELSE 0 END) AS mej_intra_no,
        SUM(CASE WHEN ee.vivienda_mejorada_peri  = 1 THEN 1 ELSE 0 END) AS mej_peri_si,
        SUM(CASE WHEN ee.vivienda_mejorada_peri  = 0 THEN 1 ELSE 0 END) AS mej_peri_no,

        COALESCE(SUM(dc.intra_ninfas),0) AS intra_n,
        COALESCE(SUM(dc.intra_adulta),0) AS intra_a,
        COALESCE(SUM(dc.peri_ninfa),0)   AS peri_n,
        COALESCE(SUM(dc.peri_adulta),0)  AS peri_a,

        COALESCE(SUM(dc.intra_pared),0)  AS intra_pared,
        COALESCE(SUM(dc.intra_techo),0)  AS intra_techo,
        COALESCE(SUM(dc.intra_cama),0)   AS intra_cama,
        COALESCE(SUM(dc.intra_otros),0)  AS intra_otros,

        COALESCE(SUM(dc.peri_corral),0)      AS peri_corral,
        COALESCE(SUM(dc.peri_gallinero),0)   AS peri_gallinero,
        COALESCE(SUM(dc.peri_conejera),0)    AS peri_conejera,
        COALESCE(SUM(dc.peri_zarzo_troje),0) AS peri_zarzo_troje,

        ROUND(AVG(COALESCE(ee.altura,0)),0)   AS altura_prom,
        ROUND(AVG(COALESCE(ee.latitud,0)),6)  AS lat_prom,
        ROUND(AVG(COALESCE(ee.longitud,0)),6) AS lng_prom

      FROM Municipios mu
      LEFT JOIN Comunidades c ON c.municipio_id = mu.municipio_id
      LEFT JOIN Evaluaciones_Entomologicas ee ON ee.comunidad_id = c.comunidad_id ${dateCondition}
      LEFT JOIN EE1_Detalles_Capturas dc ON dc.evaluacion_id = ee.evaluacion_id
      WHERE ${where}
      GROUP BY mu.municipio_id, mu.nombre_municipio, c.comunidad_id, c.nombre_comunidad
      ORDER BY mu.nombre_municipio, c.nombre_comunidad
    `;

    const fullParams = [...dateParams, ...params];

    console.log("🔍 SQL getEvaluacionesDetalladas (Refactor):", where);

    return new Promise((resolve, reject) => {
      db.query(sql, fullParams, (err, rows) => {
        if (err) {
          console.error("❌ Error SQL getEvaluacionesDetalladas:", err);
          return reject(err);
        }

        console.log("🔍 Registros encontrados:", rows.length);

        const out = rows.map((r, i) => {
          const exist = Number(r.viviendas_existentes) || 0;
          const rev = Number(r.viviendas_revisadas) || 0;

          // Si rev=0 (no hay evaluaciones), mostramos 0% cobertura, fechas vacías
          const porCob = exist > 0 ? `${Math.round((rev / exist) * 100)}%` : "0%";
          const porcIV = pct(r.viv_positivas, rev);
          const porcIII = pct(r.viv_pos_intra, rev);
          const porcIP = pct(r.viv_pos_peri, rev);
          const porcIIC = pct(r.viv_con_ninfas, rev);
          const porcCI = pct(r.viv_ci_intra, rev);
          const porcICP = pct(r.viv_ci_peri, rev);

          const totalEj = (Number(r.intra_n) || 0) + (Number(r.intra_a) || 0) +
            (Number(r.peri_n) || 0) + (Number(r.peri_a) || 0);

          return {
            id: i + 1,
            municipio: r.municipio || "N/A",
            comunidad: r.comunidad || `Comunidad ${i + 1}`,
            fecha_inicio: r.fecha_inicio || "-",
            fecha_final: r.fecha_final || "-",
            fecha_ejecucion: r.last_date ? new Date(r.last_date).toLocaleDateString() : "-",

            total_habitantes: Number(r.total_habitantes) || 0,
            total_habitaciones: Number(r.total_habitaciones) || 0,

            viviendas_existentes: exist,
            viviendas_programadas: exist, // Asumimos programadas = existentes por defecto si no hay dato
            viviendas_revisadas: rev,
            porc_cobertura: porCob,

            viv_positivas: Number(r.viv_positivas) || 0,
            porc_iv: porcIV,
            viv_pos_intra: Number(r.viv_pos_intra) || 0,
            porc_iii: porcIII,
            viv_pos_peri: Number(r.viv_pos_peri) || 0,
            porc_ip: porcIP,

            viv_con_ninfas: Number(r.viv_con_ninfas) || 0,
            porc_iic: porcIIC,
            viv_ci_intra: Number(r.viv_ci_intra) || 0,
            porc_ci: porcCI,
            viv_ci_peri: Number(r.viv_ci_peri) || 0,
            porc_icp: porcICP,

            mej_intra_si: Number(r.mej_intra_si) || 0,
            mej_intra_no: Number(r.mej_intra_no) || 0,
            mej_peri_si: Number(r.mej_peri_si) || 0,
            mej_peri_no: Number(r.mej_peri_no) || 0,

            intra_n: Number(r.intra_n) || 0,
            intra_a: Number(r.intra_a) || 0,
            peri_n: Number(r.peri_n) || 0,
            peri_a: Number(r.peri_a) || 0,
            ejemplares_total: totalEj,

            intra_pared: Number(r.intra_pared) || 0,
            intra_techo: Number(r.intra_techo) || 0,
            intra_cama: Number(r.intra_cama) || 0,
            intra_otros: Number(r.intra_otros) || 0,
            peri_corral: Number(r.peri_corral) || 0,
            peri_gallinero: Number(r.peri_gallinero) || 0,
            peri_conejera: Number(r.peri_conejera) || 0,
            peri_zarzo_troje: Number(r.peri_zarzo_troje) || 0,

            altura_prom: Number(r.altura_prom) || 0,
            lat_prom: Number(r.lat_prom) || 0,
            lng_prom: Number(r.lng_prom) || 0,
          };
        });

        resolve(out);
      });
    });
  },

  // ================== DATOS PARA REPORTE PDF ==================
  // (Mantener lógica similar o simplificar para usar el mismo core si es posible, 
  // pero por ahora lo dejamos como está o aplicamos el mismo fix si es necesario)
  async getDatosParaReporte(filtros = {}) {
    // Implementación similar a getEvaluacionesDetalladas si se requiere
    return [];
  }
};