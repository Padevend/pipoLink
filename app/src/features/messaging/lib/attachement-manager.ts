import { MessageAttachment } from "@/shared/api/types";
import { localDb } from "@/shared/storage/local-db";
import { DownloadAttachement } from "./attachements-download";
import { decryptAttachement } from "./decrypt-attachement";

interface HandleAttachmentParams {
    attachment: MessageAttachment;
    chatKey: Uint8Array;
}

export async function handleAttachment({
    attachment,
    chatKey,
}: HandleAttachmentParams) {
    const cached = localDb.getAttachementsById(attachment.id);

    if (cached && cached.downloaded) {
        return {
            ...attachment,
            downloaded: true,
            decryptedLocalUri:
                cached.decrypted_local_uri,
        };
    }

    const encryptedUri =
        await DownloadAttachement({
            attachementId: attachment.id,
            encryptedUrl:
                attachment.fileUrl,
        });

    const decryptedUri = await decryptAttachement({
        encryptedUri,
        chatKey,
        outputFilename: attachment.fileName,
        iv: attachment.iv,
    });

    localDb.upsertAttachments({
        id: attachment.id,
        encryptedUrl: attachment.fileUrl,
        decryptedLocalUri: decryptedUri,
        filename: attachment.fileName,
        mimeType: attachment.mimeType,
    });

    return {
        ...attachment,
        downloaded: true,
        decryptedLocalUri: decryptedUri,
    };
}