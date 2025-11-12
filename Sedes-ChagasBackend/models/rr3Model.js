import { connection } from "../database/db.js";

export const obtenerEstadisticasRR3 = (filtros, callback) => {
  const { municipio_id, mes, año } = filtros;
  
  let query = `
    SELECT 
      m.municipio_id,
      m.nombre as municipio,
      COUNT(DISTINCT r.rr1_id) as total_registros,
      MIN(r.fecha_rociado) as fecha_inicio,
      MAX(r.fecha_rociado) as fecha_final,
      SUM(r.habitantes_protegidos) as poblacion_protegida,
      
      -- Viviendas
      COUNT(DISTINCT CASE WHEN r.numero_vivienda IS NOT NULL THEN r.numero_vivienda END) as viviendas_existentes,
      COUNT(DISTINCT CASE WHEN r.rociado = 1 THEN r.numero_vivienda END) as viviendas_rociadas,
      COUNT(DISTINCT CASE WHEN r.no_rociado = 1 THEN r.numero_vivienda END) as viviendas_no_rociadas,
      COUNT(DISTINCT CASE WHEN r.cerrada = 1 THEN r.numero_vivienda END) as viviendas_cerradas,
      COUNT(DISTINCT CASE WHEN r.renuente = 1 THEN r.numero_vivienda END) as viviendas_renuentes,
      
      -- Habitaciones
      SUM(r.habitaciones_rociadas) as habitaciones_rociadas,
      SUM(r.habitaciones_no_rociadas) as habitaciones_no_rociadas,
      
      -- Peridomicilio
      SUM(r.corrales) as corrales,
      SUM(r.gallineros) as gallineros,
      SUM(r.conejeras) as conejeras,
      SUM(r.zarzos_trojes) as zarzos_trojes,
      SUM(r.otros_peridomicilio) as otros,
      
      -- Insecticidas
      SUM(CASE WHEN r.insecticida_utilizado = 'ALFACIPERMETRINA' THEN r.dosis ELSE 0 END) as dosis_alfacipermetrina,
      SUM(CASE WHEN r.insecticida_utilizado = 'ALFACIPERMETRINA' THEN r.numero_cargas ELSE 0 END) as cargas_alfacipermetrina,
      SUM(CASE WHEN r.insecticida_utilizado = 'ALFACIPERMETRINA' THEN r.cantidad_insecticida ELSE 0 END) as litros_alfacipermetrina,
      
      SUM(CASE WHEN r.insecticida_utilizado = 'BENDIOCARB' THEN r.dosis ELSE 0 END) as dosis_bendiocarb,
      SUM(CASE WHEN r.insecticida_utilizado = 'BENDIOCARB' THEN r.numero_cargas ELSE 0 END) as cargas_bendiocarb,
      SUM(CASE WHEN r.insecticida_utilizado = 'BENDIOCARB' THEN r.cantidad_insecticida ELSE 0 END) as litros_bendiocarb,
      
      SUM(CASE WHEN r.insecticida_utilizado = 'LAMBDACIALOTRINA' THEN r.dosis ELSE 0 END) as dosis_lambdacialotrina,
      SUM(CASE WHEN r.insecticida_utilizado = 'LAMBDACIALOTRINA' THEN r.numero_cargas ELSE 0 END) as cargas_lambdacialotrina,
      SUM(CASE WHEN r.insecticida_utilizado = 'LAMBDACIALOTRINA' THEN r.cantidad_insecticida ELSE 0 END) as litros_lambdacialotrina,
      
      -- Totales generales de insecticida
      SUM(r.dosis) as dosis_total,
      SUM(r.numero_cargas) as total_cargas,
      SUM(r.cantidad_insecticida) as total_litros_kg,
      
      -- Rociadores
      GROUP_CONCAT(DISTINCT CONCAT(u.nombre_completo) SEPARATOR ', ') as rociadores
      
    FROM rr1 r
    INNER JOIN municipios m ON r.municipio_id = m.municipio_id
    LEFT JOIN usuarios u ON r.tecnico_id = u.usuario_id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (municipio_id) {
    query += " AND r.municipio_id = ?";
    params.push(municipio_id);
  }
  
  if (mes && año) {
    query += " AND MONTH(r.fecha_rociado) = ? AND YEAR(r.fecha_rociado) = ?";
    params.push(mes, año);
  }
  
  query += `
    GROUP BY m.municipio_id, m.nombre
    ORDER BY m.nombre
  `;
  
  console.log("📊 Ejecutando consulta RR3...");
  
  connection.query(query, params, (err, results) => {
    if (err) {
      console.error("❌ Error en RR3 model:", err);
      return callback(err, null);
    }
    
    console.log(`✅ RR3 - ${results.length} municipios encontrados`);
    
    // Calcular progreso para cada municipio
    const resultadosConProgreso = results.map(item => {
      const viviendasExistentes = parseInt(item.viviendas_existentes) || 0;
      const viviendasRociadas = parseInt(item.viviendas_rociadas) || 0;
      
      const progreso = viviendasExistentes > 0 
        ? ((viviendasRociadas / viviendasExistentes) * 100).toFixed(1)
        : 0;
      
      return {
        ...item,
        progreso_viviendas: parseFloat(progreso)
      };
    });
    
    callback(null, resultadosConProgreso);
  });
};

export const obtenerTotalesRR3 = (filtros, callback) => {
  const { municipio_id, mes, año } = filtros;
  
  let query = `
    SELECT 
      COUNT(DISTINCT r.rr1_id) as total_registros,
      COUNT(DISTINCT CASE WHEN r.numero_vivienda IS NOT NULL THEN r.numero_vivienda END) as viviendas_existentes,
      COUNT(DISTINCT CASE WHEN r.rociado = 1 THEN r.numero_vivienda END) as viviendas_rociadas,
      COUNT(DISTINCT CASE WHEN r.no_rociado = 1 THEN r.numero_vivienda END) as viviendas_no_rociadas,
      COUNT(DISTINCT CASE WHEN r.cerrada = 1 THEN r.numero_vivienda END) as viviendas_cerradas,
      COUNT(DISTINCT CASE WHEN r.renuente = 1 THEN r.numero_vivienda END) as viviendas_renuentes,
      SUM(r.habitaciones_rociadas) as habitaciones_rociadas,
      SUM(r.habitaciones_no_rociadas) as habitaciones_no_rociadas,
      SUM(r.corrales) as corrales,
      SUM(r.gallineros) as gallineros,
      SUM(r.conejeras) as conejeras,
      SUM(r.zarzos_trojes) as zarzos_trojes,
      SUM(r.otros_peridomicilio) as otros,
      SUM(r.dosis) as dosis_total,
      SUM(r.numero_cargas) as total_cargas,
      SUM(r.cantidad_insecticida) as total_litros_kg,
      SUM(r.habitantes_protegidos) as poblacion_protegida
    FROM rr1 r
    WHERE 1=1
  `;
  
  const params = [];
  
  if (municipio_id) {
    query += " AND r.municipio_id = ?";
    params.push(municipio_id);
  }
  
  if (mes && año) {
    query += " AND MONTH(r.fecha_rociado) = ? AND YEAR(r.fecha_rociado) = ?";
    params.push(mes, año);
  }
  
  connection.query(query, params, (err, results) => {
    if (err) {
      console.error("❌ Error en totales RR3:", err);
      return callback(err, null);
    }
    
    const totales = results[0] || {};
    
    // Calcular progreso general
    const viviendasExistentes = parseInt(totales.viviendas_existentes) || 0;
    const viviendasRociadas = parseInt(totales.viviendas_rociadas) || 0;
    totales.progreso_viviendas = viviendasExistentes > 0 
      ? parseFloat(((viviendasRociadas / viviendasExistentes) * 100).toFixed(1))
      : 0;
    
    callback(null, totales);
  });
};