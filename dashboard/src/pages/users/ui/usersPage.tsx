import { useState, useEffect } from "react";
import { api } from "@/share/lib/api";
import type { User } from "@/share/lib/api";
import { useToast } from "@/providers/toast/toastContext";
import {
  Search,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Shield,
  Loader2,
  Calendar,
  Key,
  Mail,
  AlertTriangle
} from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Confirmation Modals State
  const [userToBan, setUserToBan] = useState<User | null>(null);
  const [userToRestore, setUserToRestore] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { showToast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers(page, limit, search.trim());
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      showToast({
        type: "error",
        message: err.message || "Erreur lors de la récupération des utilisateurs.",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const executeBan = async () => {
    if (!userToBan) return;
    setActionLoading(true);
    try {
      await api.banUser(userToBan.id);
      showToast({
        type: "success",
        message: `L'utilisateur ${userToBan.displayName || userToBan.username} a été banni et notifié.`,
        duration: 4000,
      });
      setUserToBan(null);
      fetchUsers();
    } catch (err: any) {
      showToast({
        type: "error",
        message: err.message || "Impossible de bannir l'utilisateur.",
        duration: 4000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const executeRestore = async () => {
    if (!userToRestore) return;
    setActionLoading(true);
    try {
      await api.restoreUser(userToRestore.id);
      showToast({
        type: "success",
        message: `L'utilisateur ${userToRestore.displayName || userToRestore.username} a été rétabli.`,
        duration: 4000,
      });
      setUserToRestore(null);
      fetchUsers();
    } catch (err: any) {
      showToast({
        type: "error",
        message: err.message || "Impossible de rétablir l'utilisateur.",
        duration: 4000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
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
          Comptes Utilisateurs
        </h1>
        <p className="text-xs text-zinc-500 font-medium mt-1">
          Recherchez et gérez les rôles, statuts et exclusions de vos membres
        </p>
      </div>

      {/* SEARCH BAR (Glassmorphism Light) */}
      <div className="bg-white/60 border border-white/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm shadow-zinc-200/40 backdrop-blur-xl">
        <form onSubmit={handleSearchSubmit} className="w-full md:max-w-md relative group">
          <input
            type="text"
            placeholder="Rechercher par nom, email, matricule ou ID..."
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
          {total} utilisateur(s) trouvé(s)
        </div>
      </div>

      {/* USERS TABLE CARD (Glassmorphism Table) */}
      <div className="bg-white/60 border border-white/80 rounded-2xl overflow-hidden shadow-sm shadow-zinc-200/40 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-200/60 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">Utilisateur</th>
                <th className="px-6 py-3.5">Matricule / ID</th>
                <th className="px-6 py-3.5">Rôle</th>
                <th className="px-6 py-3.5">Statut</th>
                <th className="px-6 py-3.5">Date de Création</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                    <div className="flex justify-center items-center space-x-2">
                      <Loader2 className="animate-spin text-orange-500" size={16} strokeWidth={2.5} />
                      <span className="text-xs font-semibold">Chargement des comptes...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 text-xs font-medium">
                    Aucun utilisateur ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/40 transition-colors duration-150">
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-[11px] font-bold text-zinc-600 overflow-hidden flex-shrink-0">
                          {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-800 truncate">{user.displayName || "Utilisateur"}</p>
                          <p className="text-[10px] font-medium text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                            <Mail size={11} className="text-zinc-400" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-zinc-600">
                          <Key size={12} className="text-zinc-400" />
                          <span>{user.matricule || "Aucun matricule"}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono select-all">ID: {user.id}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        user.role === "admin"
                          ? "bg-zinc-800 text-white border-zinc-900"
                          : "bg-zinc-100 text-zinc-600 border-zinc-200/60"
                      }`}>
                        <Shield size={10} strokeWidth={2} />
                        <span className="capitalize">{user.role}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {user.isExcluded ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border bg-orange-500/10 text-orange-600 border-orange-500/20">
                          Banni / Exclu
                        </span>
                      ) : user.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border bg-zinc-100 text-zinc-700 border-zinc-200">
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border bg-zinc-100 text-zinc-400 border-zinc-200 border-dashed">
                          En attente OTP
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-zinc-500 text-xs font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Calendar size={13} className="text-zinc-400" />
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {user.role === "admin" ? (
                        <span className="text-[11px] text-zinc-400 font-medium italic pr-2">Protégé</span>
                      ) : user.isExcluded ? (
                        <button
                          onClick={() => setUserToRestore(user)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:border-zinc-300 shadow-sm transition-all duration-200 cursor-pointer active:scale-[0.97]"
                        >
                          <UserCheck size={13} className="text-zinc-500" />
                          <span>Rétablir</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setUserToBan(user)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-600 bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10 hover:border-orange-500/20 transition-all duration-200 cursor-pointer active:scale-[0.97]"
                        >
                          <UserX size={13} />
                          <span>Bannir</span>
                        </button>
                      )}
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

      {/* CONFIRMATION MODALS (Glassmorphic Light Popups) */}
      {userToBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-md">
          <div className="w-full max-w-md bg-white/90 border border-white rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 mb-4 border border-orange-500/20">
              <AlertTriangle size={20} />
            </div>
            
            <h3 className="text-base font-bold text-zinc-800">Suspendre le compte ?</h3>
            
            <p className="mt-2 text-xs text-zinc-500 font-medium leading-relaxed">
              Êtes-vous sûr de vouloir suspendre le compte de{" "}
              <span className="font-bold text-zinc-800">{userToBan.displayName || userToBan.username}</span> ?
              Cette action révoquera immédiatement tous ses accès en cours et lui enverra une notification de bannissement.
            </p>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setUserToBan(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={executeBan}
                disabled={actionLoading}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-500/10 transition-all cursor-pointer"
              >
                {actionLoading && <Loader2 size={13} className="animate-spin" />}
                <span>Bannir le compte</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {userToRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-md">
          <div className="w-full max-w-md bg-white/90 border border-white rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 mb-4 border border-zinc-200">
              <UserCheck size={20} />
            </div>
            
            <h3 className="text-base font-bold text-zinc-800">Rétablir le compte ?</h3>
            
            <p className="mt-2 text-xs text-zinc-500 font-medium leading-relaxed">
              Voulez-vous rétablir le compte de{" "}
              <span className="font-bold text-zinc-800">{userToRestore.displayName || userToRestore.username}</span> ?
              Il pourra à nouveau se connecter à l'application et recevra une notification de rétablissement.
            </p>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setUserToRestore(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={executeRestore}
                disabled={actionLoading}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-900 rounded-xl shadow-md transition-all cursor-pointer"
              >
                {actionLoading && <Loader2 size={13} className="animate-spin" />}
                <span>Rétablir le compte</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}