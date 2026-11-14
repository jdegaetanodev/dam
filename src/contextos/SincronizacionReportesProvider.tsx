import { useEffect, type PropsWithChildren } from 'react';
import { useAuth } from './AuthContext';
import { useBaseDatos } from './BaseDatosContext';
import { useEstadoRed } from './RedContext';
import {
  eliminarReporteLocal,
  listarReportesPendientesLocales,
} from '../servicios/reportesLocal';
import { sincronizarReporteLocal } from '../servicios/sincronizacionReportes';
import { obtenerReportesCercanos } from '../servicios/reportesCercanos';
import {
  cargarRevisionDuplicado,
  eliminarRevisionDuplicado,
  guardarRevisionDuplicado,
} from '../servicios/revisionesDuplicados';
import { deleteStoredFile } from '../servicios/mediaService';

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
            const revision = await cargarRevisionDuplicado(idUsuario, reporte.id);
            if (revision?.decision === 'revisar') {
              continue;
            }

            if (revision?.decision === 'adhesion_confirmada') {
              await eliminarReporteLocal(db, reporte.id, idUsuario);
              await Promise.all([
                ...reporte.fotos.map((foto) => deleteStoredFile(foto.url)),
                ...(reporte.audioUrl ? [deleteStoredFile(reporte.audioUrl)] : []),
              ]);
              await eliminarRevisionDuplicado(idUsuario, reporte.id);
              continue;
            }

            if (revision?.decision !== 'crear') {
              const candidatos = await obtenerReportesCercanos(reporte.coordenadas);
              if (candidatos.length > 0) {
                await guardarRevisionDuplicado(idUsuario, reporte.id, candidatos);
                continue;
              }
            }

            await sincronizarReporteLocal(db, reporte);
            if (revision?.decision === 'crear') {
              await eliminarRevisionDuplicado(idUsuario, reporte.id);
            }
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
