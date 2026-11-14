import { Coordenadas } from '../tipos';
import { filtrarReportesCercanos, ReporteCercano } from '../utilidades/reportesCercanos';
import { obtenerReportes } from './reportes';

export async function obtenerReportesCercanos(
  coordenadas: Coordenadas
): Promise<ReporteCercano[]> {
  const reportes = await obtenerReportes();
  return filtrarReportesCercanos(coordenadas, reportes);
}
