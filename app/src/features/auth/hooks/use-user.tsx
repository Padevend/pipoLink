import { userApi } from "@/shared/api/user";
import { useQuery } from "@tanstack/react-query";

export function useGetUser(id: string) {
    return useQuery({
        queryKey: ['user', id],
        queryFn: () => userApi.getUser(id),
        enabled: !!id,
    });
}