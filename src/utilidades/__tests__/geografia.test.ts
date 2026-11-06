import {
  puntoDentroDePoligono,
  obtenerZonaPorCoordenadas,
} from '../geografia';

import { MOCK_ZONAS } from '../../mocks/zonas.mock';

describe('Funciones geográficas', () => {
  const poligonoPrueba = [
    { latitud: -33.00, longitud: -58.53 },
    { latitud: -33.00, longitud: -58.48 },
    { latitud: -33.03, longitud: -58.48 },
    { latitud: -33.03, longitud: -58.53 },
  ];

  test('detecta un punto dentro de un polígono', () => {
    const punto = {
      latitud: -33.015,
      longitud: -58.50,
    };

    expect(
      puntoDentroDePoligono(punto, poligonoPrueba)
    ).toBe(true);
  });

  test('detecta un punto fuera de un polígono', () => {
    const punto = {
      latitud: -33.05,
      longitud: -58.50,
    };

    expect(
      puntoDentroDePoligono(punto, poligonoPrueba)
    ).toBe(false);
  });

  test('detecta correctamente la zona municipal', () => {
    const punto = {
      latitud: -33.00,
      longitud: -58.50,
    };

    const zona = obtenerZonaPorCoordenadas(
      punto,
      MOCK_ZONAS
    );

    expect(zona).not.toBeNull();
    expect(zona?.id).toBe('zon-norte');
  });

  test('devuelve null cuando el punto está fuera de las zonas', () => {
    const punto = {
      latitud: -33.10,
      longitud: -58.60,
    };

    const zona = obtenerZonaPorCoordenadas(
      punto,
      MOCK_ZONAS
    );

    expect(zona).toBeNull();
  });
});