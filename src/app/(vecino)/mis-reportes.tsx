import { useCallback, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';

import { ModalQrReporte } from '../../componentes/ModalQrReporte';
import { PanelReportesCercanos } from '../../componentes/PanelReportesCercanos';
import { useAuth } from '../../contextos/AuthContext';
import { useBaseDatos } from '../../contextos/BaseDatosContext';
import { useEstadoRed } from '../../contextos/RedContext';
import { avisarCambiosDeEstado } from '../../servicios/notificaciones';
import {
  obtenerMisReportes,
  obtenerTiposDeReporte,
  sumarAdhesion,
} from '../../servicios/reportes';
import {
  eliminarReporteLocal,
  listarReportesLocales,
} from '../../servicios/reportesLocal';
import {
  cargarRevisionDuplicado,
  eliminarRevisionDuplicado,
  marcarAdhesionConfirmada,
  marcarRevisionParaCrear,
  RevisionDuplicado,
} from '../../servicios/revisionesDuplicados';
import { sincronizarReporteLocal } from '../../servicios/sincronizacionReportes';
import { deleteStoredFile } from '../../servicios/mediaService';
import { Reporte, TipoDeReporte } from '../../tipos';
import { ReporteCercano } from '../../utilidades/reportesCercanos';

//Listar reportes locales al dispositivo y remotos
function combinarReportes(locales: Reporte[], remotos: Reporte[]): Reporte[] {
  const reportesPorClave = new Map<string, Reporte>();
  const claveDe = (reporte: Reporte) =>
    reporte.codigo.trim() ? `codigo:${reporte.codigo.trim()}` : `id:${reporte.id}`;

  for (const reporte of remotos) {
    reportesPorClave.set(claveDe(reporte), { ...reporte, sincronizado: true });
  }

  for (const reporte of locales) {
    const clave = claveDe(reporte);
    const remoto = reportesPorClave.get(clave);
    reportesPorClave.set(
      clave,
      remoto ? { ...reporte, ...remoto, sincronizado: true } : reporte
    );
  }

  return [...reportesPorClave.values()].sort(
    (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
  );
}

export default function MisReportesScreen() {
  const db = useBaseDatos();
  const { usuario } = useAuth();
  const { internetDisponible } = useEstadoRed();
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [tipos, setTipos] = useState<TipoDeReporte[]>([]);
  const [revisionesDuplicado, setRevisionesDuplicado] =
    useState<Record<string, RevisionDuplicado>>({});
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [codigoQrSeleccionado, setCodigoQrSeleccionado] = useState<string | null>(null);

  const cargarReportes = useCallback(async () => {
    try {
      const revisionesPendientes: Record<string, RevisionDuplicado> = {};
      let reportesLocales = usuario
        ? await listarReportesLocales(db, usuario.id)
        : [];

      if (usuario) {
        const revisiones = await Promise.all(
          reportesLocales
            .filter((reporte) => !reporte.sincronizado)
            .map(async (reporte) => ({
              reporte,
              revision: await cargarRevisionDuplicado(usuario.id, reporte.id),
            }))
        );
        for (const { reporte, revision } of revisiones) {
          if (!revision) continue;

          if (revision.decision === 'adhesion_confirmada') {
            await eliminarReporteLocal(db, reporte.id, usuario.id);
            await Promise.all([
              ...reporte.fotos.map((foto) => deleteStoredFile(foto.url)),
              ...(reporte.audioUrl ? [deleteStoredFile(reporte.audioUrl)] : []),
            ]);
            await eliminarRevisionDuplicado(usuario.id, reporte.id);
            continue;
          }

          revisionesPendientes[reporte.id] = revision;
        }

        reportesLocales = await listarReportesLocales(db, usuario.id);
      }
      setRevisionesDuplicado(revisionesPendientes);

      if (Object.keys(revisionesPendientes).length > 0) {
        const listaTipos = await obtenerTiposDeReporte().catch((error: unknown) => {
          console.error('No se pudieron cargar los tipos de reporte:', error);
          return [];
        });
        setTipos(listaTipos);
      } else {
        setTipos([]);
      }
      setReportes(combinarReportes(reportesLocales, []));

      if (internetDisponible === true && usuario) {
        try {
          const reportesRemotos = await obtenerMisReportes();
          avisarCambiosDeEstado(reportesRemotos);
          setReportes(combinarReportes(reportesLocales, reportesRemotos));
        } catch (error) {
          console.error(
            'No se pudieron actualizar los reportes desde el servidor; se muestran los guardados en el dispositivo:',
            error
          );
        }
      }
    } catch (error) {
      console.error('No se pudieron cargar los reportes guardados en el dispositivo:', error);
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, [db, internetDisponible, usuario]);

  useFocusEffect(
    useCallback(() => {
      void cargarReportes();
    }, [cargarReportes])
  );

  const actualizar = () => {
    setActualizando(true);
    void cargarReportes();
  };

  async function adherirAReporteExistente(
    reporteLocal: Reporte,
    candidato: ReporteCercano
  ) {
    if (!usuario) return;

    Alert.alert(
      '¿Es el mismo problema?',
      `Si te sumás a ${candidato.codigo}, no se creará el reporte pendiente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, sumarme',
          onPress: () => {
            void (async () => {
              try {
                await sumarAdhesion(candidato.id);
                await marcarAdhesionConfirmada(usuario.id, reporteLocal.id, candidato.id);
                await cargarReportes();
                Alert.alert(
                  '¡Te sumaste al reporte!',
                  `Te sumaste a ${candidato.codigo}; el reporte pendiente se quitó de la cola.`
                );
              } catch (error) {
                console.error('No se pudo completar la adhesión al reporte cercano:', error);
                Alert.alert(
                  'No se pudo sumar al reporte',
                  error instanceof Error ? error.message : 'Intentá nuevamente cuando tengas conexión.'
                );
              }
            })();
          },
        },
      ]
    );
  }

  async function crearReportePendiente(reporteLocal: Reporte) {
    if (!usuario) return;

    Alert.alert(
      'Crear un reporte nuevo',
      'Confirmás que ninguno de los reportes cercanos describe el mismo problema.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear igualmente',
          onPress: () => {
            void (async () => {
              try {
                await marcarRevisionParaCrear(usuario.id, reporteLocal.id);
                await sincronizarReporteLocal(db, reporteLocal);
                await eliminarRevisionDuplicado(usuario.id, reporteLocal.id);
                setRevisionesDuplicado((actuales) => {
                  const siguientes = { ...actuales };
                  delete siguientes[reporteLocal.id];
                  return siguientes;
                });
                await cargarReportes();
                Alert.alert('Reporte sincronizado', 'Tu reporte se envió al servidor.');
              } catch (error) {
                console.error('No se pudo sincronizar el reporte pendiente:', error);
                Alert.alert(
                  'No se pudo enviar el reporte',
                  error instanceof Error ? error.message : 'Se volverá a intentar más tarde.'
                );
              }
            })();
          },
        },
      ]
    );
  }

  function obtenerTextoEstado(estado: string) {
    switch (estado) {
      case 'recibido':
        return 'Recibido';

      case 'en_revision':
        return 'En revisión';

      case 'asignado':
        return 'Asignado';

      case 'en_progreso':
        return 'En progreso';

      case 'resuelto':
        return 'Resuelto';

      case 'rechazado':
        return 'Rechazado';

      default:
        return estado;
    }
  }

  function obtenerColorEstado(estado: string) {
    switch (estado) {
      case 'recibido':
        return '#2563EB';

      case 'en_revision':
        return '#D97706';

      case 'asignado':
        return '#7C3AED';

      case 'en_progreso':
        return '#0891B2';

      case 'resuelto':
        return '#15803D';

      case 'rechazado':
        return '#DC2626';

      default:
        return '#64748B';
    }
  }

  if (cargando) {
    return (
      <View style={estilos.cargando}>
        <ActivityIndicator size="large" />
        <Text style={estilos.cargandoTexto}>
          Cargando tus reportes...
        </Text>
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Mis Reclamos</Text>

      <Text style={estilos.subtitulo}>
        Acá podés consultar el estado de tus reportes.
      </Text>

      <ModalQrReporte
        visible={codigoQrSeleccionado !== null}
        codigo={codigoQrSeleccionado ?? ''}
        onClose={() => setCodigoQrSeleccionado(null)}
      />

      <FlatList
        data={reportes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          reportes.length === 0
            ? estilos.listaVacia
            : estilos.lista
        }
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
          />
        }
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <Text style={estilos.vacioIcono}>📋</Text>

            <Text style={estilos.vacioTitulo}>
              Todavía no tenés reportes
            </Text>

            <Text style={estilos.vacioTexto}>
              Cuando realices un reporte municipal aparecerá acá.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const qrDisponible = item.codigo.trim().length > 0;
          const revision = revisionesDuplicado[item.id];

          return (
            <View style={estilos.tarjeta}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/detalle-vecino/[id]',
                    params: { id: item.id, codigo: item.codigo },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Ver detalle del reporte ${item.codigo || 'pendiente de sincronización'}`}
                accessibilityHint="Muestra el historial y las fotos del reporte"
              >
                <View style={estilos.encabezadoTarjeta}>
                  <View>
                    <Text style={estilos.codigo}>
                      {item.codigo || 'Reporte pendiente'}
                    </Text>

                    <Text style={estilos.fecha}>
                      {new Date(item.creadoEn).toLocaleDateString('es-AR')}
                    </Text>
                  </View>

                  <View style={estilos.indicadores}>
                    <View
                      style={[
                        estilos.estado,
                        {
                          backgroundColor: obtenerColorEstado(item.estado),
                        },
                      ]}
                    >
                      <Text style={estilos.estadoTexto}>
                        {obtenerTextoEstado(item.estado)}
                      </Text>
                    </View>

                    <View
                      style={[
                        estilos.sincronizacion,
                        item.sincronizado
                          ? estilos.sincronizado
                          : estilos.pendiente,
                      ]}
                      accessibilityRole="text"
                      accessibilityLabel={
                        item.sincronizado
                          ? 'Reporte sincronizado con el servidor'
                          : 'Reporte pendiente de sincronización'
                      }
                    >
                      <Ionicons
                        name={
                          item.sincronizado
                            ? 'cloud-done-outline'
                            : 'cloud-upload-outline'
                        }
                        size={14}
                        color={item.sincronizado ? '#15803D' : '#B45309'}
                      />
                      <Text
                        style={[
                          estilos.sincronizacionTexto,
                          { color: item.sincronizado ? '#15803D' : '#B45309' },
                        ]}
                      >
                        {item.sincronizado ? 'Sincronizado' : 'Pendiente'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={estilos.linea} />

                <Text style={estilos.etiqueta}>
                  Descripción
                </Text>

                <Text style={estilos.descripcion}>
                  {item.descripcion || 'Sin descripción adicional.'}
                </Text>

                <Text style={estilos.ubicacion}>
                  📍 {item.direccion || 'Ubicación registrada en el mapa'}
                </Text>
              </Pressable>

              {qrDisponible ? (
                <Pressable
                  onPress={() => setCodigoQrSeleccionado(item.codigo)}
                  style={estilos.botonQr}
                  accessibilityRole="button"
                  accessibilityLabel={`Mostrar código QR del reporte ${item.codigo}`}
                >
                  <Ionicons name="qr-code-outline" size={18} color="#0B3A5D" />
                  <Text style={estilos.botonQrTexto}>Ver código QR</Text>
                </Pressable>
              ) : (
                <View
                  style={estilos.qrPendiente}
                  accessibilityRole="text"
                  accessibilityLabel="El código QR estará disponible cuando el reporte se sincronice"
                >
                  <Ionicons name="time-outline" size={16} color="#92400E" />
                  <Text style={estilos.qrPendienteTexto}>
                    QR disponible cuando se sincronice
                  </Text>
                </View>
              )}

              {revision?.decision === 'revisar' ? (
                <PanelReportesCercanos
                  candidatos={revision.candidatos}
                  tipos={tipos}
                  onAdherir={(candidato) => {
                    void adherirAReporteExistente(item, candidato);
                  }}
                  onCrearNuevo={() => {
                    void crearReportePendiente(item);
                  }}
                  textoCrearNuevo="Ninguno coincide: enviar mi reporte"
                  descripcionCrearNuevo="El reporte está retenido hasta que confirmes esta decisión."
                />
              ) : null}
            </View>
          );
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  titulo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  subtitulo: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 16,
  },

  lista: {
    paddingBottom: 30,
    gap: 12,
  },

  listaVacia: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  encabezadoTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },

  indicadores: {
    alignItems: 'flex-end',
    gap: 6,
  },

  codigo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },

  fecha: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },

  estado: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  estadoTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  sincronizacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  sincronizado: {
    backgroundColor: '#DCFCE7',
  },

  pendiente: {
    backgroundColor: '#FEF3C7',
  },

  sincronizacionTexto: {
    fontSize: 12,
    fontWeight: '700',
  },

  linea: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },

  etiqueta: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },

  descripcion: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 14,
  },

  ubicacion: {
    fontSize: 15,
    color: '#475569',
  },

  botonQr: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#0B3A5D',
    borderRadius: 10,
  },

  botonQrTexto: {
    color: '#0B3A5D',
    fontSize: 15,
    fontWeight: '700',
  },

  qrPendiente: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
  },

  qrPendienteTexto: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
  },

  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },

  cargandoTexto: {
    fontSize: 16,
    color: '#64748B',
  },

  vacio: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  vacioIcono: {
    fontSize: 50,
    marginBottom: 16,
  },

  vacioTitulo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },

  vacioTexto: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
});