import { File, Directory, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

// Nombre del subdirectorio para las evidencias
const INCIDENTS_DIRECTORY_NAME = 'incidents_photos';

/**
 * Guarda una imagen desde la caché temporal al almacenamiento permanente de la app.
 */
export const saveImagePermanently = async (tempUri: string): Promise<string> => {
  try {
    // 1. Instanciar y garantizar el directorio de destino permanente en Paths.document
    const targetDirectory = new Directory(Paths.document, INCIDENTS_DIRECTORY_NAME);
    if (!targetDirectory.exists) {
      targetDirectory.create();
    }

    // 2. Instanciar el archivo temporal (ubicado en la caché)
    const tempFile = new File(tempUri);

    // 3. Crear la referencia al archivo permanente de destino con nombre único
    const fileExtension = tempUri.split('.').pop() || 'jpg';
    const permanentFileName = `incidente_${Date.now()}.${fileExtension}`;
    const permanentFile = new File(targetDirectory, permanentFileName);

    // 4. Copiar desde caché hacia almacenamiento permanente
    tempFile.copy(permanentFile);

    return permanentFile.uri;
  } catch (error) {
    console.error('Error al guardar la imagen de forma permanente:', error);
    throw new Error('No se pudo guardar la fotografía en el almacenamiento local.');
  }
};

/**
 * Elimina una imagen persistida
 */
export const deleteStoredImage = async (fileUri: string): Promise<void> => {
  try {
    const file = new File(fileUri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn('No se pudo eliminar el archivo local:', error);
  }
};

/**
 * Abre la galería del dispositivo, permite elegir una foto y la guarda en almacenamiento permanente.
 */

export const seleccionarDeGaleria = async (): Promise<string | null> => {
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert('Se requiere permiso para acceder a la galería de fotos.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect:[4, 3],
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    // Accedemos al elemento del arreglo
    const tempUri = result.assets[0].uri;
    const permanentUri = await saveImagePermanently(tempUri);

    return permanentUri;
  } catch (error) {
    console.error('Error al seleccionar la foto de la galería:', error);
    alert('No se pudo cargar la imagen seleccionada.');
    return null;
  }
};