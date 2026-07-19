import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePayments } from "../model/use_payments";
import { api, type AuditLog, type SystemStats } from "@/share/lib/api";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  DollarSign,
  CreditCard,
  Wallet,
  TrendingUp,
  CalendarDays
} from "lucide-react";

export function PaymentsFeat() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { payments, totalPages, loading, error } = usePayments({ page, limit });
  const { data: statsData } = useQuery<{ stats: SystemStats; events: AuditLog[] }>({
    queryKey: ["system-stats-events"],
    queryFn: api.getStats,
  });
  const revenue = statsData?.stats?.revenue;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
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
      case "completed":
      case "paid":
      case "success":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "failed":
        return "bg-zinc-100 text-zinc-400 border-zinc-200 line-through";
      case "pending":
        return "bg-zinc-100 text-zinc-500 border-zinc-200 border-dashed";
      default:
        return "bg-zinc-100 text-zinc-600 border-zinc-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
      case "success":
        return "Payé";
      case "failed":
        return "Échoué";
      case "pending":
        return "En attente";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-800">
          Historique des Paiements
        </h1>
        <p className="text-xs text-zinc-500 font-medium mt-1">
          Consultez et suivez toutes les transactions bancaires et abonnements réglés
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-xs font-semibold p-4 rounded-xl">
          Erreur lors du chargement des paiements: {(error as any).message || "Problème réseau."}
        </div>
      )}

      {/* REVENUE SUMMARY */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/60 border border-white/80 rounded-2xl p-4 flex items-center gap-3 shadow-sm shadow-zinc-200/40 backdrop-blur-xl">
            <div className="h-9 w-9 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-orange-500 shrink-0">
              <Wallet size={16} />
            </div>
            <div>
              <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Revenu Total</span>
              <p className="text-lg font-bold tracking-tight text-zinc-800">
                {revenue.totalRevenue.toLocaleString("fr-FR")} <span className="text-xs text-zinc-400 font-medium">XAF</span>
              </p>
            </div>
          </div>
          <div className="bg-white/60 border border-white/80 rounded-2xl p-4 flex items-center gap-3 shadow-sm shadow-zinc-200/40 backdrop-blur-xl">
            <div className="h-9 w-9 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-orange-500 shrink-0">
              <CalendarDays size={16} />
            </div>
            <div>
              <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Revenu ce mois</span>
              <p className="text-lg font-bold tracking-tight text-zinc-800">
                {revenue.revenueThisMonth.toLocaleString("fr-FR")} <span className="text-xs text-zinc-400 font-medium">XAF</span>
              </p>
            </div>
          </div>
          <div className="bg-white/60 border border-white/80 rounded-2xl p-4 flex items-center gap-3 shadow-sm shadow-zinc-200/40 backdrop-blur-xl">
            <div className="h-9 w-9 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-orange-500 shrink-0">
              <TrendingUp size={16} />
            </div>
            <div>
              <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">MRR ({revenue.activePremium} abonnés)</span>
              <p className="text-lg font-bold tracking-tight text-zinc-800">
                {revenue.mrr.toLocaleString("fr-FR")} <span className="text-xs text-zinc-400 font-medium">XAF</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENTS TABLE CARD */}
      <div className="bg-white/60 border border-white/80 rounded-2xl overflow-hidden shadow-sm shadow-zinc-200/40 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-200/60 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">Utilisateur</th>
                <th className="px-6 py-3.5">Montant</th>
                <th className="px-6 py-3.5">Moyen de Paiement / ID</th>
                <th className="px-6 py-3.5">Statut</th>
                <th className="px-6 py-3.5">Date de Règlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400">
                    <div className="flex justify-center items-center space-x-2">
                      <Loader2 className="animate-spin text-orange-500" size={16} strokeWidth={2.5} />
                      <span className="text-xs font-semibold">Chargement de l'historique financier...</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 text-xs font-medium">
                    Aucune transaction enregistrée.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/40 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-[11px] font-bold text-zinc-600 overflow-hidden flex-shrink-0">
                          {payment.userDisplayName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-800 truncate">{payment.userDisplayName}</p>
                          <p className="text-[10px] font-medium text-zinc-400 truncate mt-0.5">{payment.userEmail}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium">
                      <div className="flex items-center space-x-0.5 font-bold text-zinc-800">
                        <DollarSign size={13} className="text-orange-500" strokeWidth={2.5} />
                        <span>{(payment.amount / 100).toFixed(2)}</span>
                        <span className="text-[9px] text-zinc-400 font-medium uppercase ml-0.5">{payment.currency}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-zinc-600">
                          <CreditCard size={12} className="text-zinc-400" />
                          <span className="capitalize text-[11px] font-semibold">{payment.provider}</span>
                        </div>
                        {payment.providerRef && (
                          <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 select-all">
                            Réf: {payment.providerRef}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusStyles(payment.status)}`}>
                        {getStatusLabel(payment.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-zinc-500 text-xs font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Calendar size={13} className="text-zinc-400" />
                        <span>{formatDate(payment.paidAt || payment.createdAt)}</span>
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
