import { z } from 'zod';
import { AsyncStorage } from 'expo-sqlite/kv-store';
import { ReporteCercano } from '../utilidades/reportesCercanos';

const PREFIJO_CLAVE = 'revision-duplicado:';

const candidatoSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  tipoId: z.string(),
  descripcion: z.string().nullable(),
  direccion: z.string(),
  estado: z.enum(['recibido', 'en_revision', 'asignado', 'resuelto', 'rechazado']),
  coordenadas: z.object({ latitud: z.number(), longitud: z.number() }),
  distanciaMetros: z.number().nonnegative(),
});

const revisionSchema = z.object({
  candidatos: z.array(candidatoSchema).min(1),
  decision: z.enum(['revisar', 'crear', 'adhesion_confirmada']),
  reporteAdheridoId: z.string().optional(),
});

export type RevisionDuplicado = z.infer<typeof revisionSchema>;

function obtenerClave(autorId: string, reporteId: string): string {
  if (!autorId.trim() || !reporteId.trim()) {
    throw new Error('El identificador del usuario y del reporte son obligatorios.');
  }
  return `${PREFIJO_CLAVE}${encodeURIComponent(autorId)}:${encodeURIComponent(reporteId)}`;
}

export async function cargarRevisionDuplicado(
  autorId: string,
  reporteId: string
): Promise<RevisionDuplicado | null> {
  const valorGuardado = await AsyncStorage.getItemAsync(obtenerClave(autorId, reporteId));
  if (valorGuardado === null) return null;

  let parseado: unknown;
  try {
    parseado = JSON.parse(valorGuardado);
  } catch (error) {
    throw new Error(`La revisión de duplicado del reporte ${reporteId} no contiene JSON válido.`, {
      cause: error,
    });
  }

  const resultado = revisionSchema.safeParse(parseado);
  if (!resultado.success) {
    throw new Error(`La revisión de duplicado del reporte ${reporteId} tiene datos inválidos.`, {
      cause: resultado.error,
    });
  }
  return resultado.data;
}

export async function guardarRevisionDuplicado(
  autorId: string,
  reporteId: string,
  candidatos: ReporteCercano[]
): Promise<void> {
  const revision = revisionSchema.parse({ candidatos, decision: 'revisar' });
  await AsyncStorage.setItemAsync(
    obtenerClave(autorId, reporteId),
    JSON.stringify(revision)
  );
}

export async function marcarRevisionParaCrear(
  autorId: string,
  reporteId: string
): Promise<void> {
  const revision = await cargarRevisionDuplicado(autorId, reporteId);
  if (!revision) {
    throw new Error(`No hay una revisión pendiente para el reporte ${reporteId}.`);
  }
  await AsyncStorage.setItemAsync(
    obtenerClave(autorId, reporteId),
    JSON.stringify({ ...revision, decision: 'crear' })
  );
}

export async function marcarAdhesionConfirmada(
  autorId: string,
  reporteId: string,
  reporteAdheridoId: string
): Promise<void> {
  const revision = await cargarRevisionDuplicado(autorId, reporteId);
  if (!revision) {
    throw new Error(`No hay una revisión pendiente para el reporte ${reporteId}.`);
  }
  await AsyncStorage.setItemAsync(
    obtenerClave(autorId, reporteId),
    JSON.stringify({ ...revision, decision: 'adhesion_confirmada', reporteAdheridoId })
  );
}

export async function eliminarRevisionDuplicado(
  autorId: string,
  reporteId: string
): Promise<void> {
  await AsyncStorage.removeItemAsync(obtenerClave(autorId, reporteId));
}
