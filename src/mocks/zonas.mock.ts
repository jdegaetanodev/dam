import { Zona } from '../tipos';

export const MOCK_ZONAS: Zona[] = [
  {
    id: 'zon-norte',
    nombre: 'Zona Norte',
    referente: 'Corralón Norte',
    limite: [
      { latitud: -32.9800, longitud: -58.5300 },
      { latitud: -32.9800, longitud: -58.4800 },
      { latitud: -33.0100, longitud: -58.4800 },
      { latitud: -33.0100, longitud: -58.5300 },
    ],
  },

  {
    id: 'zon-sur',
    nombre: 'Zona Sur',
    referente: 'Corralón Sur',
    limite: [
      { latitud: -33.0100, longitud: -58.5300 },
      { latitud: -33.0100, longitud: -58.4800 },
      { latitud: -33.0400, longitud: -58.4800 },
      { latitud: -33.0400, longitud: -58.5300 },
    ],
  },

  {
    id: 'zon-este',
    nombre: 'Zona Este',
    referente: 'Corralón Este',
    limite: [
      { latitud: -32.9800, longitud: -58.4800 },
      { latitud: -32.9800, longitud: -58.4550 },
      { latitud: -33.0400, longitud: -58.4550 },
      { latitud: -33.0400, longitud: -58.4800 },
    ],
  },

  {
    id: 'zon-oeste',
    nombre: 'Zona Oeste',
    referente: 'Corralón Oeste',
    limite: [
      { latitud: -32.9800, longitud: -58.5550 },
      { latitud: -32.9800, longitud: -58.5300 },
      { latitud: -33.0400, longitud: -58.5300 },
      { latitud: -33.0400, longitud: -58.5550 },
    ],
  },
];