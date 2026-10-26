import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TipoDeReporte } from '../tipos';

interface Props {
  tipos: TipoDeReporte[];
  seleccionadaId: string | null;
  onSelect: (id: string) => void;
}

// La cuadrícula se arma con los TipoDeReporte que devuelve el servicio,
// así si la API agrega o cambia categorías no hay que tocar este componente.
export function CategoriaGrid({ tipos, seleccionadaId, onSelect }: Props) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {tipos.map((t) => {
        const activa = seleccionadaId === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => onSelect(t.id)}
            role="radio"
            accessibilityState={{ selected: activa }}
            accessibilityLabel={`Categoría ${t.nombre}`}
            accessibilityHint="Toca para elegir este tipo de problema"
            style={[
              styles.boton,
              { backgroundColor: activa ? t.color : '#FFFFFF', borderColor: t.color },
            ]}
          >
            <Ionicons
              name={t.icono as any}
              size={44}
              color={activa ? '#FFFFFF' : t.color}
            />
            <Text style={[styles.label, { color: activa ? '#FFFFFF' : '#111827' }]}>
              {t.nombre}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  boton: {
    width: '48%',
    minHeight: 110,
    borderWidth: 3,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 8,
  },
  label: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
});
