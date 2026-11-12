// Notificaciones locales: avisan al vecino cuando un reporte suyo cambió de estado.
// La app guarda en el teléfono el último estado que vio de cada reporte y,
// cuando vuelve a pedir sus reportes, compara: si alguno cambió, lo avisa.

import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AsyncStorage } from 'expo-sqlite/kv-store';

import { Reporte } from '../tipos';
import { ETIQUETAS_ESTADO } from '../utilidades/estados';

const CLAVE_ESTADOS = 'estados-de-mis-reportes';
const CLAVE_YA_PREGUNTAMOS = 'avisos-ya-preguntamos';

// Con la app abierta, el aviso también se muestra.
// (En Android, sin sonido el aviso desplegable no aparece).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Muestra para qué sirven los avisos antes del permiso del sistema.
const preguntarAlVecino = () =>
  new Promise<boolean>((resolve) =>
    Alert.alert(
      'Avisos de tus reportes',
      'Te avisamos cuando cambie el estado de un reporte tuyo. Podés cambiarlo después en los ajustes del teléfono.',
      [
        { text: 'Ahora no', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Permitir', onPress: () => resolve(true) },
      ]
    )
  );

// Devuelve si se pueden mostrar avisos. Pregunta una sola vez; si el vecino
// dice que no, la app sigue funcionando igual, sin avisos.
const hayPermiso = async (): Promise<boolean> => {
  // Android necesita un "canal" antes de poder pedir el permiso y mostrar avisos.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Estado de mis reportes',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const permiso = await Notifications.getPermissionsAsync();
  if (permiso.granted) return true;
  if (!permiso.canAskAgain || (await AsyncStorage.getItemAsync(CLAVE_YA_PREGUNTAMOS))) return false;

  await AsyncStorage.setItemAsync(CLAVE_YA_PREGUNTAMOS, 'si');
  if (!(await preguntarAlVecino())) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
};

// Compara los reportes con los estados guardados y avisa los que cambiaron.
// Nunca hace fallar la pantalla: si algo sale mal, solo no hay aviso.
export const avisarCambiosDeEstado = async (reportes: Reporte[]) => {
  try {
    const guardado = await AsyncStorage.getItemAsync(CLAVE_ESTADOS);
    const conocidos: Record<string, string> = guardado ? JSON.parse(guardado) : {};

    // Un reporte que la app nunca vio no se avisa: solo se guarda su estado.
    const cambiados = reportes.filter((r) => conocidos[r.id] && conocidos[r.id] !== r.estado);

    reportes.forEach((r) => {
      conocidos[r.id] = r.estado;
    });
    await AsyncStorage.setItemAsync(CLAVE_ESTADOS, JSON.stringify(conocidos));

    if (!(await hayPermiso())) return;

    for (const reporte of cambiados) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Tu reporte cambió de estado',
          body: `${reporte.codigo}: ahora está "${ETIQUETAS_ESTADO[reporte.estado]}".`,
        },
        trigger: null, // se muestra ya
      });
    }
  } catch (error) {
    console.warn('No se pudo revisar el estado de los reportes:', error);
  }
};