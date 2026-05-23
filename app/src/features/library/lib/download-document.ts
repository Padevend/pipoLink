import { Paths, File } from "expo-file-system"
import { libraryApi } from '@/shared/api/library';
import { getStaticUri } from '@/shared/lib/static';

export async function openDocumentDownload(documentId: string): Promise<void> {
  const { fileUrl } = await libraryApi.downloadDocument(documentId);
  const url = getStaticUri(fileUrl);

  const file = new File(
    Paths.document + `/pipolink`,
    fileUrl.split('/').pop() ?? `document-${documentId}`
  )

  await File.downloadFileAsync(url, file);
}
