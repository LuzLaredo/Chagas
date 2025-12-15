import { Denuncia, CreateDenunciaRequest, UpdateDenunciaRequest } from '../types/denuncias';
import { baseUrl } from "../api/BaseUrl";
 
const API_URL = `${baseUrl}/api`;
 
// -------------------------------------------
// 🔐 Obtener encabezados con token
// -------------------------------------------
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        'Content-Type': 'application/json'
    };
};
 
// -------------------------------------------
// 📌 SERVICIO DE DENUNCIAS - COMPLETO
// -------------------------------------------
export const denunciasService = {
 
    // ----------------------------------------------------
    // 🟩 1. Obtener TODAS las denuncias (PARA EL MAPA)
    // ----------------------------------------------------
    getDenuncias: async (): Promise<Denuncia[]> => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("Token no encontrado. Inicia sesión.");
            }
 
            const response = await fetch(`${API_URL}/denuncias`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
 
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
 
            return await response.json();
        } catch (error) {
            console.error("❌ Error al obtener denuncias:", error);
            throw error;
        }
    },
 
    // ----------------------------------------------------
    // 🟦 2. Obtener denuncias del usuario actual
    // ----------------------------------------------------
    getDenunciasByUser: async (): Promise<Denuncia[]> => {
      try {
        const token = localStorage.getItem('token');
        console.log('🔐 Token encontrado:', token ? 'Sí' : 'No');
       
        if (!token) {
          throw new Error('No estás autenticado. Inicia sesión.');
        }
 
        const response = await fetch(`${API_URL}/denuncias?mine=true`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
 
        console.log('📡 Response status:', response.status);
       
        if (response.status === 401) {
          // Token expirado o inválido
          localStorage.removeItem('token');
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
 
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
 
        const data = await response.json();
        console.log('📦 Denuncias recibidas:', data);
        return data;
       
      } catch (error) {
        console.error("❌ Error al traer denuncias del usuario:", error);
        throw error;
      }
    },
 
    // ----------------------------------------------------
    // 🟨 3. Obtener una denuncia por ID - MODIFICADO
    // ----------------------------------------------------
    getDenunciaById: async (id: number): Promise<Denuncia> => {
        try {
            const token = localStorage.getItem('token');
            const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
            
            // Roles que pueden ver cualquier denuncia
            const rolesConAccesoTotal = ['jefe_grupo', 'administrador', 'tecnico'];
            
            let headers = {};
            
            // Si el usuario está autenticado y tiene rol especial, usar token
            if (token && userInfo.rol && rolesConAccesoTotal.includes(userInfo.rol)) {
                console.log(`🎯 Usuario ${userInfo.rol} accediendo a denuncia ${id} con autenticación`);
                headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
            } else {
                console.log(`👤 Acceso público a denuncia ${id}`);
                headers = {
                    'Content-Type': 'application/json'
                };
            }
 
            const response = await fetch(`${API_URL}/denuncias/${id}`, {
                method: 'GET',
                headers: headers
            });
 
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
 
            return await response.json();
        } catch (error) {
            console.error("❌ Error al obtener denuncia por ID:", error);
            throw error;
        }
    },
 
    // ----------------------------------------------------
    // 🟧 4. Crear denuncia (acepta JSON o FormData)
    // ----------------------------------------------------
    createDenuncia: async (denuncia: CreateDenunciaRequest | FormData): Promise<Denuncia> => {
        try {
            const token = localStorage.getItem('token');
 
            const headers: Record<string, string> = {
                ...(token && { 'Authorization': `Bearer ${token}` })
            };
 
            // Si NO es FormData → agregar Content-Type JSON
            if (!(denuncia instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
            }
 
            const response = await fetch(`${API_URL}/denuncias`, {
                method: 'POST',
                headers,
                body: denuncia instanceof FormData ? denuncia : JSON.stringify(denuncia)
            });
 
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Error al crear denuncia');
            }
 
            return await response.json();
 
        } catch (error) {
            console.error("❌ Error al crear denuncia:", error);
            throw error;
        }
    },
 
    // ----------------------------------------------------
    // 🟥 5. Actualizar denuncia
    // ----------------------------------------------------
    updateDenuncia: async (denuncia: UpdateDenunciaRequest): Promise<Denuncia> => {
        try {
            const response = await fetch(`${API_URL}/denuncias/${denuncia.denuncia_id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(denuncia)
            });
 
            if (!response.ok) {
                throw new Error('Error al actualizar denuncia');
            }
 
            return await response.json();
        } catch (error) {
            console.error("❌ Error al actualizar denuncia:", error);
            throw error;
        }
    },
 
    // ----------------------------------------------------
    // 🗑️ 6. Eliminar denuncia
    // ----------------------------------------------------
    deleteDenuncia: async (id: number): Promise<void> => {
        try {
            const response = await fetch(`${API_URL}/denuncias/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
 
            if (!response.ok) {
                throw new Error('Error al eliminar denuncia');
            }
        } catch (error) {
            console.error("❌ Error al eliminar denuncia:", error);
            throw error;
        }
    },
 
    // ----------------------------------------------------
    // ❌ 7. Cancelar denuncia
    // ----------------------------------------------------
    cancelarDenuncia: async (id: number, motivo: string, comentarios?: string): Promise<void> => {
        try {
            const response = await fetch(`${API_URL}/denuncias/${id}/cancelar`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ motivo, comentarios })
            });
 
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Sesión expirada. Inicia sesión nuevamente.");
                }
                throw new Error('Error al cancelar denuncia');
            }
 
        } catch (error) {
            console.error("❌ Error al cancelar denuncia:", error);
            throw error;
        }
    }
};