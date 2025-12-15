import * as detallesEE1Model from "../models/DetallesEE1Model.js"; 

/**
 * Obtiene los detalles de una EE1, incluyendo el estado de servicio precalculado en el modelo.
 * Esta es la función que se exporta como getDetalleEE1.
 */
export const getDetalleEE1 = async (req, res) => {
    // El ID se obtiene del parámetro de la URL
    const evaluacionId = req.params.id; 

    if (!evaluacionId) {
        return res.status(400).json({ message: "ID de Evaluación (EE1) es requerido." });
    }

    try {
        const datosBrutos = await detallesEE1Model.getDetalleEE1ById(evaluacionId);

        if (!datosBrutos) {
            return res.status(404).json({ message: "Evaluación Entomológica (EE1) no encontrada." });
        }

        // Estructurar la respuesta final
        const detallesEE1 = {
            // Datos Generales
            jefe_familia: datosBrutos.jefe_familia,
            n_vivienda: datosBrutos.n_vivienda,
            n_habitantes: datosBrutos.n_habitantes,
            numero_habitaciones: datosBrutos.numero_habitaciones,
            comunidad: datosBrutos.comunidad,
            municipio: datosBrutos.municipio,

            // Resultado y Estado
            resultado_ee: datosBrutos.resultado_ee, 
            estado_servicio: datosBrutos.estado_servicio, 

            // Equipo que realizó la evaluación
            tecnico_id: datosBrutos.tecnico_id,
            tecnico_nombre: datosBrutos.tecnico_nombre,
            
            jefe1_id: datosBrutos.jefe1_id,
            jefe1_nombre: datosBrutos.jefe1_nombre,
            
            jefe2_id: datosBrutos.jefe2_id,
            jefe2_nombre: datosBrutos.jefe2_nombre,
            
            jefe3_id: datosBrutos.jefe3_id,
            jefe3_nombre: datosBrutos.jefe3_nombre,
            
            jefe4_id: datosBrutos.jefe4_id,
            jefe4_nombre: datosBrutos.jefe4_nombre,

            // Ubicación y Visual
            foto_entrada: datosBrutos.foto_entrada,
            latitud: datosBrutos.latitud,
            longitud: datosBrutos.longitud
        };

        res.json(detallesEE1);

    } catch (error) {
        console.error(`Error en getDetalleEE1 (Controlador) para ID ${evaluacionId}:`, error);
        res.status(500).json({ message: "Error al obtener datos de EE1" });
    }
};