// C:\PS3-CHAGAS\Chagas\src\types\mapTypes.ts

export interface Municipio {
    municipio_id: number;
    nombre_municipio: string;
    coordenadas: string;
    departamento: string;
    fecha_creacion?: string; 
    fecha_modificacion?: string;
}

export interface EE1MapPoint {
    id: number;
    latitud: string;
    longitud: string;
    altura: string;
    fecha_programada: string | null;
    hora_programada: string | null;
    resultado: 'positivo' | 'negativo'; 
    nombre_municipio: string;
    nombre_comunidad: string;
    fecha_rociado: string | null;
    estado_rociado: 'Rociado Realizado' | 'Pendiente de Rociado' | 'No Requiere Rociado';
}

export interface GeneralMapPoint {
    id: number;
    latitud: string;
    longitud: string;
    altura: string;
    fecha_registro: string | null;
    tipo_registro: 'evaluacion_entomologica' | 'denuncia'; 
    estado_resultado: 'positivo' | 'negativo' | 'programada' | 'recibida' | 'realizada';
    nombre_municipio: string;
    nombre_comunidad: string;
    rociado: 'Sí' | 'No' | null; 
}