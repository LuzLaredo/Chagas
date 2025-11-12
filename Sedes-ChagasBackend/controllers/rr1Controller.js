import {
  crearFormularioRR1,
  obtenerFormulariosRR1,
  obtenerFormularioRR1PorId
} from "../models/rr1Model.js";

// Crear nuevo formulario RR1
export const crearRR1 = async (req, res) => {
  try {

    const { 
      sede_id, redsalud_id, establecimiento_id,
      municipio_id, comunidad_id, numero_vivienda, jefe_familia,
      habitantes_protegidos, cerrada, renuente, habitaciones_rociadas,
      habitaciones_no_rociadas, corrales, gallineros, conejeras,
      zarzos_trojes, otros_peridomicilio, numero_cargas,
      cantidad_insecticida, firma_conformidad, rociado, no_rociado,
      insecticida_utilizado, lote, dosis, tecnico_id, jefe1_id, jefe2_id, jefe3_id, jefe4_id
    } = req.body;

    // Validaciones básicas
    if (!numero_vivienda || !jefe_familia || !tecnico_id) {
      return res.status(400).json({ 
        error: "Faltan campos obligatorios: numero_vivienda, jefe_familia, tecnico_id" 
      });
    }

    // Si la vivienda está cerrada, renuente o no rociada, poner todos los valores en 0
    const isViviendaNoDisponible = cerrada || renuente || no_rociado;

    // Calcular total de habitaciones
    const habitaciones_total = isViviendaNoDisponible ? 0 : 
      (parseInt(habitaciones_rociadas) || 0) + (parseInt(habitaciones_no_rociadas) || 0);

    console.log("🔧 Procesando datos - Vivienda no disponible:", isViviendaNoDisponible);
    console.log("🔧 Total habitaciones calculado:", habitaciones_total);

    // Crear formulario principal
    crearFormularioRR1({
      tecnico_id: parseInt(tecnico_id),
      jefe1_id: parseInt(jefe1_id) || null,
      jefe2_id: parseInt(jefe2_id) || null,
      jefe3_id: parseInt(jefe3_id) || null,
      jefe4_id: parseInt(jefe4_id) || null,
      sede_id: parseInt(sede_id) || 1,
      redsalud_id: parseInt(redsalud_id) || 1,
      establecimiento_id: parseInt(establecimiento_id) || 1,
      municipio_id: parseInt(municipio_id) || 1,
      comunidad_id: parseInt(comunidad_id) || 1,
      numero_vivienda,
      jefe_familia,
      habitantes_protegidos: parseInt(habitantes_protegidos) || 0,
      cerrada: cerrada ? 1 : 0,
      renuente: renuente ? 1 : 0,
      habitaciones_rociadas: isViviendaNoDisponible ? 0 : parseInt(habitaciones_rociadas) || 0,
      habitaciones_no_rociadas: isViviendaNoDisponible ? 0 : parseInt(habitaciones_no_rociadas) || 0,
      habitaciones_total: habitaciones_total,
      corrales: isViviendaNoDisponible ? 0 : parseInt(corrales) || 0,
      gallineros: isViviendaNoDisponible ? 0 : parseInt(gallineros) || 0,
      conejeras: isViviendaNoDisponible ? 0 : parseInt(conejeras) || 0,
      zarzos_trojes: isViviendaNoDisponible ? 0 : parseInt(zarzos_trojes) || 0,
      otros_peridomicilio: isViviendaNoDisponible ? 0 : parseInt(otros_peridomicilio) || 0,
      numero_cargas: isViviendaNoDisponible ? 0 : parseInt(numero_cargas) || 0,
      cantidad_insecticida: isViviendaNoDisponible ? 0 : parseFloat(cantidad_insecticida) || 0,
      firma_conformidad: firma_conformidad || "",
      rociado: rociado ? 1 : 0,
      no_rociado: no_rociado ? 1 : 0,
      insecticida_utilizado: insecticida_utilizado || "",
      lote: lote || "",
      dosis: isViviendaNoDisponible ? 0 : parseFloat(dosis) || 0,
      estado: rociado ? 'activo' : 'inactivo'
    }, (err, resultado) => {
      if (err) {
        console.error("❌ Error al crear formulario:", err);
        return res.status(500).json({ 
          error: "Error al crear formulario RR1",
          details: err.sqlMessage || err.message 
        });
      }

      
      res.status(201).json({
        message: "Formulario RR1 creado exitosamente",
        id_rr1: resultado.insertId,
        vivienda_no_disponible: isViviendaNoDisponible
      });
    });

  } catch (error) {
    console.error("💥 Error general:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      details: error.message 
    });
  }
};

// Obtener todos los formularios RR1
export const obtenerRR1 = (req, res) => {
  obtenerFormulariosRR1((err, formularios) => {
    if (err) {
      console.error("Error al obtener formularios RR1:", err);
      return res.status(500).json({ 
        error: "Error al obtener formularios",
        details: err.message 
      });
    }
    res.json(formularios);
  });
};

// Obtener un formulario RR1 específico
export const obtenerRR1PorId = (req, res) => {
  const { id } = req.params;

  obtenerFormularioRR1PorId(id, (err, formulario) => {
    if (err) {
      console.error("Error al obtener formulario RR1:", err);
      return res.status(500).json({ 
        error: "Error al obtener formulario",
        details: err.message 
      });
    }

    if (!formulario) {
      return res.status(404).json({ error: "Formulario no encontrado" });
    }

    res.json(formulario);
  });
};