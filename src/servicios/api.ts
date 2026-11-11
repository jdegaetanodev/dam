import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.46:3000';
// Clave idéntica a la que definió AuthContext.tsx
const CLAVE_TOKEN = 'sesion_token_seguro';

export class ApiError extends Error {
  constructor(public codigo: string, mensaje: string, public status: number) {
    super(mensaje);
  }
}

async function obtenerToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(CLAVE_TOKEN);
  } catch (error) {
    console.warn('Error al leer token de SecureStore:', error);
    return null;
  }
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = await obtenerToken();
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${ruta}`, {
      ...opciones,
      headers: {
        ...(typeof opciones.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opciones.headers,
      },
    });
  } catch (err) {
    console.log('FETCH FALLÓ en', ruta, err);
    throw new ApiError('SIN_RED', 'No hay conexión. Probá de nuevo cuando tengas señal.', 0);
  }

  const cuerpo = await res.json().catch(() => null);

  if (!res.ok) {
    const e = cuerpo?.error;
    throw new ApiError(e?.codigo ?? 'ERROR', e?.mensaje ?? 'Ocurrió un error inesperado.', res.status);
  }

  return cuerpo.datos as T;
}

export const api = {
  get: <T>(ruta: string) => pedir<T>(ruta),
  post: <T>(ruta: string, body: unknown) =>
    pedir<T>(ruta, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(ruta: string, body: unknown) =>
    pedir<T>(ruta, { method: 'PATCH', body: JSON.stringify(body) }),
  subir: <T>(ruta: string, formData: FormData) =>
    pedir<T>(ruta, { method: 'POST', body: formData }),
};