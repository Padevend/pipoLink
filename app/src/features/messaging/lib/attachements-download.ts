import { localDb } from "@/shared/storage/local-db";
import * as FileSystemLegacy from 'expo-file-system/legacy';

interface Props {
    attachementId: string;
    encryptedUrl: string;
}

export async function DownloadAttachement({
    attachementId,
    encryptedUrl
}: Props) {
    const existing = localDb.getAttachementsById(attachementId);
    if (existing && existing.downloaded) {
        return existing.decrypted_local_uri;
    }

    const ecryptedPath = FileSystemLegacy.cacheDirectory + attachementId + '.enc';

    const result = await FileSystemLegacy.downloadAsync(encryptedUrl, ecryptedPath);
    return result.uri
}