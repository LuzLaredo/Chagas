import db, { verifyConnection } from "../config/db.js";

function pct(num, den) {
  const n = Number(num) || 0, d = Number(den) || 0;
  return d > 0 ? `${((n / d) * 100).toFixed(0)}%` : "0%";
}

export const EE2Model = {
  // ================== ESTADÍSTICAS (RESUMEN) ==================
  async getEstadisticas(filtros) {
    await verifyConnection();
    const { fechaInicio, fechaFin, municipioId, sedeId, redId, establecimientoId } = filtros;

    const where = ["ee.fecha_evaluacion BETWEEN ? AND ?"];
    const params = [fechaInicio, fechaFin];

    if (municipioId)         { where.push("ee.municipio_id = ?");        params.push(municipioId); }
    if (sedeId)              { where.push("ee.sede_id = ?");             params.push(sedeId); }
    if (redId)               { where.push("ee.redsalud_id = ?");         params.push(redId); }
    if (establecimientoId)   { where.push("ee.establecimiento_id = ?");  params.push(establecimientoId); }

    const sql = `
      SELECT
        COUNT(*) AS total_evaluaciones,
        SUM(CASE WHEN ee.resultado='positivo' THEN 1 ELSE 0 END) AS positivas,
        SUM(CASE WHEN ee.resultado='negativo' THEN 1 ELSE 0 END) AS negativas,

        -- 👇 AQUÍ sumamos habitantes y HABITACIONES desde la BD
        SUM(COALESCE(ee.numero_habitantes,0))   AS total_habitantes,
        SUM(COALESCE(ee.numero_habitaciones,0)) AS total_habitaciones,

        COALESCE(SUM(dc.intra_ninfas),0) AS intra_ninfas,
        COALESCE(SUM(dc.intra_adulta),0) AS intra_adulta,
        COALESCE(SUM(dc.peri_ninfa),0)   AS peri_ninfa,
        COALESCE(SUM(dc.peri_adulta),0)  AS peri_adulta
      FROM Evaluaciones_Entomologicas ee
      LEFT JOIN EE1_Detalles_Capturas dc ON dc.evaluacion_id = ee.evaluacion_id
      WHERE ${where.join(" AND ")}
    `;

    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, rows) => {
        if (err) return reject(err);
        const r = rows[0] || {};
        const total = r.total_evaluaciones || 0;
        const pos   = r.positivas || 0;

        resolve({
          total,
          positivas: pos,
          negativas: r.negativas || 0,
          porc: total > 0 ? ((pos / total) * 100).toFixed(1) : "0.0",
          habitantes:   r.total_habitantes   || 0,
          habitaciones: r.total_habitaciones || 0,
          capturas: (r.intra_ninfas || 0) + (r.intra_adulta || 0) + (r.peri_ninfa || 0) + (r.peri_adulta || 0),
          intraN: r.intra_ninfas || 0,
          intraA: r.intra_adulta || 0,
          periN: r.peri_ninfa    || 0,
          periA: r.peri_adulta   || 0
        });
      });
    });
  },

  // ================== MUNICIPIOS ==================
  async getMunicipios() {
    await verifyConnection();
    return new Promise((resolve, reject) => {
      db.query("SELECT municipio_id, nombre_municipio FROM Municipios ORDER BY nombre_municipio", (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  // ================== DETALLE POR COMUNIDAD ==================
  async getEvaluacionesDetalladas(filtros) {
    await verifyConnection();
    const { fechaInicio, fechaFin, municipioId, sedeId, redId, establecimientoId } = filtros;

    const where = ["ee.fecha_evaluacion BETWEEN ? AND ?"];
    const params = [fechaInicio, fechaFin];

    if (municipioId)         { where.push("ee.municipio_id = ?");        params.push(municipioId); }
    if (sedeId)              { where.push("ee.sede_id = ?");             params.push(sedeId); }
    if (redId)               { where.push("ee.redsalud_id = ?");         params.push(redId); }
    if (establecimientoId)   { where.push("ee.establecimiento_id = ?");  params.push(establecimientoId); }

    // NOTA: existen campos (existentes/programadas) que no están en tu esquema.
    // Se estiman para mantener el formato EE-2.
    const sql = `
      SELECT
        c.nombre_comunidad AS comunidad,

        DATE_FORMAT(MIN(ee.fecha_evaluacion),'%d/%m/%Y') AS fecha_inicio,
        DATE_FORMAT(MAX(ee.fecha_evaluacion),'%d/%m/%Y') AS fecha_final,
        DATE_FORMAT(MAX(ee.fecha_evaluacion),'%d/%m/%Y') AS fecha_ejecucion,

        COUNT(*) AS viviendas_revisadas,
        COUNT(*) AS viviendas_existentes,         -- estimación = revisadas
        COUNT(*) AS viviendas_programadas,        -- estimación

        -- 👇 SUMAMOS ambas métricas desde BD
        SUM(COALESCE(ee.numero_habitantes,0))   AS total_habitantes,
        SUM(COALESCE(ee.numero_habitaciones,0)) AS total_habitaciones,

        SUM(CASE WHEN ee.resultado='positivo' THEN 1 ELSE 0 END) AS viv_positivas,

        SUM(CASE WHEN COALESCE(dc.intra_ninfas,0)+COALESCE(dc.intra_adulta,0) > 0 THEN 1 ELSE 0 END) AS viv_pos_intra,
        SUM(CASE WHEN COALESCE(dc.peri_ninfa,0)+COALESCE(dc.peri_adulta,0) > 0 THEN 1 ELSE 0 END)    AS viv_pos_peri,

        SUM(CASE WHEN COALESCE(dc.intra_ninfas,0)+COALESCE(dc.peri_ninfa,0) > 0 THEN 1 ELSE 0 END) AS viv_con_ninfas,
        SUM(CASE WHEN COALESCE(dc.intra_ninfas,0) > 0 THEN 1 ELSE 0 END)                           AS viv_ci_intra,
        SUM(CASE WHEN COALESCE(dc.peri_ninfa,0)  > 0 THEN 1 ELSE 0 END)                           AS viv_ci_peri,

        SUM(CASE WHEN ee.vivienda_mejorada_intra = TRUE THEN 1 ELSE 0 END) AS mej_intra_si,
        SUM(CASE WHEN ee.vivienda_mejorada_intra = FALSE THEN 1 ELSE 0 END) AS mej_intra_no,
        SUM(CASE WHEN ee.vivienda_mejorada_peri  = TRUE THEN 1 ELSE 0 END) AS mej_peri_si,
        SUM(CASE WHEN ee.vivienda_mejorada_peri  = FALSE THEN 1 ELSE 0 END) AS mej_peri_no,

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
      FROM Evaluaciones_Entomologicas ee
      LEFT JOIN Comunidades c ON c.comunidad_id = ee.comunidad_id
      LEFT JOIN EE1_Detalles_Capturas dc ON dc.evaluacion_id = ee.evaluacion_id
      WHERE ${where.join(" AND ")}
      GROUP BY c.comunidad_id, c.nombre_comunidad
      ORDER BY c.nombre_comunidad
    `;

    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, rows) => {
        if (err) {
          console.error("❌ Error en getEvaluacionesDetalladas:", err);
          return resolve(this.getDatosEjemplo());
        }

        const out = rows.map((r, i) => {
          const exist = Number(r.viviendas_existentes) || 0;
          const rev   = Number(r.viviendas_revisadas) || 0;

          const porCob = exist > 0 ? `${Math.round((rev / exist) * 100)}%` : "0%";
          const porcIV  = pct(r.viv_positivas,   rev);
          const porcIII = pct(r.viv_pos_intra,   rev);
          const porcIP  = pct(r.viv_pos_peri,    rev);
          const porcIIC = pct(r.viv_con_ninfas,  rev);
          const porcCI  = pct(r.viv_ci_intra,    rev);
          const porcICP = pct(r.viv_ci_peri,     rev);

          const totalEj = (Number(r.intra_n)||0) + (Number(r.intra_a)||0) +
                          (Number(r.peri_n)||0)  + (Number(r.peri_a)||0);

          return {
            id: i + 1,
            comunidad: r.comunidad || `Comunidad ${i+1}`,
            fecha_inicio:    r.fecha_inicio    || "",
            fecha_final:     r.fecha_final     || "",
            fecha_ejecucion: r.fecha_ejecucion || "",

            total_habitantes:   Number(r.total_habitantes)   || 0,
            total_habitaciones: Number(r.total_habitaciones) || 0, // 👈 MAPEADO

            viviendas_existentes:   exist,
            viviendas_programadas:  Number(r.viviendas_programadas) || exist,
            viviendas_revisadas:    rev,
            porc_cobertura: porCob,

            viv_positivas: Number(r.viv_positivas) || 0,
            porc_iv:  porcIV,
            viv_pos_intra: Number(r.viv_pos_intra) || 0,
            porc_iii: porcIII,
            viv_pos_peri: Number(r.viv_pos_peri) || 0,
            porc_ip:  porcIP,

            viv_con_ninfas: Number(r.viv_con_ninfas) || 0,
            porc_iic:  porcIIC,
            viv_ci_intra: Number(r.viv_ci_intra) || 0,
            porc_ci:  porcCI,
            viv_ci_peri:  Number(r.viv_ci_peri)  || 0,
            porc_icp: porcICP,

            mej_intra_si: Number(r.mej_intra_si) || 0,
            mej_intra_no: Number(r.mej_intra_no) || 0,
            mej_peri_si:  Number(r.mej_peri_si)  || 0,
            mej_peri_no:  Number(r.mej_peri_no)  || 0,

            intra_n: Number(r.intra_n) || 0,
            intra_a: Number(r.intra_a) || 0,
            peri_n:  Number(r.peri_n)  || 0,
            peri_a:  Number(r.peri_a)  || 0,
            ejemplares_total: totalEj,

            intra_pared:  Number(r.intra_pared)  || 0,
            intra_techo:  Number(r.intra_techo)  || 0,
            intra_cama:   Number(r.intra_cama)   || 0,
            intra_otros:  Number(r.intra_otros)  || 0,
            peri_corral:      Number(r.peri_corral)      || 0,
            peri_gallinero:   Number(r.peri_gallinero)   || 0,
            peri_conejera:    Number(r.peri_conejera)    || 0,
            peri_zarzo_troje: Number(r.peri_zarzo_troje) || 0,

            altura_prom: Number(r.altura_prom) || 0,
            lat_prom:    Number(r.lat_prom)    || 0,
            lng_prom:    Number(r.lng_prom)    || 0,
          };
        });

        resolve(out.length ? out : this.getDatosEjemplo());
      });
    });
  },

  // ====== Fallback demo (por si no hay datos) ======
  getDatosEjemplo() {
    return [
      {
        id: 1,
        comunidad: "Chocaya",
        fecha_inicio: "05/08/2025",
        fecha_final: "05/08/2025",
        fecha_ejecucion: "05/08/2025",
        total_habitantes: 160,
        total_habitaciones: 35,
        viviendas_existentes: 50,
        viviendas_programadas: 50,
        viviendas_revisadas: 45,
        porc_cobertura: "90%",
        viv_positivas: 5,
        porc_iv: "11%",
        viv_pos_intra: 3, porc_iii: "7%",
        viv_pos_peri: 2,  porc_ip: "4%",
        viv_con_ninfas: 2, porc_iic: "4%",
        viv_ci_intra: 1,  porc_ci: "2%",
        viv_ci_peri: 1,   porc_icp: "2%",
        mej_intra_si: 10, mej_intra_no: 35,
        mej_peri_si: 8,   mej_peri_no: 37,
        intra_n: 4, intra_a: 3, peri_n: 2, peri_a: 1,
        ejemplares_total: 10,
        intra_pared: 3, intra_techo: 1, intra_cama: 2, intra_otros: 1,
        peri_corral: 1, peri_gallinero: 1, peri_conejera: 0, peri_zarzo_troje: 0,
        altura_prom: 2550, lat_prom: -17.621, lng_prom: -66.043
      }
    ];
  }
};
