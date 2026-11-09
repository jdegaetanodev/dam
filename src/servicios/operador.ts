// Servicio del operador municipal: bandeja y acciones sobre un reporte.
//
// Por ahora simula la API con los mocks (todavía no hay cliente HTTP ni login real).
// Cada función indica el endpoint que la va a reemplazar. Cuando se conecte la API,
// se cambia el INTERIOR de cada función, no su firma: las pantallas no se enteran.
//
// El detalle y el historial de un reporte ya existen en `reportes.ts`
// (`obtenerReportePorId` y `obtenerHistorialEstados`): no se repiten acá.

import { CambioDeEstado, Cuadrilla, EstadoReporte, Reporte, Zona } from '../tipos';
import {
  MOCK_CAMBIOS_ESTADO,
  MOCK_CUADRILLAS,
  MOCK_REPORTES,
} from '../mocks/reportes.mock';
import { MOCK_ZONAS } from '../mocks/zonas.mock';

// ─── Tipos que usan las pantallas ────────────────────────────────────────────

/** Los estados que muestra la bandeja: los que todavía se están trabajando. */
export type EstadoAbierto = 'recibido' | 'en_revision' | 'asignado';

/** Valor de `zonaId` para ver los reportes de todas las zonas. */
export const ZONA_TODAS = 'todas';

export interface FiltrosBandeja {
  estado: EstadoAbierto | null; // null = los tres estados abiertos
  tipoId: string | null; // null = todos los tipos
  zonaId: string; // id de una zona o ZONA_TODAS
}

/**
 * Error con el mismo formato que la API: `{ codigo, mensaje }`.
 * La pantalla muestra `message` tal cual y decide qué hacer mirando `codigo`.
 */
export class ErrorDeServicio extends Error {
  readonly codigo: string;

  constructor(codigo: string, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorDeServicio';
    this.codigo = codigo;
    // Asegura que `error instanceof ErrorDeServicio` funcione al extender Error.
    Object.setPrototypeOf(this, ErrorDeServicio.prototype);
  }
}

// ─── Simulación del servidor (se borra al conectar la API) ───────────────────
// Reglas tomadas del README y de docs/SPECIFICATION.md (R11 a R15) de la API.

/** Mensajes copiados del catálogo de errores del README de la API. */
const MENSAJES = {
  REPORTE_NO_ENCONTRADO: 'No encontramos ese reporte.',
  TRANSICION_INVALIDA: 'Ese cambio de estado no es posible desde el estado actual.',
  MOTIVO_REQUERIDO: 'Contá por qué se rechaza el reporte.',
  CUADRILLA_REQUERIDA: 'Para asignar, elegí una cuadrilla.',
  CUADRILLA_NO_ENCONTRADA: 'No existe esa cuadrilla.',
  CUADRILLA_INACTIVA: 'Esa cuadrilla no está activa.',
  CUADRILLA_DE_OTRA_ZONA: 'Esa cuadrilla trabaja en otra zona.',
  DUPLICADO_INVALIDO: 'No se puede marcar como duplicado de ese reporte.',
  ESTADO_NO_ADMITE_FOTO:
    'La foto del arreglo se sube cuando el reporte está asignado o resuelto.',
} as const;

type CodigoSimulado = keyof typeof MENSAJES;

/** Lanza el error de la API. Al devolver `never`, TypeScript sabe que el código no sigue. */
function fallar(codigo: CodigoSimulado): never {
  throw new ErrorDeServicio(codigo, MENSAJES[codigo]);
}

/** La API real toma el operador del token. El mock usa el operador de prueba. */
const OPERADOR_MOCK_ID = 'usr-003';

const ESTADOS_ABIERTOS: readonly EstadoReporte[] = ['recibido', 'en_revision', 'asignado'];

/** R11 — Máquina de estados para `PATCH /estado` (`asignado` va por `/cuadrilla`). */
const DESTINOS: Record<EstadoReporte, readonly EstadoReporte[]> = {
  recibido: ['en_revision', 'rechazado'],
  en_revision: ['rechazado'],
  asignado: ['resuelto', 'en_revision', 'rechazado'],
  resuelto: [],
  rechazado: [],
};

