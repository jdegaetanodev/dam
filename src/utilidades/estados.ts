// Texto y color de cada estado de un reporte.
// Lo usan la bandeja y el detalle del operador para mostrar el estado de la misma forma.

import { EstadoReporte } from '../tipos';

/** Los nombres de los estados son los que estan en el PRD */
export const ETIQUETAS_ESTADO: Record<EstadoReporte, string> = {
  recibido: 'Recibido',
  en_revision: 'En revisión',
  asignado: 'Asignado a cuadrilla',
  resuelto: 'Resuelto',
  rechazado: 'Rechazado',
};

// Color de fondo de cada estado.
export const COLORES_ESTADO: Record<EstadoReporte, string> = {
  recibido: '#2563EB',
  en_revision: '#B45309',
  asignado: '#7C3AED',
  resuelto: '#15803D',
  rechazado: '#DC2626',
};