import { decryptFile } from '@/shared/crypto';
import * as FileSystemLegacy from 'expo-file-system/legacy';

interface Params {
    encryptedUri: string,
    chatKey: Uint8Array,
    outputFilename: string,
    iv: string,
}

export async function decryptAttachement({
    encryptedUri,
    chatKey,
    outputFilename,
    iv
}: Params): Promise<string> {
    // read uri content to buffer
    const buffer = await FileSystemLegacy.readAsStringAsync(encryptedUri, {
        encoding: FileSystemLegacy.EncodingType.Base64,
    })
    const encryptedBuffer = Uint8Array.from(atob(buffer), c => c.charCodeAt(0));

    // decrypt buffer with chatKey
    const decryptedBuffer = await decryptFile(encryptedBuffer, iv, chatKey);

    // write decrypted buffer to file and return file uri
    const outputUri = FileSystemLegacy.cacheDirectory + `attachememts/${outputFilename}`;
    // make directory if not exists
    await FileSystemLegacy.makeDirectoryAsync(FileSystemLegacy.cacheDirectory + 'attachememts', { intermediates: true });

    if (!decryptedBuffer) return "";

    await FileSystemLegacy.writeAsStringAsync(outputUri, btoa(String.fromCharCode(...decryptedBuffer)), {
        encoding: FileSystemLegacy.EncodingType.Base64,
    });

    return outputUri;
}