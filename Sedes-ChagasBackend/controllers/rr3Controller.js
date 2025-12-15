import db from "../config/db.js";

export const obtenerEstadisticasRR3Controller = async (req, res) => {
  const { municipio, mes, año } = req.query;
  const usuarioId = req.user?.usuario_id;
  const rol = req.user?.rol;

  const currentDate = new Date();
  const targetMonth = mes || currentDate.getMonth() + 1;
  const targetYear = año || currentDate.getFullYear();

  console.log("📊 Solicitando estadísticas RR3 por municipio (Refactorizado):", {
    municipio,
    mes: targetMonth,
    año: targetYear,
    usuarioId,
    rol
  });

  // Función interna para ejecutar la consulta principal
  const ejecutarQuery = (municipiosPermitidos = null) => {
    let whereConditions = [];
    let queryParams = [];

    // Condiciones para el JOIN (se aplican solo a los formularios)
    let joinConditions = [
      'MONTH(fr.fecha_registro) = ?',
      'YEAR(fr.fecha_registro) = ?',
      'fr.estado = "activo"'
    ];
    let joinParams = [targetMonth, targetYear];

    // === FILTROS DE MUNICIPIO ===

    // 1. Si enviaron un municipio específico
    if (municipio && municipio !== "") {
      whereConditions.push('m.municipio_id = ?');
      queryParams.push(municipio);

      // Validar seguridad para supervisor
      if (municipiosPermitidos && !municipiosPermitidos.includes(parseInt(municipio))) {
        return res.status(403).json({ error: "No tiene permiso para ver este municipio" });
      }
    }
    // 2. Si no enviaron municipio pero hay restricciones (Supervisor)
    else if (municipiosPermitidos) {
      if (municipiosPermitidos.length > 0) {
        whereConditions.push(`m.municipio_id IN (${municipiosPermitidos.join(',')})`);
      } else {
        return res.json({ estadisticas: [], totales: {}, resumen: { total: 0 } }); // No tiene municipios
      }
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // QUERY FOR RR3 (Based on all Municipalities)
    // Municipios -> Left Join Formularios (filtered by month/year/active)
    const query = `
      SELECT 
        m.municipio_id,
        m.nombre_municipio AS municipio,
        MIN(DATE(fr.fecha_registro)) AS fecha_inicio,
        MAX(DATE(fr.fecha_registro)) AS fecha_final,
        COUNT(fr.id_rr1) AS total_registros,
        COALESCE(SUM(fr.habitantes_protegidos), 0) AS poblacion_protegida,
        
        -- VIVIENDAS POR MUNICIPIO
        COUNT(DISTINCT fr.id_rr1) AS viviendas_existentes,
        COALESCE(SUM(CASE WHEN fr.rociado = 1 THEN 1 ELSE 0 END), 0) AS viviendas_rociadas,
        COALESCE(SUM(CASE WHEN fr.no_rociado = 1 THEN 1 ELSE 0 END), 0) AS viviendas_no_rociadas,
        COALESCE(SUM(CASE WHEN fr.cerrada = 1 THEN 1 ELSE 0 END), 0) AS viviendas_cerradas,
        COALESCE(SUM(CASE WHEN fr.renuente = 1 THEN 1 ELSE 0 END), 0) AS viviendas_renuentes,
        
        -- HABITACIONES POR MUNICIPIO
        COALESCE(SUM(fr.habitaciones_rociadas), 0) AS habitaciones_rociadas,
        COALESCE(SUM(fr.habitaciones_no_rociadas), 0) AS habitaciones_no_rociadas,
        COALESCE(SUM(fr.habitaciones_total), 0) AS habitaciones_total,
        
        -- PERIDOMICILIO POR MUNICIPIO
        COALESCE(SUM(fr.corrales), 0) AS corrales,
        COALESCE(SUM(fr.gallineros), 0) AS gallineros,
        COALESCE(SUM(fr.conejeras), 0) AS conejeras,
        COALESCE(SUM(fr.zarzos_trojes), 0) AS zarzos_trojes,
        COALESCE(SUM(fr.otros_peridomicilio), 0) AS otros,
        
        -- INSECTICIDAS POR MUNICIPIO
        -- Alfacipermetrina
        COALESCE(SUM(CASE WHEN fr.insecticida_utilizado = 'ALFACIPERMETRINA' THEN fr.dosis ELSE 0 END), 0) AS dosis_alfacipermetrina,
        COALESCE(SUM(CASE WHEN fr.insecticida_utilizado = 'ALFACIPERMETRINA' THEN fr.numero_cargas ELSE 0 END), 0) AS cargas_alfacipermetrina,
        COALESCE(SUM(CASE WHEN fr.insecticida_utilizado = 'ALFACIPERMETRINA' THEN fr.cantidad_insecticida ELSE 0 END), 0) AS litros_alfacipermetrina,
        
        -- Bendiocarb
        COALESCE(SUM(CASE WHEN fr.insecticida_utilizado = 'BENDIOCARB' THEN fr.dosis ELSE 0 END), 0) AS dosis_bendiocarb,
        COALESCE(SUM(CASE WHEN fr.insecticida_utilizado = 'BENDIOCARB' THEN fr.numero_cargas ELSE 0 END), 0) AS cargas_bendiocarb,
        COALESCE(SUM(CASE WHEN fr.insecticida_utilizado = 'BENDIOCARB' THEN fr.cantidad_insecticida ELSE 0 END), 0) AS litros_bendiocarb,
        
        -- Lambdacialotrina
        COALESCE(SUM(CASE WHEN fr.insecticida_utilizado = 'LAMBDACIALOTRINA' THEN fr.dosis ELSE 0 END), 0) AS dosis_lambdacialotrina,
        COALESCE(SUM(CASE WHEN fr.insecticida_utilizado = 'LAMBDACIALOTRINA' THEN fr.numero_cargas ELSE 0 END), 0) AS cargas_lambdacialotrina,
        COALESCE(SUM(CASE WHEN fr.insecticida_utilizado = 'LAMBDACIALOTRINA' THEN fr.cantidad_insecticida ELSE 0 END), 0) AS litros_lambdacialotrina,
        
        -- TOTALES GENERALES DE INSECTICIDA
        COALESCE(SUM(fr.numero_cargas), 0) AS total_cargas,
        COALESCE(SUM(fr.cantidad_insecticida), 0) AS total_litros_ml,
        COALESCE(SUM(fr.cantidad_insecticida) / 1000, 0) AS total_litros_kg,
        COALESCE(SUM(fr.dosis), 0) AS dosis_total,
        
        -- ROCIADORES POR MUNICIPIO
        GROUP_CONCAT(DISTINCT COALESCE(u.nombre_completo, 'Sin nombre')) AS rociadores,
        COUNT(DISTINCT fr.tecnico_id) AS total_rociadores
        
      FROM Municipios m
      LEFT JOIN Formulario_RR1 fr ON m.municipio_id = fr.municipio_id 
           AND ${joinConditions.join(' AND ')}
      LEFT JOIN Usuarios u ON fr.tecnico_id = u.usuario_id
      ${whereClause}
      GROUP BY m.municipio_id, m.nombre_municipio
      ORDER BY m.nombre_municipio
    `;

    // Combinar parámetros
    const fullParams = [...joinParams, ...queryParams];

    console.log("📝 Query RR3 Refactorizada:", whereConditions);

    db.query(query, fullParams, (err, rows) => {
      if (err) {
        console.error("❌ Error en query RR3:", err);
        return res.status(500).json({ error: "Error estadísticas RR3" });
      }

      // Calcular totales generales y progreso
      const totales = rows.reduce((acc, item) => {
        const poblacion = parseInt(item.poblacion_protegida) || 0;
        const viviendasRociadas = parseInt(item.viviendas_rociadas) || 0;
        const viviendasNoRociadas = parseInt(item.viviendas_no_rociadas) || 0;
        const viviendasCerradas = parseInt(item.viviendas_cerradas) || 0;
        const viviendasRenuentes = parseInt(item.viviendas_renuentes) || 0;
        const viviendasExistentes = parseInt(item.viviendas_existentes) || 0;
        const habitacionesRociadas = parseInt(item.habitaciones_rociadas) || 0;
        const habitacionesNoRociadas = parseInt(item.habitaciones_no_rociadas) || 0;
        const registros = parseInt(item.total_registros) || 0;
        const cargas = parseInt(item.total_cargas) || 0;
        const litrosMl = parseFloat(item.total_litros_ml) || 0;
        const litrosKg = parseFloat(item.total_litros_kg) || 0;
        const dosis = parseFloat(item.dosis_total) || 0;

        return {
          total_registros: acc.total_registros + registros,
          poblacion_protegida: acc.poblacion_protegida + poblacion,
          viviendas_existentes: acc.viviendas_existentes + viviendasExistentes,
          viviendas_rociadas: acc.viviendas_rociadas + viviendasRociadas,
          viviendas_no_rociadas: acc.viviendas_no_rociadas + viviendasNoRociadas,
          viviendas_cerradas: acc.viviendas_cerradas + viviendasCerradas,
          viviendas_renuentes: acc.viviendas_renuentes + viviendasRenuentes,
          habitaciones_rociadas: acc.habitaciones_rociadas + habitacionesRociadas,
          habitaciones_no_rociadas: acc.habitaciones_no_rociadas + habitacionesNoRociadas,
          habitaciones_total: acc.habitaciones_total + (parseInt(item.habitaciones_total) || 0),
          total_cargas: acc.total_cargas + cargas,
          total_litros_ml: acc.total_litros_ml + litrosMl,
          total_litros_kg: parseFloat((acc.total_litros_kg + litrosKg).toFixed(2)),
          dosis_total: parseFloat((acc.dosis_total + dosis).toFixed(2)),
          corrales: acc.corrales + (parseInt(item.corrales) || 0),
          gallineros: acc.gallineros + (parseInt(item.gallineros) || 0),
          conejeras: acc.conejeras + (parseInt(item.conejeras) || 0),
          zarzos_trojes: acc.zarzos_trojes + (parseInt(item.zarzos_trojes) || 0),
          otros: acc.otros + (parseInt(item.otros) || 0),
          total_rociadores: acc.total_rociadores + (parseInt(item.total_rociadores) || 0)
        };
      }, {
        total_registros: 0, poblacion_protegida: 0, viviendas_existentes: 0,
        viviendas_rociadas: 0, viviendas_no_rociadas: 0, viviendas_cerradas: 0, viviendas_renuentes: 0,
        habitaciones_rociadas: 0, habitaciones_no_rociadas: 0, habitaciones_total: 0,
        total_cargas: 0, total_litros_ml: 0, total_litros_kg: 0, dosis_total: 0,
        corrales: 0, gallineros: 0, conejeras: 0, zarzos_trojes: 0, otros: 0, total_rociadores: 0
      });

      // Calcular progreso general de viviendas
      totales.progreso_viviendas = totales.viviendas_existentes > 0
        ? parseFloat(((totales.viviendas_rociadas / totales.viviendas_existentes) * 100).toFixed(1))
        : 0;

      // Agregar progreso a cada municipio
      const estadisticasConProgreso = rows.map(item => {
        const viviendasExistentes = parseInt(item.viviendas_existentes) || 0;
        const viviendasRociadas = parseInt(item.viviendas_rociadas) || 0;
        const progreso = viviendasExistentes > 0
          ? ((viviendasRociadas / viviendasExistentes) * 100).toFixed(1)
          : 0;
        return { ...item, progreso_viviendas: parseFloat(progreso) };
      });

      res.json({
        estadisticas: estadisticasConProgreso,
        totales,
        periodo: {
          mes: parseInt(targetMonth),
          año: parseInt(targetYear),
          mes_nombre: getNombreMes(targetMonth)
        },
        resumen: {
          total_municipios: rows.length
        }
      });
    });
  };

  // === LÓGICA PRINCIPAL ===

  if (rol === 'supervisor' && usuarioId) {
    // Obtener TODOS los municipios del supervisor
    db.query(
      'SELECT municipio_id FROM Usuario_Municipio WHERE usuario_id = ?',
      [usuarioId],
      (err, results) => {
        if (err) return res.status(500).json({ error: "Error verificando permisos" });
        if (!results || results.length === 0) return res.status(403).json({ error: "Supervisor sin municipios asignados" });

        const municipiosIds = results.map(r => r.municipio_id);
        ejecutarQuery(municipiosIds);
      }
    );
  } else {
    // Admin o roles globales
    ejecutarQuery(null);
  }
};

export const obtenerCatalogosRR3 = async (req, res) => {
  const usuarioId = req.user?.usuario_id;
  const rol = req.user?.rol;

  console.log("📋 Cargando catálogos RR3 (Refactorizado)...");

  let query = 'SELECT municipio_id, nombre_municipio AS nombre FROM Municipios ORDER BY nombre_municipio';
  let params = [];

  // Si es supervisor, filtrar municipios
  if (rol === 'supervisor' && usuarioId) {
    query = `
      SELECT DISTINCT m.municipio_id, m.nombre_municipio AS nombre 
      FROM Municipios m
      INNER JOIN Usuario_Municipio um ON m.municipio_id = um.municipio_id
      WHERE um.usuario_id = ?
      ORDER BY m.nombre_municipio
    `;
    params = [usuarioId];
  }

  db.query(query, params, (err, municipios) => {
    if (err) {
      console.error("❌ Error catálogos RR3:", err);
      return res.status(500).json({ error: "Error al cargar catálogos" });
    }

    console.log(`✅ Catálogos RR3 cargados: ${municipios.length} municipios`);

    res.json({
      municipios: municipios || []
    });
  });
};

// Función auxiliar para obtener nombre del mes
function getNombreMes(mes) {
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return meses[mes - 1] || "Desconocido";
}