export interface DocumentModel {
  id: string;
  folderId: string;
  title: string;
  type: 'CC' | 'TD' | 'TP' | 'Examen' | 'Cours' | 'Résumé';
  niveau: string;
  ue: string;
  annee: number;
  description?: string;
  fileUrl: string;
  size: number;
  downloadCount: number;
  uploadedBy: string;
  createdAt: string;
}
