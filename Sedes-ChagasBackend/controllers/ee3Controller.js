import EE3 from "../models/EE3Model.js"; // IMPORT en lugar de require

// Listar evaluaciones de EE3
export async function listarEvaluaciones(req, res) {
  try {
    const data = await EE3.listarEvaluaciones(req.query || {});
    res.json({ success: true, data });
  } catch (err) {
    console.error("EE3 listarEvaluaciones:", err);
    res.status(500).json({
      success: false,
      message: "Error al listar evaluaciones",
      error: err.message || String(err)
    });
  }
}

// Obtener estadísticas de EE3
export async function estadisticas(req, res) {
  try {
    const data = await EE3.estadisticas(req.query || {});
    res.json({ success: true, data });
  } catch (err) {
    console.error("EE3 estadisticas:", err);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: err.message || String(err)
    });
  }
}
