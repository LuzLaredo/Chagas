import db from "../config/db.js"; // NUEVO: Importar la conexión a la base de datos

// ===========================================================
// 🔸 OBTENER TODOS LOS CATÁLOGOS COMPLETOS
// ===========================================================
export const obtenerCatalogosCompletos = async (req, res) => {
  try {
    console.log("🔍 Solicitando catálogos completos");
    
    // Ejecutar consultas en paralelo
    const [
      municipios,
      comunidades,
      sedes,
      redesSalud,
      establecimientos,
      tecnicos,
      jefesGrupo
    ] = await Promise.all([
      new Promise((resolve, reject) => {
        db.query("SELECT * FROM Municipios ORDER BY nombre_municipio", (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query("SELECT * FROM Comunidades ORDER BY nombre_comunidad", (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query("SELECT * FROM Sedes ORDER BY nombre_sede", (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query("SELECT * FROM RedSalud ORDER BY nombre_red", (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query("SELECT * FROM EstablecimientosSalud ORDER BY nombre_establecimiento", (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query(`
          SELECT usuario_id, nombre_completo 
          FROM Usuarios 
          WHERE rol = 'tecnico' AND estado = 'activo'
          ORDER BY nombre_completo
        `, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query(`
          SELECT usuario_id, nombre_completo 
          FROM Usuarios 
          WHERE rol = 'jefe_grupo' AND estado = 'activo'
          ORDER BY nombre_completo
        `, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      })
    ]);

    console.log(`✅ Catálogos obtenidos: Municipios(${municipios.length}), Comunidades(${comunidades.length})`);
    
    res.json({
      municipios,
      comunidades,
      sedes,
      redesSalud,
      establecimientos,
      tecnicos,
      jefesGrupo
    });

  } catch (error) {
    console.error("❌ Error al obtener catálogos completos:", error);
    res.status(500).json({ 
      error: "Error interno al obtener catálogos",
      details: error.message 
    });
  }
};

// ===========================================================
// 🔸 OBTENER CATÁLOGOS POR USUARIO (FILTRADO POR MUNICIPIOS ASIGNADOS)
// ===========================================================
// En catalogosController.js, modifica la función obtenerCatalogosPorUsuario:
export const obtenerCatalogosPorUsuario = async (req, res) => {
  try {
    const usuarioId = req.user?.usuario_id;
    const rol = req.user?.rol;
    
    console.log(`🔍 Obteniendo catálogos para usuario: ${usuarioId}, rol: ${rol}`);
    
    // Si es administrador, mostrar todos los catálogos
    if (rol === 'administrador') {
      console.log("✅ Usuario es administrador, mostrando todos los catálogos");
      return obtenerCatalogosCompletos(req, res);
    }

    // Para técnicos, jefes_grupo y supervisores, obtener solo sus municipios
    const queryMunicipios = `
      SELECT DISTINCT m.* 
      FROM Usuario_Municipio um
      INNER JOIN Municipios m ON um.municipio_id = m.municipio_id
      WHERE um.usuario_id = ?
      ORDER BY m.nombre_municipio
    `;

    const queryComunidades = `
      SELECT c.* 
      FROM Comunidades c
      INNER JOIN Usuario_Municipio um ON c.municipio_id = um.municipio_id
      WHERE um.usuario_id = ?
      ORDER BY c.nombre_comunidad
    `;

    const queryTecnicos = `
      SELECT usuario_id, nombre_completo 
      FROM Usuarios 
      WHERE rol = 'tecnico' AND estado = 'activo'
      ORDER BY nombre_completo
    `;

    const queryJefesGrupo = `
      SELECT usuario_id, nombre_completo 
      FROM Usuarios 
      WHERE rol = 'jefe_grupo' AND estado = 'activo'
      ORDER BY nombre_completo
    `;

    // Ejecutar todas las consultas con callbacks
    db.query(queryMunicipios, [usuarioId], (errMunicipios, municipiosResult) => {
      if (errMunicipios) {
        console.error("❌ Error al obtener municipios:", errMunicipios);
        municipiosResult = [];
      }
      
      db.query(queryComunidades, [usuarioId], (errComunidades, comunidadesResult) => {
        if (errComunidades) {
          console.error("❌ Error al obtener comunidades:", errComunidades);
          comunidadesResult = [];
        }
        
        db.query(queryTecnicos, (errTecnicos, tecnicosResult) => {
          if (errTecnicos) {
            console.error("❌ Error al obtener técnicos:", errTecnicos);
            tecnicosResult = [];
          }
          
          db.query(queryJefesGrupo, (errJefes, jefesGrupoResult) => {
            if (errJefes) {
              console.error("❌ Error al obtener jefes de grupo:", errJefes);
              jefesGrupoResult = [];
            }
            
            console.log(`✅ Catálogos obtenidos: ${municipiosResult.length} municipios, ${comunidadesResult.length} comunidades`);
            
            res.json({
              municipios: municipiosResult || [],
              comunidades: comunidadesResult || [],
              tecnicos: tecnicosResult || [],
              jefesGrupo: jefesGrupoResult || []
            });
          });
        });
      });
    });

  } catch (error) {
    console.error("❌ Error en obtenerCatalogosPorUsuario:", error);
    res.status(500).json({ 
      error: "Error al obtener catálogos", 
      details: error.message 
    });
  }
};
// ===========================================================
// 🔸 CONTROLADORES INDIVIDUALES (sin cambios)
// ===========================================================

export const obtenerMunicipiosController = (req, res) => {
  db.query("SELECT * FROM Municipios ORDER BY nombre_municipio", (err, results) => {
    if (err) {
      console.error("❌ Error al obtener municipios:", err);
      return res.status(500).json({ error: "Error al obtener municipios" });
    }
    res.json(results);
  });
};

export const obtenerComunidadesController = (req, res) => {
  db.query("SELECT * FROM Comunidades ORDER BY nombre_comunidad", (err, results) => {
    if (err) {
      console.error("❌ Error al obtener comunidades:", err);
      return res.status(500).json({ error: "Error al obtener comunidades" });
    }
    res.json(results);
  });
};

export const obtenerSedesController = (req, res) => {
  db.query("SELECT * FROM Sedes ORDER BY nombre_sede", (err, results) => {
    if (err) {
      console.error("❌ Error al obtener sedes:", err);
      return res.status(500).json({ error: "Error al obtener sedes" });
    }
    res.json(results);
  });
};

export const obtenerRedesSaludController = (req, res) => {
  db.query("SELECT * FROM RedSalud ORDER BY nombre_red", (err, results) => {
    if (err) {
      console.error("❌ Error al obtener redes de salud:", err);
      return res.status(500).json({ error: "Error al obtener redes de salud" });
    }
    res.json(results);
  });
};

export const obtenerEstablecimientosController = (req, res) => {
  db.query("SELECT * FROM EstablecimientosSalud ORDER BY nombre_establecimiento", (err, results) => {
    if (err) {
      console.error("❌ Error al obtener establecimientos:", err);
      return res.status(500).json({ error: "Error al obtener establecimientos" });
    }
    res.json(results);
  });
};

export const obtenerMunicipiosUsuarioController = async (req, res) => {
  try {
    const usuarioId = req.user?.usuario_id;
    
    if (!usuarioId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const query = `
      SELECT DISTINCT m.* 
      FROM Usuario_Municipio um
      INNER JOIN Municipios m ON um.municipio_id = m.municipio_id
      WHERE um.usuario_id = ?
      ORDER BY m.nombre_municipio
    `;

    db.query(query, [usuarioId], (err, results) => {
      if (err) {
        console.error("❌ Error al obtener municipios del usuario:", err);
        return res.status(500).json({ error: "Error al obtener municipios" });
      }
      res.json(results);
    });

  } catch (error) {
    console.error("❌ Error en obtenerMunicipiosUsuarioController:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const obtenerTecnicosController = (req, res) => {
  db.query(`
    SELECT usuario_id, nombre_completo 
    FROM Usuarios 
    WHERE rol = 'tecnico' AND estado = 'activo'
    ORDER BY nombre_completo
  `, (err, results) => {
    if (err) {
      console.error("❌ Error al obtener técnicos:", err);
      return res.status(500).json({ error: "Error al obtener técnicos" });
    }
    res.json(results);
  });
};

export const obtenerJefesGrupoController = (req, res) => {
  db.query(`
    SELECT usuario_id, nombre_completo 
    FROM Usuarios 
    WHERE rol = 'jefe_grupo' AND estado = 'activo'
    ORDER BY nombre_completo
  `, (err, results) => {
    if (err) {
      console.error("❌ Error al obtener jefes de grupo:", err);
      return res.status(500).json({ error: "Error al obtener jefes de grupo" });
    }
    res.json(results);
  });
};