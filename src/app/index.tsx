import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {

    const timer = setTimeout(() => {
      router.replace('/login');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={estilos.contenedor}>
      <ActivityIndicator size="large" color="#0B3A5D" />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});