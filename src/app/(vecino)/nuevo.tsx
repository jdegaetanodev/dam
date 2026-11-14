import { useCallback, useEffect, useRef, useState } from 'react';
import {  ActivityIndicator, Alert, AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,} from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { CategoriaGrid } from '../../componentes/CategoriaGrid';
import { GrabadorVoz } from '../../componentes/GrabadorVoz';
import { PanelReportesCercanos } from '../../componentes/PanelReportesCercanos';
import { SelectorEvidencia } from '../../componentes/SelectorEvidencia';
import { SelectorUbicacion } from '../../componentes/SelectorUbicacion';
import { useAuth } from '../../contextos/AuthContext';
import { useBaseDatos } from '../../contextos/BaseDatosContext';
import { useEstadoRed } from '../../contextos/RedContext';
import { validarReporte } from '../../schemas/reporte';
import { obtenerTiposDeReporte, sumarAdhesion } from '../../servicios/reportes';
import {
  guardarReporteLocal,
  listarReportesPendientesLocales,
} from '../../servicios/reportesLocal';
import { sincronizarReporteLocal } from '../../servicios/sincronizacionReportes';
import {
  cargarBorradorReporte,
  descartarBorradorReporte,
  guardarBorradorReporte,
} from '../../servicios/borradoresReporte';
import { deleteStoredFile } from '../../servicios/mediaService';
import { Coordenadas, Reporte, TipoDeReporte } from '../../tipos';
import { ApiError } from '../../servicios/api';
import { obtenerReportesCercanos } from '../../servicios/reportesCercanos';
import { ReporteCercano } from '../../utilidades/reportesCercanos';
import { cargarRevisionDuplicado } from '../../servicios/revisionesDuplicados';

// Ubicación inicial de prueba en Gualeguaychú
const COORDENADAS_PRUEBA: Coordenadas = {
  latitud: -33.0089,
  longitud: -58.5142,
};

// La API exige una dirección. El selector entrega solo coordenadas, así que
// la resolvemos con geocodificación inversa; si falla, usamos las coordenadas como texto.
async function direccionDesde(c: Coordenadas): Promise<string> {
  try {
    const [lugar] = await Location.reverseGeocodeAsync({
      latitude: c.latitud,
      longitude: c.longitud,
    });
    const calle = lugar?.street ?? lugar?.name ?? '';
    const texto = `${calle} ${lugar?.streetNumber ?? ''}`.trim();
    if (texto) return texto;
  } catch {
    // sin red o sin servicio de geocodificación: seguimos con el respaldo
  }
  return `${c.latitud.toFixed(5)}, ${c.longitud.toFixed(5)}`;
}

