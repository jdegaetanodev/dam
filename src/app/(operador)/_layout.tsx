import { Tabs } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';

export default function OperadorTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0284C7',
        tabBarInactiveTintColor: '#64748B',
        headerShown: true,
        headerStyle: { backgroundColor: '#0284C7' },
        headerTintColor: '#FFFFFF',
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