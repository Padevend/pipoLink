import { useMutation } from "@tanstack/react-query";
import { api } from "@/share/lib/api";
import { useToast } from "@/providers/toast/toastContext";

export function useNotifications() {
  const { showToast } = useToast();

  const { mutateAsync: sendNotificationMutate, isPending: actionLoading } = useMutation({
    mutationFn: api.sendBroadcastNotification,
    onSuccess: (data) => {
      showToast({
        type: "success",
        message: `Notification envoyée à ${data.recipients} utilisateur(s).`,
        duration: 4000,
      });
    },
    onError: (err: any) => {
      showToast({
        type: "error",
        message: err.message || "Erreur lors de l'envoi de la notification.",
        duration: 4000,
      });
    },
  });

  return {
    sendNotification: sendNotificationMutate,
    actionLoading,
  };
}
