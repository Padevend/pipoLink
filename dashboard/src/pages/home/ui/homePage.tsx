import { useState, useEffect } from "react";
import { api } from "@/share/lib/api";
import type { AuditLog } from "@/share/lib/api";
import { useToast } from "@/providers/toast/toastContext";
import {
  FileText,
  Megaphone,
  Activity,
  Clock,
  Laptop,
  MapPin,
  RefreshCw,
  UserCheck
} from "lucide-react";
import { getStaticUrl } from "@/share/lib/helpers";

export default function HomePage() {
  const [stats, setStats] = useState<any>({
    totalAccounts: 0,
    activeAccounts: 0,
    totalDocuments: 0,
    totalAnnouncements: 0,
  });
  const [events, setEvents] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getStats();
      setStats(data.stats);
      setEvents(data.events);
    } catch (err: any) {
      showToast({
        type: "error",
        message: err.message || "Erreur de chargement des statistiques.",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Gestion des statuts purement monochrome et orange pour le focus critique
  const getActionStyle = (action: string) => {
    switch (action) {
      case "BAN_USER":
      case "DELETE_DOCUMENT":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20"; // Alerte ou action critique
      case "LOGIN":
      case "DEVICE_LINKED":
      case "RESTORE_USER":
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-200/80"; // Neutre
    }
  };

  return (
    <div className="space-y-8 select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-800">
            Supervision du Système
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Suivi en temps réel de l'activité, des connexions et des statistiques globales
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-zinc-200 bg-white/80 hover:bg-white text-zinc-600 hover:text-zinc-900 transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-sm backdrop-blur-md active:scale-[0.98]"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-orange-500" : "text-zinc-400"} />
          <span className="text-xs font-semibold">Actualiser</span>
        </button>
      </div>

      {/* STATS CARDS (Style Glassmorphism Light) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Comptes Actifs */}
        <div className="bg-white/60 border border-white/80 rounded-2xl p-6 relative overflow-hidden group shadow-sm shadow-zinc-200/40 backdrop-blur-xl transition-all duration-300 hover:border-zinc-300">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Comptes Actifs</span>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-800">
                {stats.activeAccounts}
                <span className="text-xs text-zinc-400 font-medium ml-1.5">/ {stats.totalAccounts}</span>
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-500 group-hover:text-orange-500 transition-colors duration-200">
              <UserCheck size={16} />
            </div>
          </div>
        </div>

        {/* Card 2: Documents */}
        <div className="bg-white/60 border border-white/80 rounded-2xl p-6 relative overflow-hidden group shadow-sm shadow-zinc-200/40 backdrop-blur-xl transition-all duration-300 hover:border-zinc-300">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Documents</span>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-800">{stats.totalDocuments}</h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-500 group-hover:text-orange-500 transition-colors duration-200">
              <FileText size={16} />
            </div>
          </div>
        </div>

        {/* Card 3: Annonces */}
        <div className="bg-white/60 border border-white/80 rounded-2xl p-6 relative overflow-hidden group shadow-sm shadow-zinc-200/40 backdrop-blur-xl transition-all duration-300 hover:border-zinc-300">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Annonces Publiées</span>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-800">{stats.totalAnnouncements}</h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-500 group-hover:text-orange-500 transition-colors duration-200">
              <Megaphone size={16} />
            </div>
          </div>
        </div>

        {/* Card 4: Activités */}
        <div className="bg-white/60 border border-white/80 rounded-2xl p-6 relative overflow-hidden group shadow-sm shadow-zinc-200/40 backdrop-blur-xl transition-all duration-300 hover:border-zinc-300">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Activités Récentes</span>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-800">{events.length}</h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-500 group-hover:text-orange-500 transition-colors duration-200">
              <Activity size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* JOURNAL DES ÉVÉNEMENTS (Glass Block) */}
      <div className="bg-white/60 border border-white/80 rounded-2xl overflow-hidden shadow-sm shadow-zinc-200/40 backdrop-blur-xl">
        <div className="px-6 py-4.5 border-b border-zinc-200/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Activity size={16} className="text-orange-500" />
            <h2 className="font-bold text-zinc-800 text-sm">Journal des événements</h2>
          </div>
          <span className="text-[10px] bg-zinc-100 border border-zinc-200 text-zinc-500 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
            Temps réel
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-200/60 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">Utilisateur</th>
                <th className="px-6 py-3.5">Action</th>
                <th className="px-6 py-3.5">Adresse IP</th>
                <th className="px-6 py-3.5">Localisation</th>
                <th className="px-6 py-3.5">Appareil / Client</th>
                <th className="px-6 py-3.5">Date et Heure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 text-xs font-medium">
                    Aucun événement récent enregistré.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-white/40 transition-colors duration-150">
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-[11px] font-bold text-zinc-600 overflow-hidden flex-shrink-0">
                          {event.avatarUrl ? (
                            <img src={getStaticUrl(event.avatarUrl)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            event.displayName.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-800 truncate">{event.displayName}</p>
                          <p className="text-[10px] font-medium text-zinc-400 truncate">{event.userEmail}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border tracking-wide ${getActionStyle(event.action)}`}>
                        {event.action}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <code className="text-[11px] text-zinc-600 font-mono bg-zinc-100/80 px-1.5 py-0.5 rounded border border-zinc-200/60">
                        {event.ip}
                      </code>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5 text-zinc-600 text-xs font-medium">
                        <MapPin size={13} className="text-zinc-400 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5 text-zinc-400 text-[11px] max-w-[180px] truncate" title={event.userAgent}>
                        <Laptop size={13} className="text-zinc-400 flex-shrink-0" />
                        <span className="truncate font-medium">{event.userAgent}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-zinc-500 text-xs font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Clock size={13} className="text-zinc-400 flex-shrink-0" />
                        <span>{formatDate(event.createdAt)}</span>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}