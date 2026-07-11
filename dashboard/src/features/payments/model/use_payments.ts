import { useQuery } from "@tanstack/react-query";
import { api } from "@/share/lib/api";

export function usePayments({ page, limit }: { page: number; limit: number }) {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["payments", page, limit],
    queryFn: () => api.getPayments(page, limit),
  });

  return {
    payments: data?.payments || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 1,
    loading,
    error,
  };
}
