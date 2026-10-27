import { z } from 'zod';

// Esquema de validación del formulario de nuevo reporte, según el PRD:
// - el tipo es obligatorio
// - la foto es obligatoria (sin foto no hay reporte)
// - la ubicación es obligatoria (del GPS o puesta a mano en el mapa)
// - la descripción se escribe O se graba una nota de voz
export const reporteSchema = z
  .object({
    tipoId: z.string().min(1, 'Elegí qué tipo de problema querés reportar'),
    descripcion: z
      .string()
      .trim()
      .max(500, 'La descripción no puede superar los 500 caracteres'),
    audioUri: z.string().nullable(),
    fotos: z.array(z.string()).min(1, 'La foto es obligatoria: sin foto no hay reporte'),
    coordenadas: z
      .object({ latitud: z.number(), longitud: z.number() })
      .nullable()
      .refine((c) => c !== null, 'Falta la ubicación: usá el GPS o marcala en el mapa'),
  })
  .refine((d) => d.descripcion.length > 0 || d.audioUri !== null, {
    message: 'Escribí una descripción o grabá una nota de voz',
    path: ['descripcion'],
  });

export type ReporteForm = z.infer<typeof reporteSchema>;

// Devuelve un mapa campo -> mensaje de error (vacío si todo está bien).
export function validarReporte(datos: unknown): Record<string, string> {
  const resultado = reporteSchema.safeParse(datos);
  if (resultado.success) return {};
  const errores: Record<string, string> = {};
  for (const issue of resultado.error.issues) {
    const campo = String(issue.path[0] ?? 'general');
    if (!errores[campo]) errores[campo] = issue.message;
  }
  return errores;
}
