import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[estilos.contenedor, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>Reportes Urbanos</Text>
        <Text style={estilos.subtitulo}>Municipalidad de Gualeguaychú</Text>
      </View>

      <View style={estilos.seccionBotones}>
        <Text style={estilos.etiqueta}>Accesos directos de evaluación:</Text>

        <Pressable
          style={[estilos.boton, estilos.botonVecino]}
          onPress={() => router.replace('/(vecino)/nuevo')}
          accessible
          role="button"
          accessibilityLabel="Ingresar como Vecino"
        >
          <Text style={estilos.textoBoton}>Ingresar como Vecino</Text>
        </Pressable>

        <Pressable
          style={[estilos.boton, estilos.botonOperador]}
          onPress={() => router.replace('/(operador)/bandeja')}
          accessible
          role="button"
          accessibilityLabel="Ingresar como Operador"
        >
          <Text style={estilos.textoBoton}>Ingresar como Operador</Text>
        </Pressable>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  encabezado: {
    marginTop: 60,
    alignItems: 'center',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0B3A5D',
  },
  subtitulo: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
  },
  seccionBotones: {
    width: '100%',
    marginBottom: 40,
    gap: 16,
  },
  etiqueta: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 8,
  },
  boton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonVecino: {
    backgroundColor: '#0B3A5D',
  },
  botonOperador: {
    backgroundColor: '#0284C7',
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});