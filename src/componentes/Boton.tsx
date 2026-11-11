import { Pressable, StyleSheet, Text } from 'react-native';

interface Props {
  texto: string;
  onPress: () => void;
  deshabilitado?: boolean;
}

// Botón grande y accesible, para las pantallas del operador.
export function Boton({ texto, onPress, deshabilitado = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      style={[estilos.boton, deshabilitado && estilos.deshabilitado]}
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado }}
    >
      <Text style={estilos.texto}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#0369A1',
  },
  deshabilitado: { opacity: 0.5 },
  texto: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
});