export default function NuevoReporte() {
  const db = useBaseDatos();
  const { usuario } = useAuth();
  const { internetDisponible } = useEstadoRed();
  const usuarioId = usuario?.id;
  const [tipos, setTipos] = useState<TipoDeReporte[]>([]);
  const [tipoId, setTipoId] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [reportesCercanos, setReportesCercanos] = useState<ReporteCercano[]>([]);
  const [estadoBusquedaCercanos, setEstadoBusquedaCercanos] = useState<
    'esperando' | 'buscando' | 'completa' | 'error' | 'sin_conexion'
  >('esperando');
  const [ubicacionConsultada, setUbicacionConsultada] = useState<string | null>(null);
  const [reportesPendientesDeRevision, setReportesPendientesDeRevision] = useState(0);
  const [reintentoBusqueda, setReintentoBusqueda] = useState(0);
  const busquedaCercanosActual = useRef(0);

  const [coordenadas, setCoordenadas] =
    useState<Coordenadas | null>(COORDENADAS_PRUEBA);
  const [ubicacionRestaurada, setUbicacionRestaurada] = useState(false);

  const [errores, setErrores] =
    useState<Record<string, string>>({});

  const [enviando, setEnviando] = useState(false);

  const [reinicio, setReinicio] = useState(0);
  const [borradorListo, setBorradorListo] = useState(false);
  const [autoguardadoActivo, setAutoguardadoActivo] = useState(false);
  const [errorBorrador, setErrorBorrador] = useState<string | null>(null);
  const colaBorradores = useRef<Promise<void>>(Promise.resolve());
  const contenidoActualRef = useRef({
    tipoId,
    descripcion,
    audioUri,
    fotoUri,
    coordenadas,
  });
  useEffect(() => {
    contenidoActualRef.current = {
      tipoId,
      descripcion,
      audioUri,
      fotoUri,
      coordenadas,
    };
  }, [tipoId, descripcion, audioUri, fotoUri, coordenadas]);

  //Hace una serie de borradores: si varios borradores se disparan al mismo tiempo, no se sobreescriben
  const persistirBorrador = useCallback(
    (usuarioId: string, contenido: typeof contenidoActualRef.current) => {
      const operacion = colaBorradores.current
        .catch(() => undefined)
        .then(() => guardarBorradorReporte(usuarioId, contenido));
      colaBorradores.current = operacion;
      return operacion;
    },
    []
  );

  //Espera a que termine el guardado antes de eliminar borrador
  const eliminarBorrador = useCallback(async (usuarioId: string) => {
    await colaBorradores.current.catch(() => undefined);
    await descartarBorradorReporte(usuarioId);
  }, []);

  useEffect(() => {
    let cancelado = false;
    if (!usuarioId) {
      const timer = setTimeout(() => {
        if (!cancelado) setReportesPendientesDeRevision(0);
      }, 0);
      return () => {
        cancelado = true;
        clearTimeout(timer);
      };
    }

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const pendientes = await listarReportesPendientesLocales(db, usuarioId);
          const revisiones = await Promise.all(
            pendientes.map((reporte) => cargarRevisionDuplicado(usuarioId, reporte.id))
          );
          if (!cancelado) {
            setReportesPendientesDeRevision(
              revisiones.filter((revision) => revision?.decision === 'revisar').length
            );
          }
        } catch (error) {
          if (!cancelado) {
            console.error('No se pudieron consultar los reportes retenidos para revisión:', error);
          }
        }
      })();
    }, 1000);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [db, usuarioId]);

  const latitud = coordenadas?.latitud;
  const longitud = coordenadas?.longitud;
  const claveUbicacion =
    latitud !== undefined && longitud !== undefined
      ? `${latitud}:${longitud}`
      : null;
  const buscandoUbicacionActual =
    internetDisponible === true &&
    (claveUbicacion === null ||
      ubicacionConsultada !== claveUbicacion ||
      estadoBusquedaCercanos === 'esperando' ||
      estadoBusquedaCercanos === 'buscando');
  const candidatosUbicacionActual =
    claveUbicacion !== null && ubicacionConsultada === claveUbicacion
      ? reportesCercanos
      : [];

  useEffect(() => {
    const idBusqueda = ++busquedaCercanosActual.current;
    let cancelado = false;

    const timer = setTimeout(() => {
      if (!borradorListo || latitud === undefined || longitud === undefined) {
        setEstadoBusquedaCercanos('esperando');
        setReportesCercanos([]);
        setUbicacionConsultada(null);
        return;
      }

      if (internetDisponible !== true) {
        setReportesCercanos([]);
        setEstadoBusquedaCercanos('sin_conexion');
        setUbicacionConsultada(`${latitud}:${longitud}`);
        return;
      }

      setUbicacionConsultada(null);
      setEstadoBusquedaCercanos('buscando');
      void obtenerReportesCercanos({ latitud, longitud })
        .then((candidatos) => {
          if (cancelado || busquedaCercanosActual.current !== idBusqueda) return;
          setReportesCercanos(candidatos);
          setUbicacionConsultada(`${latitud}:${longitud}`);
          setEstadoBusquedaCercanos('completa');
        })
        .catch((error: unknown) => {
          if (cancelado || busquedaCercanosActual.current !== idBusqueda) return;
          console.error('No se pudieron comprobar reportes cercanos:', error);
          setReportesCercanos([]);
          setUbicacionConsultada(`${latitud}:${longitud}`);
          setEstadoBusquedaCercanos('error');
        });
    }, 400);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [
    borradorListo,
    latitud,
    longitud,
    internetDisponible,
    reintentoBusqueda,
  ]);

  useEffect(() => {
    obtenerTiposDeReporte()
      .then(setTipos)
      .catch((e) => {
        console.log('ERROR AL CARGAR TIPOS:', e);
        Alert.alert(
          'No se pudieron cargar las categorías',
          e instanceof ApiError ? e.message : 'Revisá tu conexión y volvé a abrir la pantalla.'
        );
      });
  }, []);

  useEffect(() => {
    let cancelado = false;
    setBorradorListo(false);
    setAutoguardadoActivo(false);
    setTipoId(null);
    setDescripcion('');
    setAudioUri(null);
    setFotoUri(null);
    setCoordenadas(COORDENADAS_PRUEBA);
    setUbicacionRestaurada(false);

    if (!usuario) {
      setBorradorListo(true);
      return;
    }

    async function recuperarBorrador(usuarioId: string) {
      try {
        const borrador = await cargarBorradorReporte(usuarioId);
        if (cancelado) return;

        if (!borrador) {
          setBorradorListo(true);
          return;
        }

        Alert.alert(
          'Borrador encontrado',
          'Hay un reporte que dejaste sin terminar. ¿Querés continuar editándolo?',
          [
            {
              text: 'Descartar',
              style: 'destructive',
              onPress: () => {
                void (async () => {
                  try {
                    await eliminarBorrador(usuarioId);
                    await Promise.all([
                      borrador.fotoUri
                        ? deleteStoredFile(borrador.fotoUri)
                        : Promise.resolve(),
                      borrador.audioUri
                        ? deleteStoredFile(borrador.audioUri)
                        : Promise.resolve(),
                    ]);
                    setTipoId(null);
                    setDescripcion('');
                    setAudioUri(null);
                    setFotoUri(null);
                    setCoordenadas(COORDENADAS_PRUEBA);
                    setUbicacionRestaurada(false);
                    setAutoguardadoActivo(false);
                    setBorradorListo(true);
                  } catch (error) {
                    console.error('No se pudo descartar el borrador:', error);
                    Alert.alert('No se pudo descartar', 'Intentá nuevamente.');
                    setBorradorListo(true);
                  }
                })();
              },
            },
            {
              text: 'Continuar',
              onPress: () => {
                setTipoId(borrador.tipoId);
                setDescripcion(borrador.descripcion);
                setAudioUri(borrador.audioUri);
                setFotoUri(borrador.fotoUri);
                setCoordenadas(borrador.coordenadas);
                setUbicacionRestaurada(borrador.coordenadas !== null);
                setAutoguardadoActivo(true);
                setBorradorListo(true);
              },
            },
          ],
          { cancelable: false }
        );
      } catch (error) {
        if (cancelado) return;
        console.error('No se pudo recuperar el borrador:', error);
        setBorradorListo(true);
        Alert.alert(
          'No se pudo recuperar el borrador',
          'El borrador guardado no se pudo leer. Podés comenzar un reporte nuevo.'
        );
      }
    }

    void recuperarBorrador(usuario.id);

    return () => {
      cancelado = true;
    };
  }, [usuario?.id, eliminarBorrador]);

  useEffect(() => {
    if (!usuario || !borradorListo || !autoguardadoActivo || enviando) {
      return;
    }

    const timer = setTimeout(() => {
      void persistirBorrador(usuario.id, contenidoActualRef.current)
        .then(() => setErrorBorrador(null))
        .catch((error: unknown) => {
          console.error('No se pudo guardar el borrador:', error);
          setErrorBorrador('No se pudo guardar el borrador en este dispositivo.');
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [
    usuario?.id,
    borradorListo,
    autoguardadoActivo,
    enviando,
    tipoId,
    descripcion,
    audioUri,
    fotoUri,
    coordenadas,
    persistirBorrador,
  ]);

  useEffect(() => {
    if (!usuario || !borradorListo || !autoguardadoActivo) {
      return;
    }

    const subscription = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') return;

      void persistirBorrador(usuario.id, contenidoActualRef.current).catch((error: unknown) => {
        console.error('No se pudo guardar el borrador al salir de la app:', error);
        setErrorBorrador('No se pudo guardar el borrador en este dispositivo.');
      });
    });

    return () => subscription.remove();
  }, [usuario?.id, borradorListo, autoguardadoActivo, persistirBorrador]);

  function marcarCambiosDeFormulario() {
    setAutoguardadoActivo(true);
  }

  function validarFormulario(): boolean {
    const errs = validarReporte({
      tipoId: tipoId ?? '',
      descripcion,
      audioUri,
      fotos: fotoUri ? [fotoUri] : [],
      coordenadas,
    });

    setErrores(errs);

    if (Object.keys(errs).length > 0) {
      Alert.alert(
        'Falta completar',
        Object.values(errs)[0]
      );
      return false;
    }

    if (!tipoId || !fotoUri || !coordenadas) {
      return false;
    }

    if (!usuario) {
      Alert.alert('Sesión no disponible', 'Iniciá sesión para guardar tu reporte.');
      return false;
    }
    return true;
  }

  function limpiarFormulario() {
    setTipoId(null);
    setDescripcion('');
    setAudioUri(null);
    setErrores({});
    setFotoUri(null);
    setCoordenadas(COORDENADAS_PRUEBA);
    setUbicacionRestaurada(false);
    setReportesCercanos([]);
    setUbicacionConsultada(null);
    setEstadoBusquedaCercanos('esperando');
    setReinicio((n) => n + 1);
  }

  async function guardarReporteNuevo() {
    if (!validarFormulario() || !usuario || !coordenadas || !tipoId || !fotoUri) {
      return;
    }
    setEnviando(true);

    try {
      const direccion = await direccionDesde(coordenadas);

      // La zona y la cuadrilla las resuelve la API: la zona a partir de las
      // coordenadas y la cuadrilla la asigna el operador desde la bandeja.
      // Esos campos van con valores neutros porque el servicio no los envía.
      const reporteLocal: Reporte = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        codigo: '',
        tipoId,
        descripcion: descripcion.trim() || null,
        audioUrl: audioUri,
        fotos: [{ id: `fot-${Date.now()}`, url: fotoUri, momento: 'problema' }],
        coordenadas,
        direccion,
        zonaId: '',
        estado: 'recibido',
        autorId: usuario.id,
        cuadrillaId: null,
        duplicadoDe: null,
        adhesiones: 0,
        creadoEn: new Date().toISOString(),
        sincronizado: false,
      };

      await guardarReporteLocal(db, reporteLocal);
      setAutoguardadoActivo(false);
      try {
        await eliminarBorrador(usuario.id);
      } catch (error) {
        console.error('El reporte se guardó, pero no se pudo eliminar su borrador:', error);
      }

      let reporteSincronizado: Reporte | null = null;
      if (internetDisponible === true) {
        try {
          reporteSincronizado = await sincronizarReporteLocal(db, reporteLocal);
        } catch (error) {
          console.error('El reporte quedó guardado localmente y pendiente de sincronización:', error);
        }
      }

      if (reporteSincronizado) {
        Alert.alert(
          '¡Reporte sincronizado!',
          `Tu número de seguimiento es ${reporteSincronizado.codigo}`
        );
      } else {
        Alert.alert(
          'Reporte guardado en este dispositivo',
          'Se enviará automáticamente cuando haya conexión a internet.'
        );
      }

      limpiarFormulario();
    } catch (error) {
      console.error('No se pudo guardar el reporte en el dispositivo:', error);
      Alert.alert(
        'No se pudo guardar el reporte',
        'No se guardó en este dispositivo. Revisá el almacenamiento e intentá de nuevo.'
      );
    } finally {
      setEnviando(false);
    }
  }

  async function adherirAReporteCercano(reporteCercano: ReporteCercano) {
    if (!usuario) return;

    setEnviando(true);
    try {
      const actualizado = await sumarAdhesion(reporteCercano.id);

      setAutoguardadoActivo(false);
      try {
        await eliminarBorrador(usuario.id);
      } catch (error) {
        console.error('Te sumaste al reporte, pero no se pudo eliminar el borrador:', error);
        Alert.alert(
          'Te sumaste al reporte',
          'No se pudo borrar el borrador anterior. Revisalo antes de crear otro reporte.'
        );
      }

      await Promise.all([
        fotoUri ? deleteStoredFile(fotoUri) : Promise.resolve(),
        audioUri ? deleteStoredFile(audioUri) : Promise.resolve(),
      ]);
      limpiarFormulario();
      Alert.alert(
        '¡Te sumaste al reporte!',
        `${actualizado.codigo || reporteCercano.codigo} ahora tiene ${actualizado.adhesiones} adhesión(es). No se creó un reporte nuevo.`
      );
    } catch (error) {
      console.error('No se pudo registrar la adhesión:', error);
      Alert.alert(
        'No se pudo sumar al reporte',
        error instanceof Error ? error.message : 'Intentá nuevamente cuando tengas conexión.'
      );
    } finally {
      setEnviando(false);
    }
  }

  function confirmarAdhesion(reporteCercano: ReporteCercano) {
    Alert.alert(
      '¿Es el mismo problema?',
      `Si te sumás a ${reporteCercano.codigo}, se descartará el reporte nuevo en curso y no se creará otro.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, sumarme',
          onPress: () => void adherirAReporteCercano(reporteCercano),
        },
      ]
    );
  }

  async function enviar() {
    if (!validarFormulario()) return;

    if (internetDisponible === true) {
      if (buscandoUbicacionActual) {
        Alert.alert('Buscando reportes cercanos', 'Esperá a que termine la comprobación de duplicados.');
        return;
      }

      if (candidatosUbicacionActual.length > 0) {
        Alert.alert(
          '¿Crear un reporte nuevo?',
          'Hay reportes cercanos. Si ninguno describe el mismo problema, podés crear el tuyo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Crear mi reporte', onPress: () => void guardarReporteNuevo() },
          ]
        );
        return;
      }

      if (
        estadoBusquedaCercanos === 'error' &&
        ubicacionConsultada === claveUbicacion
      ) {
        Alert.alert(
          'No se pudo comprobar si hay duplicados',
          'Podés reintentar la búsqueda o continuar y crear el reporte igualmente.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Crear igualmente', onPress: () => void guardarReporteNuevo() },
          ]
        );
        return;
      }
    }

    await guardarReporteNuevo();
  }

  if (!borradorListo) {
    return (
      <View style={styles.cargandoBorrador}>
        <ActivityIndicator size="large" color="#0B3A5D" />
        <Text style={styles.cargandoBorradorTexto}>Revisando borradores...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.pantalla}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={styles.titulo}
          accessibilityRole="header"
        >
          ¿Qué pasa?
        </Text>

        {reportesPendientesDeRevision > 0 ? (
          <Pressable
            onPress={() => router.push('/(vecino)/mis-reportes')}
            style={styles.avisoRevisionDuplicados}
            accessibilityRole="button"
          >
            <Text style={styles.avisoRevisionDuplicadosTexto}>
              {reportesPendientesDeRevision === 1
                ? 'Tenés un reporte pendiente de revisar por posibles duplicados.'
                : `Tenés ${reportesPendientesDeRevision} reportes pendientes de revisar por posibles duplicados.`}
              {' '}Tocá para resolverlo.
            </Text>
          </Pressable>
        ) : null}

        {errorBorrador && <Text style={styles.error}>{errorBorrador}</Text>}

        <CategoriaGrid
          tipos={tipos}
          seleccionadaId={tipoId}
          onSelect={(id) => {
            setTipoId(id);
            marcarCambiosDeFormulario();
          }}
        />

        {errores.tipoId && (
          <Text style={styles.error}>
            {errores.tipoId}
          </Text>
        )}

        <Text style={styles.subtitulo}>
          Foto (obligatoria)
        </Text>

        <SelectorEvidencia
          key={reinicio}
          uri={fotoUri}
          onChange={(uri) => {
            setFotoUri(uri);
            marcarCambiosDeFormulario();
          }}
        />

        {errores.fotos && (
          <Text style={styles.error}>
            {errores.fotos}
          </Text>
        )}

        <Text style={styles.subtitulo}>
          ¿Dónde está el problema?
        </Text>

        <SelectorUbicacion
          coordenadas={coordenadas}
          onChange={setCoordenadas}
          onUserChange={marcarCambiosDeFormulario}
          consultarGpsAlIniciar={!ubicacionRestaurada}
        />

        {errores.coordenadas && (
          <Text style={styles.error}>
            {errores.coordenadas}
          </Text>
        )}

        {buscandoUbicacionActual ? (
          <View style={styles.estadoBusqueda}>
            <ActivityIndicator size="small" color="#0B3A5D" />
            <Text style={styles.textoBusqueda}>
              Comprobando reportes en un radio de 50 metros...
            </Text>
          </View>
        ) : null}

        {estadoBusquedaCercanos === 'completa' &&
        ubicacionConsultada === claveUbicacion &&
        candidatosUbicacionActual.length === 0 ? (
          <Text style={styles.textoBusqueda}>
            No encontramos otros reportes a menos de 50 metros.
          </Text>
        ) : null}

        {estadoBusquedaCercanos === 'sin_conexion' &&
        internetDisponible !== true ? (
          <Text style={styles.avisoBusqueda}>
            Sin conexión no se pueden consultar reportes cercanos. Se comprobarán antes de sincronizar.
          </Text>
        ) : null}

        {estadoBusquedaCercanos === 'error' &&
        ubicacionConsultada === claveUbicacion ? (
          <View style={styles.errorBusqueda}>
            <Text style={styles.error}>
              No se pudo comprobar si hay reportes cercanos.
            </Text>
            <Pressable
              onPress={() => setReintentoBusqueda((n) => n + 1)}
              accessibilityRole="button"
              style={styles.botonReintentarBusqueda}
            >
              <Text style={styles.botonReintentarBusquedaTexto}>Reintentar búsqueda</Text>
            </Pressable>
          </View>
        ) : null}

        {candidatosUbicacionActual.length > 0 ? (
          <PanelReportesCercanos
            candidatos={candidatosUbicacionActual}
            tipos={tipos}
            onAdherir={confirmarAdhesion}
            descripcionCrearNuevo="Si ninguno coincide, usá «Crear mi reporte» al final del formulario."
            disabled={enviando}
          />
        ) : null}

        <Text style={styles.subtitulo}>
          Contanos
        </Text>

        <TextInput
          style={styles.input}
          value={descripcion}
          onChangeText={(texto) => {
            setDescripcion(texto);
            marcarCambiosDeFormulario();
          }}
          placeholder="Escribí acá los detalles (o grabá un audio)"
          placeholderTextColor="#6B7280"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
          accessibilityLabel="Descripción del problema"
        />

        {errores.descripcion && (
          <Text style={styles.error}>
            {errores.descripcion}
          </Text>
        )}

        <GrabadorVoz
          uri={audioUri}
          onChange={(uri) => {
            setAudioUri(uri);
            marcarCambiosDeFormulario();
          }}
        />

        <Pressable
          onPress={enviar}
          disabled={
            enviando ||
            buscandoUbicacionActual
          }
          role="button"
          accessibilityLabel="Enviar reporte municipal"
          accessibilityHint="Envía el reporte al municipio"
          accessibilityState={{
            disabled:
              enviando ||
              buscandoUbicacionActual,
          }}
          style={[
            styles.enviar,
            (enviando || buscandoUbicacionActual) && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.enviarTexto}>
            {enviando ? 'Enviando...' : buscandoUbicacionActual
              ? 'Comprobando reportes...'
              : candidatosUbicacionActual.length > 0
                ? 'Crear mi reporte'
              : 'Enviar Reporte'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  cargandoBorrador: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
  },

  cargandoBorradorTexto: {
    color: '#475569',
    fontSize: 16,
  },

  pantalla: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  contenido: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },

  titulo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  avisoRevisionDuplicados: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
  },

  avisoRevisionDuplicadosTexto: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
  },

  subtitulo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },

  input: {
    minHeight: 120,
    borderWidth: 2,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 12,
    fontSize: 20,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },

  error: {
    fontSize: 18,
    color: '#B91C1C',
    fontWeight: '600',
  },

  estadoBusqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  textoBusqueda: {
    color: '#475569',
    fontSize: 14,
  },

  avisoBusqueda: {
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    fontSize: 14,
  },

  errorBusqueda: {
    gap: 8,
  },

  botonReintentarBusqueda: {
    minHeight: 40,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },

  botonReintentarBusquedaTexto: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },

  enviar: {
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: '#14532D',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },

  enviarTexto: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
