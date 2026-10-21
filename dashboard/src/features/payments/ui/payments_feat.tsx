import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePayments } from "../model/use_payments";
import { api, type AuditLog, type SystemStats } from "@/share/lib/api";


import {
  ChevronLeft, ChevronRight, Calendar,
  CreditCard, Wallet, TrendingUp, CalendarDays, Receipt
} from "lucide-react";
import { BillingAnalytics } from "./billing-analytics";
import { PaymentsSkeleton } from "./skeleton";

export function PaymentsFeat() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { payments, totalPages, loading: paymentsLoading, error } = usePayments({ page, limit });
  
  const { data: statsData, isLoading: statsLoading } = useQuery<{ stats: SystemStats; events: AuditLog[] }>({
    queryKey: ["system-stats-events"],
    queryFn: api.getStats,
  });
  
  const revenue = statsData?.stats?.revenue;
  const isInitialLoading = (paymentsLoading || statsLoading) && payments.length === 0;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    }).format(new Date(dateStr));
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount);
  };

  if (isInitialLoading) return <PaymentsSkeleton />;

  return (
    <div className="space-y-10 text-zinc-900 pb-10">
      
      {/* HEADER */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Finances & Paiements</h1>
        <p className="text-sm font-medium text-zinc-500 mt-2">
          Suivez les revenus, analysez le MRR et gérez l'historique des transactions.
        </p>
      </header>

      {/* ANALYTICS CHARTS */}
      <BillingAnalytics />

      {error && (
        <div className="bg-zinc-900 text-white px-6 py-4 rounded-[2rem] font-medium flex items-center gap-3">
          <CreditCard size={20} />
          <span>Erreur réseau : {(error as any).message || "Impossible de charger l'historique."}</span>
        </div>
      )}

      {/* REVENUE SUMMARY CARDS */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total */}
          <div className="bg-zinc-50 rounded-[2rem] p-6 flex items-center gap-5 hover:bg-zinc-100 transition-colors">
            <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center text-zinc-900 shrink-0 shadow-sm border border-zinc-100">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Revenu Global</p>
              <p className="text-2xl font-bold tracking-tight text-zinc-900">
                {formatMoney(revenue.totalRevenue)} <span className="text-sm text-zinc-500 font-medium ml-1">XAF</span>
              </p>
            </div>
          </div>
          
          {/* Mensuel */}
          <div className="bg-zinc-50 rounded-[2rem] p-6 flex items-center gap-5 hover:bg-zinc-100 transition-colors">
            <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center text-zinc-900 shrink-0 shadow-sm border border-zinc-100">
              <CalendarDays size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Revenu ce mois</p>
              <p className="text-2xl font-bold tracking-tight text-zinc-900">
                {formatMoney(revenue.revenueThisMonth)} <span className="text-sm text-zinc-500 font-medium ml-1">XAF</span>
              </p>
            </div>
          </div>
          
          {/* MRR */}
          <div className="bg-zinc-900 rounded-[2rem] p-6 flex items-center gap-5 text-white shadow-xl shadow-zinc-900/10">
            <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">MRR ({revenue.activePremium} VIP)</p>
              <p className="text-2xl font-bold tracking-tight">
                {formatMoney(revenue.mrr)} <span className="text-sm text-zinc-400 font-medium ml-1">XAF</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENTS TABLE */}
      <div className="bg-zinc-50 rounded-[2rem] overflow-hidden">
        
        <div className="px-8 py-6 border-b border-zinc-200/60 flex items-center justify-between">
          <h2 className="text-lg font-bold">Historique des transactions</h2>
        </div>

        <div className="overflow-x-auto px-8 pb-8 pt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-zinc-400 text-xs font-medium uppercase tracking-wider border-b border-zinc-200/60">
                <th className="pb-4 font-medium">Utilisateur</th>
                <th className="pb-4 font-medium">Montant</th>
                <th className="pb-4 font-medium hidden md:table-cell">Moyen & Réf</th>
                <th className="pb-4 font-medium">Statut</th>
                <th className="pb-4 font-medium hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-zinc-200/50">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-zinc-400">
                      <div className="bg-white p-4 rounded-full">
                        <Receipt size={32} className="text-zinc-300" />
                      </div>
                      <p className="text-sm font-medium text-zinc-500">Aucune transaction enregistrée.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="group hover:bg-white transition-colors">
                    
                    {/* UTILISATEUR */}
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center font-bold text-sm text-zinc-900 border border-zinc-100 shrink-0">
                          {payment.userDisplayName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-zinc-900">{payment.userDisplayName}</p>
                          <p className="text-xs text-zinc-500 truncate mt-0.5">{payment.userEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* MONTANT */}
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-1 font-bold text-zinc-900 text-base">
                        <span>{formatMoney(payment.amount / 100)}</span>
                        <span className="text-[10px] text-zinc-400 font-semibold uppercase">{payment.currency}</span>
                      </div>
                    </td>

                    {/* MOYEN DE PAIEMENT (Caché sur mobile) */}
                    <td className="py-4 pr-4 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 capitalize">
                        <CreditCard size={14} className="text-zinc-400" />
                        {payment.provider}
                      </div>
                      {payment.providerRef && (
                        <p className="text-[10px] text-zinc-400 font-mono mt-1 select-all">
                          {payment.providerRef.length > 15 ? payment.providerRef.substring(0, 15) + "..." : payment.providerRef}
                        </p>
                      )}
                    </td>

                    {/* STATUT (Monochrome Flat) */}
                    <td className="py-4 pr-4">
                      {["completed", "paid", "success"].includes(payment.status.toLowerCase()) ? (
                         <span className="bg-zinc-900 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Payé
                        </span>
                      ) : payment.status.toLowerCase() === "failed" ? (
                        <span className="bg-zinc-200 text-zinc-500 px-3 py-1 rounded-full text-xs font-semibold line-through decoration-zinc-400">
                          Échoué
                        </span>
                      ) : (
                        <span className="border-2 border-zinc-200 text-zinc-500 px-3 py-1 rounded-full text-xs font-semibold">
                          En attente
                        </span>
                      )}
                    </td>

                    {/* DATE (Caché sur tablette) */}
                    <td className="py-4 hidden lg:table-cell text-sm text-zinc-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
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
          <div className="px-8 py-4 border-t border-zinc-200/60 flex items-center justify-between bg-zinc-50">
            <span className="text-sm font-medium text-zinc-500">
              Page {page} sur {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-zinc-900 hover:bg-zinc-200 disabled:opacity-30 transition-colors shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-zinc-900 hover:bg-zinc-200 disabled:opacity-30 transition-colors shadow-sm"
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