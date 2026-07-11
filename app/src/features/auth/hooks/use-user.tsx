import { userApi } from "@/shared/api/user";
import { localDb } from "@/shared/storage/local-db";
import { useQuery } from "@tanstack/react-query";

export function useGetUser(id: string) {
    return useQuery({
        queryKey: ['user', id],
        queryFn: async () => {
            try {
                const remote = await userApi.getUser(id);
                if (remote) {
                    localDb.upsertUsers([remote]);
                }
                return remote;
            } catch (err) {
                const cached = localDb.getUser(id);
                if (cached) return cached;
                throw err;
            }
        },
        initialData: () => {
            return localDb.getUser(id) || undefined;
        },
        enabled: !!id,
    });
}