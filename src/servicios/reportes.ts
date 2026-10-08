import { Reporte, TipoDeReporte, CambioDeEstado, EstadoReporte } from '@/tipos';
import {
  MOCK_REPORTES,
  MOCK_TIPOS_REPORTE,
  MOCK_CAMBIOS_ESTADO,
} from '../mocks/reportes.mock';

// Simulador de demora de red (200 ms) para mantener la interfaz asíncrona
const demorar = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const obtenerReportes = async (): Promise<Reporte[]> => {
  await demorar();
  return [...MOCK_REPORTES];
};

export const obtenerReportePorId = async (id: string): Promise<Reporte | null> => {
  await demorar();
  const reporte = MOCK_REPORTES.find((item) => item.id === id);
  return reporte ? { ...reporte } : null;
};

export const obtenerTiposDeReporte = async (): Promise<TipoDeReporte[]> => {
  await demorar();
  return [...MOCK_TIPOS_REPORTE];
};

export const obtenerHistorialEstados = async (reporteId: string): Promise<CambioDeEstado[]> => {
  await demorar();
  return MOCK_CAMBIOS_ESTADO.filter((cambio) => cambio.reporteId === reporteId);
};

export const crearReporte = async (
  nuevoReporte: Omit<Reporte, 'id' | 'codigo' | 'creadoEn' | 'adhesiones' | 'sincronizado'>
): Promise<Reporte> => {
  await demorar();
  const reporteCreado: Reporte = {
    ...nuevoReporte,
    id: `rep-${Date.now()}`,
    codigo: `GCHU-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    creadoEn: new Date().toISOString(),
    adhesiones: 0,
    sincronizado: true,
  };

  MOCK_REPORTES.unshift(reporteCreado);
  return reporteCreado;
};

export const actualizarEstadoReporte = async (
  reporteId: string,
  nuevoEstado: EstadoReporte,
  comentario: string | null,
  operadorId: string
): Promise<Reporte> => {
  await demorar();
  const index = MOCK_REPORTES.findIndex((r) => r.id === reporteId);
  if (index === -1) {
    throw new Error(`Reporte con id ${reporteId} no encontrado`);
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