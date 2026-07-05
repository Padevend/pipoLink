import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/share/lib/api";
import { useToast } from "@/providers/toast/toastContext";
import { Lock, Mail, Loader2, Terminal, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (api.isAuthenticated()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast({
        type: "error",
        message: "Veuillez remplir tous les champs.",
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      await api.login(email.trim(), password);
      showToast({
        type: "success",
        message: "Connexion réussie ! Bienvenue sur le Dashboard.",
        duration: 3000,
      });
      navigate("/", { replace: true });
    } catch (err: any) {
      showToast({
        type: "error",
        message: err.message || "Erreur de connexion.",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 text-zinc-900 overflow-hidden select-none">

      {/* Éléments d'arrière-plan pour l'effet Glassmorphism (Monochrome + Orange) */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-zinc-300/40 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative w-full max-w-[420px] space-y-8 z-10">

        {/* EN-TÊTE */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 border border-white/80 backdrop-blur-md shadow-sm text-orange-500">
            <Terminal size={22} strokeWidth={1.5} />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-800">
              PipoLink Admin
            </h2>
            <p className="text-xs text-zinc-500 font-medium tracking-wide">
              Console de surveillance et de modération globale
            </p>
          </div>
        </div>

        {/* PANNEAU CENTRAL : Glassmorphism Card (Light Mode) */}
        <div className="bg-white/60 border border-white/80 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-zinc-200/50">
          <form className="space-y-6" onSubmit={handleSubmit}>

            <div className="space-y-4">
              {/* CHAMP : Email */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Adresse Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400 group-focus-within:text-orange-500 transition-colors">
                    <Mail size={16} strokeWidth={1.5} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200/80 bg-white/50 py-2.5 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 focus:border-orange-500/50 focus:bg-white focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all duration-200 shadow-sm shadow-zinc-100/50"
                    placeholder="admin@pipolink.app"
                  />
                </div>
              </div>

              {/* CHAMP : Mot de Passe */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Mot de Passe
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400 group-focus-within:text-orange-500 transition-colors">
                    <Lock size={16} strokeWidth={1.5} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200/80 bg-white/50 py-2.5 pl-10 pr-10 text-sm text-zinc-800 placeholder-zinc-400 focus:border-orange-500/50 focus:bg-white focus:ring-1 focus:ring-orange-500/20 focus:outline-none transition-all duration-200 shadow-sm shadow-zinc-100/50"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-orange-500 focus:text-orange-500 transition-colors outline-none cursor-pointer"
                  >
                    {showPassword
                      ? <Eye size={16} strokeWidth={1.5} />
                      : <EyeOff size={16} strokeWidth={1.5} />
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* BOUTON D'ACTION */}
            <button
              type="submit"
              disabled={loading}
              className="relative flex w-full h-11 items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-600 font-semibold text-sm text-white shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:hover:bg-orange-500 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.99]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                  <span>Authentification...</span>
                </div>
              ) : (
                "Accéder au Dashboard"
              )}
            </button>
          </form>
        </div>

        {/* PIED DE PAGE */}
        <p className="text-center text-[11px] font-medium text-zinc-400 tracking-wide">
          Système sécurisé propriétaire • PipoLink 2026
        </p>

      </div>
    </div>
  );
}