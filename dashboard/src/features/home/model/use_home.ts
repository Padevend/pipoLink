import { useQuery } from "@tanstack/react-query";
import { api, type AuditLog } from "@/share/lib/api";

export function useHome() {
  const { data, isLoading: loading, error, refetch } = useQuery<{ stats: any; events: AuditLog[] }>({
    queryKey: ["system-stats-events"],
    queryFn: api.getStats,
  });

  const stats = data?.stats || {
    totalAccounts: 0,
    activeAccounts: 0,
    totalDocuments: 0,
    totalAnnouncements: 0,
  };

  const events = data?.events || [];

  return {
    stats,
    events,
    loading,
    error,
    refresh: refetch,
  };
}
