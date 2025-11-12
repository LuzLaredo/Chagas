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

export interface EstadisticasGenerales {
    viviendasRegistradas: number;
    habitantesProtegidos: number;
    viviendasEvaluadas: number;
    viviendasPositivas: number;
    tasaInfestacion: number;
    ejemplaresCapturados: number;
    ejemplaresIntra: number;
    ejemplaresPeri: number;
    viviendasRociadas: number;
    coberturaRociado: number;
    totalInsecticida: number;
    habitacionesNoRociadas: number;
}

export interface DistribucionViviendas {
    label: string;
    value: number;
    color: string;
}

export interface TopComunidad {
    nombre: string;
    valor: number;
}

export interface CostoModelo {
    modelo: string;
    costo: number;
}

export interface EstadisticasCompletas {
    generales: EstadisticasGenerales;
    distribucionViviendas: DistribucionViviendas[];
    habitacionesNoRociadas: number;
    topComunidades: TopComunidad[];
    costosModelos: CostoModelo[];
}

export const estadisticasService = {
    // Obtener estadísticas generales
    getEstadisticasGenerales: async (): Promise<EstadisticasGenerales> => {
        try {
            const response = await fetch(`${API_URL}/estadisticas/generales`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener estadísticas generales:', error);
            throw error;
        }
    },

    // Obtener distribución de viviendas
    getDistribucionViviendas: async (): Promise<DistribucionViviendas[]> => {
        try {
            const response = await fetch(`${API_URL}/estadisticas/distribucion-viviendas`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener distribución de viviendas:', error);
            throw error;
        }
    },

    // Obtener top comunidades
    getTopComunidades: async (): Promise<TopComunidad[]> => {
        try {
            const response = await fetch(`${API_URL}/estadisticas/top-comunidades`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener top comunidades:', error);
            throw error;
        }
    },

    // Obtener costos por modelos
    getCostosModelos: async (): Promise<CostoModelo[]> => {
        try {
            const response = await fetch(`${API_URL}/estadisticas/costos-modelos`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener costos por modelos:', error);
            throw error;
        }
    },

    // Obtener todas las estadísticas
    getAllEstadisticas: async (): Promise<EstadisticasCompletas> => {
        try {
            const response = await fetch(`${API_URL}/estadisticas/all`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener todas las estadísticas:', error);
            throw error;
        }
    },

    // Obtener estadísticas por rango de fechas
    getEstadisticasPorFechas: async (fechaInicio: string, fechaFin: string): Promise<EstadisticasCompletas> => {
        try {
            const response = await fetch(`${API_URL}/estadisticas/por-fechas?inicio=${fechaInicio}&fin=${fechaFin}`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener estadísticas por fechas:', error);
            throw error;
        }
    },

    // Obtener estadísticas por municipio
    getEstadisticasPorMunicipio: async (municipioId: string | number): Promise<EstadisticasCompletas> => {
        try {
            const response = await fetch(`${API_URL}/estadisticas/por-municipio/${municipioId}`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener estadísticas por municipio:', error);
            throw error;
        }
    },

    // Obtener estadísticas por fechas y municipio
    getEstadisticasPorFechasYMunicipio: async (fechaInicio: string, fechaFin: string, municipioId: string | number): Promise<EstadisticasCompletas> => {
        try {
            const response = await fetch(`${API_URL}/estadisticas/por-fechas-municipio?inicio=${fechaInicio}&fin=${fechaFin}&municipio=${municipioId}`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener estadísticas por fechas y municipio:', error);
            throw error;
        }
    },

    // Obtener evolución temporal
    getEvolucionTemporal: async (fechaInicio: string, fechaFin: string, municipioId?: number): Promise<any[]> => {
        try {
            const municipioParam = municipioId ? `&municipio=${municipioId}` : '';
            const response = await fetch(`${API_URL}/estadisticas/evolucion-temporal?inicio=${fechaInicio}&fin=${fechaFin}${municipioParam}`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener evolución temporal:', error);
            throw error;
        }
    },

    // Obtener eficacia de rociado
    getEficaciaRociado: async (fechaInicio: string, fechaFin: string, municipioId?: number): Promise<any[]> => {
        try {
            const municipioParam = municipioId ? `&municipio=${municipioId}` : '';
            const response = await fetch(`${API_URL}/estadisticas/eficacia-rociado?inicio=${fechaInicio}&fin=${fechaFin}${municipioParam}`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener eficacia de rociado:', error);
            throw error;
        }
    },

    // Obtener distribución de ejemplares
    getDistribucionEjemplares: async (fechaInicio: string, fechaFin: string, municipioId?: number): Promise<any[]> => {
        try {
            const municipioParam = municipioId ? `&municipio=${municipioId}` : '';
            const response = await fetch(`${API_URL}/estadisticas/distribucion-ejemplares?inicio=${fechaInicio}&fin=${fechaFin}${municipioParam}`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener distribución de ejemplares:', error);
            throw error;
        }
    },

    // Obtener métricas de progreso
    getMetricasProgreso: async (fechaInicio: string, fechaFin: string, municipioId?: number): Promise<any[]> => {
        try {
            const municipioParam = municipioId ? `&municipio=${municipioId}` : '';
            const response = await fetch(`${API_URL}/estadisticas/metricas-progreso?inicio=${fechaInicio}&fin=${fechaFin}${municipioParam}`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener métricas de progreso:', error);
            throw error;
        }
    },

    // Obtener comparación entre períodos
    getComparacionFechas: async (fechaInicio: string, fechaFin: string, municipioId?: number): Promise<any[]> => {
        try {
            const municipioParam = municipioId ? `&municipio=${municipioId}` : '';
            const response = await fetch(`${API_URL}/estadisticas/comparacion-fechas?inicio=${fechaInicio}&fin=${fechaFin}${municipioParam}`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener comparación de fechas:', error);
            throw error;
        }
    },

    // Obtener lista de municipios
    getMunicipios: async (): Promise<any[]> => {
        try {
            console.log('🔄 Solicitando municipios desde:', `${API_URL}/estadisticas/municipios`);
            const response = await fetch(`${API_URL}/estadisticas/municipios`);
            console.log('📡 Respuesta del servidor:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ Municipios recibidos:', data);
            return data;
        } catch (error) {
            console.error('❌ Error al obtener municipios:', error);
            throw error;
        }
    },

    // Obtener estadísticas de denuncias por estado
    getEstadisticasDenuncias: async (fechaInicio: string, fechaFin: string, municipioId?: number): Promise<any[]> => {
        try {
            const municipioParam = municipioId ? `&municipio=${municipioId}` : '';
            const response = await fetch(`${API_URL}/estadisticas/estadisticas-denuncias?inicio=${fechaInicio}&fin=${fechaFin}${municipioParam}`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener estadísticas de denuncias:', error);
            throw error;
        }
    },

  // Obtener eficiencia del rociado
  getEficienciaRociado: async (fechaInicio: string, fechaFin: string, municipioId?: number): Promise<any[]> => {
    try {
      const municipioParam = municipioId ? `&municipio=${municipioId}` : '';
      const response = await fetch(`${API_URL}/estadisticas/eficiencia-rociado?inicio=${fechaInicio}&fin=${fechaFin}${municipioParam}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener eficiencia de rociado:', error);
      throw error;
    }
  },

  // Nuevas métricas avanzadas
  getAnalisisTemporal: async (fechaInicio: string, fechaFin: string, municipioId?: number): Promise<any[]> => {
    try {
      const municipioParam = municipioId ? `&municipio=${municipioId}` : '';
      const response = await fetch(`${API_URL}/estadisticas/analisis-temporal?inicio=${fechaInicio}&fin=${fechaFin}${municipioParam}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener análisis temporal:', error);
      throw error;
    }
  },

  getDistribucionGeografica: async (fechaInicio: string, fechaFin: string, municipioId?: number): Promise<any[]> => {
    try {
      const municipioParam = municipioId ? `&municipio=${municipioId}` : '';
      const response = await fetch(`${API_URL}/estadisticas/distribucion-geografica?inicio=${fechaInicio}&fin=${fechaFin}${municipioParam}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener distribución geográfica:', error);
      throw error;
    }
  },

  getAnalisisEjemplares: async (fechaInicio: string, fechaFin: string, municipioId?: number): Promise<any[]> => {
    try {
      const municipioParam = municipioId ? `&municipio=${municipioId}` : '';
      const response = await fetch(`${API_URL}/estadisticas/analisis-ejemplares?inicio=${fechaInicio}&fin=${fechaFin}${municipioParam}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener análisis de ejemplares:', error);
      throw error;
    }
  },

  getIndicadoresRendimiento: async (fechaInicio: string, fechaFin: string, municipioId?: number): Promise<any[]> => {
    try {
      const municipioParam = municipioId ? `&municipio=${municipioId}` : '';
      const response = await fetch(`${API_URL}/estadisticas/indicadores-rendimiento?inicio=${fechaInicio}&fin=${fechaFin}${municipioParam}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener indicadores de rendimiento:', error);
      throw error;
    }
  }
};
