import type { SQLiteDatabase } from 'expo-sqlite';
import type { Coordenadas, Foto, Reporte } from '../tipos';

interface ReporteEnBaseDatos extends Omit<Reporte, 'fotos' | 'coordenadas' | 'sincronizado'> {
  fotos: string;
  coordenadas: string;
  sincronizado: number;
}

function convertirReporte(fila: ReporteEnBaseDatos): Reporte {
  let fotos: Foto[];
  let coordenadas: Coordenadas;

  try {
    fotos = JSON.parse(fila.fotos) as Foto[];
    coordenadas = JSON.parse(fila.coordenadas) as Coordenadas;
  } catch (error) {
    throw new Error(`No se pudo leer la información local del reporte ${fila.id}.`, {
      cause: error,
    });
  }

  return {
    ...fila,
    fotos,
    coordenadas,
    sincronizado: fila.sincronizado === 1,
  };
}

function validarPropietario(autorId: string): void {
  if (!autorId.trim()) {
    throw new Error('El identificador del usuario es obligatorio para acceder a sus reportes.');
  }
}

export async function guardarReporteLocal(
  db: SQLiteDatabase,
  reporte: Reporte
): Promise<void> {
  validarPropietario(reporte.autorId);

  const resultado = await db.runAsync(
    `INSERT INTO reportes (
      id, codigo, tipoId, descripcion, audioUrl, fotos, coordenadas,
      direccion, zonaId, estado, autorId, cuadrillaId, duplicadoDe,
      adhesiones, creadoEn, sincronizado
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      codigo = excluded.codigo,
      tipoId = excluded.tipoId,
      descripcion = excluded.descripcion,
      audioUrl = excluded.audioUrl,
      fotos = excluded.fotos,
      coordenadas = excluded.coordenadas,
      direccion = excluded.direccion,
      zonaId = excluded.zonaId,
      estado = excluded.estado,
      cuadrillaId = excluded.cuadrillaId,
      duplicadoDe = excluded.duplicadoDe,
      adhesiones = excluded.adhesiones,
      creadoEn = excluded.creadoEn,
      sincronizado = excluded.sincronizado
    WHERE reportes.autorId = excluded.autorId`,
    reporte.id,
    reporte.codigo,
    reporte.tipoId,
    reporte.descripcion,
    reporte.audioUrl,
    JSON.stringify(reporte.fotos),
    JSON.stringify(reporte.coordenadas),
    reporte.direccion,
    reporte.zonaId,
    reporte.estado,
    reporte.autorId,
    reporte.cuadrillaId,
    reporte.duplicadoDe,
    reporte.adhesiones,
    reporte.creadoEn,
    reporte.sincronizado ? 1 : 0
  );

  if (resultado.changes === 0) {
    throw new Error(
      `No se guardó el reporte ${reporte.id}: el identificador ya pertenece a otro usuario.`
    );
  }
}

export async function listarReportesLocales(
  db: SQLiteDatabase,
  autorId: string
): Promise<Reporte[]> {
  validarPropietario(autorId);

  const filas = await db.getAllAsync<ReporteEnBaseDatos>(
    `SELECT
      id, codigo, tipoId, descripcion, audioUrl, fotos, coordenadas,
      direccion, zonaId, estado, autorId, cuadrillaId, duplicadoDe,
      adhesiones, creadoEn, sincronizado
    FROM reportes
    WHERE autorId = ?
    ORDER BY creadoEn DESC`,
    autorId
  );

  return filas.map(convertirReporte);
}

export async function listarReportesPendientesLocales(
  db: SQLiteDatabase,
  autorId: string
): Promise<Reporte[]> {
  validarPropietario(autorId);

  const filas = await db.getAllAsync<ReporteEnBaseDatos>(
    `SELECT
      id, codigo, tipoId, descripcion, audioUrl, fotos, coordenadas,
      direccion, zonaId, estado, autorId, cuadrillaId, duplicadoDe,
      adhesiones, creadoEn, sincronizado
    FROM reportes
    WHERE autorId = ? AND sincronizado = 0
    ORDER BY creadoEn ASC`,
    autorId
  );

  return filas.map(convertirReporte);
}

export async function obtenerReporteLocal(
  db: SQLiteDatabase,
  id: string,
  autorId: string
): Promise<Reporte | null> {
  validarPropietario(autorId);

  const fila = await db.getFirstAsync<ReporteEnBaseDatos>(
    `SELECT
      id, codigo, tipoId, descripcion, audioUrl, fotos, coordenadas,
      direccion, zonaId, estado, autorId, cuadrillaId, duplicadoDe,
      adhesiones, creadoEn, sincronizado
    FROM reportes
    WHERE id = ? AND autorId = ?`,
    id,
    autorId
  );

  return fila ? convertirReporte(fila) : null;
}