import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
const CLAVE_TOKEN = 'token'; // misma clave que use el login del grupo

export class ApiError extends Error {
  constructor(public codigo: string, mensaje: string, public status: number) {
    super(mensaje);
  }
}

// TODO: borrar cuando el login real del grupo guarde el token en SecureStore
let tokenDemo: string | null = null;

async function obtenerToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(CLAVE_TOKEN);
  if (token || !__DEV__) return token;
  if (!tokenDemo) {
    try {
      const res = await fetch(`${BASE_URL}/auth/ingreso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'norma@mail.com', contrasena: 'demo1234' }),
      });
      tokenDemo = (await res.json())?.datos?.token ?? null;
    } catch {
      tokenDemo = null;
    }
  }
  return tokenDemo;
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
    // TODO: borrar este log cuando termine la depuración
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
  subir: <T>(ruta: string, formData: FormData) =>
    pedir<T>(ruta, { method: 'POST', body: formData }),
};