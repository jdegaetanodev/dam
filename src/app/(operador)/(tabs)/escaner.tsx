import { useCallback, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';

import { Boton } from '../../../componentes/Boton';
import { obtenerReportePorCodigo } from '../../../servicios/operador';

// Forma del número de seguimiento según la API (regla R4): GCHU-2026-00412
const FORMATO_CODIGO = /^GCHU-\d{4}-\d{5}$/;

export default function EscanerScreen() {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const enfocada = useIsFocused();
  const [leyendo, setLeyendo] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Al volver a esta pestaña (por ejemplo, desde el detalle), se puede escanear otra vez.
  useFocusEffect(
    useCallback(() => {
      setLeyendo(false);
      setMensaje(null);
    }, [])
  );

  const alLeerCodigo = async ({ data }: BarcodeScanningResult) => {
    // Mientras se procesa un código, la cámara deja de leer (evita lecturas repetidas).
    setLeyendo(true);
    const codigo = data.trim();

    if (!FORMATO_CODIGO.test(codigo)) {
      setMensaje('Ese QR no es de un reporte de la Municipalidad.');
      return;
    }
    try {
      const reporte = await obtenerReportePorCodigo(codigo);
      router.push({ pathname: '/reporte/[id]', params: { id: reporte.id } });
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
    }
  };

  const escanearDeNuevo = () => {
    setMensaje(null);
    setLeyendo(false);
  };

  // Todavía no se sabe si hay permiso.
  if (!permiso) return null;

  if (!permiso.granted) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.texto}>Para escanear el QR de un reporte, la app necesita usar la cámara.</Text>
        {/* Si el permiso se negó para siempre, solo se puede cambiar desde la configuración del teléfono. */}
        <Boton
          texto={permiso.canAskAgain ? 'Permitir cámara' : 'Abrir configuración'}
          onPress={permiso.canAskAgain ? pedirPermiso : Linking.openSettings}
        />
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      {/* La cámara solo funciona mientras esta pestaña está a la vista. */}
      {enfocada ? (
        <CameraView
          style={estilos.camara}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={leyendo ? undefined : alLeerCodigo}
          accessibilityLabel="Cámara para escanear el código QR del reporte"
        />
      ) : null}

      <View style={estilos.panel}>
        {mensaje ? (
          <>
            <Text style={estilos.error} accessibilityRole="alert">
              {mensaje}
            </Text>
            <Boton texto="Escanear otro código" onPress={escanearDeNuevo} />
          </>
        ) : (
          <Text style={estilos.texto}>Apuntá la cámara al código QR del reporte.</Text>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#000000' },
  camara: { flex: 1 },
  panel: { padding: 16, gap: 12, backgroundColor: '#FFFFFF' },
  centro: { flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: '#FFFFFF' },
  texto: { fontSize: 18, color: '#1E293B', textAlign: 'center' },
  error: { fontSize: 18, color: '#B91C1C', textAlign: 'center' },
});