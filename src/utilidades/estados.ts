// Texto, color y cambios permitidos de cada estado de un reporte.
// Lo usan las pantallas del operador y el servicio `operador.ts`.
import { EstadoReporte } from '../tipos';

/** Nombres de los estados como el PRD. */
export const ETIQUETAS_ESTADO: Record<EstadoReporte, string> = {
  recibido: 'Recibido',
  en_revision: 'En revisión',
  asignado: 'Asignado a cuadrilla',
  resuelto: 'Resuelto',
  rechazado: 'Rechazado',
};

//Color de fondo de cada estado
export const COLORES_ESTADO: Record<EstadoReporte, string> = {
  recibido: '#2563EB',
  en_revision: '#B45309',
  asignado: '#7C3AED',
  resuelto: '#15803D',
  rechazado: '#DC2626',
};

// A qué estados puede pasar un reporte con "cambiar estado"
//Asignar una cuadrilla es una acción aparte. Resuelto y rechazado son finales
export const ESTADOS_SIGUIENTES: Record<EstadoReporte, EstadoReporte[]> = {
  recibido: ['en_revision', 'rechazado'],
  en_revision: ['rechazado'],
  asignado: ['resuelto', 'en_revision', 'rechazado'],
  resuelto: [],
  rechazado: [],
};