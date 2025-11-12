import db from "../config/db.js";

export const getRR2Estadisticas = (req, res) => {
  const { municipio, mes, año } = req.query;
  
  const currentDate = new Date();
  const targetMonth = mes || currentDate.getMonth() + 1;
  const targetYear = año || currentDate.getFullYear();

  console.log("📊 Solicitando estadísticas RR2:", { municipio, mes: targetMonth, año: targetYear });

  let whereConditions = ['MONTH(fr.fecha_registro) = ?', 'YEAR(fr.fecha_registro) = ?'];
  let queryParams = [targetMonth, targetYear];

  if (municipio && municipio !== "") {
    whereConditions.push('fr.municipio_id = ?');
    queryParams.push(municipio);
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : '';

  // QUERY ACTUALIZADA CON NUEVAS COLUMNAS
  const query = `
    SELECT 
      c.comunidad_id,
      c.nombre_comunidad AS comunidad,
      m.nombre_municipio AS municipio,
      MIN(DATE(fr.fecha_registro)) AS fecha_inicio,
      MAX(DATE(fr.fecha_registro)) AS fecha_final,
      COUNT(fr.id_rr1) AS total_registros,
      COALESCE(SUM(fr.habitantes_protegidos), 0) AS poblacion_protegida,
      
      -- NUEVAS COLUMNAS DE VIVIENDAS
      COUNT(fr.id_rr1) AS viviendas_existentes,
      COALESCE(SUM(CASE WHEN fr.rociado = 1 THEN 1 ELSE 0 END), 0) AS viviendas_rociadas,
      COALESCE(SUM(CASE WHEN fr.no_rociado = 1 THEN 1 ELSE 0 END), 0) AS viviendas_no_rociadas,
      COALESCE(SUM(CASE WHEN fr.cerrada = 1 THEN 1 ELSE 0 END), 0) AS viviendas_cerradas,
      COALESCE(SUM(CASE WHEN fr.renuente = 1 THEN 1 ELSE 0 END), 0) AS viviendas_renuentes,
      
      -- Habitaciones
      COALESCE(SUM(fr.habitaciones_rociadas), 0) AS habitaciones_rociadas,
      COALESCE(SUM(fr.habitaciones_no_rociadas), 0) AS habitaciones_no_rociadas,
      COALESCE(SUM(fr.habitaciones_total), 0) AS habitaciones_total,
      
      -- Peridomicilio
      COALESCE(SUM(fr.corrales), 0) AS corrales,
      COALESCE(SUM(fr.gallineros), 0) AS gallineros,
      COALESCE(SUM(fr.conejeras), 0) AS conejeras,
      COALESCE(SUM(fr.zarzos_trojes), 0) AS zarzos_trojes,
      COALESCE(SUM(fr.otros_peridomicilio), 0) AS otros,
      
      -- Datos de rociado
      COALESCE(SUM(fr.numero_cargas), 0) AS total_cargas,
      COALESCE(SUM(fr.cantidad_insecticida), 0) AS total_litros_ml,
      COALESCE(SUM(fr.cantidad_insecticida) / 1000, 0) AS total_litros_kg,
      COALESCE(SUM(fr.dosis), 0) AS dosis,
      
      -- Rociadores (técnicos)
      GROUP_CONCAT(DISTINCT COALESCE(u.nombre_completo, 'Sin nombre')) AS rociadores,
      COUNT(DISTINCT fr.tecnico_id) AS total_rociadores
      
    FROM Formulario_RR1 fr
    LEFT JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
    LEFT JOIN Municipios m ON fr.municipio_id = m.municipio_id
    LEFT JOIN Usuarios u ON fr.tecnico_id = u.usuario_id
    ${whereClause}
    GROUP BY c.comunidad_id, c.nombre_comunidad, m.nombre_municipio
    ORDER BY m.nombre_municipio, c.nombre_comunidad
  `;

  console.log("📝 Query RR2:", query);
  console.log("🔧 Parámetros:", queryParams);

  db.query(query, queryParams, (err, rows) => {
    if (err) {
      console.error("❌ Error en query RR2:", err);
      return res.status(500).json({ 
        error: "Error al obtener estadísticas RR2",
        details: err.message,
        sql: err.sql
      });
    }

    console.log("✅ Datos RR2 obtenidos:", rows.length, "comunidades");

    // Si no hay datos, devolver estructura vacía pero válida
    if (rows.length === 0) {
      console.log("ℹ️ No hay datos para el período seleccionado");
      return res.json({
        estadisticas: [],
        totales: {
          total_registros: 0,
          poblacion_protegida: 0,
          // NUEVOS TOTALES
          viviendas_existentes: 0,
          viviendas_rociadas: 0,
          viviendas_no_rociadas: 0,
          viviendas_cerradas: 0,
          viviendas_renuentes: 0,
          habitaciones_rociadas: 0,
          habitaciones_no_rociadas: 0,
          habitaciones_total: 0,
          total_cargas: 0,
          total_litros_ml: 0,
          total_litros_kg: 0,
          dosis: 0,
          corrales: 0,
          gallineros: 0,
          conejeras: 0,
          zarzos_trojes: 0,
          otros: 0,
          total_rociadores: 0
        },
        periodo: {
          mes: parseInt(targetMonth),
          año: parseInt(targetYear),
          mes_nombre: getNombreMes(targetMonth)
        },
        resumen: {
          total_comunidades: 0,
          total_municipios: 0
        }
      });
    }

    // Calcular totales generales ACTUALIZADOS
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
      const dosis = parseFloat(item.dosis) || 0;

      return {
        total_registros: acc.total_registros + registros,
        poblacion_protegida: acc.poblacion_protegida + poblacion,
        // NUEVOS TOTALES
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
        dosis: parseFloat((acc.dosis + dosis).toFixed(2)),
        corrales: acc.corrales + (parseInt(item.corrales) || 0),
        gallineros: acc.gallineros + (parseInt(item.gallineros) || 0),
        conejeras: acc.conejeras + (parseInt(item.conejeras) || 0),
        zarzos_trojes: acc.zarzos_trojes + (parseInt(item.zarzos_trojes) || 0),
        otros: acc.otros + (parseInt(item.otros) || 0),
        total_rociadores: acc.total_rociadores + (parseInt(item.total_rociadores) || 0)
      };
    }, {
      total_registros: 0,
      poblacion_protegida: 0,
      // NUEVOS TOTALES INICIALES
      viviendas_existentes: 0,
      viviendas_rociadas: 0,
      viviendas_no_rociadas: 0,
      viviendas_cerradas: 0,
      viviendas_renuentes: 0,
      habitaciones_rociadas: 0,
      habitaciones_no_rociadas: 0,
      habitaciones_total: 0,
      total_cargas: 0,
      total_litros_ml: 0,
      total_litros_kg: 0,
      dosis: 0,
      corrales: 0,
      gallineros: 0,
      conejeras: 0,
      zarzos_trojes: 0,
      otros: 0,
      total_rociadores: 0
    });

    console.log("📊 Resumen RR2:", {
      comunidades: rows.length,
      registros: totales.total_registros,
      viviendas_existentes: totales.viviendas_existentes,
      viviendas_rociadas: totales.viviendas_rociadas,
      viviendas_no_rociadas: totales.viviendas_no_rociadas,
      poblacion: totales.poblacion_protegida,
      rociadores: totales.total_rociadores
    });

    res.json({
      estadisticas: rows,
      totales,
      periodo: {
        mes: parseInt(targetMonth),
        año: parseInt(targetYear),
        mes_nombre: getNombreMes(targetMonth)
      },
      resumen: {
        total_comunidades: rows.length,
        total_municipios: [...new Set(rows.map(item => item.municipio))].length
      }
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

export const getCatalogosFiltros = (req, res) => {
  console.log("📋 Cargando catálogos para filtros RR2...");
  
  // Consulta para municipios (solo aquellos que tienen formularios RR1)
  const queryMunicipios = `
    SELECT DISTINCT 
      m.municipio_id, 
      m.nombre_municipio AS nombre 
    FROM Municipios m
    INNER JOIN Formulario_RR1 fr ON m.municipio_id = fr.municipio_id
    ORDER BY m.nombre_municipio
  `;
  
  db.query(queryMunicipios, (err, municipios) => {
    if (err) {
      console.error("❌ Error al obtener municipios con formularios:", err);
      // Fallback: obtener todos los municipios
      const fallbackQuery = 'SELECT municipio_id, nombre_municipio AS nombre FROM Municipios ORDER BY nombre_municipio';
      db.query(fallbackQuery, (err, municipios) => {
        if (err) {
          console.error("❌ Error en query fallback:", err);
          return res.status(500).json({ 
            error: "Error al obtener catálogos",
            details: err.message 
          });
        }
        
        console.log("✅ Catálogos RR2 cargados (fallback) - Municipios:", municipios.length);
        
        res.json({
          municipios: municipios || [],
          redesSalud: [],
          establecimientos: []
        });
      });
      return;
    }
    
    console.log("✅ Catálogos RR2 cargados - Municipios:", municipios.length);
    
    res.json({
      municipios: municipios || [],
      redesSalud: [],
      establecimientos: []
    });
  });
};