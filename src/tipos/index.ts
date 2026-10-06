export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface Foto {
  id: string;
  url: string; 
  momento: 'problema' | 'arreglo';
}

export type EstadoReporte =
  | 'recibido'
  | 'en_revision'
  | 'asignado'
  | 'resuelto'
  | 'rechazado';

export interface Reporte {
  id: string;
  codigo: string;
  tipoId: string;
  descripcion: string | null;
  audioUrl: string | null;
  fotos: Foto[];
  coordenadas: Coordenadas;
  direccion: string;
  zonaId: string;
  estado: EstadoReporte;
  autorId: string;
  cuadrillaId: string | null;
  duplicadoDe: string | null;
  adhesiones: number;
  creadoEn: string; 
  sincronizado: boolean;
}

export interface TipoDeReporte {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  areaResponsable: string;
}

export interface CambioDeEstado {
  id: string;
  reporteId: string;
  estado: EstadoReporte;
  comentario: string | null;
  operadorId: string | null;
  creadoEn: string;
}

export type RolUsuario = 'vecino' | 'operador';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
}

export interface Zona {
  id: string;
  nombre: string;
  limites: Coordenadas[];
}

export interface Cuadrilla {
  id: string;
  nombre: string;
  areaResponsable: string;
}