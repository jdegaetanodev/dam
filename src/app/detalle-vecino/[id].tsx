import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@react-native-vector-icons/ionicons';

import { useAuth } from '../../contextos/AuthContext';
import { useBaseDatos } from '../../contextos/BaseDatosContext';
import { useEstadoRed } from '../../contextos/RedContext';
import { listarReportesLocales } from '../../servicios/reportesLocal';
import {
  obtenerHistorialEstados,
  obtenerMisReportes,
} from '../../servicios/reportes';
import { CambioDeEstado, Foto, Reporte } from '../../tipos';
import { COLORES_ESTADO, ETIQUETAS_ESTADO } from '../../utilidades/estados';

export default function DetalleReporteVecinoScreen() {
  const { id, codigo } = useLocalSearchParams<{ id: string; codigo?: string }>();
  const db = useBaseDatos();
  const { usuario } = useAuth();
  const { internetDisponible } = useEstadoRed();
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [historial, setHistorial] = useState<CambioDeEstado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);
  const [datosLocales, setDatosLocales] = useState(false);
  const cargaActual = useRef(0);

  const cargar = useCallback(async () => {
    const idCarga = ++cargaActual.current;
    const sigueVigente = () => cargaActual.current === idCarga;
    let reporteLocal: Reporte | null = null;
    setError(null);
    setErrorHistorial(null);

    try {
      if (usuario) {
        const reportesLocales = await listarReportesLocales(db, usuario.id);
        if (!sigueVigente()) return;
        reporteLocal =
          reportesLocales.find(
            (item) => item.id === id || (codigo && item.codigo === codigo)
          ) ?? null;
      }

      if (internetDisponible === true && reporteLocal?.sincronizado !== false) {
        try {
          const reportesRemotos = await obtenerMisReportes();
          if (!sigueVigente()) return;
          const codigoBuscado = codigo || reporteLocal?.codigo;
          const reporteRemoto = reportesRemotos.find(
            (item) =>
              item.id === id ||
              (codigoBuscado !== undefined && item.codigo === codigoBuscado)
          );

          if (!reporteRemoto) {
            throw new Error('No encontramos ese reporte.');
          }

          setReporte(reporteRemoto);
          setDatosLocales(false);

          try {
            const cambios = await obtenerHistorialEstados(reporteRemoto.id);
            if (!sigueVigente()) return;
            setHistorial(cambios);
          } catch (historialError) {
            if (!sigueVigente()) return;
            console.error('No se pudo cargar el historial del reporte:', historialError);
            setHistorial([]);
            setErrorHistorial('No se pudo cargar el historial. Probá actualizar la pantalla.');
          }
          return;
        } catch (reporteError) {
          if (!sigueVigente()) return;
          if (!reporteLocal) {
            throw reporteError;
          }
          console.warn('No se pudo actualizar el detalle desde el servidor; se muestra la copia local:', reporteError);
        }
      }

      if (!sigueVigente()) return;

      if (reporteLocal) {
        setReporte(reporteLocal);
        setHistorial([]);
        setDatosLocales(true);
        setErrorHistorial(
          reporteLocal.sincronizado && internetDisponible === true
            ? 'No se pudo cargar el historial desde el servidor.'
            : reporteLocal.sincronizado
              ? 'El historial se mostrará cuando vuelva la conexión.'
            : 'El historial estará disponible cuando el reporte se sincronice.'
        );
        return;
      }

      throw new Error(
        internetDisponible === true
          ? 'No se pudo encontrar el reporte.'
          : 'Este reporte no está disponible en el dispositivo y no hay conexión.'
      );
    } catch (loadError) {
      if (!sigueVigente()) return;
      console.error('No se pudo cargar el detalle del reporte:', loadError);
      setReporte(null);
      setHistorial([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Ocurrió un error inesperado al cargar el reporte.'
      );
    } finally {
      if (sigueVigente()) setCargando(false);
    }
  }, [codigo, db, id, internetDisponible, usuario]);

  useFocusEffect(
    useCallback(() => {
      setCargando(true);
      void cargar();

      return () => {
        cargaActual.current += 1;
      };
    }, [cargar])
  );

  const reintentar = () => {
    setCargando(true);
    void cargar();
  };

  if (cargando) {
    return (
      <View style={estilos.centro}>
        <Stack.Screen options={{ title: 'Detalle del reporte' }} />
        <ActivityIndicator size="large" color="#0B3A5D" accessibilityLabel="Cargando el reporte" />
      </View>
    );
  }

  if (error || !reporte) {
    return (
      <View style={estilos.centro}>
        <Stack.Screen options={{ title: 'Detalle del reporte' }} />
        <Text style={estilos.error} accessibilityRole="alert">
          {error ?? 'No se encontró el reporte.'}
        </Text>
        <Pressable onPress={reintentar} style={estilos.boton} accessibilityRole="button">
          <Text style={estilos.botonTexto}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const fotosDelArreglo =
    reporte.estado === 'resuelto'
      ? reporte.fotos.filter((foto) => foto.momento === 'arreglo')
      : [];
  const textoEstado = ETIQUETAS_ESTADO[reporte.estado] ?? reporte.estado;
  const colorEstado = COLORES_ESTADO[reporte.estado] ?? '#64748B';

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <Stack.Screen options={{ title: `Reporte ${reporte.codigo || codigo || ''}` }} />

      {datosLocales ? (
        <View style={estilos.avisoOffline} accessibilityRole="text">
          <Ionicons name="cloud-offline-outline" size={18} color="#92400E" />
          <Text style={estilos.avisoOfflineTexto}>
            Mostrando los datos guardados en este dispositivo.
          </Text>
        </View>
      ) : null}

      <View style={estilos.seccion}>
        <Text style={estilos.titulo} accessibilityRole="header">
          Reporte {reporte.codigo || codigo || 'pendiente de sincronización'}
        </Text>
        <View
          style={[estilos.insigniaEstado, { backgroundColor: colorEstado }]}
          accessibilityRole="text"
          accessibilityLabel={`Estado: ${textoEstado}`}
        >
          <Text style={estilos.textoInsignia}>{textoEstado}</Text>
        </View>
        <Text style={estilos.dato}>
          {new Date(reporte.creadoEn).toLocaleString('es-AR')}
        </Text>
        <Text style={estilos.dato}>
          📍 {reporte.direccion || 'Ubicación registrada en el mapa'}
        </Text>
        {reporte.descripcion ? (
          <Text style={estilos.descripcion}>{reporte.descripcion}</Text>
        ) : null}
      </View>

      {reporte.estado === 'resuelto' ? (
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion} accessibilityRole="header">
            Así se resolvió
          </Text>
          {fotosDelArreglo.length > 0 ? (
            fotosDelArreglo.map((foto, indice) => (
              <FotoArreglo key={foto.id} foto={foto} indice={indice} total={fotosDelArreglo.length} />
            ))
          ) : (
            <Text style={estilos.dato}>
              El reporte figura como resuelto, pero no tiene una foto del arreglo adjunta.
            </Text>
          )}
        </View>
      ) : null}

      <View style={estilos.seccion}>
        <Text style={estilos.tituloSeccion} accessibilityRole="header">
          Historial del reporte
        </Text>
        {errorHistorial ? (
          <>
            <Text style={estilos.avisoHistorial} accessibilityRole="text">
              {errorHistorial}
            </Text>
            {internetDisponible === true && (!datosLocales || reporte.sincronizado) ? (
              <Pressable
                onPress={reintentar}
                accessibilityRole="button"
                style={estilos.reintentarHistorial}
              >
                <Text style={estilos.reintentarHistorialTexto}>Actualizar</Text>
              </Pressable>
            ) : null}
          </>
        ) : historial.length > 0 ? (
          historial.map((cambio) => (
            <View key={cambio.id} style={estilos.cambio}>
              <Text style={estilos.fechaCambio}>
                {new Date(cambio.fechaHora).toLocaleString('es-AR')}
              </Text>
              <Text style={estilos.estadoCambio}>
                {ETIQUETAS_ESTADO[cambio.estado] ?? cambio.estado}
              </Text>
              {cambio.comentario ? (
                <Text style={estilos.comentario}>{cambio.comentario}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={estilos.dato}>Todavía no hay cambios de estado registrados.</Text>
        )}
      </View>
    </ScrollView>
  );
}

function FotoArreglo({ foto, indice, total }: { foto: Foto; indice: number; total: number }) {
  return (
    <Image
      source={{ uri: foto.url }}
      style={estilos.fotoArreglo}
      contentFit="cover"
      accessible
      accessibilityLabel={`Foto de resolución ${indice + 1} de ${total}`}
    />
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#F8FAFC' },
  contenido: { padding: 16, gap: 16 },
  seccion: {
    padding: 16,
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  titulo: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  tituloSeccion: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  insigniaEstado: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  textoInsignia: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  dato: { fontSize: 15, color: '#475569' },
  descripcion: { fontSize: 16, color: '#1E293B', marginTop: 4 },
  fotoArreglo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 8, backgroundColor: '#E2E8F0' },
  cambio: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0', gap: 3 },
  fechaCambio: { fontSize: 13, color: '#64748B' },
  estadoCambio: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  comentario: { fontSize: 15, color: '#475569' },
  avisoOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
  },
  avisoOfflineTexto: { flex: 1, color: '#92400E', fontSize: 14 },
  avisoHistorial: { color: '#92400E', fontSize: 14 },
  reintentarHistorial: { alignSelf: 'flex-start', paddingVertical: 6 },
  reintentarHistorialTexto: { color: '#0B3A5D', fontSize: 14, fontWeight: '700' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  error: { color: '#B91C1C', fontSize: 16, textAlign: 'center' },
  boton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#0B3A5D' },
  botonTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
