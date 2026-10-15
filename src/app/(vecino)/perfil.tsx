// src/app/(vecino)/perfil.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contextos/AuthContext';

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const { usuario, cerrarSesion } = useAuth();
  const [saliendo, setSaliendo] = useState(false);

  const manejarCierreSesion = async () => {
    setSaliendo(true);
    try {
      await cerrarSesion();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setSaliendo(false);
    }
  };

  return (
    <ScrollView
      style={estilos.flex}
      contentContainerStyle={[
        estilos.contenedor,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={estilos.encabezado}>
        <View style={estilos.avatarContenedor}>
          <Text style={estilos.avatarTexto}>
            {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={estilos.nombreUsuario}>{usuario?.nombre || 'Usuario'}</Text>
        <View style={estilos.badgeRol}>
          <Text style={estilos.textoBadgeRol}>
            Rol: {usuario?.rol ? usuario.rol.toUpperCase() : 'DESCONOCIDO'}
          </Text>
        </View>
      </View>

      <View style={estilos.seccionDatos}>
        <Text style={estilos.tituloSeccion}>Datos de la cuenta</Text>

        <View style={estilos.tarjetaFila}>
          <Text style={estilos.etiqueta}>Identificador:</Text>
          <Text style={estilos.valor}>{usuario?.id || '—'}</Text>
        </View>

        <View style={estilos.tarjetaFila}>
          <Text style={estilos.etiqueta}>Correo electrónico:</Text>
          <Text style={estilos.valor}>{usuario?.email || '—'}</Text>
        </View>

        <View style={estilos.tarjetaFila}>
          <Text style={estilos.etiqueta}>Teléfono:</Text>
          <Text style={estilos.valor}>{usuario?.telefono || 'No especificado'}</Text>
        </View>
      </View>

      <Pressable
        style={[estilos.botonCerrarSesion, saliendo && estilos.botonDeshabilitado]}
        onPress={manejarCierreSesion}
        disabled={saliendo}
        role="button"
        accessibilityLabel="Cerrar sesión de la cuenta"
      >
        {saliendo ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={estilos.textoBotonCerrar}>Cerrar Sesión</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contenedor: {
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  encabezado: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarContenedor: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0B3A5D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarTexto: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  nombreUsuario: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  badgeRol: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  textoBadgeRol: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '700',
  },
  seccionDatos: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tituloSeccion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  tarjetaFila: {
    marginBottom: 12,
  },
  etiqueta: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  valor: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  botonCerrarSesion: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBotonCerrar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});