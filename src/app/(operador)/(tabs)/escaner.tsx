import { View, Text, StyleSheet } from 'react-native';

export default function EscanerScreen() {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.texto}>Pantalla: Escáner QR (Operador)</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  texto: { fontSize: 16, color: '#334155' },
});