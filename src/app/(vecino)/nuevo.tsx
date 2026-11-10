import { useEffect, useState } from 'react';
import {  Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput,} from 'react-native';
import * as Location from 'expo-location';
import { CategoriaGrid } from '../../componentes/CategoriaGrid';
import { GrabadorVoz } from '../../componentes/GrabadorVoz';
import { SelectorEvidencia } from '../../componentes/SelectorEvidencia';
import { SelectorUbicacion } from '../../componentes/SelectorUbicacion';
import { useAuth } from '../../contextos/AuthContext';
import { useBaseDatos } from '../../contextos/BaseDatosContext';
import { useEstadoRed } from '../../contextos/RedContext';
import { validarReporte } from '../../schemas/reporte';
import { obtenerTiposDeReporte } from '../../servicios/reportes';
import { guardarReporteLocal } from '../../servicios/reportesLocal';
import { sincronizarReporteLocal } from '../../servicios/sincronizacionReportes';
import { Coordenadas, Reporte, TipoDeReporte } from '../../tipos';
import { ApiError } from '../../servicios/api';

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
  const [tipos, setTipos] = useState<TipoDeReporte[]>([]);
  const [tipoId, setTipoId] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  const [coordenadas, setCoordenadas] =
    useState<Coordenadas | null>(COORDENADAS_PRUEBA);

  const [errores, setErrores] =
    useState<Record<string, string>>({});

  const [enviando, setEnviando] = useState(false);

  const [reinicio, setReinicio] = useState(0);

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
      Alert.alert(
        'Falta completar',
        Object.values(errs)[0]
      );
      return;
    }

    if (!tipoId || !fotoUri || !coordenadas) {
      return;
    }

    if (!usuario) {
      Alert.alert('Sesión no disponible', 'Iniciá sesión para guardar tu reporte.');
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

      // Reiniciar formulario
      setTipoId(null);
      setDescripcion('');
      setAudioUri(null);
      setErrores({});
      setFotoUri(null);
      setReinicio((n) => n + 1);

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

        <CategoriaGrid
          tipos={tipos}
          seleccionadaId={tipoId}
          onSelect={setTipoId}
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
          onChange={setFotoUri}
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
        />

        {errores.coordenadas && (
          <Text style={styles.error}>
            {errores.coordenadas}
          </Text>
        )}

        <Text style={styles.subtitulo}>
          Contanos
        </Text>

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

        {errores.descripcion && (
          <Text style={styles.error}>
            {errores.descripcion}
          </Text>
        )}

        <GrabadorVoz
          uri={audioUri}
          onChange={setAudioUri}
        />

        <Pressable
          onPress={enviar}
          disabled={enviando}
          role="button"
          accessibilityLabel="Enviar reporte municipal"
          accessibilityHint="Envía el reporte al municipio"
          accessibilityState={{
            disabled: enviando,
          }}
          style={[
            styles.enviar,
            enviando && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.enviarTexto}>
            {enviando
              ? 'Enviando...'
              : 'Enviar Reporte'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