/** Cambiar a true para probar cómo responden las pantallas sin conexión (lo pide el PRD). */
const SIMULAR_ERROR_DE_RED = false;

const demorar = async (ms: number = 300): Promise<void> => {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
  if (SIMULAR_ERROR_DE_RED) {
    throw new ErrorDeServicio(
      'ERROR_DE_RED',
      'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.'
    );
  }
};

/** Como la API: un comentario vacío o con solo espacios se guarda como null. */
const limpiarComentario = (comentario: string | null): string | null => {
  const limpio = comentario?.trim() ?? '';
  return limpio === '' ? null : limpio;
};

const indiceDe = (reporteId: string): number => {
  const indice = MOCK_REPORTES.findIndex((r) => r.id === reporteId);
  if (indice === -1) fallar('REPORTE_NO_ENCONTRADO');
  return indice;
};

/** Guarda el cambio en el historial y deja el reporte en su nuevo estado. */
const registrarCambio = (
  indice: number,
  estado: EstadoReporte,
  comentario: string | null,
  otrosCampos: Partial<Reporte> = {}
): Reporte => {
  const reporte = MOCK_REPORTES[indice];

  const cambio: CambioDeEstado = {
    id: `cam-${Date.now()}`,
    reporteId: reporte.id,
    estado,
    comentario,
    operadorId: OPERADOR_MOCK_ID,
    fechaHora: new Date().toISOString(),
  };
  MOCK_CAMBIOS_ESTADO.push(cambio);

  MOCK_REPORTES[indice] = { ...reporte, ...otrosCampos, estado };
  return { ...MOCK_REPORTES[indice] };
};

// ─── Consultas ───────────────────────────────────────────────────────────────

/**
 * Reportes abiertos, los más apoyados primero y, a igualdad, el más viejo.
 * API: GET /bandeja?estado=&tipoId=&zonaId=
 */
export const obtenerBandeja = async (filtros: FiltrosBandeja): Promise<Reporte[]> => {
  await demorar();

  return MOCK_REPORTES.filter(
    (r) =>
      (filtros.estado ? r.estado === filtros.estado : ESTADOS_ABIERTOS.includes(r.estado)) &&
      (filtros.tipoId === null || r.tipoId === filtros.tipoId) &&
      (filtros.zonaId === ZONA_TODAS || r.zonaId === filtros.zonaId)
  )
    .sort(
      (a, b) =>
        b.adhesiones - a.adhesiones || Date.parse(a.creadoEn) - Date.parse(b.creadoEn)
    )
    .map((r) => ({ ...r }));
};

/**
 * Busca un reporte por su número de seguimiento (lo que contiene el QR).
 * API: GET /reportes/codigo/:codigo
 */
export const obtenerReportePorCodigo = async (codigo: string): Promise<Reporte> => {
  await demorar();

  const reporte = MOCK_REPORTES.find((r) => r.codigo === codigo);
  if (!reporte) fallar('REPORTE_NO_ENCONTRADO');

  return { ...reporte };
};

/** API: GET /zonas */
export const obtenerZonas = async (): Promise<Zona[]> => {
  await demorar();
  return [...MOCK_ZONAS];
};

/**
 * Cuadrillas activas de una zona (para asignar un reporte de esa zona).
 * API: GET /cuadrillas?zonaId=&activa=true
 */
export const obtenerCuadrillas = async (zonaId: string): Promise<Cuadrilla[]> => {
  await demorar();
  return MOCK_CUADRILLAS.filter((c) => c.zonaId === zonaId && c.activa);
};

// ─── Acciones del operador ───────────────────────────────────────────────────

/**
 * R11 y R12 — Cambia el estado (en revisión, resuelto o rechazado).
 * Rechazar exige comentario.
 * API: PATCH /reportes/:id/estado  { estado, comentario }
 */
export const cambiarEstado = async (
  reporteId: string,
  estado: EstadoReporte,
  comentario: string | null
): Promise<Reporte> => {
  await demorar();

  const indice = indiceDe(reporteId);
  if (estado === 'asignado') fallar('CUADRILLA_REQUERIDA');
  if (!DESTINOS[MOCK_REPORTES[indice].estado].includes(estado)) {
    fallar('TRANSICION_INVALIDA');
  }

  const limpio = limpiarComentario(comentario);
  if (estado === 'rechazado' && limpio === null) fallar('MOTIVO_REQUERIDO');

  return registrarCambio(indice, estado, limpio);
};

