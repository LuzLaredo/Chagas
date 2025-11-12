import { Vivienda, Servicio } from '../types/viviendas';

import { baseUrl } from "../api/BaseUrl"; 

const API_URL = `${baseUrl}/api`;

export const viviendasService = {
    // Obtener todas las viviendas (básico)
    getViviendas: async (): Promise<Vivienda[]> => {
        const response = await fetch(`${API_URL}/viviendas/all`);
        if (!response.ok) throw new Error('Error al obtener viviendas');
        return await response.json();
    },

    // Obtener vivienda por ID con detalles completos
    getViviendaById: async (id: number): Promise<Vivienda> => {
        const response = await fetch(`${API_URL}/viviendas/${id}`);
        if (!response.ok) throw new Error('Error al obtener vivienda');
        return await response.json();
    },

    // Obtener servicio de una vivienda
    getServicioByViviendaId: async (id: number): Promise<Servicio | null> => {
        const response = await fetch(`${API_URL}/servicios/vivienda/${id}`);
        if (!response.ok) throw new Error('Error al obtener servicio');
        const data = await response.json();
        return Array.isArray(data) && data.length > 0 ? data[0] : null;
    }
};