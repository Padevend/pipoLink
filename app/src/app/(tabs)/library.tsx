import { useLibraryBrowse, useLibrarySearch } from '@/entities/document/hooks';
import {
  ExplorerBreadcrumb,
  type BreadcrumbItem,
} from '@/features/library/components/explorer-breadcrumb';
import { ExplorerFileRow } from '@/features/library/components/explorer-file-row';
import { ExplorerFolderRow } from '@/features/library/components/explorer-folder-row';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import type { Document, LibraryFolder } from '@/shared/api/types';
import { useRouter } from 'expo-router';
import { FolderOpen, Search, Upload, User } from 'lucide-react-native';
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

export default function LibraryScreen() {
  const router = useRouter();
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
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="px-5 pb-2 pt-4">
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-black tracking-tight text-text-primary-light dark:text-text-primary-dark">
              Bibliothèque
            </Text>
            <Text className="font-medium text-text-secondary-light dark:text-text-secondary-dark">
              Filière · Niveau · UE
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/library/my-documents' as never)}
            className="mr-2 h-11 w-11 items-center justify-center rounded-2xl border border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark"
          >
            <User size={20} color="#64748B" />
          </Pressable>
          <Pressable
            onPress={() => router.push('/modal/upload-document')}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30"
          >
            <Upload size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <Input
          placeholder="Rechercher un document, une UE…"
          value={search}
          onChangeText={setSearch}
          leftIcon={Search}
          containerClassName="mb-3"
        />

        {!isSearching && trail.length > 1 ? (
          <ExplorerBreadcrumb items={trail} onNavigate={navigateBreadcrumb} />
        ) : null}
      </View>

      <View className="flex-1 px-5">
        {isLoading ? (
          <View className="gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-[68px] w-full rounded-2xl" />
            ))}
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(row) => `${row.kind}-${row.item.id}`}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListHeaderComponent={
              isFetching && !isLoading ? (
                <View className="mb-2 items-center py-1">
                  <ActivityIndicator size="small" color="#FF7A00" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View className="items-center justify-center gap-3 py-24">
                <FolderOpen size={48} color="#94A3B8" />
                <Text className="text-center text-base font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                  {isSearching
                    ? 'Aucun document trouvé.'
                    : parentId
                      ? 'Ce dossier est vide.'
                      : 'Choisissez une filière pour commencer.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
