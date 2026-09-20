import { useLibraryBrowse, useLibrarySearch } from '@/entities/document/hooks';
import {
    ExplorerBreadcrumb,
    type BreadcrumbItem,
} from '@/features/library/components/explorer-breadcrumb';
import { ExplorerFileRow } from '@/features/library/components/explorer-file-row';
import { ExplorerFolderRow } from '@/features/library/components/explorer-folder-row';
import { useAuth } from '@/providers';
import type { Document, LibraryFolder } from '@/shared/api/types';
import { SearchBar } from '@/shared/ui/search-bar';
import { Skeleton } from '@/shared/ui/skeleton';
import { router } from 'expo-router';
import { FolderOpen, Sparkles } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

const ROOT_CRUMB: BreadcrumbItem = { id: null, name: 'Bibliothèque' };

export type ExplorerRow =
    | { kind: 'folder'; item: LibraryFolder }
    | { kind: 'file'; item: Document };

interface LibraryExplorerProps {
    documentAction: (doc: Document) => void;
    showAISearch?: boolean;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(t);
    }, [value, delayMs]);
    return debounced;
}

export default function LibraryExplorerComponnent({
    documentAction,
    showAISearch
}: LibraryExplorerProps) {
    const [trail, setTrail] = useState<BreadcrumbItem[]>([ROOT_CRUMB]);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search.trim(), 350);
    const { user } = useAuth();
    const isPremium =
        user?.subscription?.plan === 'PREMIUM' && user?.subscription?.status === 'ACTIVE';

    const handleSemanticSearchPress = useCallback(() => {
        if (!isPremium) {
            router.push('/settings/subscription')
            return;
        }
        router.push('/modal/semantic-search' as never);
    }, [isPremium]);

    const parentId = trail[trail.length - 1]?.id ?? null;
    const isSearching = debouncedSearch.length >= 2;

    const browseQuery = useLibraryBrowse(parentId);
    const searchQuery = useLibrarySearch(debouncedSearch);

    const isLoading = isSearching ? searchQuery.isLoading : browseQuery.isLoading;
    const isFetching = isSearching ? searchQuery.isFetching : browseQuery.isFetching;

    const rows: ExplorerRow[] = useMemo(() => {
        if (isSearching) {
            return (searchQuery.data ?? []).map((item) => ({ kind: 'file' as const, item }));
        }
        const data = browseQuery.data;
        if (!data) return [];
        return [
            ...data.folders.map((item) => ({ kind: 'folder' as const, item })),
            ...data.documents.map((item) => ({ kind: 'file' as const, item })),
        ];
    }, [isSearching, searchQuery.data, browseQuery.data]);

    const openFolder = useCallback((folder: LibraryFolder) => {
        setSearch('');
        setTrail((prev) => [...prev, { id: folder.id, name: folder.name }]);
    }, []);

    const navigateBreadcrumb = useCallback((index: number) => {
        setTrail((prev) => prev.slice(0, index + 1));
    }, []);

    const renderItem = useCallback(
        ({ item }: { item: ExplorerRow }) => {
            if (item.kind === 'folder') {
                return <ExplorerFolderRow folder={item.item} onPress={() => openFolder(item.item)} />;
            }
            return (
                <ExplorerFileRow document={item.item} onPress={() => documentAction(item.item)} />
            );
        },
        [documentAction, openFolder],
    );

    return (
        <>
            <View className="bg-white px-4 py-4 dark:bg-[#0A0A0A]">
                <View>
                    <SearchBar
                        placeholder='Rechercher un document, une UE…'
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Recherche sémantique (Bouton = rounded-full) */}
                {showAISearch && (
                    <Pressable
                        onPress={handleSemanticSearchPress}
                        className="mt-3 flex-row items-center justify-between rounded-full bg-zinc-100 px-5 py-3.5 dark:bg-[#1A1A1A] active:opacity-80 transition-all"
                    >
                        <View className="flex-row items-center gap-3 flex-1">
                            <Sparkles size={16} color="#F97316" strokeWidth={2.5} />
                            <Text className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white">
                                Recherche IA
                            </Text>
                        </View>
                        {!isPremium && (
                            <View className="rounded-full bg-orange-500 px-2.5 py-1 ml-2">
                                <Text className="text-[9px] font-black uppercase tracking-widest text-white">
                                    Premium
                                </Text>
                            </View>
                        )}
                    </Pressable>
                )}
                
                {/* Fil d'Ariane */}
                <View className="mt-4">
                    <ExplorerBreadcrumb items={trail} onNavigate={navigateBreadcrumb} />
                </View>
            </View>

            <View className="flex-1 px-6 pt-2">
                {isLoading ? (
                    <View className="gap-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]" />
                        ))}
                    </View>
                ) : (
                    <FlatList
                        data={rows}
                        keyExtractor={(row) => `${row.kind}-${row.item.id}`}
                        renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        ItemSeparatorComponent={() => <View className="h-3" />}
                        refreshing={isFetching}
                        onRefresh={() => {
                            if (isSearching) {
                                searchQuery.refetch();
                            } else {
                                browseQuery.refetch();
                            }
                        }}
                        ListEmptyComponent={
                            // Empty State (Carte = rounded-2xl)
                            <View className="items-center justify-center py-12 px-6 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-[#1A1A1A] bg-zinc-50 dark:bg-[#0A0A0A] mt-6">
                                <View className="h-14 w-14 items-center justify-center rounded-xl bg-zinc-100 dark:bg-[#1A1A1A] mb-4">
                                    <FolderOpen size={24} color="#F97316" strokeWidth={2.5} />
                                </View>
                                <Text className="text-sm font-black uppercase tracking-widest text-zinc-950 dark:text-white text-center">
                                    {isSearching ? 'Aucun résultat' : 'Dossier vide'}
                                </Text>
                                <Text className="mt-2 text-center text-xs font-bold leading-relaxed text-zinc-400 dark:text-zinc-500">
                                    {isSearching
                                        ? "Nous n'avons trouvé aucun document correspondant à votre recherche."
                                        : parentId
                                            ? "Ce dossier ne contient aucun document pour le moment."
                                            : "Sélectionnez une filière ou utilisez la barre de recherche pour démarrer."}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </>
    )
}