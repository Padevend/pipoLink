import { downloadTask } from "@/shared/api/types";
import { saveToPublicDocuments } from "@/shared/lib/file";
import { localDb } from "@/shared/storage/local-db";
import { generateUUID } from "@/shared/utils/uuid";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { DownloadQueue } from "./download.queue";

class DownloadManager {
    private queue = new DownloadQueue();
    private downlaods = new Map<string, FileSystemLegacy.DownloadResumable>();

    public async start({
        documentId,
        filename,
        url,
    }: {
        documentId: string;
        url: string;
        filename: string;
    }) {
        const id = generateUUID();

        const localUri = FileSystemLegacy.documentDirectory + "documents/pipolink/" + filename;
        console.log("localUri", localUri);

        // verifie si le dossier existe sinon le cree
        const dirInfo = await FileSystemLegacy.getInfoAsync(FileSystemLegacy.documentDirectory + "documents/pipolink");
        if (!dirInfo.exists) {
            await FileSystemLegacy.makeDirectoryAsync(FileSystemLegacy.documentDirectory + "documents/pipolink", { intermediates: true });
        }

        const task: downloadTask = {
            id,
            document_id: documentId,
            filename,
            remote_uri: url,
            local_uri: localUri,
            mineType: undefined,
            progress: 0,
            totalBytes: 0,
            writtenBytes: 0,
            status: "queued",
            created_at: Date.now(),
            updated_at: Date.now(),
        };

        localDb.saveDownloadRepository(task);

        const download = FileSystemLegacy.createDownloadResumable(
            url,
            localUri,
            {},
            (progress) => {
                task.progress =
                    progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
                task.totalBytes = progress.totalBytesExpectedToWrite;
                task.writtenBytes = progress.totalBytesWritten;
                task.status = "downloading";
                task.updated_at = Date.now();

                localDb.saveDownloadRepository(task);
            }
        );

        this.downlaods.set(id, download);

        try {
            const result = await download.downloadAsync();
            task.status = "completed";
            task.progress = 1;

            if (!result || result.status !== 200) {
                throw new Error(`Téléchargement échoué (HTTP ${result?.status})`);
            }

            // save to documents
            const publicPath = await saveToPublicDocuments({
                sourceUri: result.uri,
                filename,
                mimeType: result.mimeType,
            });
            task.local_uri = publicPath;
            localDb.saveDownloadRepository(task);

            // Supprimer le temp
            await FileSystemLegacy.deleteAsync(result.uri, { idempotent: true });

            this.queue.next();
        } catch (e) {
            task.status = "failed";
            localDb.saveDownloadRepository(task);

            this.queue.next();
        }
    }

    public async pause(id: string) {
        const download = this.downlaods.get(id);

        if (!download) return;

        const pausedData = await download.pauseAsync();

        const task = localDb.getDownloadRepositoryById(id);

        if (!task) return;
        task.status = "paused";
        task.resume_data = pausedData.resumeData;

        localDb.saveDownloadRepository(task);
    }

    public async resume(id: string) {
        const task = localDb.getDownloadRepositoryById(id);
        if (!task) return;

        const resumable = new FileSystemLegacy.DownloadResumable(
            task.remote_uri,
            task.local_uri,
            {},
            undefined,
            task.resume_data || undefined,
        );
        this.downlaods.set(id, resumable);
        task.status = "downloading";

        localDb.saveDownloadRepository(task);
        await resumable.resumeAsync();
    }

    public async cancel(id: string) {
        const download = this.downlaods.get(id);

        if (download) {
            await download.cancelAsync();
        }

        const task = localDb.getDownloadRepositoryById(id);
        if (task) {
            await FileSystemLegacy.deleteAsync(task.local_uri, {
                idempotent: true,
            });
        }

        localDb.deleteDownloadRepository(id);
    }

    public async clearHistory() {
        this.downlaods.forEach((_, id) => {
            const task = localDb.getDownloadRepositoryById(id);
            if (!task) return;

            if (["completed", "failed", "cancelled"].includes(task.status)) {
                this.downlaods.delete(id);
            }
        });

        localDb.clearDownlaodHistory();
    }
}

const downloadManager = new DownloadManager();

export { downloadManager };
