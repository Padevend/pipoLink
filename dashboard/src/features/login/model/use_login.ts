import { useMutation } from "@tanstack/react-query";
import { api } from "@/share/lib/api";
import { useAuth } from "@/providers/auth/authContext";
import { useToast } from "@/providers/toast/toastContext";

export function useLogin() {
  const { login: authLogin } = useAuth();
  const { showToast } = useToast();

  const { mutateAsync: performLogin, isPending: loading } = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.login(email.trim(), password),
    onSuccess: (data) => {
      authLogin(data.user);
      showToast({
        type: "success",
        message: "Connexion réussie ! Bienvenue sur le Dashboard.",
        duration: 3000,
      });
    },
    onError: (err: any) => {
      showToast({
        type: "error",
        message: err.message || "Erreur de connexion.",
        duration: 4000,
      });
    },
  });

  return {
    login: performLogin,
    loading,
  };
}
