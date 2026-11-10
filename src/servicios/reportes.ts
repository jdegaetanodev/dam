import { Reporte, TipoDeReporte, CambioDeEstado, EstadoReporte } from '@/tipos';
import { File } from 'expo-file-system';
import { MOCK_REPORTES, MOCK_CAMBIOS_ESTADO } from '../mocks/reportes.mock';
import { api } from './api';

// Simulador de demora de red (200 ms)
// (lo siguen usando las funciones que todavía trabajan con mocks)
const demorar = (ms: number = 200) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const USUARIO_ACTUAL_ID = 'usuario-actual';

const ADHESIONES_REALIZADAS = new Set<string>();

// ───────────────────────── Helpers de "Nuevo reporte" ─────────────────────────

const nuevoId = (prefijo: string) =>
  `${prefijo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// Argentina es UTC-3 todo el año → "2026-09-14T10:22:00-03:00"
const ahoraIso = () =>
  new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 19) + '-03:00';

// Sube una foto o un audio a POST /archivos y devuelve la url que guarda la API.
// En Expo el fetch moderno no acepta el viejo { uri, name, type } dentro del FormData:
// hay que pasar un File de expo-file-system (que funciona como Blob).
async function subirArchivo(uri: string): Promise<string> {
  const form = new FormData();
  form.append('archivo', new File(uri));
  const res = await api.subir<{ url: string }>('/archivos', form);
  return res.url;
}

// ───────────────────────── Funciones conectadas a la API ─────────────────────────

export const obtenerTiposDeReporte = async (): Promise<TipoDeReporte[]> =>
  api.get<TipoDeReporte[]>('/tipos-de-reporte');

export const crearReporte = async (
  nuevoReporte: Omit<Reporte, 'id' | 'codigo' | 'creadoEn' | 'adhesiones' | 'sincronizado'>
): Promise<Reporte> => {
  // 1) Primero se suben los archivos: la API devuelve la url definitiva de cada uno
  const fotos = await Promise.all(
    nuevoReporte.fotos.map(async (f) => ({
      id: f.id,
      url: await subirArchivo(f.url),
    }))
  );
  const audioUrl = nuevoReporte.audioUrl
    ? await subirArchivo(nuevoReporte.audioUrl)
    : undefined;

  // 2) Después se crea el reporte. Zona, estado y autor los resuelve la API
  //    (el autor sale del token), por eso no se mandan.
  return api.post<Reporte>('/reportes', {
    id: nuevoId('rep'),
    tipoId: nuevoReporte.tipoId,
    descripcion: nuevoReporte.descripcion || undefined,
    audioUrl,
    fotos,
    coordenadas: nuevoReporte.coordenadas,
    direccion: nuevoReporte.direccion || undefined,
    creadoEn: ahoraIso(),
  });
};

// ───────────────────────── Siguen con mocks (no son de esta pantalla) ─────────────────────────

export const obtenerReportes = async (): Promise<Reporte[]> => {
  await demorar();

  return [...MOCK_REPORTES];
};

export const obtenerReportePorId = async (
  id: string
): Promise<Reporte | null> => {
  await demorar();

  const reporte = MOCK_REPORTES.find(
    (item) => item.id === id
  );

  return reporte ? { ...reporte } : null;
};

export const obtenerHistorialEstados = async (
  reporteId: string
): Promise<CambioDeEstado[]> => {
  await demorar();

  return MOCK_CAMBIOS_ESTADO.filter(
    (cambio) => cambio.reporteId === reporteId
  );
};

export const actualizarEstadoReporte = async (
  reporteId: string,
  nuevoEstado: EstadoReporte,
  comentario: string | null,
  operadorId: string
): Promise<Reporte> => {
  await demorar();

  const index = MOCK_REPORTES.findIndex(
    (r) => r.id === reporteId
  );

  if (index === -1) {
    throw new Error(
      `Reporte con id ${reporteId} no encontrado`
    );
  }

  MOCK_REPORTES[index] = {
    ...MOCK_REPORTES[index],
    estado: nuevoEstado,
  };

  const nuevoCambio: CambioDeEstado = {
    id: `cam-${Date.now()}`,
    reporteId,
    estado: nuevoEstado,
    comentario,
    operadorId,
    fechaHora: new Date().toISOString(),
  };

  MOCK_CAMBIOS_ESTADO.push(nuevoCambio);

  return MOCK_REPORTES[index];
};

export const sumarAdhesion = async (
  reporteId: string
): Promise<Reporte> => {
  await demorar();

  const index = MOCK_REPORTES.findIndex(
    (reporte) => reporte.id === reporteId
  );

  if (index === -1) {
    throw new Error(
      `Reporte con id ${reporteId} no encontrado`
    );
  }

  // Identificador único de la adhesión:
  // un usuario solo puede adherirse una vez al mismo reclamo.
  const claveAdhesion =
    `${USUARIO_ACTUAL_ID}-${reporteId}`;

  if (ADHESIONES_REALIZADAS.has(claveAdhesion)) {
    throw new Error(
      'Ya estás adherido a este reclamo.'
    );
  }

  // Registrar la adhesión
  ADHESIONES_REALIZADAS.add(claveAdhesion);

  // Incrementar contador
  MOCK_REPORTES[index] = {
    ...MOCK_REPORTES[index],
    adhesiones:
      MOCK_REPORTES[index].adhesiones + 1,
  };

  return MOCK_REPORTES[index];
};