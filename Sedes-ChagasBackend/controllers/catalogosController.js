import {
  obtenerMunicipios,
  obtenerComunidades,
  obtenerSedes,
  obtenerRedesSalud,
  obtenerEstablecimientosSalud,
  obtenerTodosLosCatalogos,
  obtenerMunicipiosPorUsuario,
  obtenerTecnicos,
  obtenerJefesGrupo
} from "../models/catalogosModel.js";

// Obtener todos los catalogos (endpoint principal para el formulario RR1)
export const obtenerCatalogosCompletos = async (req, res) => {
  try {
    console.log("📋 Solicitando todos los catalogos");

    obtenerTodosLosCatalogos((err, catalogos) => {
      if (err) {
        console.error("❌ Error al obtener catalogos:", err);
        return res.status(500).json({ 
          error: "Error al obtener los catalogos",
          details: err.message 
        });
      }

      console.log(`✅ Catalogos obtenidos exitosamente:
        - Municipios: ${catalogos.municipios?.length || 0}
        - Comunidades: ${catalogos.comunidades?.length || 0}
        - Sedes: ${catalogos.sedes?.length || 0}
        - Redes de Salud: ${catalogos.redesSalud?.length || 0}
        - Establecimientos: ${catalogos.establecimientos?.length || 0}
      `);

      res.json(catalogos);
    });

  } catch (error) {
    console.error("💥 Error general en catalogos:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      details: error.message 
    });
  }
};

// Obtener municipios
export const obtenerMunicipiosController = (req, res) => {
  obtenerMunicipios((err, municipios) => {
    if (err) {
      console.error("❌ Error al obtener municipios:", err);
      return res.status(500).json({ 
        error: "Error al obtener municipios",
        details: err.message 
      });
    }
    
    res.json(municipios);
  });
};

// Obtener comunidades (con filtro opcional por municipio)
export const obtenerComunidadesController = (req, res) => {
  const { municipio_id } = req.query;
  
  obtenerComunidades(municipio_id || null, (err, comunidades) => {
    if (err) {
      console.error("❌ Error al obtener comunidades:", err);
      return res.status(500).json({ 
        error: "Error al obtener comunidades",
        details: err.message 
      });
    }
    
    res.json(comunidades);
  });
};

// Obtener sedes
export const obtenerSedesController = (req, res) => {
  obtenerSedes((err, sedes) => {
    if (err) {
      console.error("❌ Error al obtener sedes:", err);
      return res.status(500).json({ 
        error: "Error al obtener sedes",
        details: err.message 
      });
    }
    
    res.json(sedes);
  });
};

// Obtener redes de salud (con filtro opcional por sede)
export const obtenerRedesSaludController = (req, res) => {
  const { sede_id } = req.query;
  
  obtenerRedesSalud(sede_id || null, (err, redesSalud) => {
    if (err) {
      console.error("❌ Error al obtener redes de salud:", err);
      return res.status(500).json({ 
        error: "Error al obtener redes de salud",
        details: err.message 
      });
    }
    
    res.json(redesSalud);
  });
};

// Obtener establecimientos de salud (con filtro opcional por red)
export const obtenerEstablecimientosController = (req, res) => {
  const { redsalud_id } = req.query;
  
  obtenerEstablecimientosSalud(redsalud_id || null, (err, establecimientos) => {
    if (err) {
      console.error("❌ Error al obtener establecimientos:", err);
      return res.status(500).json({ 
        error: "Error al obtener establecimientos",
        details: err.message 
      });
    }
    
    res.json(establecimientos);
  });
};

// Obtener municipios asignados al usuario actual
export const obtenerMunicipiosUsuarioController = (req, res) => {
  const usuarioId = req.user.usuario_id;
  
  obtenerMunicipiosPorUsuario(usuarioId, (err, municipios) => {
    if (err) {
      console.error("❌ Error al obtener municipios del usuario:", err);
      return res.status(500).json({ 
        error: "Error al obtener municipios del usuario",
        details: err.message 
      });
    }
    
    res.json(municipios);
  });
};

// Obtener técnicos
export const obtenerTecnicosController = (req, res) => {
  obtenerTecnicos((err, tecnicos) => {
    if (err) {
      console.error("❌ Error al obtener técnicos:", err);
      return res.status(500).json({ 
        error: "Error al obtener técnicos",
        details: err.message 
      });
    }
    
    res.json(tecnicos);
  });
};

// Obtener jefes de grupo
export const obtenerJefesGrupoController = (req, res) => {
  obtenerJefesGrupo((err, jefesGrupo) => {
    if (err) {
      console.error("❌ Error al obtener jefes de grupo:", err);
      return res.status(500).json({ 
        error: "Error al obtener jefes de grupo",
        details: err.message 
      });
    }
    
    res.json(jefesGrupo);
  });
};