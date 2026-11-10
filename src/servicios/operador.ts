// Servicio del operador: bandeja y acciones sobre un reporte.
// Por ahora usa los mocks. Al conectar la API se cambia el interior de cada función
// El detalle y el historial de un reporte están en `reportes.ts`.

import { Cuadrilla, EstadoReporte, Reporte, Zona } from '../tipos';
import { MOCK_CAMBIOS_ESTADO, MOCK_CUADRILLAS, MOCK_REPORTES } from '../mocks/reportes.mock';
import { MOCK_ZONAS } from '../mocks/zonas.mock';
import { ESTADOS_SIGUIENTES } from '../utilidades/estados';

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

// Error con el mismo formato que la API: un código y un mensaje para mostrar.
export class ErrorDeServicio extends Error {
  codigo: string;

  constructor(codigo: string, mensaje: string) {
    super(mensaje);
    this.codigo = codigo;
  }
}

//Simulación de la API (se borra al conectarla)

// Cambiar a true para probar las pantallas sin conexión
const SIMULAR_ERROR_DE_RED = false;

// La API saca el operador del token. El mock usa el operador de prueba.
const OPERADOR_MOCK_ID = 'usr-003';

// Simula el tiempo que tarda la red.
const demorar = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (SIMULAR_ERROR_DE_RED) {
    throw new ErrorDeServicio('ERROR_DE_RED', 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.');
  }
};

const estaAbierto = (estado: EstadoReporte) => estado !== 'resuelto' && estado !== 'rechazado';

const buscarReporte = (reporteId: string): Reporte => {
  const reporte = MOCK_REPORTES.find((r) => r.id === reporteId);
  if (!reporte) throw new ErrorDeServicio('REPORTE_NO_ENCONTRADO', 'No encontramos ese reporte.');
  return reporte;
};

// Reemplaza el reporte guardado por su versión nueva.
const guardar = (reporte: Reporte) => {
  const indice = MOCK_REPORTES.findIndex((r) => r.id === reporte.id);
  MOCK_REPORTES[indice] = reporte;
};

// Cambia el estado del reporte y lo anota en el historial.
const registrarCambio = (
  reporte: Reporte,
  estado: EstadoReporte,
  comentario: string | null,
  otrosCampos: Partial<Reporte> = {}
): Reporte => {
  const actualizado = { ...reporte, ...otrosCampos, estado };
  guardar(actualizado);

  MOCK_CAMBIOS_ESTADO.push({
    id: `cam-${Date.now()}`,
    reporteId: reporte.id,
    estado,
    comentario,
    operadorId: OPERADOR_MOCK_ID,
    fechaHora: new Date().toISOString(),
  });

  return actualizado;
};

//Consultas

// Reportes abiertos: los más apoyados primero y, a igualdad, el más viejo.
// API: GET /bandeja?estado=&tipoId=&zonaId=
export const obtenerBandeja = async (filtros: FiltrosBandeja): Promise<Reporte[]> => {
  await demorar();

  return MOCK_REPORTES.filter(
    (r) =>
      (filtros.estado ? r.estado === filtros.estado : estaAbierto(r.estado)) &&
      (filtros.tipoId === null || r.tipoId === filtros.tipoId) &&
      (filtros.zonaId === ZONA_TODAS || r.zonaId === filtros.zonaId)
  ).sort(
    (a, b) => b.adhesiones - a.adhesiones || Date.parse(a.creadoEn) - Date.parse(b.creadoEn)
  );
};

// Busca un reporte por su número de seguimiento (lo que contiene el QR).
// API: GET /reportes/codigo/:codigo
export const obtenerReportePorCodigo = async (codigo: string): Promise<Reporte> => {
  await demorar();

  const reporte = MOCK_REPORTES.find((r) => r.codigo === codigo);
  if (!reporte) throw new ErrorDeServicio('REPORTE_NO_ENCONTRADO', 'No encontramos ese reporte.');
  return reporte;
};

// API: GET /zonas
export const obtenerZonas = async (): Promise<Zona[]> => {
  await demorar();
  return MOCK_ZONAS;
};

// Cuadrillas activas de una zona, para asignar un reporte de esa zona.
// API: GET /cuadrillas?zonaId=&activa=true
export const obtenerCuadrillas = async (zonaId: string): Promise<Cuadrilla[]> => {
  await demorar();
  return MOCK_CUADRILLAS.filter((c) => c.zonaId === zonaId && c.activa);
};

//Acciones del operador

