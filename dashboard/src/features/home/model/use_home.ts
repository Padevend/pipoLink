import { useQuery } from "@tanstack/react-query";
import { api, type AuditLog, type SystemStats } from "@/share/lib/api";

export function useHome() {
  const { data, isLoading: loading, error, refetch } = useQuery<{ stats: SystemStats; events: AuditLog[] }>({
    queryKey: ["system-stats-events"],
    queryFn: api.getStats,
  });

  const stats: SystemStats = data?.stats || {
    totalAccounts: 0,
    activeAccounts: 0,
    totalDocuments: 0,
    totalAnnouncements: 0,
    revenue: {
      totalRevenue: 0,
      revenueThisMonth: 0,
      activePremium: 0,
      mrr: 0,
    },
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
