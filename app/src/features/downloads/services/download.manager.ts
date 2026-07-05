import { downloadTask } from "@/shared/api/types";
import { saveToPublicDocuments } from "@/shared/lib/file";
import { localDb } from "@/shared/storage/local-db";
import { generateUUID } from "@/shared/utils/uuid";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { DownloadQueue } from "./download.queue";

class DownloadManager {
    private queue = new DownloadQueue();
    private downlaods = new Map<string, FileSystemLegacy.DownloadResumable>();

    private createProgressCallback(task: downloadTask) {
        return (progress: FileSystemLegacy.DownloadProgressData) => {
            task.progress = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
            task.totalBytes = progress.totalBytesExpectedToWrite;
            task.writtenBytes = progress.totalBytesWritten;
            task.status = "downloading";
            task.updated_at = Date.now();
            localDb.saveDownloadRepository(task);
        };
    }

    private async handleDownloadResult(
        task: downloadTask, 
        resultPromise: Promise<FileSystemLegacy.FileSystemDownloadResult | undefined>
    ) {
        try {
            const result = await resultPromise;
            
            // If result is undefined, it means the download was paused or cancelled.
            // We should just return without marking it as completed or failed.
            if (!result) return;

            if (result.status !== 200) {
                throw new Error(`Téléchargement échoué (HTTP ${result.status})`);
            }

            task.status = "completed";
            task.progress = 1;

            let dest_uri = await saveToPublicDocuments({
                sourceUri: result.uri, 
                filename: task.filename,
                mimeType: result.mimeType ?? null
            });

            task.local_uri = dest_uri;
            localDb.saveDownloadRepository(task);

            // Delete tmp
            await FileSystemLegacy.deleteAsync(result.uri, { idempotent: true }).catch(err => {
                console.log("Failed to delete tmp file:", err);
            });

            this.queue.next();
        } catch (e) {
            // Check if it's already marked as paused or cancelled
            const currentTask = localDb.getDownloadRepositoryById(task.id);
            if (currentTask && (currentTask.status === "paused" || currentTask.status === "cancelled")) {
                return;
            }

            task.status = "failed";
            localDb.saveDownloadRepository(task);

            this.queue.next();
        }
    }

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
            mimeType: undefined,
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
            this.createProgressCallback(task)
        );

        this.downlaods.set(id, download);

        await this.handleDownloadResult(task, download.downloadAsync());
    }

    public async pause(id: string) {
        const download = this.downlaods.get(id);
        if (!download) return;

        const task = localDb.getDownloadRepositoryById(id);
        if (!task) return;

        // Set status before pausing so that catch blocks know it was intentionally paused
        task.status = "paused";
        localDb.saveDownloadRepository(task);

        const pausedData = await download.pauseAsync();
        
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
            this.createProgressCallback(task),
            task.resume_data || undefined,
        );
        this.downlaods.set(id, resumable);
        task.status = "downloading";

        localDb.saveDownloadRepository(task);
        
        await this.handleDownloadResult(task, resumable.resumeAsync());
    }

    public async cancel(id: string) {
        const download = this.downlaods.get(id);

        const task = localDb.getDownloadRepositoryById(id);
        if (task) {
            task.status = "cancelled";
            localDb.saveDownloadRepository(task);
        }

        if (download) {
            await download.cancelAsync().catch(() => {});
        }

        if (task) {
            await FileSystemLegacy.deleteAsync(task.local_uri, {
                idempotent: true,
            }).catch(() => {});
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
