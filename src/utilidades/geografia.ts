import { Coordenadas, Zona } from '../tipos';

export function puntoDentroDePoligono(
  punto: Coordenadas,
  poligono: Coordenadas[]
): boolean {
  let dentro = false;

  const { latitud, longitud } = punto;

  for (
    let i = 0, j = poligono.length - 1;
    i < poligono.length;
    j = i++
  ) {
    const xi = poligono[i].latitud;
    const yi = poligono[i].longitud;

    const xj = poligono[j].latitud;
    const yj = poligono[j].longitud;

    const intersecta =
      yi > longitud !== yj > longitud &&
      latitud <
        ((xj - xi) * (longitud - yi)) /
          (yj - yi) +
          xi;

    if (intersecta) {
      dentro = !dentro;
    }
  }

  return dentro;
}

export function obtenerZonaPorCoordenadas(
  coordenadas: Coordenadas,
  zonas: Zona[]
): Zona | null {
  for (const zona of zonas) {
    if (puntoDentroDePoligono(coordenadas, zona.limite)) {
      return zona;
    }
  }

  return null;
}