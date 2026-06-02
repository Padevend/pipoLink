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

export async function saveToPublicDocuments({
  sourceUri,
  filename,
  mimeType
}: {
  sourceUri: string,
  filename: string,
  mimeType: string | null
}): Promise<string> {
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