// models/evaluacionesModel.js
import db from "../config/db.js";

/* ============================================================
   🔧 HELPERS
   ============================================================ */
function normalizarJefes(jefesInput) {
  let arr = [];

  if (Array.isArray(jefesInput)) {
    arr = jefesInput;
  } else if (typeof jefesInput === "string" && jefesInput.trim() !== "") {
    try {
      const parsed = JSON.parse(jefesInput);
      arr = Array.isArray(parsed)
        ? parsed
        : jefesInput.split(",").map((s) => s.trim());
    } catch {
      arr = jefesInput.split(",").map((s) => s.trim());
    }
  }

  const unicos = [
    ...new Set(arr.map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0)),
  ];

  if (unicos.length < 1) {
    throw new Error("Debe especificarse al menos un jefe de grupo.");
  }

  const [jefe1_id, jefe2_id, jefe3_id, jefe4_id] = [...unicos, null, null, null].slice(0, 4);
  return { jefe1_id, jefe2_id, jefe3_id, jefe4_id };
}

const toZeroIfUndef = (v) => (typeof v === "undefined" ? 0 : v);

/* ============================================================
   📦 MODELO
   ============================================================ */

export const EvaluacionesModel = {

  /* ============================================================
     🟢 CREAR EVALUACIÓN
     ============================================================ */
  crearEvaluacion: async (data) => {
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
        jefes,
      } = data;

      const { jefe1_id, jefe2_id, jefe3_id, jefe4_id } = normalizarJefes(jefes);

      const query = `
        INSERT INTO Evaluaciones_Entomologicas 
        (tecnico_id, jefe1_id, jefe2_id, jefe3_id, jefe4_id,
         municipio_id, comunidad_id, jefe_familia, hora_inicio, hora_final, hora_total,
         numero_habitantes, numero_habitaciones, fecha_ultimo_rociado,
         vivienda_mejorada_intra, vivienda_mejorada_peri,
         fecha_evaluacion, numero_vivienda, latitud, longitud, altura, resultado,
         foto_entrada, sede_id, redsalud_id, establecimiento_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        tecnico_id || null,
        jefe1_id,
        jefe2_id,
        jefe3_id,
        jefe4_id,
        municipio_id || null,
        comunidad_id || null,
        jefe_familia || "",
        hora_inicio || null,
        hora_final || null,
        hora_total || null,
        toZeroIfUndef(numero_habitantes),
        toZeroIfUndef(numero_habitaciones),
        fecha_ultimo_rociado || null,
        Boolean(vivienda_mejorada_intra),
        Boolean(vivienda_mejorada_peri),
        fecha_evaluacion || null,
        numero_vivienda || "",
        latitud ?? 0,
        longitud ?? 0,
        altura ?? 0,
        resultado || "negativo",
        foto_entrada || null,
        sede_id || null,
        redsalud_id || null,
        establecimiento_id || null,
      ];

      const [r] = await db.promise().execute(query, params);
      return r.insertId;
    } catch (e) {
      console.error("❌ Error crearEvaluacion:", e);
      throw e;
    }
  },

  /* ============================================================
     🟢 CREAR DETALLES
     ============================================================ */
  crearDetallesCapturas: async (evaluacion_id, data = {}) => {
    try {
      const {
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
        peri_otros = 0,
      } = data;

      const total_ninfas = Number(intra_ninfas) + Number(peri_ninfa);
      const total_adultas = Number(intra_adulta) + Number(peri_adulta);

      const query = `
        INSERT INTO EE1_Detalles_Capturas
        (evaluacion_id, intra_ninfas, intra_adulta, peri_ninfa, peri_adulta,
         total_ninfas, total_adultas, intra_pared, intra_techo, intra_cama, intra_otros,
         peri_pared, peri_corral, peri_gallinero, peri_conejera, peri_zarzo_troje, peri_otros)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        evaluacion_id,
        toZeroIfUndef(intra_ninfas),
        toZeroIfUndef(intra_adulta),
        toZeroIfUndef(peri_ninfa),
        toZeroIfUndef(peri_adulta),
        total_ninfas,
        total_adultas,
        toZeroIfUndef(intra_pared),
        toZeroIfUndef(intra_techo),
        toZeroIfUndef(intra_cama),
        toZeroIfUndef(intra_otros),
        toZeroIfUndef(peri_pared),
        toZeroIfUndef(peri_corral),
        toZeroIfUndef(peri_gallinero),
        toZeroIfUndef(peri_conejera),
        toZeroIfUndef(peri_zarzo_troje),
        toZeroIfUndef(peri_otros),
      ];

      const [r] = await db.promise().execute(query, params);
      return r.insertId;
    } catch (e) {
      console.error("❌ Error crearDetallesCapturas:", e);
      throw e;
    }
  },

  /* ============================================================
     🟡 ACTUALIZAR DETALLES
     ============================================================ */
  actualizarDetallesCapturas: async (evaluacion_id, data = {}) => {
    try {
      const [rows] = await db
        .promise()
        .execute("SELECT detalle_id FROM EE1_Detalles_Capturas WHERE evaluacion_id = ? LIMIT 1", [
          evaluacion_id,
        ]);

      const {
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
        peri_otros = 0,
      } = data;

      const total_ninfas = Number(intra_ninfas) + Number(peri_ninfa);
      const total_adultas = Number(intra_adulta) + Number(peri_adulta);

      if (rows.length > 0) {
        const query = `
          UPDATE EE1_Detalles_Capturas
          SET intra_ninfas=?, intra_adulta=?, peri_ninfa=?, peri_adulta=?,
              total_ninfas=?, total_adultas=?, intra_pared=?, intra_techo=?, intra_cama=?, intra_otros=?,
              peri_pared=?, peri_corral=?, peri_gallinero=?, peri_conejera=?, peri_zarzo_troje=?, peri_otros=?
          WHERE evaluacion_id=?
        `;

        const params = [
          toZeroIfUndef(intra_ninfas),
          toZeroIfUndef(intra_adulta),
          toZeroIfUndef(peri_ninfa),
          toZeroIfUndef(peri_adulta),
          total_ninfas,
          total_adultas,
          toZeroIfUndef(intra_pared),
          toZeroIfUndef(intra_techo),
          toZeroIfUndef(intra_cama),
          toZeroIfUndef(intra_otros),
          toZeroIfUndef(peri_pared),
          toZeroIfUndef(peri_corral),
          toZeroIfUndef(peri_gallinero),
          toZeroIfUndef(peri_conejera),
          toZeroIfUndef(peri_zarzo_troje),
          toZeroIfUndef(peri_otros),
          evaluacion_id,
        ];

        return await db.promise().execute(query, params);
      }

      return await EvaluacionesModel.crearDetallesCapturas(evaluacion_id, data);
    } catch (e) {
      console.error("❌ Error actualizarDetallesCapturas:", e);
      throw e;
    }
  },

  /* ============================================================
     🟢 OBTENER TODAS
     ============================================================ */
  obtenerEvaluaciones: async () => {
    try {
      const query = `
        SELECT 
          ee.*, 
          u.nombre_completo AS tecnico_nombre,
          j1.nombre_completo AS jefe1_nombre,
          j2.nombre_completo AS jefe2_nombre,
          j3.nombre_completo AS jefe3_nombre,
          j4.nombre_completo AS jefe4_nombre,
          m.nombre_municipio AS municipio_nombre,
          c.nombre_comunidad AS comunidad_nombre,
          s.nombre_sede AS sede_nombre,
          rs.nombre_red AS red_salud_nombre,
          es.nombre_establecimiento AS establecimiento_nombre,
          edc.*
        FROM Evaluaciones_Entomologicas ee
        LEFT JOIN Usuarios u ON ee.tecnico_id = u.usuario_id
        LEFT JOIN Usuarios j1 ON ee.jefe1_id = j1.usuario_id
        LEFT JOIN Usuarios j2 ON ee.jefe2_id = j2.usuario_id
        LEFT JOIN Usuarios j3 ON ee.jefe3_id = j3.usuario_id
        LEFT JOIN Usuarios j4 ON ee.jefe4_id = j4.usuario_id
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
    } catch (e) {
      console.error("❌ Error obtenerEvaluaciones:", e);
      throw e;
    }
  },

  /* ============================================================
     🟢 OBTENER POR ID
     ============================================================ */
  obtenerEvaluacionPorId: async (id) => {
    try {
      const query = `
        SELECT 
          ee.*, 
          u.nombre_completo AS tecnico_nombre,
          j1.nombre_completo AS jefe1_nombre,
          j2.nombre_completo AS jefe2_nombre,
          j3.nombre_completo AS jefe3_nombre,
          j4.nombre_completo AS jefe4_nombre,
          m.nombre_municipio AS municipio_nombre,
          c.nombre_comunidad AS comunidad_nombre,
          s.nombre_sede AS sede_nombre,
          rs.nombre_red AS red_salud_nombre,
          es.nombre_establecimiento AS establecimiento_nombre,
          edc.*
        FROM Evaluaciones_Entomologicas ee
        LEFT JOIN Usuarios u ON ee.tecnico_id = u.usuario_id
        LEFT JOIN Usuarios j1 ON ee.jefe1_id = j1.usuario_id
        LEFT JOIN Usuarios j2 ON ee.jefe2_id = j2.usuario_id
        LEFT JOIN Usuarios j3 ON ee.jefe3_id = j3.usuario_id
        LEFT JOIN Usuarios j4 ON ee.jefe4_id = j4.usuario_id
        LEFT JOIN Municipios m ON ee.municipio_id = m.municipio_id
        LEFT JOIN Comunidades c ON ee.comunidad_id = c.comunidad_id
        LEFT JOIN Sedes s ON ee.sede_id = s.sede_id
        LEFT JOIN RedSalud rs ON ee.redsalud_id = rs.redsalud_id
        LEFT JOIN EstablecimientosSalud es ON ee.establecimiento_id = es.establecimiento_id
        LEFT JOIN EE1_Detalles_Capturas edc ON ee.evaluacion_id = edc.evaluacion_id
        WHERE ee.evaluacion_id = ?
      `;

      const [rows] = await db.promise().execute(query, [id]);
      return rows[0] || null;
    } catch (e) {
      console.error("❌ Error obtenerEvaluacionPorId:", e);
      throw e;
    }
  },

  /* ============================================================
     🟢 OBTENER POR TÉCNICO
     ============================================================ */
  obtenerEvaluacionesPorTecnico: async (tecnico_id) => {
    try {
      const query = `
        SELECT 
          ee.*, 
          u.nombre_completo AS tecnico_nombre,
          j1.nombre_completo AS jefe1_nombre,
          j2.nombre_completo AS jefe2_nombre,
          j3.nombre_completo AS jefe3_nombre,
          j4.nombre_completo AS jefe4_nombre,
          m.nombre_municipio AS municipio_nombre,
          c.nombre_comunidad AS comunidad_nombre,
          s.nombre_sede AS sede_nombre,
          rs.nombre_red AS red_salud_nombre,
          es.nombre_establecimiento AS establecimiento_nombre,
          edc.*
        FROM Evaluaciones_Entomologicas ee
        LEFT JOIN Usuarios u ON ee.tecnico_id = u.usuario_id
        LEFT JOIN Usuarios j1 ON ee.jefe1_id = j1.usuario_id
        LEFT JOIN Usuarios j2 ON ee.jefe2_id = j2.usuario_id
        LEFT JOIN Usuarios j3 ON ee.jefe3_id = j3.usuario_id
        LEFT JOIN Usuarios j4 ON ee.jefe4_id = j4.usuario_id
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
    } catch (e) {
      console.error("❌ Error obtenerEvaluacionesPorTecnico:", e);
      throw e;
    }
  },

  /* ============================================================
     🟡 ACTUALIZAR EVALUACIÓN (CORREGIDO)
     ============================================================ */
  actualizarEvaluacion: async (id, data) => {
    try {
      // OBTENER JEFES ACTUALES PARA NO BORRARLOS
      const [rows] = await db.promise().execute(
        "SELECT jefe1_id, jefe2_id, jefe3_id, jefe4_id FROM Evaluaciones_Entomologicas WHERE evaluacion_id=?",
        [id]
      );

      if (rows.length === 0) return false;
      const actuales = rows[0];

      let sets = [
        "jefe_familia=?",
        "hora_inicio=?",
        "hora_final=?",
        "hora_total=?",
        "numero_habitantes=?",
        "numero_habitaciones=?",
        "fecha_ultimo_rociado=?",
        "vivienda_mejorada_intra=?",
        "vivienda_mejorada_peri=?",
        "fecha_evaluacion=?",
        "numero_vivienda=?",
        "latitud=?",
        "longitud=?",
        "altura=?",
        "resultado=?",
        "foto_entrada=?",
        "sede_id=?",
        "redsalud_id=?",
        "establecimiento_id=?",
      ];

      let params = [
        data.jefe_familia || "",
        data.hora_inicio || null,
        data.hora_final || null,
        data.hora_total || null,
        toZeroIfUndef(data.numero_habitantes),
        toZeroIfUndef(data.numero_habitaciones),
        data.fecha_ultimo_rociado || null,
        Boolean(data.vivienda_mejorada_intra),
        Boolean(data.vivienda_mejorada_peri),
        data.fecha_evaluacion || null,
        data.numero_vivienda || "",
        data.latitud ?? 0,
        data.longitud ?? 0,
        data.altura ?? 0,
        data.resultado || "negativo",
        data.foto_entrada || null,
        data.sede_id || null,
        data.redsalud_id || null,
        data.establecimiento_id || null,
      ];

      // Si SE ENVIARON jefes → actualizamos
      if (typeof data.jefes !== "undefined") {
        const { jefe1_id, jefe2_id, jefe3_id, jefe4_id } = normalizarJefes(data.jefes);

        sets.unshift("jefe1_id=?", "jefe2_id=?", "jefe3_id=?", "jefe4_id=?");
        params.unshift(jefe1_id, jefe2_id, jefe3_id, jefe4_id);
      } else {
        // Si NO se enviaron → mantener los actuales
        sets.unshift("jefe1_id=?", "jefe2_id=?", "jefe3_id=?", "jefe4_id=?");
        params.unshift(
          actuales.jefe1_id,
          actuales.jefe2_id,
          actuales.jefe3_id,
          actuales.jefe4_id
        );
      }

      const query = `
        UPDATE Evaluaciones_Entomologicas
        SET ${sets.join(", ")}, fecha_modificacion=CURRENT_TIMESTAMP
        WHERE evaluacion_id=?
      `;

      params.push(id);

      const [r] = await db.promise().execute(query, params);
      return r.affectedRows > 0;
    } catch (e) {
      console.error("❌ Error actualizarEvaluacion:", e);
      throw e;
    }
  },

  /* ============================================================
     🔴 ELIMINAR
     ============================================================ */
  eliminarEvaluacion: async (id) => {
    try {
      await db.promise().execute("DELETE FROM EE1_Detalles_Capturas WHERE evaluacion_id = ?", [id]);

      const [r] = await db
        .promise()
        .execute("DELETE FROM Evaluaciones_Entomologicas WHERE evaluacion_id = ?", [id]);

      return r.affectedRows > 0;
    } catch (e) {
      console.error("❌ Error eliminarEvaluacion:", e);
      throw e;
    }
  },
};
