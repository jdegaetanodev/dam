import { Tabs } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';

export default function VecinoTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0B3A5D',
        tabBarInactiveTintColor: '#64748B',
        headerShown: true,
        headerStyle: { backgroundColor: '#0B3A5D' },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Tabs.Screen
        name="nuevo"
        options={{
          title: 'Nuevo Reporte',
          tabBarLabel: 'Reportar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mis-reportes"
        options={{
          title: 'Mis Reportes',
          tabBarLabel: 'Mis Reclamos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Mapa de la Ciudad',
          tabBarLabel: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}