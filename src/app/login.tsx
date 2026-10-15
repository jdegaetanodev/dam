import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contextos/AuthContext';

export default function Login() {
  const insets = useSafeAreaInsets();
  const { iniciarSesion, iniciarSesionRapida } = useAuth();

  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  const inputClaveRef = useRef<TextInput>(null);

  const manejarLogin = async () => {
    setErrorMensaje(null);
    setEnviando(true);
    try {
      await iniciarSesion(email, clave);
    } catch (err: any) {
      setErrorMensaje(err.message || 'Error al iniciar sesión');
    } finally {
      setEnviando(false);
    }
  };

  const manejarBypass = async (rol: 'vecino' | 'operador') => {
    setErrorMensaje(null);
    setEnviando(true);
    try {
      await iniciarSesionRapida(rol);
    } catch (err: any) {
      setErrorMensaje(err.message || 'Error al acceder');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={estilos.flex}
    >
      <ScrollView
        contentContainerStyle={[
          estilos.scrollContainer,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={estilos.encabezado}>
          <Text style={estilos.titulo}>Reportes Urbanos</Text>
          <Text style={estilos.subtitulo}>Municipalidad de Gualeguaychú</Text>
        </View>

        <View style={estilos.formulario}>
          {errorMensaje && (
            <View style={estilos.cajaError}>
              <Text style={estilos.textoError}>{errorMensaje}</Text>
            </View>
          )}

          <Text style={estilos.etiqueta}>Correo electrónico</Text>
          <TextInput
            style={estilos.input}
            placeholder="ejemplo@correo.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => inputClaveRef.current?.focus()}
            editable={!enviando}
            accessibilityLabel="Campo de correo electrónico"
          />

          <Text style={estilos.etiqueta}>Contraseña</Text>
          <View style={estilos.inputClaveContenedor}>
            <TextInput
              ref={inputClaveRef}
              style={estilos.inputClave}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!mostrarClave}
              autoCapitalize="none"
              returnKeyType="go"
              value={clave}
              onChangeText={setClave}
              onSubmitEditing={manejarLogin}
              editable={!enviando}
              accessibilityLabel="Campo de contraseña"
            />
            <Pressable
              onPress={() => setMostrarClave(!mostrarClave)}
              style={estilos.botonMostrarClave}
              accessibilityLabel={mostrarClave ? 'Ocultar contraseña' : 'Ver contraseña'}
              role="button"
            >
              <Text style={estilos.textoMostrarClave}>
                {mostrarClave ? 'Ocultar' : 'Ver'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[estilos.botonPrincipal, enviando && estilos.botonDeshabilitado]}
            onPress={manejarLogin}
            disabled={enviando}
            role="button"
            accessibilityLabel="Iniciar sesión con credenciales"
          >
            {enviando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={estilos.textoBotonPrincipal}>Iniciar Sesión</Text>
            )}
          </Pressable>
        </View>

        <View style={estilos.seccionBypass}>
          <Text style={estilos.tituloBypass}>Accesos rápidos de evaluación:</Text>
          <View style={estilos.filaBypass}>
            <Pressable
              style={[estilos.botonBypass, estilos.bypassVecino]}
              onPress={() => manejarBypass('vecino')}
              disabled={enviando}
              role="button"
              accessibilityLabel="Ingresar rápido como Vecino"
            >
              <Text style={estilos.textoBypass}>Vecino</Text>
            </Pressable>

            <Pressable
              style={[estilos.botonBypass, estilos.bypassOperador]}
              onPress={() => manejarBypass('operador')}
              disabled={enviando}
              role="button"
              accessibilityLabel="Ingresar rápido como Operador"
            >
              <Text style={estilos.textoBypass}>Operador</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  encabezado: {
    marginTop: 20,
    alignItems: 'center',
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0B3A5D',
  },
  subtitulo: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 4,
  },
  formulario: {
    marginVertical: 24,
  },
  cajaError: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  textoError: {
    color: '#B91C1C',
    fontSize: 14,
  },
  etiqueta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 16,
  },
  inputClaveContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    marginBottom: 20,
  },
  inputClave: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  botonMostrarClave: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textoMostrarClave: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '600',
  },
  botonPrincipal: {
    backgroundColor: '#0B3A5D',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  seccionBypass: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  tituloBypass: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  filaBypass: {
    flexDirection: 'row',
    gap: 12,
  },
  botonBypass: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bypassVecino: {
    backgroundColor: '#0B3A5D',
  },
  bypassOperador: {
    backgroundColor: '#0284C7',
  },
  textoBypass: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});