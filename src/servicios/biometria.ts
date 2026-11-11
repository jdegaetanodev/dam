import * as LocalAuthentication from 'expo-local-authentication';

export interface EstadoBiometria {
  soportaBiometria: boolean;
  tieneHuellasRegistradas: boolean;
}

/**
 * Consulta si el dispositivo físico tiene sensor biométrico y si hay huellas cargadas
 */
export async function verificarDisponibilidadBiometrica(): Promise<EstadoBiometria> {
  try {
    const soportaBiometria = await LocalAuthentication.hasHardwareAsync();
    const tieneHuellasRegistradas = await LocalAuthentication.isEnrolledAsync();

    return {
      soportaBiometria,
      tieneHuellasRegistradas,
    };
  } catch (error) {
    console.warn('Error al verificar compatibilidad biométrica:', error);
    return {
      soportaBiometria: false,
      tieneHuellasRegistradas: false,
    };
  }
}

/**
 * Solicita la autenticación por huella digital / biometría del sistema
 */
export async function autenticarConHuella(mensajePrompt: string = 'Colocá tu huella para reingresar'): Promise<boolean> {
  try {
    const { soportaBiometria, tieneHuellasRegistradas } = await verificarDisponibilidadBiometrica();

    if (!soportaBiometria || !tieneHuellasRegistradas) {
      return false;
    }

    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: mensajePrompt,
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Ingresar con contraseña',
      disableDeviceFallback: false,
    });

    return resultado.success;
  } catch (error) {
    console.error('Error durante la autenticación biométrica:', error);
    return false;
  }
}