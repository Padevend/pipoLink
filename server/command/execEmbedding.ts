import fs from "fs";
import path from "path";
import { prisma } from "../config/database.js";
import { env } from "../config/envManager.js";
import { RagService } from "../app/services/rag.service.js";

/**
 * Commande manuelle pour ré-ingérer et ré-indexer tous les documents de la base de données
 * dans le serveur Python RAG Engine (sauvegarde vectorielle Qdrant).
 *
 * Usage :
 *   pnpm tsx command/execEmbedding.ts
 *   pnpm tsx command/execEmbedding.ts --documentId=<id>
 */
class ExecEmbedding {
  private ragService = new RagService();

  async run() {
    const args = process.argv.slice(2);
    let targetDocId: string | undefined;

    for (const arg of args) {
      if (arg.startsWith("--documentId=")) {
        targetDocId = arg.split("=")[1];
      } else if (!targetDocId && !arg.startsWith("--")) {
        targetDocId = arg;
      }
    }

    console.log("==================================================");
    console.log("🚀 Lancement de l'ingestion vectorielle RAG (saveVector)");
    console.log("==================================================\n");

    if (!this.ragService.isAvailable()) {
      console.error("❌ Erreur : RAG_AGENT_API_URL n'est pas configuré dans l'environnement.");
      process.exit(1);
    }

    const whereCondition = targetDocId ? { id: targetDocId } : {};

    const documents = await prisma.document.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
    });

    if (documents.length === 0) {
      console.log("ℹ️ Aucun document trouvé à ingérer.");
      process.exit(0);
    }

    console.log(`📄 ${documents.length} document(s) trouvé(s) en base de données.\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const step = `[${i + 1}/${documents.length}]`;
      console.log(`${step} Traitement du document "${doc.title}" (ID: ${doc.id})...`);

      try {
        const buffer = await this.loadFileBuffer(doc.fileUrl);

        await this.ragService.ingest({
          file: buffer,
          originalName: doc.fileName || doc.title,
          mimeType: doc.mimeType || "application/pdf",
          documentId: doc.id,
          filiere: doc.filiere || "Général",
          niveau: doc.niveau || "Général",
          ue: doc.ue || "Général",
          type: doc.type,
          ownerId: doc.uploaded_by_id,
        });

        successCount++;
        console.log(`   ✅ Ingesté avec succès dans le RAG Engine.`);
      } catch (err: any) {
        failCount++;
        console.error(`   ❌ Échec de l'ingestion : ${err.message || err}`);
      }
    }

    console.log("\n==================================================");
    console.log("📊 Rapport final de la ré-indexation vectorielle");
    console.log("==================================================");
    console.log(` Documents traités : ${documents.length}`);
    console.log(` Réussis           : ${successCount}`);
    console.log(` Échecs            : ${failCount}`);
    console.log("==================================================\n");

    process.exit(failCount > 0 && successCount === 0 ? 1 : 0);
  }

  /**
   * Charge le Buffer du fichier depuis le stockage local ou via HTTP.
   */
  private async loadFileBuffer(fileUrl: string): Promise<Buffer> {
    if (fileUrl.startsWith("/storage/")) {
      const relativePath = fileUrl.replace("/storage/", "");
      const fullPath = path.join(env.get("STORAGE_PATH"), relativePath);

      if (!fs.existsSync(fullPath)) {
        throw new Error(`Fichier introuvable sur le disque local : ${fullPath}`);
      }

      return fs.readFileSync(fullPath);
    } else {
      const res = await fetch(fileUrl);
      if (!res.ok) {
        throw new Error(`Impossible de télécharger le fichier distant (${res.status} ${res.statusText}) : ${fileUrl}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  }
}

new ExecEmbedding().run().catch((err) => {
  console.error("❌ Erreur critique lors de l'exécution :", err);
  process.exit(1);
});