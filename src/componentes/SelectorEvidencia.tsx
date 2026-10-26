import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { CamaraModal } from './CamaraModal';
import { seleccionarDeGaleria, deleteStoredImage } from '../servicios/mediaService';

interface Props {
  onChange?: (uri: string | null) => void;
}

export const SelectorEvidencia: React.FC<Props> = ({ onChange }) => {
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [modalCamaraVisible, setModalCamaraVisible] = useState<boolean>(false);

  // Avisa al formulario padre cada vez que cambia la foto (se saca, se elige o se quita)
  useEffect(() => {
    onChange?.(fotoUri);
  }, [fotoUri]);

  // Handler para cuando se toma la foto con la cámara
  const handleFotoTomada = (uriPermanente: string) => {
    setFotoUri(uriPermanente);
  };

  // Handler para seleccionar de la galería
  const handleSeleccionarGaleria = async () => {
    const uriPermanente = await seleccionarDeGaleria();
    if (uriPermanente) {
      setFotoUri(uriPermanente);
    }
  };

  // Handler para eliminar la foto actual
  const handleQuitarFoto = async () => {
    if (fotoUri) {
      await deleteStoredImage(fotoUri);
      setFotoUri(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Evidencia Fotográfica</Text>

      {fotoUri ? (
        <View style={styles.previewContainer}>
          {/* Previsualización usando expo-image */}
          <Image
            source={{ uri: fotoUri }}
            style={styles.imagePreview}
            contentFit="cover"
            transition={300}
          />
          <TouchableOpacity style={styles.removeButton} onPress={handleQuitarFoto}>
            <Text style={styles.removeButtonText}>✕ Quitar Foto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setModalCamaraVisible(true)}
          >
            <Text style={styles.actionButtonText}>📷 Tomar Foto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.galleryButton]}
            onPress={handleSeleccionarGaleria}
          >
            <Text style={styles.actionButtonText}>🖼️ Abrir Galería</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Componente Modal de Cámara */}
      <CamaraModal
        visible={modalCamaraVisible}
        onClose={() => setModalCamaraVisible(false)}
        onFotoTomada={handleFotoTomada}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B3A5D',
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#0B3A5D',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  galleryButton: {
    backgroundColor: '#2B6CB0',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  previewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginBottom: 8,
  },
  removeButton: {
    backgroundColor: '#E53E3E',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
