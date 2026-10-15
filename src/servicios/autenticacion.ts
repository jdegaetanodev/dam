import { Usuario } from '../tipos';
import { MOCK_USUARIOS } from '../mocks/reportes.mock';

export interface RespuestaAutenticacion {
  usuario: Usuario;
  token: string;
}

const demorar = (ms: number = 250) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Autentica un usuario con email y contraseña.
 * Para desarrollo y evaluación:
 * - Cualquier contraseña de 6 o más caracteres es válida para los usuarios del mock.
 */
export const loginConCredenciales = async (
  email: string,
  clave: string
): Promise<RespuestaAutenticacion> => {
  await demorar();

  const emailLimpio = email.trim().toLowerCase();

  if (!emailLimpio || !clave) {
    throw new Error('Completá el email y la contraseña.');
  }

  if (clave.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  const usuarioEncontrado = MOCK_USUARIOS.find(
    (u) => u.email.toLowerCase() === emailLimpio
  );

  if (!usuarioEncontrado) {
    throw new Error('Credenciales inválidas. Verificá tu email.');
  }

  // Generamos un token simulado hasta que esten las apis
  const token = `tok_${usuarioEncontrado.id}_${Date.now()}`;

  return {
    usuario: usuarioEncontrado,
    token,
  };
};

/**
 * Acceso directo rápido para desarrollo/evaluación (Bypass)
 */
export const loginRapidoPorRol = async (
  rol: 'vecino' | 'operador'
): Promise<RespuestaAutenticacion> => {
  await demorar(150);

  const usuario = MOCK_USUARIOS.find((u) => u.rol === rol);

  if (!usuario) {
    throw new Error(`No se encontró un usuario de prueba para el rol ${rol}.`);
  }

  const token = `tok_bypass_${usuario.id}_${Date.now()}`;

  return {
    usuario,
    token,
  };
};