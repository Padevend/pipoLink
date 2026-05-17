import * as Linking from 'expo-linking';

import { libraryApi } from '@/shared/api/library';
import { getStaticUri } from '@/shared/lib/static';

export async function openDocumentDownload(documentId: string): Promise<void> {
  const { fileUrl } = await libraryApi.downloadDocument(documentId);
  const url = getStaticUri(fileUrl);
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error('Impossible d’ouvrir le lien de téléchargement.');
  }
  await Linking.openURL(url);
}
