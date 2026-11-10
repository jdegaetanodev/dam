import { useEffect, type PropsWithChildren } from 'react';
import { useAuth } from './AuthContext';
import { useBaseDatos } from './BaseDatosContext';
import { useEstadoRed } from './RedContext';
import { listarReportesPendientesLocales } from '../servicios/reportesLocal';
import { sincronizarReporteLocal } from '../servicios/sincronizacionReportes';

export function SincronizacionReportesProvider({ children }: PropsWithChildren) {
  const db = useBaseDatos();
  const { usuario } = useAuth();
  const { internetDisponible } = useEstadoRed();

  useEffect(() => {
    const autorId = usuario?.id;
    if (internetDisponible !== true || !autorId) {
      return;
    }

    let activo = true;

    async function sincronizarPendientes(idUsuario: string) {
      try {
        const pendientes = await listarReportesPendientesLocales(db, idUsuario);

        for (const reporte of pendientes) {
          if (!activo) {
            return;
          }

          try {
            await sincronizarReporteLocal(db, reporte);
          } catch (error) {
            console.error(`No se pudo sincronizar el reporte ${reporte.id}:`, error);
          }
        }
      } catch (error) {
        console.error('No se pudieron consultar los reportes pendientes:', error);
      }
    }

    void sincronizarPendientes(autorId);

    return () => {
      activo = false;
    };
  }, [db, internetDisponible, usuario?.id]);

  return children;
}
