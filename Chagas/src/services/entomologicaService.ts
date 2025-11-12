import { EE1MapPoint } from '../types/mapTypes';
import { baseUrl } from "../api/BaseUrl"; 

const API_BASE_URL = `${baseUrl}`;

/**
 * Servicio para obtener datos de Evaluaciones Entomológicas.
 * Se encarga de la lógica de comunicación con el backend (API) para datos EE1.
 */
const entomologicaService = {

    /**
     * Obtiene los puntos geográficos y datos de la Evaluación Entomológica 1 (EE1).
     * API: http://localhost:5000/api/mapaEE1
     * @returns Una promesa que resuelve con un array de puntos EE1.
     */
    getMapaEE1: async (): Promise<EE1MapPoint[]> => {
        try {
            // Se realiza la llamada a la API real
            const response = await fetch(`${API_BASE_URL}/api/mapaEE1`);
            
            if (!response.ok) {
                 // Manejo de errores HTTP (ej. 404, 500)
                throw new Error(`Error ${response.status} al cargar datos de Evaluación Entomológica 1 (EE1).`);
            }
            
            // Asume que la respuesta JSON coincide con el tipo EE1MapPoint[]
            const data: EE1MapPoint[] = await response.json();
            return data;
            
        } catch (error) {
            console.error('Fallo al obtener datos de EE1:', error);
            // Re-lanzamos el error para que el componente que llama lo pueda manejar
            throw error;
        }
    }
};

export default entomologicaService;
