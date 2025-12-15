// ===========================================================
// 📁 src/services/notificacionesService.ts - CORREGIDO
// ===========================================================

// Define la interfaz para los datos de la notificación recibidos del backend
export interface Notificacion {
    notificacion_id: number;
    usuario_receptor_id: number;
    tipo_entidad_origen: string;
    id_entidad_origen: string; // Asumimos que es el número de vivienda (VARCHAR)
    mensaje: string;
    leida: 0 | 1; // tinyint(1) en SQL se mapea a 0 o 1
    ruta_destino: string | null;
    fecha_creacion: string; // ISO Date string
}

// URL base para las notificaciones
const API_URL: string = "http://localhost:5000/api/notificaciones"; 

// Función auxiliar para obtener el token de autenticación
const getAuthToken = (): string | null => {
    // ⚠️ ATENCIÓN: Debes reemplazar esta línea con el método exacto
    // que uses en tu proyecto (ej: useContext, Redux, o simplemente localStorage)
    return localStorage.getItem('token'); 
};

/**
 * 1. Obtiene la lista de notificaciones del usuario autenticado (API: GET /api/notificaciones).
 * @returns {Promise<Notificacion[]>} Lista de objetos de notificación.
 */
const listarMisNotificaciones = async (): Promise<Notificacion[]> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error("401: Usuario no autenticado. Token no encontrado.");
    }

    const response = await fetch(`${API_URL}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al listar notificaciones' }));
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
    }

    // Castear la respuesta a Notificacion[]
    return response.json() as Promise<Notificacion[]>;
};

/**
 * 2. Obtiene notificaciones recientes para el NavBar (API: GET /api/notificaciones/recientes).
 * @returns {Promise<Notificacion[]>} Lista de notificaciones recientes.
 */
const obtenerRecientes = async (): Promise<Notificacion[]> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error("401: Usuario no autenticado. Token no encontrado.");
    }

    const response = await fetch(`${API_URL}/recientes`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al obtener notificaciones recientes' }));
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
    }

    return response.json() as Promise<Notificacion[]>;
};

/**
 * 3. Obtiene el conteo de notificaciones no leídas (API: GET /api/notificaciones/conteo).
 * @returns {Promise<number>} Número de notificaciones no leídas.
 */
const obtenerConteoNoLeidas = async (): Promise<number> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error("401: Usuario no autenticado. Token no encontrado.");
    }

    const response = await fetch(`${API_URL}/conteo`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al obtener conteo' }));
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    return data.count || 0;
};

/**
 * 4. Marca una notificación específica como leída (API: PUT /api/notificaciones/:id/leer).
 * @param {number} notificacionId - ID de la notificación a marcar como leída.
 * @returns {Promise<any>} Respuesta del servidor.
 */
const marcarComoLeida = async (notificacionId: number): Promise<any> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error("401: Usuario no autenticado. Token no encontrado.");
    }

    const response = await fetch(`${API_URL}/${notificacionId}/leer`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al marcar como leída' }));
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
    }
    
    return response.json();
};

/**
 * 5. Marca TODAS las notificaciones del usuario como leídas (API: PUT /api/notificaciones/marcar-todas).
 * @returns {Promise<any>} Respuesta del servidor.
 */
const marcarTodasComoLeidas = async (): Promise<any> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error("401: Usuario no autenticado. Token no encontrado.");
    }

    const response = await fetch(`${API_URL}/marcar-todas`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al marcar todas como leídas' }));
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
    }
    
    return response.json();
};

// Exportar el objeto de servicio completo
export const notificacionesService = {
    listarMisNotificaciones,
    obtenerRecientes,
    obtenerConteoNoLeidas,
    marcarComoLeida,
    marcarTodasComoLeidas,
};