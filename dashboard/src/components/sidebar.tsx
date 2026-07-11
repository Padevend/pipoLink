import { useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useToast } from "@/providers/toast/toastContext";
import { useAuth } from "@/providers/auth/authContext";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Layers,
  LogOut,
  Terminal,
  RefreshCw,
} from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, logout } = useAuth();

  const routes = useMemo(() => {
    return [
      {
        path: "/",
        name: "Tableau de Bord",
        icon: LayoutDashboard,
      },
      {
        path: "/users",
        name: "Comptes Utilisateurs",
        icon: Users,
      },
      {
        path: "/documents",
        name: "Modération Documents",
        icon: FileText,
      },
      {
        path: "/subscriptions",
        name: "Abonnements",
        icon: Layers,
      },
      {
        path: "/payments",
        name: "Paiements",
        icon: CreditCard,
      },
      {
        path: "/updates",
        name: "Mises à Jour",
        icon: RefreshCw,
      },
    ];
  }, []);

  const handleLogout = () => {
    logout();
    showToast({
      type: "success",
      message: "Déconnexion réussie.",
      duration: 3000,
    });
    navigate("/login", { replace: true });
  };

  return (
    <aside className="w-72 bg-zinc-50/60 border-r border-zinc-200/80 backdrop-blur-xl flex flex-col h-screen overflow-hidden select-none">
      
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-zinc-200/60 space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 border border-zinc-200 shadow-sm text-orange-500">
          <Terminal size={20} strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-base font-bold text-zinc-800 tracking-wide">
            PipoLink Admin
          </h1>
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Supervision
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {routes.map((route) => {
          const Icon = route.icon;
          return (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) =>
                `flex items-center space-x-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-white/80 border border-zinc-200/50 text-orange-500 shadow-sm shadow-zinc-200/40 font-semibold"
                    : "text-zinc-500 border border-transparent hover:bg-white/40 hover:text-zinc-800"
                }`
              }
            >
              <Icon size={18} strokeWidth={1.5} className="flex-shrink-0" />
              <span>{route.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-zinc-200/60 bg-zinc-100/30 space-y-4">
        {user && (
          <div className="flex items-center space-x-3 px-2 py-1">
            <div className="h-9 w-9 rounded-xl bg-white/80 flex items-center justify-center border border-zinc-200 shadow-sm text-xs font-semibold text-zinc-600">
              {user.username ? user.username.substring(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-800 truncate">
                {user.displayName || user.username}
              </p>
              <p className="text-[10px] font-medium text-zinc-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-500 border border-transparent hover:border-zinc-200/80 hover:bg-white/80 hover:text-zinc-800 transition-all duration-200 active:scale-[0.99] cursor-pointer"
        >
          <LogOut size={15} strokeWidth={1.5} className="text-zinc-400 group-hover:text-zinc-600" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
