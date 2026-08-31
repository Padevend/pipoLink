import { Hono } from "hono";
import { prisma } from "../../config/database.js";
import { StorageService } from "../../app/storage/services/storage.service.js";
import type { DriverType } from "../../app/storage/interface/storage-provider.interface.js";

const downloadRouter = new Hono();
const storageService = new StorageService();

/**
 * GET /download/:id
 *
 * Sert un fichier en mode streaming à partir de son ID en base de données.
 * Détecte automatiquement le driver de stockage à utiliser en fonction
 * du format de l'URL stockée (local, Google Drive, R2, GCS).
 */
downloadRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const doc = await prisma.document.findUnique({
    where: { id },
  });

  if (!doc) {
    return c.json({ code: "NOT_FOUND", message: "Fichier introuvable." }, 404);
  }

  // Incrémenter le compteur de téléchargement
  await prisma.document.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
  }).catch(() => {});

  const fileUrl = doc.fileUrl;

  // ── Résolution du driver et de la clé à partir de l'URL stockée ──────────

  let driver: DriverType;
  let key: string;

  if (fileUrl.startsWith("/storage/")) {
    // Local file — key = chemin relatif après /storage/
    driver = "local";
    key = fileUrl.replace("/storage/", "");
  } else if (fileUrl.includes("drive.google.com")) {
    // Google Drive — extraire le fileId
    driver = "google-drive";
    try {
      const urlObj = new URL(fileUrl);
      let fileId = urlObj.searchParams.get("id");
      if (!fileId && urlObj.pathname.includes("/file/d/")) {
        const parts = urlObj.pathname.split("/file/d/");
        if (parts[1]) fileId = parts[1].split("/")[0];
      }
      key = fileId || "";
    } catch {
      return c.json({ code: "INVALID_URL", message: "URL de fichier invalide." }, 400);
    }
  } else if (fileUrl.startsWith("r2://") || fileUrl.includes(".r2.dev/")) {
    // Cloudflare R2
    driver = "r2";
    if (fileUrl.startsWith("r2://")) {
      key = fileUrl.replace(/^r2:\/\/[^/]+\//, "");
    } else {
      const urlObj = new URL(fileUrl);
      key = urlObj.pathname.replace(/^\//, "");
    }
  } else if (fileUrl.includes("storage.googleapis.com")) {
    // Google Cloud Storage
    driver = "gcs";
    try {
      const urlObj = new URL(fileUrl);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      key = pathParts.slice(1).join("/");
    } catch {
      return c.json({ code: "INVALID_URL", message: "URL de fichier invalide." }, 400);
    }
  } else {
    // Fallback: tenter en local avec l'URL telle quelle
    driver = "local";
    key = fileUrl.replace(/^\//, "");
  }

  if (!key) {
    return c.json({ code: "INVALID_KEY", message: "Clé de fichier invalide." }, 400);
  }

  try {
    const buffer = await storageService.getFile(key, driver);

    // Déterminer les headers de réponse
    const contentType = doc.mimeType || "application/octet-stream";
    const fileName = doc.fileName || key.split("/").pop() || "file";

    // Inliner les images et PDFs, forcer le téléchargement pour le reste
    const isInlineable = contentType.startsWith("image/") || contentType === "application/pdf";
    const disposition = isInlineable
      ? `inline; filename="${fileName}"`
      : `attachment; filename="${fileName}"`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error(`[Download] Erreur lors de la lecture du fichier ${id}:`, err);
    return c.json(
      { code: "FILE_READ_ERROR", message: "Impossible de lire le fichier." },
      500,
    );
  }
});

export { downloadRouter };
