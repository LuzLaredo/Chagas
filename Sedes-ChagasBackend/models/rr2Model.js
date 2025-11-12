import db from "../config/db.js";

export const RR2Model = {
  getEstadisticasConsolidadas: async (filtros = {}) => {
    try {
      console.log("📊 Iniciando getEstadisticasConsolidadas con filtros:", filtros);
      
      const { municipio, mes, año } = filtros;
      
      let whereConditions = [];
      let queryParams = [];

      // Usar mes y año actual si no se especifican
      const currentDate = new Date();
      const targetMonth = mes || currentDate.getMonth() + 1;
      const targetYear = año || currentDate.getFullYear();

      whereConditions.push('MONTH(fr.fecha_registro) = ?');
      whereConditions.push('YEAR(fr.fecha_registro) = ?');
      queryParams.push(targetMonth, targetYear);

      if (municipio) {
        whereConditions.push('fr.municipio_id = ?');
        queryParams.push(municipio);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

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

      console.log("📝 Query ejecutado:", query);
      console.log("🔧 Parámetros:", queryParams);

      const [rows] = await db.query(query, queryParams);
      console.log("✅ Resultados obtenidos:", rows.length, "registros");
      
      return rows;
    } catch (error) {
      console.error("❌ Error en getEstadisticasConsolidadas:", error);
      throw error;
    }
  },

  getCatalogosFiltros: async () => {
    try {
      console.log("📋 Cargando catálogos...");
      
      const [municipios] = await db.query('SELECT municipio_id, nombre_municipio AS nombre FROM Municipios ORDER BY nombre_municipio');
      const [redesSalud] = await db.query('SELECT redsalud_id, nombre_red AS nombre FROM RedSalud ORDER BY nombre_red');
      const [establecimientos] = await db.query('SELECT establecimiento_id, nombre_establecimiento AS nombre FROM EstablecimientosSalud ORDER BY nombre_establecimiento');
      
      console.log("✅ Catálogos cargados - Municipios:", municipios.length);
      
      return {
        municipios,
        redesSalud,
        establecimientos
      };
    } catch (error) {
      console.error("❌ Error en getCatalogosFiltros:", error);
      throw error;
    }
  }
};