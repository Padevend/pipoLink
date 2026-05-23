import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router } from 'expo-router';
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
import { BRAND } from '@/shared/config/brand';
import { cn } from '@/shared/utils/cn';

export default function MyDocumentsScreen() {
  
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
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      
      {/* Header Style Glassmorphism Solide Épuré */}
      <View className="z-10 flex-row items-center border-b border-border-light/20 bg-surface-light/75 px-4 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl ">
        <Pressable 
          onPress={() => router.back()} 
          className="h-9 w-9 items-center justify-center rounded-full bg-background-light/40 border border-border-light/20 dark:bg-background-dark/30 active:opacity-80"
        >
          <ChevronLeft size={20} className="text-text-primary-light dark:text-text-primary-dark" />
        </Pressable>
        
        <Text className="flex-1 ml-3 text-[17px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          Mes documents
        </Text>
      </View>

      {/* Chargement Skeletons Fluides */}
      {isLoading ? (
        <View className="gap-3 p-5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[92px] w-full rounded-2xl opacity-70" />
          ))}
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator className="py-4" color={BRAND.primary} />
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-6">
              {/* Icône enveloppée dans un conteneur Soft Glassmorphism */}
              <View className="h-16 w-16 items-center justify-center rounded-2xl border border-border-light/40 bg-surface-light/40 dark:border-border-dark/20 dark:bg-surface-dark/30 backdrop-blur-xl  mb-4">
                <View className="p-2.5 rounded-xl bg-primary/10">
                  <FileText size={26} color={BRAND.primary} />
                </View>
              </View>
              <Text className="text-base font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark text-center">
                Aucun document publié
              </Text>
              <Text className="mt-1.5 text-center text-sm leading-5 text-text-secondary-light/80 dark:text-text-secondary-dark/80 px-6">
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
              className="flex-row items-center rounded-2xl border border-border-light/40 bg-surface-light/50 p-4 dark:border-border-dark/20 dark:bg-surface-dark/40 active:opacity-90"
            >
              {/* Wrapper Icône Document */}
              <View className="mr-4 h-11 w-11 items-center justify-center rounded-xl bg-text-secondary-light/5 border border-border-light/10 dark:bg-text-secondary-dark/5 dark:border-border-dark/10 ">
                <FileText size={18} color="#64748B" />
              </View>
              
              {/* Corps Textuel */}
              <View className="flex-1 pr-3 justify-center">
                <Text
                  numberOfLines={1}
                  className="text-[14px] font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark"
                >
                  {item.title}
                </Text>
                
                <Text className="mt-1 text-[11px] font-medium text-text-secondary-light/60 dark:text-text-secondary-dark/60">
                  {formatBytes(item.fileSize)} · {format(new Date(item.createdAt), 'd MMM yyyy', { locale: fr })}
                </Text>
                
                {/* Badge Compteur Téléchargements */}
                <View className="flex-row mt-1.5">
                  <View className="rounded-full bg-primary/5 border border-primary/10 px-2 py-0.5">
                    <Text className="text-[10px] font-semibold tracking-wide text-primary">
                      {item.downloadCount} téléchargement{item.downloadCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bouton Action Supprimer */}
              <Pressable
                onPress={() => confirmDelete(item)}
                disabled={deleteMutation.isPending}
                className={cn(
                  "h-9 w-9 items-center justify-center rounded-xl active:opacity-75",
                  "bg-red-500/10 border border-red-500/10 dark:bg-red-500/20"
                )}
              >
                <Trash2 size={15} color="#EF4444" />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}