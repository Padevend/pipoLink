import { libraryApi } from "@/shared/api/library"
import { UserProfile } from "@/shared/api/types"
import { useQuery } from "@tanstack/react-query"

export function useInitLibrary(user?: UserProfile) {
    const {
        data: popularDocuments,
        isLoading: isLoadingPopular,
        isError: isErrorPopular,
        refetch: refetchPopular
    } = useQuery({
        queryKey: ["library", "init", "popular"],
        queryFn: () => libraryApi.getPopular(),
    })

    const {
        data: recommendedDocuments,
        isLoading: isLoadingRecommended,
        isError: isErrorRecommended,
        refetch: refetchRecommended,
    } = useQuery({
        queryKey: ["library", "init", "recommended"],
        queryFn: () => libraryApi.getRecommendations(user && user.niveau ? user.niveau : undefined)
    })

    return {
        popularDocuments: popularDocuments?.documents ?? [],
        recommendedDocuments: recommendedDocuments?.documents ?? [],

        isLoadingPopular, isErrorPopular,
        isLoadingRecommended, isErrorRecommended,

        refetchPopular,
        refetchRecommended
    }
}