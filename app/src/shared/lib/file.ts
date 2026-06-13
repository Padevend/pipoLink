import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from 'expo-media-library';
import { Platform } from "react-native";

export function formatBytes(bytes: number, decimals = 1) {
  if (!bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function fileExt(name: string): string {
  const parts = name.split('.');
  return parts.at(-1)?.toLowerCase() ?? '';
}

import { AsyncStorageService } from "./storage";
import { Alert } from "react-native";

export const SAF_URI_KEY = 'saf_documents_dir_uri';

export async function saveToPublicDocuments({
  sourceUri,
  filename,
  mimeType
}: {
  sourceUri: string,
  filename: string,
  mimeType: string | null
}): Promise<string> {
  if (Platform.OS === 'android') {
    let dirUri = await AsyncStorageService.get<string>(SAF_URI_KEY);
    
    // Check if we still have permission
    let hasPermission = false;
    if (dirUri) {
      try {
        await FileSystem.StorageAccessFramework.readDirectoryAsync(dirUri);
        hasPermission = true;
      } catch {
        hasPermission = false;
      }
    }

    if (!hasPermission) {
      // Ask user to pick a folder
      await new Promise<void>((resolve) => {
        Alert.alert(
          "Dossier de téléchargement",
          "Pour sauvegarder les documents de la bibliothèque dans votre téléphone, veuillez sélectionner ou créer un dossier (ex: PipoLink) dans la page suivante.",
          [{ text: "Compris", onPress: () => resolve() }]
        );
      });

      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        throw new Error("Permission refusée pour accéder au stockage public.");
      }
      dirUri = permissions.directoryUri;
      await AsyncStorageService.set(SAF_URI_KEY, dirUri);
    }

    // We have dirUri, create the file in that directory
    const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
      dirUri!,
      filename,
      mimeType || "application/octet-stream"
    );
    
    // Lecture et écriture en Base64 (copyAsync ne supporte pas les content:// en destination)
    const content = await FileSystem.readAsStringAsync(sourceUri, { encoding: FileSystem.EncodingType.Base64 });
    await FileSystem.writeAsStringAsync(destUri, content, { encoding: FileSystem.EncodingType.Base64 });
    
    return destUri;
  } else {
    // iOS: saving to documentDirectory makes it visible in the Files app (with UIFileSharingEnabled in app.json)
    const destDir = FileSystem.documentDirectory + "documents/pipolink/";
    const info = await FileSystem.getInfoAsync(destDir);
    
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
    }

    const destUri = destDir + filename;
    
    if (sourceUri !== destUri) {
      await FileSystem.copyAsync({ from: sourceUri, to: destUri });
    }
    
    return destUri;
  }
}

const ALBUM_NAME = 'PipolinkImages';

export async function saveToGallery(
  uri: string
): Promise<{ success: boolean; message: string }> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    return { success: false, message: 'Permission galerie refusée' };
  }

  let localUri = uri;
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    const filename = uri.split('/').pop()?.split('?')[0] ?? `pipolink_${Date.now()}.jpg`;
    const dest = `${FileSystem.cacheDirectory}${filename}`;
    const { uri: downloaded } = await FileSystem.downloadAsync(uri, dest);
    localUri = downloaded;
  }

  const asset = await MediaLibrary.createAssetAsync(localUri);

  const existing = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
  if (existing) {
    await MediaLibrary.addAssetsToAlbumAsync([asset], existing, false);
  } else {
    await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false);
  }

  return { success: true, message: 'Image enregistrée dans la galerie' };
}