import { StyleSheet, Text, View } from 'react-native';
import { EstadoReporte } from '../tipos';
import { COLORES_ESTADO, ETIQUETAS_ESTADO } from '../utilidades/estados';

interface Props {
  estado: EstadoReporte;
}

// Muestra el estado de un reporte con su color. Se usa en la bandeja y en el detalle.
export function InsigniaEstado({ estado }: Props) {
  const etiqueta = ETIQUETAS_ESTADO[estado];

  return (
    <View
      style={[styles.insignia, { backgroundColor: COLORES_ESTADO[estado] }]}
      accessible
      accessibilityLabel={`Estado: ${etiqueta}`}
    >
      <Text style={styles.texto}>{etiqueta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  insignia: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  texto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});