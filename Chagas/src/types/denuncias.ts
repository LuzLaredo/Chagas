export interface Denuncia {
  denuncia_id: number;
  usuario_id?: number;
  vivienda_id?: number;
  descripcion: string;
  fotos_vinchucas?: string;
  fecha_denuncia: string;
  latitud?: number;
  longitud?: number;
  altura?: number;
  estado_denuncia: 'recibida' | 'programada' | 'realizada' | 'cancelada';
  id_motivo_cancelacion?: number;
  fecha_programacion?: string;
  fecha_ejecucion?: string;
  fecha_creacion: string;
  fecha_modificacion: string;
  // Campos de relaciones
  nombre_usuario?: string;
  correo_electronico?: string;
  numero_vivienda?: string;
  jefe_familia?: string;
  direccion?: string;
  nombre_comunidad?: string;
  nombre_municipio?: string;
}

export interface CreateDenunciaRequest {
  vivienda_id?: number;
  descripcion: string;
  fotos_vinchucas?: string;
  fecha_denuncia?: string;
  latitud?: number;
  longitud?: number;
  altura?: number;
  estado_denuncia?: 'recibida' | 'programada' | 'realizada' | 'cancelada';
  fecha_programacion?: string;
  fecha_ejecucion?: string;
}

export interface UpdateDenunciaRequest {
  denuncia_id: number;
  descripcion?: string;
  fotos_vinchucas?: string;
  estado_denuncia?: 'recibida' | 'programada' | 'realizada' | 'cancelada';
  fecha_programacion?: string;
  fecha_ejecucion?: string;
  latitud?: number;
  longitud?: number;
  altura?: number;
}

