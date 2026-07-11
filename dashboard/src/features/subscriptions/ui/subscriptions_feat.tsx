import { useState } from "react";
import { useSubscriptions } from "../model/use_subscriptions";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Clock,
  Layers
} from "lucide-react";

export function SubscriptionsFeat() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { subscriptions, totalPages, loading, error } = useSubscriptions({ page, limit });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Jamais";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "expired":
        return "bg-zinc-100 text-zinc-400 border-zinc-200 line-through";
      case "canceled":
        return "bg-zinc-100 text-zinc-500 border-zinc-200 border-dashed";
      default:
        return "bg-zinc-100 text-zinc-600 border-zinc-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "Actif";
      case "expired":
        return "Expiré";
      case "canceled":
        return "Annulé";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-800">
          Suivi des Abonnements
        </h1>
        <p className="text-xs text-zinc-500 font-medium mt-1">
          Visualisez l'état des abonnements de vos membres, actifs ou expirés
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-xs font-semibold p-4 rounded-xl">
          Erreur lors du chargement des abonnements: {(error as any).message || "Problème réseau."}
        </div>
      )}

      {/* SUBSCRIPTIONS TABLE CARD */}
      <div className="bg-white/60 border border-white/80 rounded-2xl overflow-hidden shadow-sm shadow-zinc-200/40 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-200/60 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">Abonné</th>
                <th className="px-6 py-3.5">Plan / Formule</th>
                <th className="px-6 py-3.5">Statut Réel</th>
                <th className="px-6 py-3.5">Fin de Période</th>
                <th className="px-6 py-3.5">Dernière Mise à Jour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400">
                    <div className="flex justify-center items-center space-x-2">
                      <Loader2 className="animate-spin text-orange-500" size={16} strokeWidth={2.5} />
                      <span className="text-xs font-semibold">Chargement des abonnements...</span>
                    </div>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 text-xs font-medium">
                    Aucun abonnement trouvé.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/40 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-[11px] font-bold text-zinc-600 overflow-hidden flex-shrink-0">
                          {sub.userDisplayName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-800 truncate">{sub.userDisplayName}</p>
                          <p className="text-[10px] font-medium text-zinc-400 truncate mt-0.5">{sub.userEmail}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800 text-white border border-zinc-900 capitalize">
                        <Layers size={10} strokeWidth={2} />
                        <span>{sub.plan.toLowerCase()}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusStyles(sub.status)}`}>
                        {getStatusLabel(sub.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-zinc-600 text-xs font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Clock size={13} className="text-zinc-400" />
                        <span>{formatDate(sub.currentPeriodEnd)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-zinc-500 text-xs font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Calendar size={13} className="text-zinc-400" />
                        <span>{formatDate(sub.updatedAt)}</span>
                      </div>
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
    </div>
  );
}
