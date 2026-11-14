// src/contextos/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Usuario } from '../tipos';
import { loginConCredenciales, loginRapidoPorRol } from '../servicios/autenticacion';
import { autenticarConHuella, verificarDisponibilidadBiometrica } from '../servicios/biometria';

interface AuthContextData {
  usuario: Usuario | null;
  cargando: boolean;
  puedeReingresarConHuella: boolean;
  iniciarSesion: (email: string, clave: string) => Promise<void>;
  iniciarSesionRapida: (rol: 'vecino' | 'operador') => Promise<void>;
  reingresarOperadorConHuella: () => Promise<boolean>;
  cerrarSesion: () => Promise<void>;
}

const CLAVE_TOKEN = 'sesion_token_seguro';
const CLAVE_USUARIO = 'sesion_usuario_datos';
const CLAVE_ULTIMO_OPERADOR = 'sesion_ultimo_operador';
const CLAVE_TOKEN_OPERADOR = 'sesion_token_ultimo_operador';

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [puedeReingresarConHuella, setPuedeReingresarConHuella] = useState(false);

  // Al abrir la app, restauramos la sesión desde el almacenamiento seguro
  useEffect(() => {
    async function cargarSesionAlmacenada() {
      try {
        const token = await SecureStore.getItemAsync(CLAVE_TOKEN);
        const usuarioGuardado = await SecureStore.getItemAsync(CLAVE_USUARIO);
        const ultimoOperador = await SecureStore.getItemAsync(CLAVE_ULTIMO_OPERADOR);
        const tokenOperador = await SecureStore.getItemAsync(CLAVE_TOKEN_OPERADOR);

        if (token && usuarioGuardado) {
          setUsuario(JSON.parse(usuarioGuardado) as Usuario);
        } else if (ultimoOperador && tokenOperador) {
          // Si no hay sesión activa pero un operador ya usó la app previamente, comprobamos hardware
          const { soportaBiometria, tieneHuellasRegistradas } = await verificarDisponibilidadBiometrica();
          setPuedeReingresarConHuella(soportaBiometria && tieneHuellasRegistradas);
        }
      } catch (error) {
        console.error('Error al restaurar credenciales desde SecureStore:', error);
      } finally {
        setCargando(false);
      }
    }

    cargarSesionAlmacenada();
  }, []);

  const iniciarSesion = async (email: string, clave: string) => {
    const respuesta = await loginConCredenciales(email, clave);
    await SecureStore.setItemAsync(CLAVE_TOKEN, respuesta.token);
    await SecureStore.setItemAsync(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));

    if (respuesta.usuario.rol === 'operador') {
      await SecureStore.setItemAsync(CLAVE_ULTIMO_OPERADOR, JSON.stringify(respuesta.usuario));
      await SecureStore.setItemAsync(CLAVE_TOKEN_OPERADOR, respuesta.token);
      const { soportaBiometria, tieneHuellasRegistradas } = await verificarDisponibilidadBiometrica();
      setPuedeReingresarConHuella(soportaBiometria && tieneHuellasRegistradas);
    }

    setUsuario(respuesta.usuario);
  };

  const iniciarSesionRapida = async (rol: 'vecino' | 'operador') => {
    const respuesta = await loginRapidoPorRol(rol);
    await SecureStore.setItemAsync(CLAVE_TOKEN, respuesta.token);
    await SecureStore.setItemAsync(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));

    if (rol === 'operador') {
      await SecureStore.setItemAsync(CLAVE_ULTIMO_OPERADOR, JSON.stringify(respuesta.usuario));
      await SecureStore.setItemAsync(CLAVE_TOKEN_OPERADOR, respuesta.token);
      const { soportaBiometria, tieneHuellasRegistradas } = await verificarDisponibilidadBiometrica();
      setPuedeReingresarConHuella(soportaBiometria && tieneHuellasRegistradas);
    }

    setUsuario(respuesta.usuario);
  };

  const reingresarOperadorConHuella = async (): Promise<boolean> => {
    try {
      const operadorGuardado = await SecureStore.getItemAsync(CLAVE_ULTIMO_OPERADOR);
      const tokenOperador = await SecureStore.getItemAsync(CLAVE_TOKEN_OPERADOR);

      if (!operadorGuardado || !tokenOperador) return false;

      const autenticado = await autenticarConHuella('Colocá tu huella para reingresar como Operador');
      if (autenticado) {
        const datosOperador = JSON.parse(operadorGuardado) as Usuario;
        // Restauramos el token REAL y el usuario en SecureStore y en el estado global
        await SecureStore.setItemAsync(CLAVE_TOKEN, tokenOperador);
        await SecureStore.setItemAsync(CLAVE_USUARIO, operadorGuardado);
        setUsuario(datosOperador);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error en reingresarOperadorConHuella:', err);
      return false;
    }
  };

  const cerrarSesion = async () => {
    try {
      await SecureStore.deleteItemAsync(CLAVE_TOKEN);
      await SecureStore.deleteItemAsync(CLAVE_USUARIO);
      // Mantenemos CLAVE_ULTIMO_OPERADOR y CLAVE_TOKEN_OPERADOR para que pueda volver a entrar con huella
      const ultimoOperador = await SecureStore.getItemAsync(CLAVE_ULTIMO_OPERADOR);
      const tokenOperador = await SecureStore.getItemAsync(CLAVE_TOKEN_OPERADOR);
      if (ultimoOperador && tokenOperador) {
        const { soportaBiometria, tieneHuellasRegistradas } = await verificarDisponibilidadBiometrica();
        setPuedeReingresarConHuella(soportaBiometria && tieneHuellasRegistradas);
      }
    } catch (error) {
      console.error('Error al eliminar credenciales en SecureStore:', error);
    } finally {
      setUsuario(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        puedeReingresarConHuella,
        iniciarSesion,
        iniciarSesionRapida,
        reingresarOperadorConHuella,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};