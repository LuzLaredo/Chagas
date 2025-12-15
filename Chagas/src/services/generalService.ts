import { GeneralMapPoint, Municipio } from '../types/mapTypes.ts';
import { baseUrl } from "../api/BaseUrl"; 

// La URL base para todas tus APIs
const API_BASE_URL = `${baseUrl}`;

/**
 * Servicio encargado de gestionar las llamadas a la API relacionadas con datos
 * generales y la lista de municipios para los mapas.
 */
const generalService = {
    
    /**
     * Obtiene todos los puntos de interés para el Mapa General, que combina
     * Evaluaciones Entomológicas (EE) y Denuncias.
     * API: http://localhost:5000/api/mapageneral
     * @returns Una promesa que resuelve con un array de GeneralMapPoint.
     */
    getMapaGeneral: async (): Promise<GeneralMapPoint[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/mapageneral`);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status} al cargar mapa general.`);
            }
            
            const data: GeneralMapPoint[] = await response.json();
            return data;
            
        } catch (error) {
            console.error("Error en generalService.getMapaGeneral:", error);
            throw error;
        }
    },

    /**
     * Obtiene la lista completa de municipios para usar en filtros o capas.
     * API: http://localhost:5000/api/municipios
     * @returns Una promesa que resuelve con un array de Municipio.
     */
    getMunicipios: async (): Promise<Municipio[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/municipios`); 
            
            if (!response.ok) {
                throw new Error(`Error ${response.status} al cargar municipios.`);
            }
            
            const data: Municipio[] = await response.json();
            return data;
            
        } catch (error) {
            console.error("Error en generalService.getMunicipios:", error);
            throw error;
        }
    },

    /**
     * Obtiene las comunidades por municipio para usar en formularios.
     * API: http://localhost:5000/api/comunidades/municipio/:municipioId
     * @param municipioId - ID del municipio
     * @returns Una promesa que resuelve con un array de comunidades.
     */
    getComunidadesByMunicipio: async (municipioId: number): Promise<any[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/comunidades/municipio/${municipioId}`); 
            
            if (!response.ok) {
                throw new Error(`Error ${response.status} al cargar comunidades.`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error("Error en generalService.getComunidadesByMunicipio:", error);
            throw error;
        }
    },

    /**
     * Obtiene todas las comunidades activas.
     * API: http://localhost:5000/api/comunidades
     * @returns Una promesa que resuelve con un array de comunidades.
     */
    getComunidades: async (): Promise<any[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/comunidades`); 
            
            if (!response.ok) {
                throw new Error(`Error ${response.status} al cargar todas las comunidades.`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error("Error en generalService.getComunidades:", error);
            throw error;
        }
    }
};

export default generalService;