import { Stack } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contextos/AuthContext';
import { BaseDatosProvider } from '../contextos/BaseDatosContext';
import { RedProvider } from '../contextos/RedContext';
import { SincronizacionReportesProvider } from '../contextos/SincronizacionReportesProvider';

function NavegadorPrincipal() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={estilos.cargando}>
        <ActivityIndicator size="large" color="#0B3A5D" />
      </View>
    );
  }

  const tieneSesion = !!usuario;
  const esVecino = usuario?.rol === 'vecino';
  const esOperador = usuario?.rol === 'operador';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      {/* 1. Rutas públicas: solo existen si NO hay sesión activa */}
      <Stack.Protected guard={!tieneSesion}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
      </Stack.Protected>

      {/* 2. Rutas del vecino: solo existen si hay sesión y el rol es 'vecino' */}
      <Stack.Protected guard={tieneSesion && esVecino}>
        <Stack.Screen name="(vecino)" />
        <Stack.Screen
          name="detalle-vecino/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#0B3A5D' },
            headerTintColor: '#FFFFFF',
            title: 'Detalle del reporte',
          }}
        />
      </Stack.Protected>

      {/* 3. Rutas del operador: solo existen si hay sesión y el rol es 'operador' */}
      <Stack.Protected guard={tieneSesion && esOperador}>
        <Stack.Screen name="(operador)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RedProvider>
        <BaseDatosProvider>
          <AuthProvider>
            <SincronizacionReportesProvider>
              <NavegadorPrincipal />
            </SincronizacionReportesProvider>
          </AuthProvider>
        </BaseDatosProvider>
      </RedProvider>
    </SafeAreaProvider>
  );
}

const estilos = StyleSheet.create({
  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});