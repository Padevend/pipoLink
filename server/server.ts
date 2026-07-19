import { serve } from "@hono/node-server";
import { createRouter } from "./start/kernel.js";
import { env } from "./config/envManager.js";
import { prisma } from "./config/database.js";
import { initWebSocket } from "./src/modules/websocket/index.js";
import { startKeyRotationJob } from "./app/jobs/key-rotation.job.js";
import { startSubscriptionExpirationJob } from "./app/jobs/subscription-expiration.job.js";
import { readFile } from "fs/promises";
import { join } from "path";
import { serveStatic } from "hono/serve-static";

/**
 * Point d'entrée du serveur.
 * Vérifie la connexion base de données avant de démarrer.
 */
async function bootstrap() {
  // Vérification connexion base de données
  await prisma.$connect();
  console?.log("✅ Base de données connectée");

  const app = createRouter();

  // router pour servir les fichiers statiques (ex: images, documents)
  app.use("storage/*", serveStatic({
    root: './',
    getContent: async (path): Promise<any> => {
      try {
        const filePath = join(process.cwd(), path)
        const content = await readFile(filePath)
        return content
      } catch (error) {
        return null // Retourne null si le fichier n'existe pas
      }
    },
  }));

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
}

bootstrap().catch((err) => {
  console?.error("❌ Erreur de démarrage :", err);
  process.exit(1);
});
