import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/share/lib/api";
import { useToast } from "@/providers/toast/toastContext";

export function useUsers({ page, limit, search }: { page: number; limit: number; search: string }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = ["users", page, limit, search];

  const { data, isLoading: loading, error } = useQuery({
    queryKey,
    queryFn: () => api.getUsers(page, limit, search),
  });

  const { mutateAsync: banUserMutate, isPending: banLoading } = useMutation({
    mutationFn: (userId: string) => api.banUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      showToast({
        type: "error",
        message: err.message || "Impossible de bannir l'utilisateur.",
        duration: 4000,
      });
    },
  });

  const { mutateAsync: restoreUserMutate, isPending: restoreLoading } = useMutation({
    mutationFn: (userId: string) => api.restoreUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      showToast({
        type: "error",
        message: err.message || "Impossible de rétablir l'utilisateur.",
        duration: 4000,
      });
    },
  });

  const { mutateAsync: updateRoleMutate, isPending: roleLoading } = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => api.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      showToast({
        type: "error",
        message: err.message || "Impossible de modifier le rôle.",
        duration: 4000,
      });
    },
  });

  return {
    users: data?.users || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 1,
    loading,
    error,
    banUser: banUserMutate,
    restoreUser: restoreUserMutate,
    updateUserRole: updateRoleMutate,
    actionLoading: banLoading || restoreLoading || roleLoading,
  };
}
