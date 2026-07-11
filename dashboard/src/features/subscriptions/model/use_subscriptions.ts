import { useQuery } from "@tanstack/react-query";
import { api } from "@/share/lib/api";

export function useSubscriptions({ page, limit }: { page: number; limit: number }) {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["subscriptions", page, limit],
    queryFn: () => api.getSubscriptions(page, limit),
  });

  return {
    subscriptions: data?.subscriptions || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 1,
    loading,
    error,
  };
}
