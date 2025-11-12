import { Denuncia, CreateDenunciaRequest, UpdateDenunciaRequest } from '../types/denuncias';
import { baseUrl } from "../api/BaseUrl"; 

const API_URL = `${baseUrl}/api`;



// Función para obtener el token de autenticación
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

export const denunciasService = {
    // Obtener todas las denuncias (ruta pública)
    getDenuncias: async (): Promise<Denuncia[]> => {
        try {
            const response = await fetch(`${API_URL}/denuncias`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener denuncias:', error);
            throw error;
        }
    },

    // Obtener denuncia por ID (ruta pública)
    getDenunciaById: async (id: number): Promise<Denuncia> => {
        const response = await fetch(`${API_URL}/denuncias/${id}`);
        if (!response.ok) throw new Error('Error al obtener denuncia');
        return await response.json();
    },

    // Crear nueva denuncia
    createDenuncia: async (denuncia: CreateDenunciaRequest | FormData): Promise<Denuncia> => {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
        
        // Si es FormData, no agregar Content-Type (se establece automáticamente)
        if (!(denuncia instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        
        const response = await fetch(`${API_URL}/denuncias`, {
            method: 'POST',
            headers,
            body: denuncia instanceof FormData ? denuncia : JSON.stringify(denuncia),
        });
        if (!response.ok) {
            let errorMessage = 'Error al crear denuncia';
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // Si no se puede parsear el error, usar el mensaje por defecto
            }
            
            if (response.status === 401) {
                throw new Error('No estás autenticado. Por favor, inicia sesión.');
            } else if (response.status === 400) {
                throw new Error(errorMessage);
            } else {
                throw new Error(errorMessage);
            }
        }
        return await response.json();
    },

    // Actualizar denuncia
    updateDenuncia: async (denuncia: UpdateDenunciaRequest): Promise<Denuncia> => {
        const response = await fetch(`${API_URL}/denuncias/${denuncia.denuncia_id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(denuncia),
        });
        if (!response.ok) throw new Error('Error al actualizar denuncia');
        return await response.json();
    },

    // Eliminar denuncia
    deleteDenuncia: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/denuncias/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Error al eliminar denuncia');
    },

    // Cancelar denuncia
    cancelarDenuncia: async (id: number, motivo: string, comentarios?: string): Promise<void> => {
        const response = await fetch(`${API_URL}/denuncias/${id}/cancelar`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ motivo, comentarios }),
        });
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('No estás autenticado. Por favor, inicia sesión.');
            }
            throw new Error('Error al cancelar denuncia');
        }
    },
};

