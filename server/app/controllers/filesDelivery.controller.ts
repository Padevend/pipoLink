import { HttpContext } from "../../config/app.js";
import { FileDelivery, FileDeliveryService } from "../services/file-delivery.service.js";

export class FilesDeliveryControllers {
    private service = new FileDeliveryService();

    public async serveLibraryDocuments(c: HttpContext) {
        const id = c.req.param("id");
        return this.serve(c, () => this.service.document(id!, c.get("userId") as string, c.get("role") as string))
    }

    public async serveAvatars(c: HttpContext) {
        console.log("id", c.req.param("userId"))
        return this.serve(c, () => this.service.avatar(c.req.param("userId") || ""));
    }

    public async serveMessageAttachements(c: HttpContext) {
        return this.serve(c, () => this.service.messageAttachment(c.req.param("id")!, c.get("userId") as string));
    }

    public async serveDocuments(c: HttpContext) {
        return this.serve(c, () => this.service.document(c.req.param("id")!, c.get("userId") as string, c.get("role") as string));
    }

    public async serveAiAttachements(c: HttpContext) {
        return this.serve(c, () => this.service.document(c.req.param("id")!, c.get("userId") as string, c.get("role") as string, true));
    }

    public async serveAnnouncements(c: HttpContext) {
        const variant = c.req.param("variant");
        if (variant !== "poster" && variant !== "preview") {
            return c.json({ code: "NOT_FOUND", message: "Variante de fichier introuvable." }, 404);
        }
        return this.serve(c, () => this.service.announcement(c.req.param("id") || "", variant));
    }

    private async serve(c: HttpContext, resolve: () => Promise<FileDelivery>) {
        try {
            const delivery = await resolve();
            const buffer = await this.service.read(delivery);
            const fileName = delivery.fileName.replace(/[\\"\r\n]/g, "_");
            const encodedName = encodeURIComponent(fileName);
            return new Response(new Uint8Array(buffer), {
                headers: {
                    "Content-Type": delivery.mimeType,
                    "Content-Length": String(buffer.length),
                    "Content-Disposition": `${delivery.disposition}; filename="${fileName}"; filename*=UTF-8''${encodedName}`,
                    "Cache-Control": delivery.cacheControl,
                    "X-Content-Type-Options": "nosniff",
                },
            });
        } catch (error: any) {
            console.error("[Files] Impossible de servir le fichier:", error);
            return c.json(
                { code: error?.code ?? "FILE_READ_ERROR", message: error?.message ?? "Impossible de lire le fichier." },
                error?.status ?? 502,
            );
        }
    }
}