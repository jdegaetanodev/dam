import { Usuario } from '../tipos';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.46:3000';

export interface RespuestaAutenticacion {
  usuario: Usuario;
  token: string;
}

interface ApiRespuestaExito<T> {
  datos: T;
  meta: any;
}

interface ApiRespuestaError {
  error: {
    codigo: string;
    mensaje: string;
  };
}

/**
 * Autentica un usuario con email y contraseña contra la API del profe
 */
export const loginConCredenciales = async (
  email: string,
  clave: string
): Promise<RespuestaAutenticacion> => {
  const emailLimpio = email.trim().toLowerCase();

  if (!emailLimpio || !clave) {
    throw new Error('Completá el email y la contraseña.');
  }

  if (clave.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  try {
    const respuesta = await fetch(`${API_URL}/auth/ingreso`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: emailLimpio,
        contrasena: clave, 
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      const errorApi = resultado as ApiRespuestaError;
      throw new Error(
        errorApi.error?.mensaje || 'Credenciales inválidas. Verificá tu email o contraseña.'
      );
    }

    const { token, usuario } = (resultado as ApiRespuestaExito<RespuestaAutenticacion>).datos;

    return {
      usuario,
      token,
    };
  } catch (error: any) {
    if (error.name === 'TypeError' || error.message?.includes('Network request failed')) {
      throw new Error(
        `No se pudo conectar con el servidor en ${API_URL}. Revisá la conexión y que la API esté corriendo.`
      );
    }
    throw error;
  }
};

/**
 * Acceso directo rápido para desarrollo/evaluación (Bypass)
 * Conectado a los usuarios de prueba provistos en la base de la cátedra:
 * - Vecino: norma@mail.com (clave: demo1234)
 * - Operador: operador.norte@demo.ar (clave: demo1234)
 */
export const loginRapidoPorRol = async (
  rol: 'vecino' | 'operador'
): Promise<RespuestaAutenticacion> => {
  const email = rol === 'vecino' ? 'norma@mail.com' : 'operador.norte@demo.ar';
  return loginConCredenciales(email, 'demo1234');
};