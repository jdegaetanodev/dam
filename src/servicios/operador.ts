// Servicio del operador: bandeja y acciones sobre un reporte, contra la API.
// Los errores llegan como ApiError (de api.ts), con `codigo` y un `message` para mostrar.
// El detalle y el historial de un reporte están en `reportes.ts`.

import { Cuadrilla, EstadoReporte, Reporte, Zona } from '../tipos';
import { api } from './api';
import { subirArchivo } from './reportes';

// Estados que muestra la bandeja: los que todavía se están trabajando.
export type EstadoAbierto = 'recibido' | 'en_revision' | 'asignado';
export const ESTADOS_ABIERTOS: EstadoAbierto[] = ['recibido', 'en_revision', 'asignado'];

// Valor de zonaId para ver los reportes de todas las zonas.
export const ZONA_TODAS = 'todas';

export interface FiltrosBandeja {
  estado: EstadoAbierto | null; // null = todos los estados abiertos
  tipoId: string | null; // null = todos los tipos
  zonaId: string; // una zona o ZONA_TODAS
}

// Consultas

// Reportes abiertos: los más apoyados primero y, a igualdad, el más viejo.
export const obtenerBandeja = async (filtros: FiltrosBandeja): Promise<Reporte[]> => {
  let ruta = `/bandeja?zonaId=${filtros.zonaId}&porPagina=100`;
  if (filtros.estado) ruta += `&estado=${filtros.estado}`;
  if (filtros.tipoId) ruta += `&tipoId=${filtros.tipoId}`;
  return api.get<Reporte[]>(ruta);
};

// Busca un reporte por su número de seguimiento (lo que contiene el QR).
export const obtenerReportePorCodigo = async (codigo: string): Promise<Reporte> =>
  api.get<Reporte>(`/reportes/codigo/${codigo}`);

export const obtenerZonas = async (): Promise<Zona[]> => api.get<Zona[]>('/zonas');

// Cuadrillas activas de una zona, para asignar un reporte de esa zona.
export const obtenerCuadrillas = async (zonaId: string): Promise<Cuadrilla[]> =>
  api.get<Cuadrilla[]>(`/cuadrillas?zonaId=${zonaId}&activa=true`);

// Acciones del operador (cada una devuelve el reporte actualizado)

// Pasa el reporte a otro estado. Se exige comentario para rechazar.
export const cambiarEstado = async (
  reporteId: string,
  estado: EstadoReporte,
  comentario: string | null
): Promise<Reporte> => api.patch<Reporte>(`/reportes/${reporteId}/estado`, { estado, comentario });

// Asigna o reasigna una cuadrilla activa de la zona del reporte; queda "asignado".
export const asignarCuadrilla = async (
  reporteId: string,
  cuadrillaId: string,
  comentario: string | null
): Promise<Reporte> =>
  api.patch<Reporte>(`/reportes/${reporteId}/cuadrilla`, { cuadrillaId, comentario });

// Marca un reporte como duplicado de otro: queda rechazado y su autor se suma al original.
export const marcarDuplicado = async (reporteId: string, originalId: string): Promise<Reporte> =>
  api.post<Reporte>(`/reportes/${reporteId}/duplicado`, { originalId });

// Foto del arreglo: primero se sube la imagen y después se agrega al reporte.
export const agregarFotoDelArreglo = async (reporteId: string, uriLocal: string): Promise<Reporte> => {
  const url = await subirArchivo(uriLocal);
  return api.post<Reporte>(`/reportes/${reporteId}/fotos`, { url });
};