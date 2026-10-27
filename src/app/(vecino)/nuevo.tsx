import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CategoriaGrid } from '../../componentes/CategoriaGrid';
import { GrabadorVoz } from '../../componentes/GrabadorVoz';
import { SelectorEvidencia } from '../../componentes/SelectorEvidencia';
import { validarReporte } from '../../schemas/reporte';
import { crearReporte, obtenerTiposDeReporte } from '../../servicios/reportes';
import { Coordenadas, TipoDeReporte } from '../../tipos';

// TODO(Integrante 4): BORRAR esta constante cuando esté el componente de coordenadas.
// Es solo para poder probar el envío mientras tanto (Rocamora 1240).
const COORDENADAS_PRUEBA: Coordenadas = { latitud: -33.0089, longitud: -58.5142 };

export default function NuevoReporte() {
  const [tipos, setTipos] = useState<TipoDeReporte[]>([]);
  const [tipoId, setTipoId] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(COORDENADAS_PRUEBA);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [reinicio, setReinicio] = useState(0); // cambiar la key reinicia el selector de foto

  useEffect(() => {
    obtenerTiposDeReporte().then(setTipos);
  }, []);

  async function enviar() {
    const errs = validarReporte({
      tipoId: tipoId ?? '',
      descripcion,
      audioUri,
      fotos: fotoUri ? [fotoUri] : [],
      coordenadas,
    });
    setErrores(errs);
    if (Object.keys(errs).length > 0) {
      Alert.alert('Falta completar', Object.values(errs)[0]);
      return;
    }
    if (!tipoId || !fotoUri || !coordenadas) return; // ya validado; sirve para TypeScript

    setEnviando(true);
    try {
      const reporte = await crearReporte({
        tipoId,
        descripcion: descripcion.trim() || null,
        audioUrl: audioUri,
        fotos: [{ id: `fot-${Date.now()}`, url: fotoUri, momento: 'problema' }],
        coordenadas,
        direccion: '', // TODO(Integrante 4): dirección que resuelve la ubicación
        zonaId: '', // TODO: zona según el punto (la resuelve quien haga el mapa/zonas)
        estado: 'recibido',
        autorId: 'usr-084', // TODO: usuario logueado (AuthContext)
        cuadrillaId: null,
        duplicadoDe: null,
      });
      Alert.alert('¡Reporte enviado!', `Tu número de seguimiento es ${reporte.codigo}`);
      setTipoId(null);
      setDescripcion('');
      setAudioUri(null);
      setErrores({});
      setFotoUri(null);
      setReinicio((n) => n + 1);
    } catch {
      Alert.alert('No se pudo enviar', 'Probá de nuevo en un momento.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo} accessibilityRole="header">
          ¿Qué pasa?
        </Text>
        <CategoriaGrid tipos={tipos} seleccionadaId={tipoId} onSelect={setTipoId} />
        {errores.tipoId && <Text style={styles.error}>{errores.tipoId}</Text>}

        <Text style={styles.subtitulo}>Foto (obligatoria)</Text>
        <SelectorEvidencia key={reinicio} onChange={setFotoUri} />
        {errores.fotos && <Text style={styles.error}>{errores.fotos}</Text>}

        <Text style={styles.subtitulo}>Dónde</Text>
        <View style={styles.slot}>
          <Text style={styles.slotTexto}>
            Acá va el componente de coordenadas (Integrante 4).{'\n'}
            Por ahora se usa una ubicación de prueba.
          </Text>
        </View>
        {errores.coordenadas && <Text style={styles.error}>{errores.coordenadas}</Text>}

        <Text style={styles.subtitulo}>Contanos</Text>
        <TextInput
          style={styles.input}
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Escribí acá los detalles (o grabá un audio)"
          placeholderTextColor="#6B7280"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
          accessibilityLabel="Descripción del problema"
        />
        {errores.descripcion && <Text style={styles.error}>{errores.descripcion}</Text>}
        <GrabadorVoz uri={audioUri} onChange={setAudioUri} />

        <Pressable
          onPress={enviar}
          disabled={enviando}
          role="button"
          accessibilityLabel="Enviar reporte municipal"
          accessibilityHint="Envía el reporte al municipio"
          accessibilityState={{ disabled: enviando }}
          style={[styles.enviar, enviando && { opacity: 0.6 }]}
        >
          <Text style={styles.enviarTexto}>{enviando ? 'Enviando...' : 'Enviar Reporte'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 16, gap: 16, paddingBottom: 40 },
  titulo: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitulo: { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 8 },
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
  error: { fontSize: 18, color: '#B91C1C', fontWeight: '600' },
  slot: {
    minHeight: 80,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#9CA3AF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  slotTexto: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  enviar: {
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: '#14532D',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  enviarTexto: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
});
