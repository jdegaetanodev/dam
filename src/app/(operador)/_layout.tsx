import { Tabs } from 'expo-router';
import { Pressable, Text, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useAuth } from '../../contextos/AuthContext';

export default function OperadorTabsLayout() {
  const { cerrarSesion } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0284C7',
        tabBarInactiveTintColor: '#64748B',
        headerShown: true,
        headerStyle: { backgroundColor: '#0284C7' },
        headerTintColor: '#FFFFFF',
        headerRight: () => (
          <Pressable
            onPress={cerrarSesion}
            style={estilos.botonSalir}
            hitSlop={12}
            role="button"
            accessibilityLabel="Cerrar sesión de operador"
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            <Text style={estilos.textoSalir}>Salir</Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="bandeja"
        options={{
          title: 'Bandeja de Entrada',
          tabBarLabel: 'Reclamos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="file-tray-full-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="escaner"
        options={{
          title: 'Lector de Código QR',
          tabBarLabel: 'Escanear',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="qr-code-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const estilos = StyleSheet.create({
  botonSalir: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    gap: 4,
  },
  textoSalir: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});