/**
 * R14 — Asigna o reasigna una cuadrilla activa de la zona del reporte.
 * Se puede desde `en_revision` o `asignado`, y lo deja en `asignado`.
 * API: PATCH /reportes/:id/cuadrilla  { cuadrillaId, comentario }
 */
export const asignarCuadrilla = async (
  reporteId: string,
  cuadrillaId: string,
  comentario: string | null
): Promise<Reporte> => {
  await demorar();

  const indice = indiceDe(reporteId);
  const reporte = MOCK_REPORTES[indice];
  if (!cuadrillaId) fallar('CUADRILLA_REQUERIDA');
  if (reporte.estado !== 'en_revision' && reporte.estado !== 'asignado') {
    fallar('TRANSICION_INVALIDA');
  }

  const cuadrilla = MOCK_CUADRILLAS.find((c) => c.id === cuadrillaId);
  if (!cuadrilla) fallar('CUADRILLA_NO_ENCONTRADA');
  if (!cuadrilla.activa) fallar('CUADRILLA_INACTIVA');
  if (cuadrilla.zonaId !== reporte.zonaId) fallar('CUADRILLA_DE_OTRA_ZONA');

  return registrarCambio(indice, 'asignado', limpiarComentario(comentario), { cuadrillaId });
};

/**
 * R13 — Marca un reporte como duplicado de otro: queda rechazado con el comentario
 * "Duplicado de GCHU-…" y su autor se suma al original.
 * No puede ser el mismo reporte, ni un original cerrado o que ya es duplicado.
 * API: POST /reportes/:id/duplicado  { originalId }
 */
export const marcarDuplicado = async (
  reporteId: string,
  originalId: string
): Promise<Reporte> => {
  await demorar();

  const indice = indiceDe(reporteId);
  const indiceOriginal = MOCK_REPORTES.findIndex((r) => r.id === originalId);
  if (reporteId === originalId || indiceOriginal === -1) fallar('DUPLICADO_INVALIDO');

  const duplicado = MOCK_REPORTES[indice];
  const original = MOCK_REPORTES[indiceOriginal];

  if (!DESTINOS[duplicado.estado].includes('rechazado')) fallar('TRANSICION_INVALIDA');
  if (!ESTADOS_ABIERTOS.includes(original.estado) || original.duplicadoDe !== null) {
    fallar('DUPLICADO_INVALIDO');
  }

  // El autor del duplicado se suma al original (si no es el mismo vecino).
  if (duplicado.autorId !== original.autorId) {
    MOCK_REPORTES[indiceOriginal] = { ...original, adhesiones: original.adhesiones + 1 };
  }

  return registrarCambio(indice, 'rechazado', `Duplicado de ${original.codigo}`, {
    duplicadoDe: originalId,
  });
};

/**
 * R15 — Agrega una foto del arreglo: hasta tres, con el reporte asignado o resuelto.
 * API: primero POST /archivos (sube la imagen y devuelve la `url`),
 *      después POST /reportes/:id/fotos  { url }
 * El mock acepta directamente la ruta local de la foto.
 */
export const agregarFotoDelArreglo = async (
  reporteId: string,
  url: string
): Promise<Reporte> => {
  await demorar();

  const indice = indiceDe(reporteId);
  const reporte = MOCK_REPORTES[indice];
  if (reporte.estado !== 'asignado' && reporte.estado !== 'resuelto') {
    fallar('ESTADO_NO_ADMITE_FOTO');
  }

  const delArreglo = reporte.fotos.filter((f) => f.momento === 'arreglo');
  if (delArreglo.length >= 3) {
    throw new ErrorDeServicio(
      'VALIDACION_FALLIDA',
      'Se pueden subir hasta tres fotos del arreglo.'
    );
  }

  MOCK_REPORTES[indice] = {
    ...reporte,
    fotos: [...reporte.fotos, { id: `fot-${Date.now()}`, url, momento: 'arreglo' }],
  };
  return { ...MOCK_REPORTES[indice] };
};