import { Stack } from 'expo-router';

// Navegación del operador: las pestañas (bandeja y escáner) y, encima de ellas,
// el detalle de un reporte, con su botón para volver.
export default function OperadorLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0284C7' },
        headerTintColor: '#FFFFFF',
      }}
    >
      {/* La primera pantalla de la lista es la que se abre al entrar. */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="reporte/[id]" options={{ title: 'Detalle del reporte' }} />
    </Stack>
  );
}