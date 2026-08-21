import { useAiSessions, useDeleteSession } from '@/entities/ai/hooks';
import { formatRelativeDate } from '@/shared/lib/date';
import { AppLogo } from '@/shared/ui/app-logo';
import { Loader } from '@/shared/ui/loader';
import { router } from 'expo-router';
import { BookOpen, Plus, Trash2 } from 'lucide-react-native';
import React from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useToast } from '@/providers';

const ORANGE_ACCENT = '#F97316';

export default function AiScreen() {
  const { data: sessions, isLoading: sessionsLoading, refetch, isRefetching } = useAiSessions();
  const { mutate: deleteSession, isPending: isDeleting, variables: deleteVariables } = useDeleteSession();
  const toast = useToast()

  const startNewConversation = () => {
    router.push(`/ai/new`);
  };

  const openSession = (id: string) => {
    router.push(`/ai/${id}`);
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
  };

  // Composant visuel d'attente (Skeleton)
  const SessionSkeleton = () => (
    <View className="mx-6 mb-3 flex-row items-center justify-between rounded-[20px] border border-zinc-200/50 bg-white p-3.5 shadow-sm shadow-zinc-200/40 dark:border-zinc-800/80 dark:bg-zinc-900 dark:shadow-none">
      <View className="flex-row items-center gap-4 flex-1">
        {/* Skeleton Icône */}
        <View className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        
        {/* Skeleton Textes */}
        <View className="flex-1 justify-center gap-2">
          <View className="h-3.5 w-3/4 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <View className="h-2 w-1/3 rounded-full bg-zinc-50 dark:bg-zinc-800/60 animate-pulse" />
        </View>
      </View>

      {/* Skeleton Bouton */}
      <View className="h-10 w-10 rounded-full bg-zinc-50 dark:bg-zinc-800/50 animate-pulse" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top']}>
      <StatusBar style="auto" />
      
      {/* ========================================= */}
      {/* SECTION HEADER : Identité et Séparation     */}
      {/* ========================================= */}
      <View className="flex-row items-center justify-between border-b border-zinc-100 bg-white px-6 py-4 dark:border-zinc-900/80 dark:bg-zinc-950">
        <View className="flex-row items-center gap-3">
          <AppLogo size="sm" showWordmark={false} />
          <View>
            <Text className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
              Hiro
            </Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <View className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <Text className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Workspace / AI
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ========================================= */}
      {/* SECTION BODY : Fond gris clair contrastant  */}
      {/* ========================================= */}
      <View className="flex-1 bg-zinc-50 pt-6 dark:bg-zinc-950/50">
        
        {/* ACTION PRINCIPALE : Bouton flottant fort */}
        <Pressable
          onPress={startNewConversation}
          className="mx-6 mb-6 h-14 flex-row items-center justify-center gap-2.5 rounded-2xl bg-orange-500 shadow-xl shadow-orange-500/30 active:scale-[0.98] active:bg-orange-600 transition-all dark:bg-orange-600 dark:shadow-none"
        >
          <Plus size={20} color="#ffffff" strokeWidth={2.5} />
          <Text className="text-sm font-extrabold uppercase tracking-widest text-white">
            Nouveau Notebook
          </Text>
        </Pressable>

        {/* LISTE OU CHARGEMENT */}
        {sessionsLoading ? (
          <View className="flex-1 pt-2">
            {[1, 2, 3, 4, 5].map((key) => (
              <SessionSkeleton key={key} />
            ))}
          </View>
        ) : (
          <FlatList
            data={sessions ?? []}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}
            
            /* EMPTY STATE : Lumineux et engageant */
            ListEmptyComponent={
              <View className="items-center py-16 px-8">
                <View className="h-24 w-24 items-center justify-center rounded-[32px] bg-white border border-zinc-100 shadow-xl shadow-zinc-200/50 mb-6 dark:bg-zinc-900 dark:border-zinc-800 dark:shadow-none">
                  <View className="h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-500/10">
                    <BookOpen size={28} color={ORANGE_ACCENT} strokeWidth={1.5} />
                  </View>
                </View>
                <Text className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white text-center mb-2">
                  Votre index est vide
                </Text>
                <Text className="text-center text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[280px]">
                  Initialisez un nouvel environnement pour commencer à réviser avec Hiro.
                </Text>
              </View>
            }
            
            /* LISTE DES SESSIONS : Cartes blanches sur fond gris */
            renderItem={({ item }) => (
              <Pressable
                onPress={() => openSession(item.id)}
                className="group mx-6 mb-3 flex-row items-center justify-between rounded-[20px] border border-zinc-200/60 bg-white p-3.5 shadow-sm shadow-zinc-200/50 active:scale-[0.98] active:border-orange-500/50 transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
              >
                <View className="flex-row items-center gap-4 flex-1">
                  {/* Icône de bloc-notes soignée */}
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-800">
                    <BookOpen size={18} color="#52525B" />
                  </View>
                  
                  <View className="flex-1 pr-2 justify-center">
                    <Text
                      className="text-[15px] font-bold tracking-tight text-zinc-900 dark:text-white mb-0.5"
                      numberOfLines={1}
                    >
                      {item.title || 'Notebook sans titre'}
                    </Text>
                    <Text className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
                      Modifié {formatRelativeDate(item.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* Bouton de suppression minimaliste */}
                <View className="items-center justify-center pl-2">
                  {isDeleting && deleteVariables === item.id ? (
                    <View className="h-10 w-10 items-center justify-center">
                      <Loader size="small" />
                    </View>
                  ) : (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(item.id);
                      }}
                      hitSlop={8}
                      className="h-10 w-10 items-center justify-center rounded-full bg-zinc-50 active:bg-red-50 dark:bg-zinc-800 dark:active:bg-red-950/30 transition-colors"
                    >
                      <Trash2 size={16} color="#A1A1AA" />
                    </Pressable>
                  )}
                </View>
              </Pressable>
            )}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={ORANGE_ACCENT}
                colors={[ORANGE_ACCENT]}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}