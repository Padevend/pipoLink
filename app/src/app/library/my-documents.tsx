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
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top']}>
      
      {/* HEADER : Néo-banque, Plat, Solide */}
      <View className="flex-row items-center justify-between border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <View className="flex-row items-center gap-4 flex-1">
          <Pressable 
            onPress={() => router.back()} 
            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
          >
            <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
          </Pressable>
          
          <View className="flex-1">
            <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
              Mes documents
            </Text>
          </View>
        </View>

        {/* Quota FREE : Pilule pleine (rounded-full) */}
        {!isPremium && !isLoading && (
          <Pressable
            onPress={quotaFull ? () => router.push('/settings/subscription' as never) : undefined}
            className={cn(
              'rounded-full px-3 py-1.5 ml-2 active:opacity-80',
              quotaFull
                ? 'bg-orange-500'
                : 'bg-zinc-100 dark:bg-[#1A1A1A]',
            )}
          >
            <Text
              className={cn(
                'text-[10px] font-black tracking-widest uppercase',
                quotaFull ? 'text-white' : 'text-zinc-500 dark:text-zinc-400',
              )}
            >
              {Math.min(totalDocs, FREE_DOC_LIMIT)}/{FREE_DOC_LIMIT} Docs
            </Text>
          </Pressable>
        )}
      </View>

      {/* Skeletons (rounded-2xl) */}
      {isLoading ? (
        <View className="gap-y-3 px-6 pt-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]" />
          ))}
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator className="py-4" color="#F97316" />
            ) : null
          }
          ListEmptyComponent={
            /* Empty State (Carte rounded-2xl) */
            <View className="items-center justify-center py-16 px-6 mt-6 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-[#1A1A1A] bg-zinc-50 dark:bg-[#0A0A0A]">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] mb-5">
                <FileText size={24} color="#F97316" strokeWidth={2.5} />
              </View>
              <Text className="text-sm font-black uppercase tracking-widest text-zinc-950 dark:text-white text-center">
                Aucun document publié
              </Text>
              <Text className="mt-2 text-center text-xs font-bold leading-relaxed text-zinc-500 dark:text-zinc-400 px-2">
                Vous n'avez pas encore téléversé ou partagé de documents avec l'établissement.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            /* Carte Document (rounded-2xl, fond plein) */
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/library/document/[id]',
                  params:     { id: item.id },
                } as never)
              }
              className="flex-row items-center rounded-2xl bg-zinc-100 p-4 dark:bg-[#1A1A1A] active:opacity-80 transition-all"
            >
              {/* Conteneur Icône Document (rounded-full) */}
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-[#222222]">
                <FileText size={20} color="#F97316" strokeWidth={2.5} />
              </View>
              
              {/* Corps Textuel */}
              <View className="flex-1 pr-3 justify-center">
                <Text
                  numberOfLines={1}
                  className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white"
                >
                  {item.title}
                </Text>
                
                <Text className="mt-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  {formatBytes(item.fileSize)} • {format(new Date(item.createdAt), 'd MMM yyyy', { locale: fr })}
                </Text>
                
                {/* Badge Compteur (rounded-full) */}
                <View className="flex-row mt-2">
                  <View className="rounded-full bg-white dark:bg-[#222222] px-3 py-1">
                    <Text className="text-[9px] font-black tracking-widest text-zinc-500 uppercase">
                      {item.downloadCount} Téléchargement{item.downloadCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bouton Action Supprimer (rounded-full) */}
              <Pressable
                onPress={() => confirmDelete(item)}
                disabled={deleteMutation.isPending}
                hitSlop={10}
                className="h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 active:opacity-80"
              >
                <Trash2 size={16} color="#EF4444" strokeWidth={2.5} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}