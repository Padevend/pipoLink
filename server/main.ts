import { serve } from "@hono/node-server";
import { createRouter } from "./start/kernel.js";
import { env } from "./config/envManager.js";
import { prisma } from "./config/database.js";
import { initWebSocket } from "./src/modules/websocket/index.js";
import { startKeyRotationJob } from "./app/jobs/key-rotation.job.js";
import { startSubscriptionExpirationJob } from "./app/jobs/subscription-expiration.job.js";
import { startAiTokenRestorationJob } from "./app/jobs/ai-token-restoration.job.js";
import { documentIngestionQueue } from "./app/services/document-ingestion-queue.service.js";
import app from "./index.js";

/**
 * Point d'entrée du serveur.
 * Vérifie la connexion base de données avant de démarrer.
 */
async function bootstrap() {
  // Vérification connexion base de données
  await prisma.$connect();
  console?.log("✅ Base de données connectée");

  const server = serve({
    fetch: app.fetch,
    port: Number(env.get("PORT")),
    hostname: env.get("HOST") ?? "0.0.0.0",
  }, (info) => {
    console?.log(`🚀 Serveur PipoLink démarré sur http://${info.address}:${info.port}`);
  });

  initWebSocket(server as any);
  startKeyRotationJob();
  startSubscriptionExpirationJob();
  startAiTokenRestorationJob();
  documentIngestionQueue.start();
}

bootstrap().catch((err) => {
  console?.error("❌ Erreur de démarrage :", err);
  process.exit(1);
});
