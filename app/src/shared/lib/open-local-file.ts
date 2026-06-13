/**
 * openLocalFile.ts — corrigé pour Android SAF + FileProvider
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';

export function guessMimeFromUri(uri: string): string {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf:  'application/pdf',
    doc:  'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt:  'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xls:  'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    png:  'image/png',
    webp: 'image/webp',
    gif:  'image/gif',
    mp4:  'video/mp4',
    mp3:  'audio/mpeg',
    txt:  'text/plain',
    csv:  'text/csv',
    zip:  'application/zip',
  };
  return (ext && map[ext]) ? map[ext] : 'application/octet-stream';
}

function normalizeFileUri(uri: string): string {
  if (uri.startsWith('file://') || uri.startsWith('content://')) return uri;
  return `file://${uri}`;
}

/**
 * Si l'URI est un URI SAF (content://com.android.externalstorage...),
 * on ne peut pas le passer directement à getContentUriAsync ni à une app tierce.
 * On copie d'abord le fichier dans le cache interne de l'app,
 * puis on génère un content:// FileProvider depuis ce chemin interne.
 */
async function resolveToInternalUri(uri: string): Promise<string> {
  const isSafUri =
    uri.startsWith('content://com.android.externalstorage') ||
    uri.startsWith('content://com.android.providers');

  if (!isSafUri) return uri;

  const decoded = decodeURIComponent(uri);
  const rawName = decoded.split('/').pop() ?? `file_${Date.now()}`;

  // Séparer nom de base et extension AVANT sanitisation
  const lastDot = rawName.lastIndexOf('.');
  const baseName = lastDot !== -1 ? rawName.slice(0, lastDot) : rawName;
  const ext      = lastDot !== -1 ? rawName.slice(lastDot)    : '';  // ex: ".pdf"

  const cleanBase = baseName
    .replace(/\s+/g, '_')
    .replace(/[()[\]{}]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const cleanName = `${cleanBase}${ext.split(' ')[0]}`;

  const destUri = `${FileSystem.cacheDirectory}${cleanName}`;
  await FileSystem.copyAsync({ from: uri, to: destUri });
  return destUri;
}

// ─── ANDROID ──────────────────────────────────────────────────────────────────

async function openOnAndroid(fileUri: string, mimeType: string): Promise<void> {
  try {
    // 1. Résoudre vers un URI interne si c'est un URI SAF externe
    const internalUri = await resolveToInternalUri(fileUri);

    // 2. Convertir en content:// via FileProvider Expo (FLAG_GRANT_READ_URI_PERMISSION)
    let contentUri: string;
    if (internalUri.startsWith('content://')) {
      contentUri = internalUri;
    } else {
      contentUri = await FileSystem.getContentUriAsync(internalUri);
    }

    console.log('[openLocalFile] contentUri FileProvider:', contentUri);

    // 3. Lancer ACTION_VIEW via expo-intent-launcher (gère FLAG_GRANT_READ_URI_PERMISSION)
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      type: mimeType,
    });
  } catch (err: any) {
    const msg = String(err?.message ?? err);

    if (
      msg.includes('ActivityNotFoundException') ||
      msg.includes('No Activity found') ||
      msg.includes('Unable to resolve')
    ) {
      Alert.alert(
        'Application introuvable',
        `Aucune application installée ne peut ouvrir ce type de fichier (${mimeType}).\n\nInstallez une application compatible.`,
        [{ text: 'OK' }],
      );
    } else {
      throw err;
    }
  }
}

// ─── iOS ──────────────────────────────────────────────────────────────────────

async function openOnIOS(fileUri: string): Promise<void> {
  const canOpen = await Linking.canOpenURL(fileUri);
  if (!canOpen) {
    Alert.alert(
      "Impossible d'ouvrir",
      'Aucune application disponible pour ouvrir ce type de fichier.',
      [{ text: 'OK' }],
    );
    return;
  }
  await Linking.openURL(fileUri);
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

export async function openLocalFile(localUri: string, mimeType?: string): Promise<void> {
  const fileUri = normalizeFileUri(localUri);
  const resolvedMime = mimeType || guessMimeFromUri(localUri);

  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists) {
      Alert.alert(
        'Fichier introuvable',
        'Le fichier local est introuvable. Il a peut-être été supprimé.\nVeuillez le télécharger à nouveau.',
        [{ text: 'OK' }],
      );
      return;
    }
  } catch {
    // URI SAF ou distant — getInfoAsync peut échouer, on continue
  }

  try {
    if (Platform.OS === 'android') {
      await openOnAndroid(fileUri, resolvedMime);
    } else {
      await openOnIOS(fileUri);
    }
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    Alert.alert(
      "Erreur d'ouverture",
      `Impossible d'ouvrir ce fichier.\n\n${msg}`,
      [{ text: 'OK' }],
    );
    console.warn('[openLocalFile] failed:', err);
  }
}