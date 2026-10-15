import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Usuario } from '../tipos';
import { loginConCredenciales, loginRapidoPorRol } from '../servicios/autenticacion';

interface AuthContextData {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (email: string, clave: string) => Promise<void>;
  iniciarSesionRapida: (rol: 'vecino' | 'operador') => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const CLAVE_TOKEN = 'sesion_token_seguro';
const CLAVE_USUARIO = 'sesion_usuario_datos';

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Al abrir la app, restauramos la sesión desde el almacenamiento seguro
  useEffect(() => {
    async function cargarSesionAlmacenada() {
      try {
        const token = await SecureStore.getItemAsync(CLAVE_TOKEN);
        const usuarioGuardado = await SecureStore.getItemAsync(CLAVE_USUARIO);

        if (token && usuarioGuardado) {
          setUsuario(JSON.parse(usuarioGuardado) as Usuario);
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
    setUsuario(respuesta.usuario);
  };

  const iniciarSesionRapida = async (rol: 'vecino' | 'operador') => {
    const respuesta = await loginRapidoPorRol(rol);
    await SecureStore.setItemAsync(CLAVE_TOKEN, respuesta.token);
    await SecureStore.setItemAsync(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
    setUsuario(respuesta.usuario);
  };

  const cerrarSesion = async () => {
    try {
      await SecureStore.deleteItemAsync(CLAVE_TOKEN);
      await SecureStore.deleteItemAsync(CLAVE_USUARIO);
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
        iniciarSesion,
        iniciarSesionRapida,
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