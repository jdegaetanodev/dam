import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SelectorEvidencia } from '../../componentes/SelectorEvidencia';

export default function NuevoReporteScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Pantalla: Nuevo Reporte (Vecino)</Text>
      
      {/* Componente temporal de prueba para Cámara y Galería */}
      <View style={styles.testCard}>
        <SelectorEvidencia />
      </View>
    </ScrollView>    
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  texto: { fontSize: 16, color: '#334155' },
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F5F7FA',
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B3A5D',
    marginBottom: 16,
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});