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
import { Alert, FlatList, Pressable, Text, View } from 'react-native';

const ROOT_CRUMB: BreadcrumbItem = { id: null, name: 'Bibliothèque' };

export type ExplorerRow =
    | { kind: 'folder'; item: LibraryFolder }
    | { kind: 'file'; item: Document };

interface LibraryExplorerProps {
    documentAction: (doc: Document) => void;
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
    documentAction
}: LibraryExplorerProps) {
    const [trail, setTrail] = useState<BreadcrumbItem[]>([ROOT_CRUMB]);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search.trim(), 350);
    const { user } = useAuth();
    const isPremium =
        user?.subscription?.plan === 'PREMIUM' && user?.subscription?.status === 'ACTIVE';

    const handleSemanticSearchPress = useCallback(() => {
        if (!isPremium) {
            Alert.alert(
                'Fonctionnalité Premium',
                'La recherche sémantique (recherche en langage naturel dans vos documents) nécessite un abonnement Premium.',
                [
                    { text: 'Annuler', style: 'cancel' },
                    { text: "Voir l'offre", onPress: () => router.push('/settings/subscription' as never) },
                ],
            );
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
            <View className="bg-white px-5 pb-3 dark:bg-zinc-950">
                {/* Barre de Recherche Mate */}
                <View>
                    <SearchBar
                        placeholder='Rechercher un document, une UE…'
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Recherche sémantique (Premium) */}
                <Pressable
                    onPress={handleSemanticSearchPress}
                    className="mt-2.5 flex-row items-center justify-between rounded-xl border border-orange-200 bg-orange-50/60 px-3.5 py-2.5 dark:border-orange-900/40 dark:bg-orange-950/20 active:bg-orange-100 dark:active:bg-orange-950/40"
                >
                    <View className="flex-row items-center gap-2 flex-1">
                        <Sparkles size={14} color="#F97316" />
                        <Text className="text-xs font-bold tracking-tight text-zinc-800 dark:text-zinc-200">
                            Recherche IA
                        </Text>
                        <Text numberOfLines={1} className="flex-1 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                            « les lois de Maxwell en thermo… »
                        </Text>
                    </View>
                    {!isPremium && (
                        <View className="rounded-md bg-orange-500 px-1.5 py-0.5 ml-2">
                            <Text className="text-[8px] font-black uppercase tracking-wider text-white">
                                Premium
                            </Text>
                        </View>
                    )}
                </Pressable>

                {/* Fil d'Ariane */}
                <View className="mt-3.5">
                    <ExplorerBreadcrumb items={trail} onNavigate={navigateBreadcrumb} />
                </View>
            </View>

            <View className="flex-1 px-4 pt-3">
                {isLoading ? (
                    <View className="gap-2.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-14 w-full rounded-xl" />
                        ))}
                    </View>
                ) : (
                    <FlatList
                        data={rows}
                        keyExtractor={(row) => `${row.kind}-${row.item.id}`}
                        renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        ItemSeparatorComponent={() => <View className="h-2" />}
                        refreshing={isFetching}
                        onRefresh={() => {
                            if (isSearching) {
                                searchQuery.refetch();
                            } else {
                                browseQuery.refetch();
                            }
                        }}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-16 px-6">
                                {/* Conteneur d'icône Mat */}
                                <View className="h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 mb-3">
                                    <FolderOpen size={20} color="#F97316" />
                                </View>
                                <Text className="text-sm font-bold tracking-tight text-zinc-800 dark:text-zinc-200 text-center">
                                    {isSearching ? 'Aucun résultat' : 'Dossier vide'}
                                </Text>
                                <Text className="mt-1 text-center text-xs leading-4 text-zinc-400 dark:text-zinc-500 px-6">
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