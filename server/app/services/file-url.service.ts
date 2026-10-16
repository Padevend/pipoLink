/**
 * URLs exposées aux clients. Elles pointent toutes vers l'API, jamais vers le
 * disque local, un bucket ou Google Drive. Les contrôles d'accès sont appliqués
 * au moment où le fichier est demandé.
 */
export const FileUrl = {
  avatar(userId: string): string {
    return `/files/avatars/${encodeURIComponent(userId)}`;
  },

  messageAttachment(attachmentId: string): string {
    return `/files/message-attachments/${encodeURIComponent(attachmentId)}`;
  },

  document(documentId: string): string {
    return `/files/documents/${encodeURIComponent(documentId)}`;
  },

  aiAttachment(documentId: string): string {
    return `/files/ai-attachments/${encodeURIComponent(documentId)}`;
  },

  announcementPoster(announcementId: string, variant: "poster" | "preview"): string {
    return `/files/announcements/${encodeURIComponent(announcementId)}/${variant}`;
  },
};
