import { Coordenadas, Reporte } from '../tipos';

const RADIO_TIERRA_METROS = 6_371_000;
export const RADIO_REPORTE_CERCANO_METROS = 50;

export interface ReporteCercano {
  id: string;
  codigo: string;
  tipoId: string;
  descripcion: string | null;
  direccion: string;
  estado: Reporte['estado'];
  coordenadas: Coordenadas;
  distanciaMetros: number;
}

export function distanciaEntreCoordenadas(
  origen: Coordenadas,
  destino: Coordenadas
): number {
  const aLat = (destino.latitud - origen.latitud) * Math.PI / 180;
  const aLon = (destino.longitud - origen.longitud) * Math.PI / 180;
  const latOrigen = origen.latitud * Math.PI / 180;
  const latDestino = destino.latitud * Math.PI / 180;
  const valorHaversine =
    Math.sin(aLat / 2) ** 2 +
    Math.cos(latOrigen) * Math.cos(latDestino) * Math.sin(aLon / 2) ** 2;

  return 2 * RADIO_TIERRA_METROS * Math.asin(Math.sqrt(valorHaversine));
}

export function filtrarReportesCercanos(
  coordenadas: Coordenadas,
  reportes: Reporte[]
): ReporteCercano[] {
  return reportes
    .map((reporte) => ({
      id: reporte.id,
      codigo: reporte.codigo,
      tipoId: reporte.tipoId,
      descripcion: reporte.descripcion,
      direccion: reporte.direccion,
      estado: reporte.estado,
      coordenadas: reporte.coordenadas,
      distanciaMetros: distanciaEntreCoordenadas(coordenadas, reporte.coordenadas),
    }))
    .filter((reporte) => reporte.distanciaMetros <= RADIO_REPORTE_CERCANO_METROS)
    .sort((a, b) => a.distanciaMetros - b.distanciaMetros);
}

