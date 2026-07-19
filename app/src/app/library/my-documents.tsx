import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router } from 'expo-router';
import { ArrowLeft, FileText, Trash2 } from 'lucide-react-native';
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
import { useAuth, useToast } from '@/providers';
import type { Document } from '@/shared/api/types';
import { formatBytes } from '@/shared/lib/file';
import { Skeleton } from '@/shared/ui/skeleton';
import { cn } from '@/shared/utils/cn';

const FREE_DOC_LIMIT = 5;

export default function MyDocumentsScreen() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const isPremium =
    user?.subscription?.plan === 'PREMIUM' && user?.subscription?.status === 'ACTIVE';
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } =
    useMyDocuments();
  const deleteMutation = useDeleteDocument();

  const documents = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );

  const totalDocs = data?.pages[0]?.total ?? documents.length;
  const quotaFull = !isPremium && totalDocs >= FREE_DOC_LIMIT;

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
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top']}>
      
      {/* HEADER : Panneau Fixe Mat Opaque */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <Pressable 
          onPress={() => router.back()} 
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={16} color="#71717A" />
        </Pressable>
        
        <Text className="flex-1 ml-3 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Mes documents
        </Text>

        {/* Quota FREE : X/5 documents */}
        {!isPremium && !isLoading && (
          <Pressable
            onPress={quotaFull ? () => router.push('/settings/subscription' as never) : undefined}
            className={cn(
              'rounded-md px-2 py-1 border',
              quotaFull
                ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/50 active:bg-orange-100'
                : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800',
            )}
          >
            <Text
              className={cn(
                'text-[10px] font-bold tracking-wider uppercase',
                quotaFull ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500 dark:text-zinc-400',
              )}
            >
              {Math.min(totalDocs, FREE_DOC_LIMIT)}/{FREE_DOC_LIMIT} documents
            </Text>
          </Pressable>
        )}
      </View>

      {/* Skeletons Solides Opaque */}
      {isLoading ? (
        <View className="gap-2.5 p-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl bg-zinc-100 dark:bg-zinc-900" />
          ))}
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator className="py-4" color="#F97316" />
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-32 px-6">
              {/* Conteneur d'icône Mat Opaque */}
              <View className="h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 mb-4">
                <FileText size={18} color="#F97316" />
              </View>
              <Text className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-50 text-center">
                Aucun document publié
              </Text>
              <Text className="mt-1 text-center text-[11px] leading-4 text-zinc-500 dark:text-zinc-400 px-4">
                Vous n'avez pas encore téléversé ou partagé de documents avec l'établissement.
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
              className="flex-row items-center rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-900 dark:bg-zinc-900/40 active:bg-zinc-100 dark:active:bg-zinc-900"
            >
              {/* Conteneur Icône Document Opaque */}
              <View className="mr-3.5 h-9 w-9 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800">
                <FileText size={15} color="#71717A" />
              </View>
              
              {/* Corps Textuel */}
              <View className="flex-1 pr-3 justify-center">
                <Text
                  numberOfLines={1}
                  className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                >
                  {item.title}
                </Text>
                
                <Text className="mt-0.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
                  {formatBytes(item.fileSize)} · {format(new Date(item.createdAt), 'd MMM yyyy', { locale: fr })}
                </Text>
                
                {/* Badge Compteur Opaque Mat */}
                <View className="flex-row mt-1.5">
                  <View className="rounded bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5">
                    <Text className="text-[9px] font-bold tracking-wider text-orange-700 dark:text-orange-400 uppercase">
                      {item.downloadCount} téléchargement{item.downloadCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bouton Action Supprimer Rouge Mat */}
              <Pressable
                onPress={() => confirmDelete(item)}
                disabled={deleteMutation.isPending}
                className={cn(
                  "h-8 w-8 items-center justify-center rounded-lg border active:bg-red-100 dark:active:bg-red-950/40",
                  "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/40"
                )}
              >
                <Trash2 size={13} color="#EF4444" />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}