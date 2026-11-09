import type { SQLiteDatabase } from 'expo-sqlite';
import type { Reporte } from '../tipos';
import { crearReporte } from './reportes';
import { guardarReporteLocal } from './reportesLocal';

const sincronizacionesActivas = new Map<string, Promise<Reporte>>();

export function sincronizarReporteLocal(
  db: SQLiteDatabase,
  reporte: Reporte
): Promise<Reporte> {
  const clave = `${reporte.autorId}:${reporte.id}`;
  const sincronizacionExistente = sincronizacionesActivas.get(clave);

  if (sincronizacionExistente) {
    return sincronizacionExistente;
  }

  const sincronizacion = (async () => {
    try {
      const reporteRemoto = await crearReporte({
        tipoId: reporte.tipoId,
        descripcion: reporte.descripcion,
        audioUrl: reporte.audioUrl,
        fotos: reporte.fotos,
        coordenadas: reporte.coordenadas,
        direccion: reporte.direccion,
        zonaId: reporte.zonaId,
        estado: reporte.estado,
        autorId: reporte.autorId,
        cuadrillaId: reporte.cuadrillaId,
        duplicadoDe: reporte.duplicadoDe,
      });

      const reporteSincronizado: Reporte = {
        ...reporte,
        codigo: reporteRemoto.codigo,
        sincronizado: true,
      };

      await guardarReporteLocal(db, reporteSincronizado);
      return reporteSincronizado;
    } finally {
      sincronizacionesActivas.delete(clave);
    }
  })();

  sincronizacionesActivas.set(clave, sincronizacion);
  return sincronizacion;
}
