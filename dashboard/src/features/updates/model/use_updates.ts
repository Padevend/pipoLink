import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Update } from "@/share/lib/api";
import { useToast } from "@/providers/toast/toastContext";

export function useUpdates() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: updates = [], isLoading: loading, error } = useQuery<Update[]>({
    queryKey: ["updates"],
    queryFn: api.getUpdates,
  });

  const { mutateAsync: createUpdateMutate, isPending: actionLoading } = useMutation({
    mutationFn: api.createUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["updates"] });
      showToast({
        type: "success",
        message: "Version de mise à jour créée et publiée avec succès.",
        duration: 4000,
      });
    },
    onError: (err: any) => {
      showToast({
        type: "error",
        message: err.message || "Erreur lors de la création de la mise à jour.",
        duration: 4000,
      });
    },
  });

  return {
    updates,
    loading,
    error,
    createUpdate: createUpdateMutate,
    actionLoading,
  };
}
