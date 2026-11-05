import { Coordenadas, Zona } from '../tipos';

export function puntoDentroDeZona(
  punto: Coordenadas,
  limite: Coordenadas[]
): boolean {
  let dentro = false;

  for (
    let i = 0, j = limite.length - 1;
    i < limite.length;
    j = i++
  ) {
    const xi = limite[i].latitud;
    const yi = limite[i].longitud;

    const xj = limite[j].latitud;
    const yj = limite[j].longitud;

    const intersecta =
      (yi > punto.longitud) !== (yj > punto.longitud) &&
      punto.latitud <
        ((xj - xi) * (punto.longitud - yi)) /
          (yj - yi) +
          xi;

    if (intersecta) {
      dentro = !dentro;
    }
  }

  return dentro;
}

export function obtenerZonaDeCoordenadas(
  punto: Coordenadas,
  zonas: Zona[]
): Zona | null {
  for (const zona of zonas) {
    if (puntoDentroDeZona(punto, zona.limite)) {
      return zona;
    }
  }

  return null;
}