import { useState } from "react";
import { useDocuments } from "../model/use_documents";
import { useToast } from "@/providers/toast/toastContext";
import type { Document } from "@/share/lib/api";

import {
  Search, Trash2, ChevronLeft, ChevronRight,
  Loader2, Calendar, User, Download,
  FileIcon, DatabaseZap, Activity, FileWarning
} from "lucide-react";
import { Input } from "@/share/ui/Input";
import { Button } from "@/share/ui/Button";
import { DocumentsSkeleton } from "./skeleton";

export function DocumentsFeat() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [docToDelete, setDocToDelete] = useState<Document | null>(null);

  const { showToast } = useToast();
  
  const {
    documents, total, totalPages, loading, error,
    deleteDocument, actionLoading,
    enqueueIngestion, ingestionLoading,
  } = useDocuments({ page, limit, search: searchQuery });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(search.trim());
  };

  const handleIngestion = async () => {
    try {
      await enqueueIngestion();
      showToast({ type: "success", message: "Ingestion lancée avec succès." });
    } catch { /* Géré par le hook */ }
  };

  const executeDelete = async () => {
    if (!docToDelete) return;
    try {
      await deleteDocument(docToDelete.id);
      showToast({ type: "success", message: `Document supprimé.`, duration: 4000 });
      setDocToDelete(null);
    } catch { /* Géré par le hook */ }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(dateStr));
  };

  // Affichage du Skeleton au chargement initial
  if (loading && documents.length === 0 && !searchQuery) {
    return <DocumentsSkeleton />;
  }

  return (
    <div className="space-y-10 text-zinc-900 pb-10">
      
      {/* HEADER */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Bibliothèque</h1>
        <p className="text-sm font-medium text-zinc-500 mt-2">
          Surveillez, analysez par IA et modérez les documents partagés.
        </p>
      </header>

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-zinc-900 text-white px-6 py-4 rounded-[2rem] font-medium flex items-center gap-3">
          <Activity size={20} />
          <span>Impossible de charger les documents : {(error as any).message || "Erreur réseau."}</span>
        </div>
      )}

      {/* TOOLBAR (Search & Actions) */}
      <div className="bg-zinc-50 rounded-[2rem] p-6 flex flex-col xl:flex-row gap-6 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full xl:max-w-md">
          <Input
            type="text"
            placeholder="Rechercher (titre, filière)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={20} />}
          />
          <button type="submit" className="hidden" />
        </form>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <Button
            variant="primary"
            onClick={handleIngestion}
            isLoading={ingestionLoading}
            leftIcon={<DatabaseZap size={18} />}
            className="w-full sm:w-auto"
          >
            Lancer l'Ingestion IA
          </Button>
          <div className="flex items-center justify-center px-6 h-14 bg-white rounded-full text-sm font-semibold text-zinc-500 shrink-0">
            {total} résultat(s)
          </div>
        </div>
      </div>

      {/* DOCUMENTS TABLE */}
      <div className="bg-zinc-50 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto px-8 pb-8 pt-4">
          <table className="w-full text-left border-collapse mt-4">
            <thead>
              <tr className="text-zinc-400 text-xs font-medium uppercase tracking-wider border-b border-zinc-200/60">
                <th className="pb-4 font-medium">Fichier</th>
                <th className="pb-4 font-medium hidden md:table-cell">Méta</th>
                <th className="pb-4 font-medium hidden lg:table-cell">Statistiques</th>
                <th className="pb-4 font-medium hidden xl:table-cell">Statut IA</th>
                <th className="pb-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-zinc-200/50">
              {loading && documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                     <Loader2 className="animate-spin mx-auto text-zinc-900" size={24} />
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-zinc-400">
                      <div className="bg-white p-4 rounded-full">
                        <FileWarning size={32} className="text-zinc-300" />
                      </div>
                      <p className="text-sm font-medium text-zinc-500">Aucun document trouvé.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="group hover:bg-white transition-colors">
                    
                    {/* FICHIER */}
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-zinc-500 shrink-0">
                          <FileIcon size={20} />
                        </div>
                        <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                          <p className="text-sm font-semibold truncate text-zinc-900" title={doc.title}>
                            {doc.title}
                          </p>
                          <p className="text-xs text-zinc-500 truncate mt-0.5">
                            {doc.description || "Aucune description"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* META (Taille, Format, Date) - Caché sur mobile */}
                    <td className="py-4 pr-4 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span className="text-zinc-300">•</span>
                        <span className="text-xs uppercase bg-white px-2 py-0.5 rounded-full">{doc.mimeType.split("/")[1] || "FILE"}</span>
                      </div>
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1.5">
                        <Calendar size={12} /> {formatDate(doc.createdAt)}
                      </p>
                    </td>

                    {/* STATISTIQUES (Auteur, DLs) - Caché sur tablette */}
                    <td className="py-4 pr-4 hidden lg:table-cell">
                      <div className="space-y-1.5 text-sm text-zinc-600">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-zinc-400" />
                          <span className="truncate max-w-[120px]">{doc.uploadedBy?.displayName || "Inconnu"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Download size={14} className="text-zinc-400" />
                          <span>{doc.downloadCount} téléchargements</span>
                        </div>
                      </div>
                    </td>

                    {/* STATUT IA - Caché sur petits écrans */}
                    <td className="py-4 pr-4 hidden xl:table-cell">
                      {doc.isIngested ? (
                        <span className="bg-zinc-900 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Ingéré
                        </span>
                      ) : doc.ingestionStatus === "PROCESSING" ? (
                        <span className="bg-zinc-200 text-zinc-900 px-3 py-1 rounded-full text-xs font-semibold flex items-center w-max gap-1">
                          <Loader2 size={10} className="animate-spin" /> En cours
                        </span>
                      ) : doc.ingestionStatus === "FAILED" ? (
                        <span className="border-2 border-zinc-900 text-zinc-900 px-3 py-1 rounded-full text-xs font-semibold">
                          Échec
                        </span>
                      ) : (
                        <span className="border-2 border-zinc-200 text-zinc-500 px-3 py-1 rounded-full text-xs font-semibold">
                          En attente
                        </span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 text-right">
                      <button
                        onClick={() => setDocToDelete(doc)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-zinc-900 bg-zinc-200 hover:bg-zinc-300 transition-colors"
                      >
                        <Trash2 size={14} /> <span className="hidden sm:inline">Supprimer</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="px-8 py-4 border-t border-zinc-200/60 flex items-center justify-between bg-zinc-50">
            <span className="text-sm font-medium text-zinc-500">
              Page {page} sur {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-zinc-900 hover:bg-zinc-200 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-zinc-900 hover:bg-zinc-200 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE SUPPRESSION */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl">
            <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-6">
              <Trash2 size={24} className="text-zinc-900" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Supprimer le document ?</h3>
            <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
              Le document <span className="font-semibold text-zinc-900">"{docToDelete.title}"</span> sera supprimé de la base de données. L'auteur sera notifié. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setDocToDelete(null)} disabled={actionLoading}>
                Annuler
              </Button>
              <Button variant="primary" fullWidth onClick={executeDelete} isLoading={actionLoading}>
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}