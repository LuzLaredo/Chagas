export interface Vivienda {
  vivienda_id: number;
  numero_vivienda: string;
  jefe_familia: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  foto_entrada: string | null;
  comunidad_id: number | null;
  nombre_comunidad: string;
  nombre_municipio: string;
}

export interface Servicio {
  servicio_id: number;
  vivienda_id: number;
  tipo_servicio: string;
  fecha_solicitud: string;
  fecha_programacion: string | null;
  fecha_ejecucion: string | null;
  estado: string;
  observaciones: string | null;
  usuario_id: number;
}