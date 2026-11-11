import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { AccionesReporte } from '../../../componentes/AccionesReporte';
import { Boton } from '../../../componentes/Boton';
import { InsigniaEstado } from '../../../componentes/InsigniaEstado';
import { obtenerZonas } from '../../../servicios/operador';
import {
  obtenerHistorialEstados,
  obtenerReportePorId,
  obtenerTiposDeReporte,
} from '../../../servicios/reportes';
import { CambioDeEstado, Foto, Reporte } from '../../../tipos';
import { ETIQUETAS_ESTADO } from '../../../utilidades/estados';
import { formatearFecha, textoAdhesiones } from '../../../utilidades/formato';

// Botón para escuchar la nota de voz. Es un componente aparte porque
// los hooks de expo-audio solo se usan cuando el reporte tiene audio.
function ReproductorAudio({ url }: { url: string }) {
  const player = useAudioPlayer(url);
  const estado = useAudioPlayerStatus(player);

  const alternar = () => {
    if (estado.playing) {
      player.pause();
      return;
    }
    // Si ya terminó, vuelve al principio.
    if (estado.didJustFinish || estado.currentTime >= estado.duration) player.seekTo(0);
    player.play();
  };

  return <Boton texto={estado.playing ? 'Pausar nota de voz' : 'Escuchar nota de voz'} onPress={alternar} />;
}

// Una sección de fotos con su título.
function Fotos({ titulo, fotos }: { titulo: string; fotos: Foto[] }) {
  return (
    <View style={estilos.seccion}>
      <Text style={estilos.tituloSeccion} accessibilityRole="header">
        {titulo}
      </Text>
      {fotos.map((foto, i) => (
        <Image
          key={foto.id}
          source={{ uri: foto.url }}
          style={estilos.foto}
          contentFit="cover"
          accessible
          accessibilityLabel={`${titulo}, ${i + 1} de ${fotos.length}`}
        />
      ))}
    </View>
  );
}

export default function DetalleReporteScreen() {
  // Expo Router pasa el id que viene en la dirección: /reporte/rep-00412
  const { id } = useLocalSearchParams<{ id: string }>();

  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [historial, setHistorial] = useState<CambioDeEstado[]>([]);
  const [nombreTipo, setNombreTipo] = useState('');
  const [nombreZona, setNombreZona] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pide el reporte, su historial y los nombres de su tipo y su zona.
  const cargar = useCallback(async () => {
    try {
      const [datos, cambios, tipos, zonas] = await Promise.all([
        obtenerReportePorId(id),
        obtenerHistorialEstados(id),
        obtenerTiposDeReporte(),
        obtenerZonas(),
      ]);
      if (!datos) {
        setError('No encontramos ese reporte.');
        return;
      }
      setReporte(datos);
      setHistorial(cambios);
      setNombreTipo(tipos.find((t) => t.id === datos.tipoId)?.nombre ?? '');
      setNombreZona(zonas.find((z) => z.id === datos.zonaId)?.nombre ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
    } finally {
      setCargando(false);
    }
  }, [id]);

  // Al abrir la pantalla ya está en "cargando", así que solo hace falta pedir los datos.
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  // Para volver a pedir (Reintentar o después de una acción), primero se muestra la carga.
  const recargar = () => {
    setCargando(true);
    setError(null);
    cargar();
  };

  if (cargando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator size="large" color="#0369A1" accessibilityLabel="Cargando el reporte" />
      </View>
    );
  }

  if (error || !reporte) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.textoError} accessibilityRole="alert">
          {error}
        </Text>
        <Boton texto="Reintentar" onPress={recargar} />
      </View>
    );
  }

  const fotosDelProblema = reporte.fotos.filter((f) => f.momento === 'problema');
  const fotosDelArreglo = reporte.fotos.filter((f) => f.momento === 'arreglo');

  return (
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.contenido}>
      {/* El título del encabezado muestra el número de seguimiento. */}
      <Stack.Screen options={{ title: `Reporte ${reporte.codigo}` }} />

      <View style={estilos.seccion}>
        <Text style={estilos.titulo}>
          {nombreTipo} - {reporte.direccion}
        </Text>
        <InsigniaEstado estado={reporte.estado} />
        <Text style={estilos.dato}>Zona: {nombreZona}</Text>
        <Text style={estilos.dato}>{textoAdhesiones(reporte.adhesiones)}</Text>
        {reporte.descripcion ? <Text style={estilos.descripcion}>{reporte.descripcion}</Text> : null}
        {reporte.audioUrl ? <ReproductorAudio url={reporte.audioUrl} /> : null}
      </View>

      <Fotos titulo="Fotos del problema" fotos={fotosDelProblema} />
      {fotosDelArreglo.length > 0 ? <Fotos titulo="Fotos del arreglo" fotos={fotosDelArreglo} /> : null}

      <View style={estilos.seccion}>
        <Text style={estilos.tituloSeccion} accessibilityRole="header">
          Qué fue pasando
        </Text>
        {historial.map((cambio) => (
          <View key={cambio.id} style={estilos.cambio}>
            <Text style={estilos.dato}>
              {formatearFecha(cambio.fechaHora)} · {ETIQUETAS_ESTADO[cambio.estado]}
            </Text>
            {cambio.comentario ? <Text style={estilos.comentario}>{`"${cambio.comentario}"`}</Text> : null}
          </View>
        ))}
      </View>

      {/* Después de cada acción, se vuelve a pedir el reporte para mostrar lo que quedó guardado. */}
      <AccionesReporte reporte={reporte} onCambio={recargar} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F8FAFC' },
  contenido: { padding: 16, gap: 16 },
  seccion: { padding: 16, gap: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  titulo: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  tituloSeccion: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  dato: { fontSize: 16, color: '#334155' },
  descripcion: { fontSize: 16, color: '#1E293B', marginTop: 4 },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: 8, backgroundColor: '#E2E8F0' },
  cambio: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  comentario: { fontSize: 16, color: '#475569', fontStyle: 'italic', marginTop: 2 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  textoError: { fontSize: 18, color: '#B91C1C', textAlign: 'center' },
});