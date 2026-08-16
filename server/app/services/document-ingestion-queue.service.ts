import { readFile } from "fs/promises";
import path from "path";

import { prisma } from "../../config/database.js";
import { env } from "../../config/envManager.js";
import { RagService } from "./rag.service.js";

const POLL_INTERVAL_MS = 5_000;
const BATCH_SIZE = 3;

/**
 * Database-backed document ingestion queue. Queue state lives on Document so a
 * server restart cannot lose work and an already-ingested document is skipped.
 */
export class DocumentIngestionQueueService {
  private readonly rag = new RagService();
  private timer?: NodeJS.Timeout;
  private running = false;

  start() {
    if (this.timer) return;
    void this.recoverAndProcess();
    this.timer = setInterval(() => void this.processPending(), POLL_INTERVAL_MS);
  }

  async enqueue(documentId: string) {
    await prisma.document.updateMany({
      where: { id: documentId, isIngested: false, ingestionStatus: { not: "PROCESSING" } },
      data: { ingestionStatus: "PENDING", ingestionError: null, ingestionQueuedAt: new Date() },
    });
    void this.processPending();
  }

  async enqueueOutstanding() {
    const queued = await prisma.document.updateMany({
      where: { isIngested: false, ingestionStatus: { not: "PROCESSING" } },
      data: { ingestionStatus: "PENDING", ingestionError: null, ingestionQueuedAt: new Date() },
    });
    void this.processPending();
    return queued.count;
  }

  private async recoverAndProcess() {
    await prisma.document.updateMany({
      where: { isIngested: false, ingestionStatus: "PROCESSING" },
      data: { ingestionStatus: "PENDING", ingestionError: "Traitement interrompu: remis en file." },
    });
    await this.processPending();
  }

  private async processPending() {
    if (this.running || !this.rag.isAvailable()) return;
    this.running = true;
    try {
      for (let index = 0; index < BATCH_SIZE; index += 1) {
        const next = await prisma.document.findFirst({
          where: { isIngested: false, ingestionStatus: "PENDING" },
          orderBy: { ingestionQueuedAt: "asc" },
        });
        if (!next) break;

        const claimed = await prisma.document.updateMany({
          where: { id: next.id, isIngested: false, ingestionStatus: "PENDING" },
          data: {
            ingestionStatus: "PROCESSING",
            ingestionStartedAt: new Date(),
            ingestionAttempts: { increment: 1 },
            ingestionError: null,
          },
        });
        if (claimed.count === 0) continue;

        try {
          const file = await this.readDocument(next.fileUrl);
          await this.rag.ingest({
            file,
            originalName: next.fileName,
            mimeType: next.mimeType,
            documentId: next.id,
            filiere: next.filiere ?? "Général",
            niveau: next.niveau ?? "Général",
            ue: next.ue ?? "Général",
            type: next.type,
            ownerId: next.type === "AI_ATTACHMENT" ? next.uploaded_by_id : undefined,
          });
          await prisma.document.update({
            where: { id: next.id },
            data: { isIngested: true, ingestionStatus: "INGESTED", ingestionError: null, ingestedAt: new Date() },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[Document ingestion] ${next.id} failed:`, error);
          await prisma.document.updateMany({
            where: { id: next.id, isIngested: false },
            data: { ingestionStatus: "FAILED", ingestionError: message.slice(0, 1000) },
          });
        }
      }
    } finally {
      this.running = false;
    }
  }

  private async readDocument(fileUrl: string): Promise<Buffer> {
    if (fileUrl.startsWith("/storage/")) {
      const storageRoot = path.resolve(env.get("STORAGE_PATH"));
      const filePath = path.resolve(storageRoot, fileUrl.slice("/storage/".length));
      if (!filePath.startsWith(`${storageRoot}${path.sep}`)) {
        throw new Error("Chemin de document invalide.");
      }
      return readFile(filePath);
    }

    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`Téléchargement du document impossible (${response.status}).`);
    return Buffer.from(await response.arrayBuffer());
  }
}

export const documentIngestionQueue = new DocumentIngestionQueueService();
