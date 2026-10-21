import { useState } from "react";
import { useUsers } from "../model/use_users";
import { useAuth } from "@/providers/auth/authContext";
import { useToast } from "@/providers/toast/toastContext";
import type { User } from "@/share/lib/api";

import {
  Search, UserX, UserCheck, ChevronLeft, ChevronRight,
  Loader2, Calendar, Key, Mail, Shield
} from "lucide-react";
import { Input } from "@/share/ui/Input";
import { UsersSkeleton } from "./skeleton";
import { Button } from "@/share/ui/Button";
import { Select } from "@/share/ui/Select";

// Les données pour le Select
const roleOptions = [
  { value: "student", label: "Étudiant", desc: "Accès de base à la plateforme" },
  { value: "staff", label: "Staff", desc: "Peut gérer certains contenus" },
  { value: "admin", label: "Admin", desc: "Accès total, zone dangereuse" },
];

export function UsersFeat() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // États des modales
  const [userToBan, setUserToBan] = useState<User | null>(null);
  const [userToRestore, setUserToRestore] = useState<User | null>(null);

  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  
  const {
    users, total, totalPages, loading,
    banUser, restoreUser, updateUserRole, actionLoading,
  } = useUsers({ page, limit, search: searchQuery });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(search.trim());
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUser?.id) {
      showToast({ type: "error", message: "Impossible de modifier votre propre rôle.", duration: 4000 });
      return;
    }
    try {
      await updateUserRole({ userId, role: newRole });
      showToast({ type: "success", message: `Rôle mis à jour avec succès.`, duration: 4000 });
    } catch { /* Géré par le hook */ }
  };

  const executeBan = async () => {
    if (!userToBan) return;
    try {
      await banUser(userToBan.id);
      showToast({ type: "success", message: `Compte suspendu.`, duration: 4000 });
      setUserToBan(null);
    } catch { /* Géré par le hook */ }
  };

  const executeRestore = async () => {
    if (!userToRestore) return;
    try {
      await restoreUser(userToRestore.id);
      showToast({ type: "success", message: `Compte rétabli.`, duration: 4000 });
      setUserToRestore(null);
    } catch { /* Géré par le hook */ }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(dateStr));
  };

  if (loading && users.length === 0 && !searchQuery) {
    return <UsersSkeleton />;
  }

  return (
    <div className="space-y-10 text-zinc-900 pb-10">
      
      {/* HEADER */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Comptes Utilisateurs</h1>
        <p className="text-sm font-medium text-zinc-500 mt-2">
          Gérez les accès, les rôles et les exclusions de vos membres.
        </p>
      </header>

      {/* SEARCH BAR (Flat Design) */}
      <div className="bg-zinc-50 rounded-[2rem] p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:max-w-md">
          <Input
            type="text"
            placeholder="Rechercher (nom, email, matricule)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={20} />}
          />
          <button type="submit" className="hidden" />
        </form>
        
        <div className="text-sm font-semibold text-zinc-500 bg-white px-4 py-2 rounded-full">
          {total} résultat(s)
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="bg-zinc-50 rounded-[2rem]">
        <div className="px-8 pb-8 pt-4">
          <table className="w-full text-left border-collapse mt-4">
            <thead>
              <tr className="text-zinc-400 text-xs font-medium uppercase tracking-wider border-b border-zinc-200/60">
                <th className="pb-4 font-medium">Utilisateur</th>
                <th className="pb-4 font-medium hidden md:table-cell">Identification</th>
                <th className="pb-4 font-medium hidden lg:table-cell">Rôle</th>
                <th className="pb-4 font-medium">Statut</th>
                <th className="pb-4 font-medium hidden xl:table-cell">Création</th>
                <th className="pb-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-zinc-200/50">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                     <Loader2 className="animate-spin mx-auto text-zinc-900" size={24} />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-zinc-400">
                      <div className="bg-white p-4 rounded-full">
                        <UserX size={32} className="text-zinc-300" />
                      </div>
                      <p className="text-sm font-medium text-zinc-500">Aucun utilisateur trouvé.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="group hover:bg-white transition-colors">
                    
                    {/* UTILISATEUR */}
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                          {u.displayName ? u.displayName.substring(0, 2).toUpperCase() : u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold truncate max-w-[150px]">{u.displayName || "Utilisateur"}</p>
                          <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5 truncate max-w-[150px]">
                            <Mail size={12} /> {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* IDENTIFICATION (Caché sur mobile) */}
                    <td className="py-4 pr-4 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                        <Key size={14} className="text-zinc-400" />
                        <span>{u.matricule || "—"}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-mono mt-1">ID: {u.id.substring(0,8)}...</p>
                    </td>

                    {/* RÔLE (Caché sur tablette/mobile) */}
                    <td className="py-4 pr-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Select 
                            data={roleOptions}
                            value={u.role}
                            disabled={actionLoading || u.id === currentUser?.id}
                            onChange={(newRole) => handleRoleChange(u.id, newRole)}
                            leftIcon={<Shield size={18} />}
                          />
                      </div>
                    </td>

                    {/* STATUT (Monochrome Flat Badges) */}
                    <td className="py-4 pr-4">
                      {u.isExcluded ? (
                        <span className="bg-zinc-900 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Banni
                        </span>
                      ) : u.isActive ? (
                        <span className="bg-zinc-200 text-zinc-900 px-3 py-1 rounded-full text-xs font-semibold">
                          Actif
                        </span>
                      ) : (
                        <span className="border-2 border-zinc-200 text-zinc-500 px-3 py-1 rounded-full text-xs font-semibold">
                          En attente
                        </span>
                      )}
                    </td>

                    {/* CRÉATION (Caché sur petits écrans) */}
                    <td className="py-4 pr-4 hidden xl:table-cell text-sm text-zinc-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{formatDate(u.createdAt)}</span>
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 text-right">
                      {u.role === "admin" ? (
                        <span className="text-xs text-zinc-400 font-medium italic pr-4">Protégé</span>
                      ) : u.isExcluded ? (
                        <button
                          onClick={() => setUserToRestore(u)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white bg-zinc-900 hover:bg-black transition-colors disabled:opacity-50"
                        >
                          <UserCheck size={14} /> <span className="hidden sm:inline">Rétablir</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setUserToBan(u)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-zinc-900 bg-zinc-200 hover:bg-zinc-300 transition-colors disabled:opacity-50"
                        >
                          <UserX size={14} /> <span className="hidden sm:inline">Bannir</span>
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

      {/* MODAL : BANNISSEMENT */}
      {userToBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl">
            <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-6">
              <UserX size={24} className="text-zinc-900" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Suspendre ce compte ?</h3>
            <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
              Êtes-vous sûr de vouloir bloquer <span className="font-semibold text-zinc-900">{userToBan.displayName || userToBan.username}</span> ? Cette action coupera ses accès immédiatement.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setUserToBan(null)} disabled={actionLoading}>
                Annuler
              </Button>
              <Button variant="primary" fullWidth onClick={executeBan} isLoading={actionLoading}>
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : RÉTABLISSEMENT */}
      {userToRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl">
            <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-6">
              <UserCheck size={24} className="text-zinc-900" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Rétablir ce compte ?</h3>
            <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
              <span className="font-semibold text-zinc-900">{userToRestore.displayName || userToRestore.username}</span> retrouvera l'intégralité de ses accès à la plateforme.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setUserToRestore(null)} disabled={actionLoading}>
                Annuler
              </Button>
              <Button variant="primary" fullWidth onClick={executeRestore} isLoading={actionLoading}>
                Rétablir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}