import { useLibraryBrowse, useLibrarySearch } from '@/entities/document/hooks';
import {
    ExplorerBreadcrumb,
    type BreadcrumbItem,
} from '@/features/library/components/explorer-breadcrumb';
import { ExplorerFileRow } from '@/features/library/components/explorer-file-row';
import { ExplorerFolderRow } from '@/features/library/components/explorer-folder-row';
import type { Document, LibraryFolder } from '@/shared/api/types';
import { BRAND } from '@/shared/config/brand';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { router } from 'expo-router';
import { ArrowDownToLine, ArrowLeft, FolderOpen, Search, Upload, User } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ROOT_CRUMB: BreadcrumbItem = { id: null, name: 'Bibliothèque' };

type ExplorerRow =
    | { kind: 'folder'; item: LibraryFolder }
    | { kind: 'file'; item: Document };

function useDebouncedValue<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(t);
    }, [value, delayMs]);
    return debounced;
}

export default function LibraryExplorerScreen() {
    const [trail, setTrail] = useState<BreadcrumbItem[]>([ROOT_CRUMB]);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search.trim(), 350);

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

    const openDocument = useCallback(
        (id: string) => {
            router.push({ pathname: '/library/document/[id]', params: { id } } as never);
        },
        [router],
    );

    const renderItem = useCallback(
        ({ item }: { item: ExplorerRow }) => {
            if (item.kind === 'folder') {
                return <ExplorerFolderRow folder={item.item} onPress={() => openFolder(item.item)} />;
            }
            return (
                <ExplorerFileRow document={item.item} onPress={() => openDocument(item.item.id)} />
            );
        },
        [openDocument, openFolder],
    );

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
            {/* En-tête Translucide Style Glassmorphism Solide */}
            <View className="z-10 border-b border-border-light/20 bg-surface-light/75 px-5 pb-0 pt-4 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl ">
                <View className="mb-4 flex-row items-center justify-between">

                    <Pressable
                        onPress={() => router.back()}
                        hitSlop={8}
                        className="h-9 w-9 items-center justify-center rounded-xl bg-background-light/40 dark:bg-background-dark/30 active:scale-95 transition-transform"
                    >
                        <ArrowLeft size={18} color="#64748B" />
                    </Pressable>

                    <View className="flex-1 pl-4">
                        <Text className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                            Bibliothèque
                        </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                        <Pressable
                            onPress={() => router.push("/library/history")}
                            className="h-10 w-10 items-center justify-center rounded-full bg-background-light/40 dark:bg-background-dark/30 active:opacity-80"
                        >
                            <ArrowDownToLine size={22} color="#64748B" />
                        </Pressable>

                        <Pressable
                            onPress={() => router.push("/library/my-documents")}
                            className="h-10 w-10 items-center justify-center rounded-full bg-background-light/40 dark:bg-background-dark/30 active:opacity-80"
                        >
                            <User size={22} color="#64748B" />
                        </Pressable>

                        <Pressable
                            onPress={() => router.push('/modal/upload-document')}
                            className="h-12 w-12 items-center justify-center rounded-full bg-primary active:opacity-80"
                        >
                            <Upload size={22} color="#FFFFFF" />
                        </Pressable>
                    </View>
                </View>

                <View className="bg-surface-light/50 dark:bg-surface-dark/40 border border-border-light dark:border-border-dark/20 rounded-2xl p-1 ">
                    <Input
                        placeholder="Rechercher un document, une UE…"
                        value={search}
                        onChangeText={setSearch}
                        leftIcon={Search}
                        containerClassName="bg-transparent border-0 h-9"
                        className="text-[14px] text-text-primary-light dark:text-text-primary-dark"
                    />
                </View>

                <View className="mt-5">
                    <ExplorerBreadcrumb items={trail} onNavigate={navigateBreadcrumb} />
                </View>
            </View>

            {/* Zone du contenu de l'explorateur */}
            <View className="flex-1 px-5 pt-4">
                {isLoading ? (
                    <View className="gap-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="p-10 w-full rounded-2xl opacity-70" />
                        ))}
                    </View>
                ) : (
                    <FlatList
                        data={rows}
                        keyExtractor={(row) => `${row.kind}-${row.item.id}`}
                        renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        ItemSeparatorComponent={() => <View className="h-2.5" />}
                        ListHeaderComponent={
                            isFetching && !isLoading ? (
                                <View className="mb-3 items-center py-1">
                                    <ActivityIndicator size="small" color={BRAND.primary} />
                                </View>
                            ) : null
                        }
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20 px-6">
                                {/* Icône enveloppée dans un conteneur Soft Glassmorphism */}
                                <View className="h-16 w-16 items-center justify-center rounded-2xl border border-border-light/40 bg-surface-light/40 dark:border-border-dark/20 dark:bg-surface-dark/30 backdrop-blur-xl  mb-4">
                                    <View className="p-2.5 rounded-xl bg-primary/10">
                                        <FolderOpen size={26} color={BRAND.primary} />
                                    </View>
                                </View>
                                <Text className="text-base font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark text-center">
                                    {isSearching ? 'Aucun résultat' : 'Dossier vide'}
                                </Text>
                                <Text className="mt-1.5 text-center text-sm leading-5 text-text-secondary-light/80 dark:text-text-secondary-dark/80 px-4">
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
        </SafeAreaView>
    );
}