// C:\PS3-CHAGAS\Sedes-ChagasBackend\controllers\mapaGeneralController.js
import * as mapaGeneralModel from "../models/mapaGeneralModel.js";

export const getMapaGeneral = async (req, res) => {
  try {
    // Llama a la función del modelo para obtener los datos unificados y filtrados
    const datos = await mapaGeneralModel.getAllMapaGeneral();
    res.json(datos);
  } catch (error) {
    console.error("Error en getMapaGeneral:", error);
    // En caso de error en la BD o en el modelo, devuelve un error 500
    res.status(500).json({ message: "Error al obtener datos del mapa general" });
  }
};
