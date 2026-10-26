import Ionicons from '@react-native-vector-icons/ionicons';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

const MAX_SEGUNDOS = 60;

interface Props {
  uri: string | null;
  onChange: (uri: string | null) => void;
}

function formatear(segundos: number) {
  const s = Math.max(0, Math.floor(segundos));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function GrabadorVoz({ uri, onChange }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const player = useAudioPlayer(uri);
  const playStatus = useAudioPlayerStatus(player);
  const [grabando, setGrabando] = useState(false);

  const segundosGrabados = (recState.durationMillis ?? 0) / 1000;

  // Corta solo al llegar al máximo (notas cortas).
  useEffect(() => {
    if (grabando && segundosGrabados >= MAX_SEGUNDOS) {
      detener();
    }
  }, [segundosGrabados, grabando]);

  async function empezar() {
    const permiso = await requestRecordingPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        'Permiso necesario',
        'Necesitamos acceso al micrófono para grabar la nota de voz. Podés activarlo desde los ajustes del teléfono.'
      );
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setGrabando(true);
  }

  async function detener() {
    await recorder.stop();
    setGrabando(false);
    await setAudioModeAsync({ allowsRecording: false });
    if (recorder.uri) onChange(recorder.uri);
  }

  function alternarReproduccion() {
    if (playStatus.playing) {
      player.pause();
    } else {
      if (playStatus.didJustFinish || playStatus.currentTime >= playStatus.duration) {
        player.seekTo(0);
      }
      player.play();
    }
  }

  function borrar() {
    player.pause();
    onChange(null);
  }

  // Estado 1: grabando
  if (grabando) {
    return (
      <View style={styles.caja}>
        <Text style={styles.cronometro} accessibilityLiveRegion="polite">
          {formatear(segundosGrabados)} / {formatear(MAX_SEGUNDOS)}
        </Text>
        <Pressable
          onPress={detener}
          role="button"
          accessibilityLabel="Detener grabación"
          style={[styles.boton, { backgroundColor: '#B91C1C' }]}
        >
          <Ionicons name="stop" size={32} color="#FFFFFF" />
          <Text style={styles.botonTexto}>Detener</Text>
        </Pressable>
      </View>
    );
  }

  // Estado 2: ya hay una nota grabada
  if (uri) {
    const progreso =
      playStatus.duration > 0 ? playStatus.currentTime / playStatus.duration : 0;
    return (
      <View style={styles.caja}>
        <View style={styles.filaReproductor}>
          <Pressable
            onPress={alternarReproduccion}
            role="button"
            accessibilityLabel={playStatus.playing ? 'Pausar nota de voz' : 'Escuchar nota de voz'}
            hitSlop={12}
            style={styles.botonRedondo}
          >
            <Ionicons name={playStatus.playing ? 'pause' : 'play'} size={32} color="#FFFFFF" />
          </Pressable>
          <View style={styles.barraFondo} accessibilityRole="progressbar">
            <View style={[styles.barraRelleno, { width: `${Math.min(progreso, 1) * 100}%` }]} />
          </View>
          <Text style={styles.tiempo}>
            {formatear(playStatus.currentTime)} / {formatear(playStatus.duration)}
          </Text>
        </View>
        <Pressable
          onPress={borrar}
          role="button"
          accessibilityLabel="Borrar nota de voz y volver a grabar"
          hitSlop={12}
          style={[styles.boton, styles.botonBorde]}
        >
          <Ionicons name="trash" size={28} color="#B91C1C" />
          <Text style={[styles.botonTexto, { color: '#B91C1C' }]}>Borrar y volver a grabar</Text>
        </Pressable>
      </View>
    );
  }

  // Estado 3: sin nota todavía
  return (
    <View style={styles.caja}>
      <Pressable
        onPress={empezar}
        role="button"
        accessibilityLabel="Grabar nota de voz"
        accessibilityHint="Toca para empezar a grabar. Podés hablar hasta un minuto."
        style={[styles.boton, { backgroundColor: '#1D4ED8' }]}
      >
        <Ionicons name="mic" size={32} color="#FFFFFF" />
        <Text style={styles.botonTexto}>Grabar nota de voz</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { gap: 12 },
  cronometro: { fontSize: 36, fontWeight: '800', textAlign: 'center', color: '#B91C1C' },
  boton: {
    minHeight: 64,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  botonBorde: { borderWidth: 3, borderColor: '#B91C1C', backgroundColor: '#FFFFFF' },
  botonTexto: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  filaReproductor: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botonRedondo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barraFondo: { flex: 1, height: 12, borderRadius: 6, backgroundColor: '#D1D5DB', overflow: 'hidden' },
  barraRelleno: { height: '100%', backgroundColor: '#1D4ED8' },
  tiempo: { fontSize: 16, fontWeight: '600', color: '#111827' },
});
