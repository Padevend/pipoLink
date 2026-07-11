import { useState } from "react";
import { useUsers } from "../model/use_users";
import { useAuth } from "@/providers/auth/authContext";
import { useToast } from "@/providers/toast/toastContext";
import type { User } from "@/share/lib/api";
import {
  Search,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Key,
  Mail,
  AlertTriangle,
  Shield,
} from "lucide-react";

export function UsersFeat() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Confirmation Modals State
  const [userToBan, setUserToBan] = useState<User | null>(null);
  const [userToRestore, setUserToRestore] = useState<User | null>(null);

  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  
  const {
    users,
    total,
    totalPages,
    loading,
    banUser,
    restoreUser,
    updateUserRole,
    actionLoading,
  } = useUsers({ page, limit, search: searchQuery });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(search.trim());
  };

  const handleRoleChange = async (userId: string, targetUser: User, newRole: string) => {
    if (userId === currentUser?.id) {
      showToast({
        type: "error",
        message: "Vous ne pouvez pas modifier votre propre rôle.",
        duration: 4000,
      });
      return;
    }
    try {
      await updateUserRole({ userId, role: newRole });
      showToast({
        type: "success",
        message: `Rôle de ${targetUser.displayName || targetUser.username} mis à jour en "${newRole}".`,
        duration: 4000,
      });
    } catch {
      // Error handled by query hook
    }
  };

  const executeBan = async () => {
    if (!userToBan) return;
    try {
      await banUser(userToBan.id);
      showToast({
        type: "success",
        message: `L'utilisateur ${userToBan.displayName || userToBan.username} a été banni et notifié.`,
        duration: 4000,
      });
      setUserToBan(null);
    } catch {
      // Error handled by query hook
    }
  };

  const executeRestore = async () => {
    if (!userToRestore) return;
    try {
      await restoreUser(userToRestore.id);
      showToast({
        type: "success",
        message: `L'utilisateur ${userToRestore.displayName || userToRestore.username} a été rétabli.`,
        duration: 4000,
      });
      setUserToRestore(null);
    } catch {
      // Error handled by query hook
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

      {/* SEARCH BAR */}
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

      {/* USERS TABLE CARD */}
      <div className="bg-white/60 border border-white/80 rounded-2xl overflow-hidden shadow-sm shadow-zinc-200/40 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-200/60 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">Utilisateur</th>
                <th className="px-6 py-3.5">Matricule / ID</th>
                <th className="px-6 py-3.5">Rôle (Promotion / Rétrogradation)</th>
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
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/40 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-[11px] font-bold text-zinc-600 overflow-hidden flex-shrink-0">
                          {u.displayName ? u.displayName.substring(0, 2).toUpperCase() : u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-800 truncate">{u.displayName || "Utilisateur"}</p>
                          <p className="text-[10px] font-medium text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                            <Mail size={11} className="text-zinc-400" />
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-zinc-600">
                          <Key size={12} className="text-zinc-400" />
                          <span>{u.matricule || "Aucun matricule"}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono select-all">ID: {u.id}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Shield size={13} className="text-zinc-400" />
                        <select
                          value={u.role}
                          disabled={actionLoading || u.id === currentUser?.id}
                          onChange={(e) => handleRoleChange(u.id, u, e.target.value)}
                          className="bg-white/80 border border-zinc-200/80 rounded-xl px-2.5 py-1.5 text-xs font-bold text-zinc-700 focus:outline-none focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer disabled:opacity-50 transition-all"
                        >
                          <option value="student">Student (Étudiant)</option>
                          <option value="staff">Staff (Personnel)</option>
                          <option value="admin">Admin (Administrateur)</option>
                        </select>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {u.isExcluded ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border bg-orange-500/10 text-orange-600 border-orange-500/20">
                          Banni / Exclu
                        </span>
                      ) : u.isActive ? (
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
                        <span>{formatDate(u.createdAt)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {u.role === "admin" ? (
                        <span className="text-[11px] text-zinc-400 font-medium italic pr-2">Protégé</span>
                      ) : u.isExcluded ? (
                        <button
                          onClick={() => setUserToRestore(u)}
                          disabled={actionLoading}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:border-zinc-300 shadow-sm transition-all duration-200 cursor-pointer active:scale-[0.97] disabled:opacity-50"
                        >
                          <UserCheck size={13} className="text-zinc-500" />
                          <span>Rétablir</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setUserToBan(u)}
                          disabled={actionLoading}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-600 bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10 hover:border-orange-500/20 transition-all duration-200 cursor-pointer active:scale-[0.97] disabled:opacity-50"
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

      {/* CONFIRMATION MODALS */}
      {userToBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-md animate-in fade-in duration-150">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-md animate-in fade-in duration-150">
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
