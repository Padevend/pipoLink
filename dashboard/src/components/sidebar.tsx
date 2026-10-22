import { useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useToast } from "@/providers/toast/toastContext";
import { useAuth } from "@/providers/auth/authContext";
import {
  LayoutDashboard, Users, FileText, CreditCard, 
  Layers, LogOut, BellRing, X, GraduationCap,
  Tag
} from "lucide-react";
import { AppLogo } from "@/share/ui/AppLogo";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, logout } = useAuth();

  // Navigation structurée par groupes
  const navGroups = useMemo(() => [
    {
      label: "Général",
      items: [
        { path: "/", name: "Tableau de Bord", icon: LayoutDashboard },
      ]
    },
    {
      label: "Utilisateurs & Contenu",
      items: [
        { path: "/users", name: "Comptes Utilisateurs", icon: Users },
        { path: "/documents", name: "Modération Documents", icon: FileText },
        { path: "/academic-paths", name: "Parcours académiques", icon: GraduationCap },
      ]
    },
    {
      label: "Finance",
      items: [
        { path: "/subscriptions", name: "Abonnements", icon: Layers },
        { path: "/payments", name: "Paiements", icon: CreditCard },
        { path: "/promo", name: "Codes Promos", icon: Tag },
      ]
    },
    {
      label: "Système",
      items: [
        { path: "/notifications", name: "Notifications", icon: BellRing },
        // { path: "/updates", name: "Mises à Jour", icon: RefreshCw },
      ]
    }
  ], []);

  const handleLogout = () => {
    logout();
    showToast({ type: "success", message: "Déconnexion réussie.", duration: 3000 });
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* OVERLAY MOBILE */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col h-screen overflow-hidden transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-20 flex items-center justify-between px-6">
          <AppLogo size={20} />
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto space-y-6">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="px-4 text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.items.map((route) => {
                  const Icon = route.icon;
                  return (
                    <NavLink
                      key={route.path}
                      to={route.path}
                      onClick={() => setIsOpen(false)} // Ferme la sidebar sur mobile au clic
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-zinc-900 text-white"
                            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                        }`
                      }
                    >
                      <Icon size={18} strokeWidth={2} className="flex-shrink-0" />
                      <span>{route.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Profile & Logout */}
        <div className="p-4 bg-white border-t border-zinc-100">
          <div className="bg-zinc-50 rounded-2xl p-2 mb-2 flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center font-bold text-sm text-zinc-900 shadow-sm shrink-0">
              {user?.username ? user.username.substring(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900 truncate">
                {user?.displayName || user?.username || "Admin"}
              </p>
              <p className="text-xs font-medium text-zinc-500 truncate">
                {user?.email || "admin@pipolink.app"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-full text-sm font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          >
            <LogOut size={16} strokeWidth={2} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
