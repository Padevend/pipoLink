import { useState } from "react";
import { useDocuments } from "../model/use_documents";
import { useToast } from "@/providers/toast/toastContext";
import type { Document } from "@/share/lib/api";
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  User,
  Download,
  FileIcon,
  AlertTriangle
} from "lucide-react";

export function DocumentsFeat() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Deletion Modal state
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);

  const { showToast } = useToast();
  
  const {
    documents,
    total,
    totalPages,
    loading,
    error,
    deleteDocument,
    actionLoading,
  } = useDocuments({ page, limit, search: searchQuery });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(search.trim());
  };

  const executeDelete = async () => {
    if (!docToDelete) return;
    try {
      await deleteDocument(docToDelete.id);
      showToast({
        type: "success",
        message: `Le document "${docToDelete.title}" a été supprimé et l'auteur notifié.`,
        duration: 4000,
      });
      setDocToDelete(null);
    } catch {
      // Error handled by hook
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8 select-none">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-800">
          Modération de la Bibliothèque
        </h1>
        <p className="text-xs text-zinc-500 font-medium mt-1">
          Surveillez, recherchez et supprimez les documents partagés non conformes
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-xs font-semibold p-4 rounded-xl">
          Erreur lors du chargement des documents: {(error as any).message || "Problème réseau."}
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="bg-white/60 border border-white/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm shadow-zinc-200/40 backdrop-blur-xl">
        <form onSubmit={handleSearchSubmit} className="w-full md:max-w-md relative group">
          <input
            type="text"
            placeholder="Rechercher par titre, cours, filière..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white/50 py-2 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 focus:border-orange-500/50 focus:bg-white focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all duration-200"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400 group-focus-within:text-orange-500 transition-colors">
            <Search size={16} strokeWidth={1.5} />
          </div>
          <button type="submit" className="hidden" />
        </form>
        
        <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
          {total} document(s) trouvé(s)
        </div>
      </div>

      {/* DOCUMENTS TABLE CARD */}
      <div className="bg-white/60 border border-white/80 rounded-2xl overflow-hidden shadow-sm shadow-zinc-200/40 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-200/60 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">Document</th>
                <th className="px-6 py-3.5">Taille / Format</th>
                <th className="px-6 py-3.5">Partagé par</th>
                <th className="px-6 py-3.5">Téléchargements</th>
                <th className="px-6 py-3.5">Date de Partage</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                    <div className="flex justify-center items-center space-x-2">
                      <Loader2 className="animate-spin text-orange-500" size={16} strokeWidth={2.5} />
                      <span className="text-xs font-semibold">Chargement de la bibliothèque...</span>
                    </div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 text-xs font-medium">
                    Aucun document trouvé.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/40 transition-colors duration-150">
                    <td className="px-6 py-4 max-w-sm">
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 h-8 w-8 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-500 flex-shrink-0">
                          <FileIcon size={14} strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-800 truncate" title={doc.title}>
                            {doc.title}
                          </p>
                          <p className="text-[10px] font-medium text-zinc-400 truncate mt-0.5" title={doc.description || ""}>
                            {doc.description || "Aucune description"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium">
                      <div className="space-y-0.5">
                        <p className="text-zinc-700 font-semibold">{formatFileSize(doc.fileSize)}</p>
                        <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">{doc.mimeType.split("/")[1] || doc.mimeType}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-zinc-600">
                      <div className="flex items-center space-x-2">
                        <User size={13} className="text-zinc-400" />
                        <span className="truncate">{doc.uploadedBy?.displayName || "Inconnu"}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-zinc-600">
                      <div className="flex items-center space-x-1.5">
                        <Download size={13} className="text-zinc-400" />
                        <span>{doc.downloadCount}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-zinc-500 text-xs font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Calendar size={13} className="text-zinc-400" />
                        <span>{formatDate(doc.createdAt)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDocToDelete(doc)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-600 bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10 hover:border-orange-500/20 transition-all duration-200 cursor-pointer active:scale-[0.97]"
                      >
                        <Trash2 size={13} />
                        <span>Supprimer</span>
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
          <div className="px-6 py-3 border-t border-zinc-200/60 flex items-center justify-between bg-zinc-50/30 backdrop-blur-md">
            <span className="text-xs font-medium text-zinc-400">
              Page {page} sur {totalPages}
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 transition-all cursor-pointer shadow-sm"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 transition-all cursor-pointer shadow-sm"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-md">
          <div className="w-full max-w-md bg-white/90 border border-white rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 mb-4 border border-orange-500/20">
              <AlertTriangle size={20} />
            </div>
            
            <h3 className="text-base font-bold text-zinc-800">Supprimer ce document ?</h3>
            
            <p className="mt-2 text-xs text-zinc-500 font-medium leading-relaxed">
              Êtes-vous sûr de vouloir supprimer le document{" "}
              <span className="font-bold text-zinc-800">"{docToDelete.title}"</span> ?
              Cette action est irréversible, le fichier sera retiré de la bibliothèque et l'auteur recevra une notification explicative.
            </p>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setDocToDelete(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={executeDelete}
                disabled={actionLoading}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-500/10 transition-all cursor-pointer"
              >
                {actionLoading && <Loader2 size={13} className="animate-spin" />}
                <span>Supprimer le document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
