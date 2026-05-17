import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { ChevronLeft, FileText, Trash2 } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDeleteDocument, useMyDocuments } from '@/entities/document/hooks';
import { Skeleton } from '@/shared/ui/skeleton';
import type { Document } from '@/shared/api/types';
import { formatBytes } from '@/shared/lib/file';
import { useToast } from '@/shared/hooks/use-toast';

export default function MyDocumentsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } =
    useMyDocuments();
  const deleteMutation = useDeleteDocument();

  const documents = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );

  const confirmDelete = useCallback(
    (doc: Document) => {
      Alert.alert(
        'Supprimer le document',
        `Voulez-vous supprimer « ${doc.title} » ? Cette action est irréversible.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text:    'Supprimer',
            style:   'destructive',
            onPress: () => {
              deleteMutation.mutate(doc.id, {
                onSuccess: () => {
                  showToast({ type: 'success', message: 'Document supprimé.' });
                },
                onError: () => {
                  showToast({ type: 'error', message: 'Impossible de supprimer le document.' });
                },
              });
            },
          },
        ],
      );
    },
    [deleteMutation, showToast],
  );

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-row items-center border-b border-border-light px-2 dark:border-border-dark">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center">
          <ChevronLeft size={24} color="#111827" />
        </Pressable>
        <Text className="flex-1 text-lg font-black text-text-primary-light dark:text-text-primary-dark">
          Mes documents
        </Text>
      </View>

      {isLoading ? (
        <View className="gap-2 p-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator className="py-4" color="#FF7A00" />
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center py-24">
              <FileText size={40} color="#94A3B8" />
              <Text className="mt-3 text-center text-text-secondary-light dark:text-text-secondary-dark">
                Vous n&apos;avez pas encore publié de document.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/library/document/[id]',
                  params:     { id: item.id },
                } as never)
              }
              className="mb-3 flex-row items-center rounded-2xl border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark"
            >
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <FileText size={20} color="#64748B" />
              </View>
              <View className="flex-1 pr-2">
                <Text
                  numberOfLines={2}
                  className="font-bold text-text-primary-light dark:text-text-primary-dark"
                >
                  {item.title}
                </Text>
                <Text className="mt-0.5 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  {formatBytes(item.fileSize)} ·{' '}
                  {format(new Date(item.createdAt), 'd MMM yyyy', { locale: fr })}
                </Text>
                <Text className="mt-0.5 text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                  {item.downloadCount} téléchargement{item.downloadCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <Pressable
                onPress={() => confirmDelete(item)}
                disabled={deleteMutation.isPending}
                className="h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40"
              >
                <Trash2 size={18} color="#DC2626" />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
