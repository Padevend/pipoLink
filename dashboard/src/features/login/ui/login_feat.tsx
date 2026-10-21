import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../model/use_login";
import { useAuth } from "@/providers/auth/authContext";
import { useToast } from "@/providers/toast/toastContext";
import { Mail, Lock } from "lucide-react";
import { AppLogo } from "@/share/ui/AppLogo";
import { Input } from "@/share/ui/Input";
import { Button } from "@/share/ui/Button";

export function LoginFeat() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const { login, loading } = useLogin();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/", { replace: true });
    }
  }, [navigate, isAuthenticated]);

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

    try {
      await login({ email, password });
      navigate("/", { replace: true });
    } catch {
      // Les erreurs sont supposées être gérées par le hook useLogin
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-white text-zinc-900 selection:bg-zinc-200">
      <main className="w-full max-w-md mx-auto px-6 py-12 flex flex-col">
        
        {/* HEADER */}
        <div className="flex flex-col items-center text-center mb-10">
          <AppLogo size={22} withName={false} className="mb-8" />
          <h1 className="text-[28px] font-semibold tracking-tight text-zinc-900 mb-2">
            PipoLink Admin
          </h1>
          <p className="text-zinc-500 font-medium text-sm">
            Console de sécurité & modération globale
          </p>
        </div>

        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@pipolink.app"
            required
            leftIcon={<Mail size={20} strokeWidth={2} />}
          />

          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            leftIcon={<Lock size={20} strokeWidth={2} />}
          />

          <div className="pt-4">
            <Button
              type="submit"
              isLoading={loading}
              fullWidth
              variant="primary"
            >
              Se connecter
            </Button>
          </div>
        </form>

        {/* FOOTER */}
        <div className="mt-14 text-center">
          <p className="text-[13px] font-medium text-zinc-400">
            PipoLink OS © 2026
          </p>
        </div>

      </main>
    </div>
  );
}