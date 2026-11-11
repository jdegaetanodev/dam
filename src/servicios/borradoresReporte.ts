import { z } from 'zod';
import { AsyncStorage } from 'expo-sqlite/kv-store';
import type { Coordenadas } from '../tipos';

const VERSION_BORRADOR = 1;
const PREFIJO_CLAVE = 'borrador-reporte:';

const coordenadasSchema = z
  .object({
    latitud: z.number(),
    longitud: z.number(),
  })
  .nullable();

const contenidoBorradorSchema = z.object({
  tipoId: z.string().nullable(),
  descripcion: z.string(),
  audioUri: z.string().nullable(),
  fotoUri: z.string().nullable(),
  coordenadas: coordenadasSchema,
});

const borradorGuardadoSchema = contenidoBorradorSchema.extend({
  version: z.literal(VERSION_BORRADOR),
  actualizadoEn: z.string().datetime(),
});

export type ContenidoBorradorReporte = {
  tipoId: string | null;
  descripcion: string;
  audioUri: string | null;
  fotoUri: string | null;
  coordenadas: Coordenadas | null;
};

export type BorradorReporte = ContenidoBorradorReporte & {
  version: typeof VERSION_BORRADOR;
  actualizadoEn: string;
};

function obtenerClave(usuarioId: string): string {
  if (!usuarioId.trim()) {
    throw new Error('El identificador del usuario es obligatorio para acceder al borrador.');
  }

  return `${PREFIJO_CLAVE}${encodeURIComponent(usuarioId)}`;
}

export async function guardarBorradorReporte(
  usuarioId: string,
  contenido: ContenidoBorradorReporte
): Promise<void> {
  const clave = obtenerClave(usuarioId);
  const contenidoValidado = contenidoBorradorSchema.safeParse(contenido);

  if (!contenidoValidado.success) {
    throw new Error('No se pudo guardar el borrador porque sus datos no son válidos.', {
      cause: contenidoValidado.error,
    });
  }

  const borrador: BorradorReporte = {
    ...contenidoValidado.data,
    version: VERSION_BORRADOR,
    actualizadoEn: new Date().toISOString(),
  };

  await AsyncStorage.setItemAsync(clave, JSON.stringify(borrador));
}

export async function cargarBorradorReporte(
  usuarioId: string
): Promise<BorradorReporte | null> {
  const clave = obtenerClave(usuarioId);
  const valorGuardado = await AsyncStorage.getItemAsync(clave);

  if (valorGuardado === null) {
    return null;
  }

  let valorParseado: unknown;
  try {
    valorParseado = JSON.parse(valorGuardado);
  } catch (error) {
    throw new Error('El borrador guardado no contiene JSON válido.', { cause: error });
  }

  const resultado = borradorGuardadoSchema.safeParse(valorParseado);
  if (!resultado.success) {
    throw new Error(
      'El borrador guardado no tiene un formato compatible con esta versión de la aplicación.',
      { cause: resultado.error }
    );
  }

  return resultado.data;
}

export async function descartarBorradorReporte(usuarioId: string): Promise<void> {
  await AsyncStorage.removeItemAsync(obtenerClave(usuarioId));
}
