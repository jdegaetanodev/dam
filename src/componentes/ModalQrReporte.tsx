import QRCode from 'react-native-qrcode-svg';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface Props {
  visible: boolean;
  codigo: string;
  onClose: () => void;
}

export function ModalQrReporte({ visible, codigo, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={estilos.fondo}>
        <View
          style={estilos.tarjeta}
          accessibilityViewIsModal
        >
          <Text style={estilos.titulo} accessibilityRole="header">
            Código QR del reporte
          </Text>
          <Text style={estilos.instruccion}>
            Mostrale este código al operador para que pueda escanearlo.
          </Text>

          {codigo ? (
            <View style={estilos.qr}>
              <QRCode value={codigo} size={240} />
            </View>
          ) : null}

          <Text style={estilos.codigo}>{codigo}</Text>

          <Pressable
            onPress={onClose}
            style={estilos.boton}
            accessibilityRole="button"
            accessibilityLabel="Cerrar código QR"
          >
            <Text style={estilos.botonTexto}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  tarjeta: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  titulo: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  instruccion: {
    marginTop: 8,
    color: '#475569',
    fontSize: 15,
    textAlign: 'center',
  },
  qr: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  codigo: {
    marginTop: 16,
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  boton: {
    minHeight: 48,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#0B3A5D',
  },
  botonTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
