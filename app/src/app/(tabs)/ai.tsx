import { useAiSessions, useDeleteSession } from '@/entities/ai/hooks';
import { AppLogo } from '@/shared/ui/app-logo';
import { Button } from '@/shared/ui/button';
import { formatRelativeDate } from '@/shared/lib/date';
import { BRAND } from '@/shared/config/brand';
import { BookOpen, FolderOpen, Plus, Terminal, Trash2 } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { RefreshControl } from 'react-native';
import { Loader } from '@/shared/ui/loader';

// On définit une couleur Orange Électrique pour les icônes Lucide
const ORANGE_ACCENT = '#FF6B00'; 

export default function AiScreen() {
  const { data: sessions, isLoading: sessionsLoading, refetch, isRefetching } = useAiSessions();
  const { mutate: deleteSession, isPending: isDeleting, variables: deleteVariables } = useDeleteSession();

  const startNewConversation = () => {
    router.push(`/ai/new`);
  };

  const openSession = (id: string) => {
    router.push(`/ai/${id}`);
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top']}>
      
      {/* Header : Style Technique & Minimaliste */}
      <View className="flex-row items-center justify-between border-b border-zinc-100 bg-white px-6 py-4 dark:border-zinc-900 dark:bg-zinc-950">
        <View className="flex-row items-center gap-3">
          <AppLogo size="sm" />
          <View>
            <Text className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
              Hiro
            </Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              {/* Point indicateur Orange Tech */}
              <View className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <Text className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Workspace / AI Sessions
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="flex-1 px-5 pt-6">
        
        {/* Bouton d'action principal - Focus Orange */}
        <Button
          label="Nouveau Notebook"
          leftIcon={<Plus size={16} color="#fff" />}
          onPress={startNewConversation}
          className="mb-6 rounded-xl h-12 bg-orange-500 dark:bg-orange-600 active:opacity-90"
        />

        {sessionsLoading ? (
          <ActivityIndicator color={ORANGE_ACCENT} className="mt-8" />
        ) : (
          <FlatList
            data={sessions ?? []}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            ItemSeparatorComponent={() => <View className="h-2.5" />}
            
            /* Empty State : Épuré et Mathématique */
            ListEmptyComponent={
              <View className="items-center py-24 px-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20">
                <View className="h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 mb-4">
                  <Terminal size={20} color={ORANGE_ACCENT} />
                </View>
                <Text className="text-md font-bold tracking-tight text-zinc-900 dark:text-zinc-50 text-center">
                  Index vide
                </Text>
                <Text className="mt-1 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500 max-w-[240px]">
                  Aucun notebook initialisé. Créez un environnement pour commencer à réviser.
                </Text>
              </View>
            }
            
            /* Liste des Items : Structure Monochrome Clé, Accentuation Orange au survol/touch */
            renderItem={({ item }) => (
              <Pressable
                onPress={() => openSession(item.id)}
                className="w-full flex-row items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-900 dark:bg-zinc-900/60 active:border-orange-500/50 dark:active:border-orange-500/50 transition-all"
              >
                {/* GAUCHE : Contenu principal */}
                <View className="flex-row items-center gap-4 flex-1 pr-4">
                  {/* Icône de dossier monochrome avec point orange discret */}
                  <View className="h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 relative">
                    <FolderOpen size={16} color={ORANGE_ACCENT} />
                  </View>
                  
                  <View className="flex-1 justify-center">
                    <Text
                      className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                      numberOfLines={1}
                    >
                      {item.title || 'Notebook sans titre'}
                    </Text>
                    <Text className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Notebook · {formatRelativeDate(item.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* DROITE : Action de suppression technique */}
                <View className="items-center justify-center pl-2">
                  {isDeleting && deleteVariables === item.id ? (
                    <Loader size="small" />
                  ) : (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(item.id);
                      }}
                      className="h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 active:bg-red-50/50 dark:active:bg-red-950/20 active:border-red-500/30 group"
                    >
                      <Trash2 size={14} color="#A1A1AA" />
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
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}