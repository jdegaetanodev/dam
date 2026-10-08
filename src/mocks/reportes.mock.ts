import { Reporte, TipoDeReporte, Usuario, Zona, Cuadrilla, CambioDeEstado } from '../tipos';

export const MOCK_USUARIOS: Usuario[] = [
  {
    id: 'usr-084',
    nombre: 'Norma Pereyra',
    email: 'norma@mail.com',
    telefono: '3446-412233',
    rol: 'vecino',
    zonaId: null,
    avisosActivos: true,
    creadoEn: '2026-08-30T19:10:00-03:00',
  },
  {
    id: 'usr-003',
    nombre: 'Carlos Martínez',
    email: 'cmartinez@gchu.gob.ar',
    telefono: null,
    rol: 'operador',
    zonaId: 'zon-norte',
    avisosActivos: true,
    creadoEn: '2026-05-10T08:00:00-03:00',
  },
];

export const MOCK_TIPOS_REPORTE: TipoDeReporte[] = [
  { id: 'tip-bache', nombre: 'Bache', icono: 'warning-outline', color: '#C1440E', areaResponsable: 'Obras Públicas' },
  { id: 'tip-luz', nombre: 'Luminaria', icono: 'bulb-outline', color: '#D97706', areaResponsable: 'Electrotecnia' },
  { id: 'tip-basura', nombre: 'Basura', icono: 'trash-outline', color: '#4B5563', areaResponsable: 'Higiene Urbana' },
  { id: 'tip-arbol', nombre: 'Rama / Árbol', icono: 'leaf-outline', color: '#15803D', areaResponsable: 'Espacios Verdes' },
  { id: 'tip-agua', nombre: 'Agua / Cloaca', icono: 'water-outline', color: '#0284C7', areaResponsable: 'Obras Sanitarias' },
  { id: 'tip-semaforo', nombre: 'Semáforo', icono: 'navigate-outline', color: '#DC2626', areaResponsable: 'Tránsito' },
  { id: 'tip-vereda', nombre: 'Vereda', icono: 'construct-outline', color: '#78716C', areaResponsable: 'Obras Privadas' },
  { id: 'tip-otro', nombre: 'Otro', icono: 'help-circle-outline', color: '#6B7280', areaResponsable: 'Atención al Vecino' },
];

export const MOCK_ZONAS: Zona[] = [
  {
    id: 'zon-norte',
    nombre: 'Zona Norte',
    referente: 'Corralón Norte',
    limite: [
      { latitud: -32.99, longitud: -58.53 },
      { latitud: -32.99, longitud: -58.49 },
      { latitud: -33.02, longitud: -58.49 },
      { latitud: -33.02, longitud: -58.53 },
    ],
  },
  {
    id: 'zon-sur',
    nombre: 'Zona Sur',
    referente: 'Corralón Sur',
    limite: [
      { latitud: -33.02, longitud: -58.53 },
      { latitud: -33.02, longitud: -58.49 },
      { latitud: -33.05, longitud: -58.49 },
      { latitud: -33.05, longitud: -58.53 },
    ],
  },
];

export const MOCK_CUADRILLAS: Cuadrilla[] = [
  { id: 'cua-01', nombre: 'Cuadrilla 1 — Luminarias', zonaId: 'zon-norte', especialidad: 'alumbrado', activa: true },
  { id: 'cua-02', nombre: 'Cuadrilla 2 — Bacheo', zonaId: 'zon-norte', especialidad: 'pavimento', activa: true },
  { id: 'cua-03', nombre: 'Cuadrilla 3 — Espacios Verdes', zonaId: 'zon-sur', especialidad: 'poda', activa: true },
];

export const MOCK_CAMBIOS_ESTADO: CambioDeEstado[] = [
  {
    id: 'cam-101',
    reporteId: 'rep-00412',
    estado: 'recibido',
    comentario: 'Ingresado por la aplicación móvil del vecino.',
    operadorId: null,
    fechaHora: '2026-09-14T10:22:00-03:00',
  },
  {
    id: 'cam-102',
    reporteId: 'rep-00412',
    estado: 'en_revision',
    comentario: 'Verificado en el lugar por el inspector de zona.',
    operadorId: 'usr-003',
    fechaHora: '2026-09-15T08:40:00-03:00',
  },
  {
    id: 'cam-103',
    reporteId: 'rep-00412',
    estado: 'asignado',
    comentario: 'Asignado para reparación a cuadrilla de pavimentación.',
    operadorId: 'usr-003',
    fechaHora: '2026-09-18T14:15:00-03:00',
  },
];

export const MOCK_REPORTES: Reporte[] = [
  // Caso 1: Reporte asignado sin nota de voz (audioUrl: null)
  {
    id: 'rep-00412',
    codigo: 'GCHU-2026-00412',
    tipoId: 'tip-bache',
    descripcion: 'Pozo grande en la mano hacia el centro, pasa el agua.',
    audioUrl: null,
    fotos: [
      { id: 'fot-901', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600', momento: 'problema' },
    ],
    coordenadas: { latitud: -33.0089, longitud: -58.5142 },
    direccion: 'Rocamora 1240',
    zonaId: 'zon-norte',
    estado: 'asignado',
    autorId: 'usr-084',
    cuadrillaId: 'cua-02',
    duplicadoDe: null,
    adhesiones: 3,
    creadoEn: '2026-09-14T10:22:00-03:00',
    sincronizado: true,
  },
  // Caso 2: Reporte rechazado con motivo explicativo largo (caso borde exigido por la cátedra)
  {
    id: 'rep-00413',
    codigo: 'GCHU-2026-00413',
    tipoId: 'tip-vereda',
    descripcion: 'Rotura de baldosas frente a garaje particular.',
    audioUrl: null,
    fotos: [
      { id: 'fot-902', url: 'https://images.unsplash.com/photo-1584463699039-44e27f91062b?w=600', momento: 'problema' },
    ],
    coordenadas: { latitud: -33.0125, longitud: -58.5189 },
    direccion: 'Urquiza 850',
    zonaId: 'zon-norte',
    estado: 'rechazado',
    autorId: 'usr-084',
    cuadrillaId: null,
    duplicadoDe: null,
    adhesiones: 1,
    creadoEn: '2026-09-16T11:00:00-03:00',
    sincronizado: true,
  },
  // Caso 3: Reporte en cola offline pendiente de sincronización
  {
    id: 'rep-00415',
    codigo: 'GCHU-2026-00415',
    tipoId: 'tip-luz',
    descripcion: 'Luminaria titila y se apaga de noche.',
    audioUrl: null,
    fotos: [
      { id: 'fot-903', url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600', momento: 'problema' },
    ],
    coordenadas: { latitud: -33.021, longitud: -58.522 },
    direccion: '25 de Mayo al 1100',
    zonaId: 'zon-sur',
    estado: 'recibido',
    autorId: 'usr-084',
    cuadrillaId: null,
    duplicadoDe: null,
    adhesiones: 0,
    creadoEn: '2026-10-06T20:30:00-03:00',
    sincronizado: false,
  },
];