// Pasa el reporte a otro estado. Rechazar exige un comentario
// API: PATCH /reportes/:id/estado  { estado, comentario }
export const cambiarEstado = async (
  reporteId: string,
  estado: EstadoReporte,
  comentario: string | null
): Promise<Reporte> => {
  await demorar();
  const reporte = buscarReporte(reporteId);

  if (!ESTADOS_SIGUIENTES[reporte.estado].includes(estado)) {
    throw new ErrorDeServicio('TRANSICION_INVALIDA', 'Ese cambio de estado no es posible desde el estado actual.');
  }

  // Un comentario vacío o con solo espacios cuenta como que no hay comentario.
  const texto = comentario?.trim() || null;
  if (estado === 'rechazado' && texto === null) {
    throw new ErrorDeServicio('MOTIVO_REQUERIDO', 'Contá por qué se rechaza el reporte.');
  }

  return registrarCambio(reporte, estado, texto);
};

// Asigna o reasigna una cuadrilla activa de la zona del reporte
// API: PATCH /reportes/:id/cuadrilla  { cuadrillaId, comentario }
export const asignarCuadrilla = async (
  reporteId: string,
  cuadrillaId: string,
  comentario: string | null
): Promise<Reporte> => {
  await demorar();
  const reporte = buscarReporte(reporteId);

  if (!cuadrillaId) throw new ErrorDeServicio('CUADRILLA_REQUERIDA', 'Para asignar, elegí una cuadrilla.');
  if (reporte.estado !== 'en_revision' && reporte.estado !== 'asignado') {
    throw new ErrorDeServicio('TRANSICION_INVALIDA', 'Ese cambio de estado no es posible desde el estado actual.');
  }

  const cuadrilla = MOCK_CUADRILLAS.find((c) => c.id === cuadrillaId);
  if (!cuadrilla) throw new ErrorDeServicio('CUADRILLA_NO_ENCONTRADA', 'No existe esa cuadrilla.');
  if (!cuadrilla.activa) throw new ErrorDeServicio('CUADRILLA_INACTIVA', 'Esa cuadrilla no está activa.');
  if (cuadrilla.zonaId !== reporte.zonaId) {
    throw new ErrorDeServicio('CUADRILLA_DE_OTRA_ZONA', 'Esa cuadrilla trabaja en otra zona.');
  }

  return registrarCambio(reporte, 'asignado', comentario?.trim() || null, { cuadrillaId });
};

// Marca un reporte como duplicado de otro: queda rechazado y su autor se suma al original
// API: POST /reportes/:id/duplicado  { originalId }
export const marcarDuplicado = async (
  reporteId: string,
  originalId: string
): Promise<Reporte> => {
  await demorar();
  const duplicado = buscarReporte(reporteId);
  const original = MOCK_REPORTES.find((r) => r.id === originalId);

  // El original tiene que ser otro reporte, estar abierto y no ser a su vez un duplicado.
  if (
    !original ||
    original.id === duplicado.id ||
    !estaAbierto(original.estado) ||
    original.duplicadoDe !== null
  ) {
    throw new ErrorDeServicio('DUPLICADO_INVALIDO', 'No se puede marcar como duplicado de ese reporte.');
  }
  if (!ESTADOS_SIGUIENTES[duplicado.estado].includes('rechazado')) {
    throw new ErrorDeServicio('TRANSICION_INVALIDA', 'Ese cambio de estado no es posible desde el estado actual.');
  }

  // El autor del duplicado se suma al original, si no es el mismo vecino.
  if (duplicado.autorId !== original.autorId) {
    guardar({ ...original, adhesiones: original.adhesiones + 1 });
  }

  return registrarCambio(duplicado, 'rechazado', `Duplicado de ${original.codigo}`, {
    duplicadoDe: original.id,
  });
};

// Agrega una foto del arreglo: hasta tres, con el reporte asignado o resuelto
// API: primero POST /archivos (sube la imagen y devuelve su url),
//      después POST /reportes/:id/fotos  { url }
export const agregarFotoDelArreglo = async (
  reporteId: string,
  url: string
): Promise<Reporte> => {
  await demorar();
  const reporte = buscarReporte(reporteId);

  if (reporte.estado !== 'asignado' && reporte.estado !== 'resuelto') {
    throw new ErrorDeServicio(
      'ESTADO_NO_ADMITE_FOTO',
      'La foto del arreglo se sube cuando el reporte está asignado o resuelto.'
    );
  }

  const fotosDelArreglo = reporte.fotos.filter((f) => f.momento === 'arreglo');
  if (fotosDelArreglo.length >= 3) {
    throw new ErrorDeServicio('VALIDACION_FALLIDA', 'Se pueden subir hasta tres fotos del arreglo.');
  }

  const actualizado: Reporte = {
    ...reporte,
    fotos: [...reporte.fotos, { id: `fot-${Date.now()}`, url, momento: 'arreglo' }],
  };
  guardar(actualizado);
  return actualizado;
};