// controllers/mapaEE1Controller.js
import * as mapaEE1Model from "../models/mapaEE1Model.js";

/**
 * Obtiene los datos del mapa de EE1 y los envía como respuesta JSON.
 */
export const getMapaEE1 = async (req, res) => {
  try {
    // Llamada asíncrona al modelo
    const datos = await mapaEE1Model.getAllMapaEE1();
    res.json(datos);
  } catch (error) {
    // Captura cualquier error del modelo (SQL o conexión)
    console.error("Error en getMapaEE1 (Controlador):", error);

    // Responde con un mensaje genérico de error
    res.status(500).json({ message: "Error al obtener datos de EE1" });
  }
};
