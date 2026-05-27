import * as FileSystem from "expo-file-system/legacy";
//import { Album, Asset, requestPermissionsAsync } from 'expo-media-library';
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

// Android uniquement : StorageAccessFramework 
async function saveToPublicDocumentsAndroid(
  sourceUri: string,
  filename: string,
  mimeType: string
): Promise<string> {
  const SAF = FileSystem.StorageAccessFramework;

  // Demander permission au dossier Documents
  const permissions = await SAF.requestDirectoryPermissionsAsync();
  if (!permissions.granted) {
    throw new Error("Permission refusée pour accéder aux Documents");
  }

  // Créer le fichier dans le dossier choisi par l'utilisateur
  const destUri = await SAF.createFileAsync(
    permissions.directoryUri,
    filename,
    mimeType
  );

  // Lire le contenu du fichier téléchargé (depuis sandbox)
  const content = await FileSystem.readAsStringAsync(sourceUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Écrire dans le dossier public
  await SAF.writeAsStringAsync(destUri, content, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return destUri;
}

// iOS : copier dans documentDirectory (visible dans Files app)
async function saveToPublicDocumentsIOS(
  sourceUri: string,
  filename: string
): Promise<string> {
  const destDir = FileSystem.documentDirectory + "PipoLink/";
  const info = await FileSystem.getInfoAsync(destDir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
  }

  const destUri = destDir + filename;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
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
  if (Platform.OS === "android") {
    return saveToPublicDocumentsAndroid(sourceUri, filename, mimeType || "application/octet-stream");
  } else {
    return saveToPublicDocumentsIOS(sourceUri, filename);
  }
}

const ALBUM_NAME = 'PipolinkImages';

export async function saveToGallery(
  uri: string
): Promise<{ success: boolean; message: string }> {
  // const { status } = await requestPermissionsAsync();
  // if (status !== 'granted') {
  //   return { success: false, message: 'Permission galerie refusée' };
  // }

  // let localUri = uri;
  // if (uri.startsWith('http://') || uri.startsWith('https://')) {
  //   const filename = uri.split('/').pop()?.split('?')[0] ?? `pipolink_${Date.now()}.jpg`;
  //   const dest = `${FileSystem.cacheDirectory}${filename}`;
  //   const { uri: downloaded } = await FileSystem.downloadAsync(uri, dest);
  //   localUri = downloaded;
  // }

  // const asset = await Asset.create(localUri);

  // const existing = await Album.get(ALBUM_NAME);
  // if (existing) {
  //   await existing.add([asset]);
  // } else {
  //   await Album.create(ALBUM_NAME, [asset]);
  // }

  return { success: true, message: 'Image enregistrée dans la galerie' };
}