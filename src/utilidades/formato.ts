// Textos que se muestran igual en varias pantallas.

// "1 vecino se sumó" o "3 vecinos se sumaron"
export const textoAdhesiones = (cantidad: number) =>
  cantidad === 1 ? '1 vecino se sumó' : `${cantidad} vecinos se sumaron`;

// Fecha ISO 8601 a "14/09" (día/mes en la hora del teléfono), como el PRD.
export const formatearFecha = (fechaIso: string) => {
  const fecha = new Date(fechaIso);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}`;
};