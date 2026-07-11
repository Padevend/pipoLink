import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/share/lib/api";
import { useToast } from "@/providers/toast/toastContext";

export function useDocuments({ page, limit, search }: { page: number; limit: number; search: string }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = ["documents", page, limit, search];

  const { data, isLoading: loading, error } = useQuery({
    queryKey,
    queryFn: () => api.getDocuments(page, limit, search),
  });

  const { mutateAsync: deleteDocMutate, isPending: actionLoading } = useMutation({
    mutationFn: (docId: string) => api.deleteDocument(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (err: any) => {
      showToast({
        type: "error",
        message: err.message || "Erreur lors de la suppression du document.",
        duration: 4000,
      });
    },
  });

  return {
    documents: data?.documents || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 1,
    loading,
    error,
    deleteDocument: deleteDocMutate,
    actionLoading,
  };
}
