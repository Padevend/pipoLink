import { useState } from "react";
import { useSubscriptions } from "../model/use_subscriptions";

// UI Components
import { ChevronLeft, ChevronRight, Loader2, Calendar, Clock, Layers, CreditCard } from "lucide-react";

export function SubscriptionsFeat() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { subscriptions, totalPages, loading, error } = useSubscriptions({ page, limit });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Jamais";
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    }).format(new Date(dateStr));
  };

  return (
    <div className="space-y-10 text-zinc-900 pb-10">
      {/* HEADER */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Abonnements</h1>
        <p className="text-sm font-medium text-zinc-500 mt-2">
          Visualisez l'état des souscriptions de vos membres, actifs ou expirés.
        </p>
      </header>

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-zinc-900 text-white px-6 py-4 rounded-[2rem] font-medium flex items-center gap-3">
          <CreditCard size={20} />
          <span>Erreur réseau : {(error as any).message || "Impossible de charger les abonnements."}</span>
        </div>
      )}

      {/* SUBSCRIPTIONS TABLE */}
      <div className="bg-zinc-50 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto px-8 pb-8 pt-4">
          <table className="w-full text-left border-collapse mt-4">
            <thead>
              <tr className="text-zinc-400 text-xs font-medium uppercase tracking-wider border-b border-zinc-200/60">
                <th className="pb-4 font-medium">Abonné</th>
                <th className="pb-4 font-medium hidden md:table-cell">Plan / Formule</th>
                <th className="pb-4 font-medium">Statut Réel</th>
                <th className="pb-4 font-medium hidden lg:table-cell">Fin de Période</th>
                <th className="pb-4 font-medium hidden xl:table-cell">Dernière MAJ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/50">
              {loading && subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Loader2 className="animate-spin mx-auto text-zinc-900" size={24} />
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-zinc-400">
                      <div className="bg-white p-4 rounded-full">
                        <CreditCard size={32} className="text-zinc-300" />
                      </div>
                      <p className="text-sm font-medium text-zinc-500">Aucun abonnement trouvé.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="group hover:bg-white transition-colors">
                    
                    {/* ABONNÉ */}
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center font-bold text-sm text-zinc-900 shrink-0 border border-zinc-100">
                          {sub.userDisplayName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-zinc-900">{sub.userDisplayName}</p>
                          <p className="text-xs text-zinc-500 truncate mt-0.5">{sub.userEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* PLAN */}
                    <td className="py-4 pr-4 hidden md:table-cell">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 text-white capitalize">
                        <Layers size={14} />
                        {sub.plan.toLowerCase()}
                      </span>
                    </td>

                    {/* STATUT */}
                    <td className="py-4 pr-4">
                      {sub.status.toLowerCase() === "active" ? (
                        <span className="bg-zinc-200 text-zinc-900 px-3 py-1 rounded-full text-xs font-semibold">
                          Actif
                        </span>
                      ) : sub.status.toLowerCase() === "expired" ? (
                        <span className="border-2 border-zinc-200 text-zinc-500 px-3 py-1 rounded-full text-xs font-semibold">
                          Expiré
                        </span>
                      ) : (
                        <span className="border border-zinc-300 text-zinc-700 px-3 py-1 rounded-full text-xs font-semibold border-dashed">
                          Annulé
                        </span>
                      )}
                    </td>

                    {/* FIN PÉRIODE */}
                    <td className="py-4 pr-4 hidden lg:table-cell text-sm text-zinc-500">
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>{formatDate(sub.currentPeriodEnd)}</span>
                      </div>
                    </td>

                    {/* DERNIÈRE MAJ */}
                    <td className="py-4 pr-4 hidden xl:table-cell text-sm text-zinc-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
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
    </div>
  );
}