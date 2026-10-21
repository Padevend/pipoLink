import { useHome } from "../model/use_home";
import {
  FileText, Megaphone, Activity, Clock, Laptop, MapPin, 
  RefreshCw, UserCheck, Wallet, CalendarDays, Sparkles, TrendingUp
} from "lucide-react";
import { getStaticUrl } from "@/share/lib/helpers";
import { HomeSkeleton } from "./skeleton";

export function HomeFeat() {
  const { stats, events, loading, error, refresh } = useHome();

  // Formateur de date natif plus performant
  const formatDate = (dateStr: string) => 
    new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }).format(new Date(dateStr));

  const statCards = stats ? [
    { label: "Comptes Actifs", value: stats.activeAccounts, sub: `/ ${stats.totalAccounts}`, icon: UserCheck },
    { label: "Documents", value: stats.totalDocuments, sub: "", icon: FileText },
    { label: "Annonces", value: stats.totalAnnouncements, sub: "", icon: Megaphone },
    { label: "Activités", value: events?.length || 0, sub: "récentes", icon: Activity },
    { label: "Revenu Total", value: stats.revenue.totalRevenue.toLocaleString("fr-FR"), sub: "XAF", icon: Wallet },
    { label: "Revenu ce mois", value: stats.revenue.revenueThisMonth.toLocaleString("fr-FR"), sub: "XAF", icon: CalendarDays },
    { label: "Abonnés Premium", value: stats.revenue.activePremium, sub: "", icon: Sparkles },
    { label: "MRR", value: stats.revenue.mrr.toLocaleString("fr-FR"), sub: "XAF", icon: TrendingUp },
  ] : [];

  if (loading && !stats) return <HomeSkeleton />;

  return (
    <div className="space-y-10 text-zinc-900 pb-10">
      
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supervision</h1>
          <p className="text-sm font-medium text-zinc-500 mt-2">
            Vue d'ensemble de l'activité et des revenus du système.
          </p>
        </div>
        <button
          onClick={() => refresh()}
          disabled={loading}
          className="flex items-center gap-2 h-12 px-6 rounded-full bg-zinc-900 hover:bg-black text-white font-medium transition-transform active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span>Actualiser</span>
        </button>
      </header>

      {/* ERROR BANNER (Monochrome Flat) */}
      {error && (
        <div className="bg-zinc-900 text-white px-6 py-4 rounded-[2rem] font-medium flex items-center gap-3">
          <Activity size={20} />
          <span>Impossible de charger les données : {(error as any).message || "Erreur réseau."}</span>
        </div>
      )}

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-zinc-50 rounded-[2rem] p-6 flex flex-col gap-6 hover:bg-zinc-100 transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-zinc-500 text-sm font-medium">{card.label}</span>
              <div className="bg-white p-3 rounded-full">
                <card.icon size={20} className="text-zinc-900" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-semibold tracking-tight text-zinc-900">
                {card.value} <span className="text-base text-zinc-500 font-medium ml-1">{card.sub}</span>
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* EVENTS TABLE (Flat Design) */}
      <section className="bg-zinc-50 rounded-[2rem] overflow-hidden">
        <div className="px-8 py-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Journal des événements</h2>
          <span className="bg-zinc-200 text-zinc-900 px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
            TEMPS RÉEL
          </span>
        </div>

        <div className="overflow-x-auto px-8 pb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-zinc-400 text-xs font-medium uppercase tracking-wider border-b border-zinc-200/60">
                <th className="pb-4 font-medium">Utilisateur</th>
                <th className="pb-4 font-medium">Action</th>
                <th className="pb-4 font-medium">Adresse IP</th>
                <th className="pb-4 font-medium hidden md:table-cell">Appareil</th>
                <th className="pb-4 font-medium hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-zinc-200/50">
              {events.length === 0 ? (
                // EMPTY STATE AMÉLIORÉ
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-zinc-400">
                      <div className="bg-white p-4 rounded-full">
                        <Activity size={32} className="text-zinc-300" />
                      </div>
                      <p className="text-sm font-medium text-zinc-500">Aucune activité récente enregistrée.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="group hover:bg-white transition-colors">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                          {event.avatarUrl ? (
                            <img src={getStaticUrl(event.avatarUrl)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            event.displayName.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{event.displayName}</p>
                          <p className="text-xs text-zinc-500">{event.userEmail}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 pr-4">
                      {/* Bages d'actions monochromes */}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                        ${["BAN_USER", "DELETE_DOCUMENT"].includes(event.action) 
                          ? "bg-zinc-900 text-white" 
                          : "bg-zinc-200 text-zinc-900"}`}>
                        {event.action.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <MapPin size={14} />
                        <span>{event.ip}</span>
                      </div>
                    </td>

                    <td className="py-4 pr-4 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-sm text-zinc-500 max-w-[150px] truncate" title={event.userAgent}>
                        <Laptop size={14} />
                        <span className="truncate">{event.userAgent}</span>
                      </div>
                    </td>

                    <td className="py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Clock size={14} />
                        <span>{formatDate(event.createdAt)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}