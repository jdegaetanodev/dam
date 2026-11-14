import {
  distanciaEntreCoordenadas,
  filtrarReportesCercanos,
  RADIO_REPORTE_CERCANO_METROS,
} from '../reportesCercanos';
import { Reporte } from '../../tipos';

const reporteBase: Reporte = {
  id: 'rep-1',
  codigo: 'GCHU-2026-00001',
  tipoId: 'bache',
  descripcion: 'Bache en la calle',
  audioUrl: null,
  fotos: [],
  coordenadas: { latitud: -33, longitud: -58 },
  direccion: 'Calle 1',
  zonaId: 'zona-1',
  estado: 'recibido',
  autorId: 'vecino-1',
  cuadrillaId: null,
  duplicadoDe: null,
  adhesiones: 0,
  creadoEn: '2026-01-01T00:00:00.000Z',
  sincronizado: true,
};

describe('reportes cercanos', () => {
  it('mide distancia geográfica en metros', () => {
    expect(
      distanciaEntreCoordenadas(
        { latitud: -33, longitud: -58 },
        { latitud: -33, longitud: -58 }
      )
    ).toBe(0);
  });

  it('incluye el límite de 50 metros, descarta los más lejanos y ordena por distancia', () => {
    const origen = { latitud: 0, longitud: 0 };
    const a50Metros = {
      ...reporteBase,
      id: 'rep-50',
      coordenadas: {
        latitud: 0,
        longitud: (RADIO_REPORTE_CERCANO_METROS / 6_371_000) * (180 / Math.PI),
      },
    };
    const a20Metros = {
      ...a50Metros,
      id: 'rep-20',
      coordenadas: {
        latitud: 0,
        longitud: (20 / 6_371_000) * (180 / Math.PI),
      },
    };
    const a51Metros = {
      ...a50Metros,
      id: 'rep-51',
      coordenadas: {
        latitud: 0,
        longitud: (51 / 6_371_000) * (180 / Math.PI),
      },
    };

    expect(filtrarReportesCercanos(origen, [a50Metros, a51Metros, a20Metros]).map((r) => r.id))
      .toEqual(['rep-20', 'rep-50']);
  });
});
