
import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import { saveImagePermanently } from '../servicios/mediaService';

interface CamaraModalProps {
  visible: boolean;
  onClose: () => void;
  onFotoTomada: (uriPermanente: string) => void;
}

export const CamaraModal: React.FC<CamaraModalProps> = ({
  visible,
  onClose,
  onFotoTomada,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [guardando, setGuardando] = useState<boolean>(false);
  
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
          <Text style={styles.permissionText}>
            Necesitamos acceso a la cámara para tomar la fotografía del incidente urbano.
          </Text>
          <TouchableOpacity style={styles.buttonPrimary} onPress={requestPermission}>
            <Text style={styles.buttonText}>Otorgar Permiso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonSecondary} onPress={onClose}>
            <Text style={styles.buttonSecondaryText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const toggleFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash((prev) => (prev === 'off' ? 'on' : 'off'));
  };

  const tomarFoto = async () => {
    if (!cameraRef.current || guardando) return;

    try {
      setGuardando(true);
      const foto = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (foto?.uri) {
        const uriPermanente = await saveImagePermanently(foto.uri);
        onFotoTomada(uriPermanente);
        onClose();
      }
    } catch (error) {
      console.error('Error al capturar la foto:', error);
      Alert.alert('Error', 'No se pudo capturar la fotografía. Intentá nuevamente.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* CameraView ocupa el fondo y se cierra sin hijos */}
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing={facing}
          flash={flash}
        />

        {/* Capa transparente superpuesta con los botones */}
        <View style={styles.overlay}>
          {/* Barra Superior */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
              <Text style={styles.iconText}>{flash === 'on' ? '⚡ ON' : '⚡ OFF'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={onClose}>
              <Text style={styles.iconText}>✕ Cerrar</Text>
            </TouchableOpacity>
          </View>

          {/* Barra Inferior */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleFacing}>
              <Text style={styles.iconText}>🔄 Girar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.captureButton} 
              onPress={tomarFoto}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator color="#FFFFFF" size="large" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>

            <View style={{ width: 60 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 40,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F7FA',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B3A5D',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonPrimary: {
    backgroundColor: '#0B3A5D',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonSecondary: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    color: '#718096',
    fontSize: 15,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  iconText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
});