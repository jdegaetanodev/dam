import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

interface Props {
  internetDisponible: boolean | null;
  mensaje: string;
}

export function AvisoSinConexion({ internetDisponible, mensaje }: Props) {
  if (internetDisponible !== false) return null;

  return (
    <View style={estilos.contenedor} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={22} color="#92400E" />
      <Text style={estilos.mensaje}>{mensaje}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
  },
  mensaje: {
    flex: 1,
    color: '#78350F',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
