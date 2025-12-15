import db from "../config/db.js";

export const getRR2Estadisticas = (req, res) => {
  const { municipio, mes, año, _t } = req.query;
  const usuarioId = req.user?.usuario_id;
  const rol = req.user?.rol;

  const currentDate = new Date();
  const targetMonth = mes ? parseInt(mes) : currentDate.getMonth() + 1;
  const targetYear = año ? parseInt(año) : currentDate.getFullYear();

  console.log("📊 Solicitando estadísticas RR2 (Refactorizado):", {
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
    let joinConditions = [
      'MONTH(fr.fecha_registro) = ?',
      'YEAR(fr.fecha_registro) = ?',
      'fr.estado = "activo"'
    ];

    // Parametros para el LEFT JOIN (conditions apply to the join, not the whole result set to keep rows)
    const joinParams = [targetMonth, targetYear];

    // === FILTROS DE MUNICIPIO ===

    // 1. Si enviaron municipio(s) específico(s)
    if (municipio && municipio !== "") {
      // Manejar múltiples municipios separados por coma
      const municipiosRequested = municipio.toString().split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

      if (municipiosRequested.length > 0) {
        whereConditions.push(`m.municipio_id IN (${municipiosRequested.join(',')})`);
      }

      // Validar seguridad para supervisor
      if (municipiosPermitidos) {
        const permitidosSet = new Set(municipiosPermitidos);
        const hayNoPermitidos = municipiosRequested.some(id => !permitidosSet.has(id));

        if (hayNoPermitidos) {
          return res.status(403).json({ error: "No tiene permiso para ver uno o más de los municipios solicitados" });
        }
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

    // QUERY REFACTORIZADA: Municipios -> Comunidades -> Left Join Formularios
    // Esto asegura que mostremos comunidades aunque no tengan datos
    const query = `
      SELECT 
        c.comunidad_id,
        c.nombre_comunidad AS comunidad,
        m.nombre_municipio AS municipio,
        MIN(DATE(fr.fecha_registro)) AS fecha_inicio,
        MAX(DATE(fr.fecha_registro)) AS fecha_final,
        COUNT(fr.id_rr1) AS total_registros,
        COALESCE(SUM(fr.habitantes_protegidos), 0) AS poblacion_protegida,
        
        -- VIVIENDAS
        COUNT(fr.id_rr1) AS viviendas_existentes,
        COALESCE(SUM(CASE WHEN fr.rociado = 1 THEN 1 ELSE 0 END), 0) AS viviendas_rociadas,
        COALESCE(SUM(CASE WHEN fr.no_rociado = 1 THEN 1 ELSE 0 END), 0) AS viviendas_no_rociadas,
        COALESCE(SUM(CASE WHEN fr.cerrada = 1 THEN 1 ELSE 0 END), 0) AS viviendas_cerradas,
        COALESCE(SUM(CASE WHEN fr.renuente = 1 THEN 1 ELSE 0 END), 0) AS viviendas_renuentes,
        
        -- HABITACIONES
        COALESCE(SUM(fr.habitaciones_rociadas), 0) AS habitaciones_rociadas,
        COALESCE(SUM(fr.habitaciones_no_rociadas), 0) AS habitaciones_no_rociadas,
        COALESCE(SUM(fr.habitaciones_total), 0) AS habitaciones_total,
        
        -- PERIDOMICILIO
        COALESCE(SUM(fr.corrales), 0) AS corrales,
        COALESCE(SUM(fr.gallineros), 0) AS gallineros,
        COALESCE(SUM(fr.conejeras), 0) AS conejeras,
        COALESCE(SUM(fr.zarzos_trojes), 0) AS zarzos_trojes,
        COALESCE(SUM(fr.otros_peridomicilio), 0) AS otros,
        
        -- INSECTICIDAS
        COALESCE(SUM(fr.numero_cargas), 0) AS total_cargas,
        COALESCE(SUM(CASE WHEN fr.insecticida_utilizado = 'LAMBDACIALOTRINA' THEN fr.numero_cargas ELSE 0 END), 0) AS total_cargas_ml,
        COALESCE(SUM(CASE WHEN fr.insecticida_utilizado = 'LAMBDACIALOTRINA' THEN fr.cantidad_insecticida ELSE 0 END), 0) AS total_litros_ml,
        COALESCE(SUM(CASE WHEN fr.insecticida_utilizado = 'LAMBDACIALOTRINA' THEN fr.dosis ELSE 0 END), 0) AS dosis_ml,
        
        COALESCE(SUM(CASE WHEN fr.insecticida_utilizado = 'BENDIOCARB' THEN fr.numero_cargas ELSE 0 END), 0) AS total_cargas_gr,
        COALESCE(SUM(CASE WHEN fr.insecticida_utilizado = 'BENDIOCARB' THEN fr.cantidad_insecticida ELSE 0 END), 0) AS total_litros_gr,
        COALESCE(SUM(CASE WHEN fr.insecticida_utilizado = 'BENDIOCARB' THEN fr.dosis ELSE 0 END), 0) AS dosis_gr,
        
        COALESCE(SUM(CASE WHEN fr.insecticida_utilizado = 'LAMBDACIALOTRINA' THEN fr.cantidad_insecticida ELSE 0 END) / 1000, 0) AS total_litros_l,
        COALESCE(SUM(fr.cantidad_insecticida) / 1000, 0) AS total_litros_kg,
        
        GROUP_CONCAT(DISTINCT COALESCE(u.nombre_completo, 'Sin nombre')) AS rociadores,
        COUNT(DISTINCT fr.tecnico_id) AS total_rociadores
        
      FROM Municipios m
      INNER JOIN Comunidades c ON m.municipio_id = c.municipio_id
      LEFT JOIN Formulario_RR1 fr ON c.comunidad_id = fr.comunidad_id 
           AND ${joinConditions.join(' AND ')}
      LEFT JOIN Usuarios u ON fr.tecnico_id = u.usuario_id
      ${whereClause}
      GROUP BY c.comunidad_id, c.nombre_comunidad, m.nombre_municipio, m.municipio_id
      ORDER BY m.nombre_municipio, c.nombre_comunidad
    `;

    // Combinar parámetros para la query (primero joinParams, luego queryParams)
    const fullParams = [...joinParams, ...queryParams];

    console.log("📝 Ejecutando query RR2 Full:", {
      municipios: municipiosPermitidos || 'Todos',
      where: whereClause
    });

    db.query(query, fullParams, (err, rows) => {
      if (err) {
        console.error("❌ Error en query RR2:", err);
        return res.status(500).json({ error: "Error obteniendo estadísticas" });
      }

      // Filtrar filas vacías SOLO si no se pidió un municipio específico y hay demasiadas (opcional)
      // Pero el requerimiento es "ver todos", así que devolvemos todo lo que coincida con el filtro de municipio.
      // Si no se eligió municipio, mostrará TODAS las comunidades del sistema. Esto puede ser mucho.
      // Si el user quiere "all municipalities (no solo con datos)", entonces esto es correcto.

      // Calcular totales
      const totales = calcularTotales(rows);

      res.json({
        estadisticas: rows,
        totales,
        periodo: { mes: targetMonth, año: targetYear, mes_nombre: getNombreMes(targetMonth) },
        resumen: {
          total_comunidades: rows.length,
          total_municipios: [...new Set(rows.map(r => r.municipio))].length
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

// Función auxiliar para calcular totales
function calcularTotales(rows) {
  return rows.reduce((acc, item) => ({
    total_registros: acc.total_registros + (parseInt(item.total_registros) || 0),
    poblacion_protegida: acc.poblacion_protegida + (parseInt(item.poblacion_protegida) || 0),
    viviendas_existentes: acc.viviendas_existentes + (parseInt(item.viviendas_existentes) || 0),
    viviendas_rociadas: acc.viviendas_rociadas + (parseInt(item.viviendas_rociadas) || 0),
    viviendas_no_rociadas: acc.viviendas_no_rociadas + (parseInt(item.viviendas_no_rociadas) || 0),
    viviendas_cerradas: acc.viviendas_cerradas + (parseInt(item.viviendas_cerradas) || 0),
    viviendas_renuentes: acc.viviendas_renuentes + (parseInt(item.viviendas_renuentes) || 0),
    habitaciones_rociadas: acc.habitaciones_rociadas + (parseInt(item.habitaciones_rociadas) || 0),
    habitaciones_no_rociadas: acc.habitaciones_no_rociadas + (parseInt(item.habitaciones_no_rociadas) || 0),
    total_cargas: acc.total_cargas + (parseInt(item.total_cargas) || 0),
    total_litros_l: acc.total_litros_l + (parseFloat(item.total_litros_l) || 0),
    total_litros_kg: acc.total_litros_kg + (parseFloat(item.total_litros_kg) || 0),
    dosis_ml: acc.dosis_ml + (parseFloat(item.dosis_ml) || 0),
    dosis_gr: acc.dosis_gr + (parseFloat(item.dosis_gr) || 0),
    total_rociadores: acc.total_rociadores + (parseInt(item.total_rociadores) || 0)
  }), {
    total_registros: 0, poblacion_protegida: 0, viviendas_existentes: 0,
    viviendas_rociadas: 0, viviendas_no_rociadas: 0, viviendas_cerradas: 0, viviendas_renuentes: 0,
    habitaciones_rociadas: 0, habitaciones_no_rociadas: 0, total_cargas: 0,
    total_litros_l: 0, total_litros_kg: 0, dosis_ml: 0, dosis_gr: 0, total_rociadores: 0
  });
}

export const getCatalogosFiltros = (req, res) => {
  const usuarioId = req.user?.usuario_id;
  const rol = req.user?.rol;

  console.log("📋 Cargando catálogos RR2 (Refactorizado)...", { rol, usuarioId });

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
      console.error("❌ Error catálogos RR2:", err);
      return res.status(500).json({ error: "Error al cargar catálogos" });
    }

    console.log(`✅ Catálogos cargados: ${municipios.length} municipios`);

    res.json({
      municipios: municipios || [],
      redesSalud: [],
      establecimientos: [],
      ultima_actualizacion: new Date().toISOString()
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