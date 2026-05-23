import { useAiSessions, useDeleteSession } from '@/entities/ai/hooks';
import { AppLogo } from '@/shared/ui/app-logo';
import { Button } from '@/shared/ui/button';
import { formatRelativeDate } from '@/shared/lib/date';
import { BRAND } from '@/shared/config/brand';
import { MessageSquarePlus, Sparkles, Trash2 } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { RefreshControl } from 'react-native';
import { Loader } from '@/shared/ui/loader';

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
  }

  // ==================== VUE HISTORIQUE ====================
  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      {/* Header Épuré Sans Dégradé (Style Glassmorphism Solide) */}
      <View className="z-10 flex-row items-center justify-between border-b border-border-light/20 bg-surface-light/75 px-6 py-4 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl ">
        <View className="flex-row items-center gap-3">
          <View className=" opacity-95">
            <AppLogo size="sm" />
          </View>
          <View className="justify-center">
            <Text className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
              Assistant IA
            </Text>

            {/* Tag Historique style badge minimaliste */}
            <View className="flex-row mt-0.5">
              <View className="rounded-full bg-text-secondary-light/5 px-2 py-0.5 dark:bg-text-secondary-dark/5 border border-border-light/10 dark:border-border-dark/10">
                <Text className="text-[10px] font-semibold tracking-wide text-text-secondary-light/80 dark:text-text-secondary-dark/80">
                  Historique
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className="flex-1 px-5 pt-6">
        <Button
          label="Nouvelle conversation"
          leftIcon={<MessageSquarePlus size={18} color="#fff" />}
          onPress={startNewConversation}
          className="mb-6 rounded-2xl h-12 "
        />

        {sessionsLoading ? (
          <ActivityIndicator color={BRAND.primary} className="mt-8" />
        ) : (
          <FlatList
            data={sessions ?? []}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            ItemSeparatorComponent={() => <View className="h-3" />}
            ListEmptyComponent={
              <View className="items-center py-20 px-6">
                <View className="h-16 w-16 items-center justify-center rounded-2xl border border-border-light/40 bg-surface-light/40 dark:border-border-dark/20 dark:bg-surface-dark/30 backdrop-blur-xl  mb-4">
                  <View className="p-2.5 rounded-xl bg-primary/10">
                    <Sparkles size={26} color={BRAND.primary} />
                  </View>
                </View>
                <Text className="text-lg font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark text-center">
                  Aucune conversation
                </Text>
                <Text className="mt-1.5 text-center text-sm leading-5 text-text-secondary-light/80 dark:text-text-secondary-dark/80 px-4">
                  Créez un nouvel échange pour poser toutes vos questions de cours.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => openSession(item.id)}
                className="w-full flex-row items-center justify-between rounded-xl border border-border-light/40 bg-surface-light/50 p-3.5 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md active:scale-[0.99] transition-all"
              >

                {/* LEFT: Content Block */}
                <View className="flex-1 items-start justify-center pr-4">
                  <Text
                    className="text-[14px] font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark"
                    numberOfLines={1}
                  >
                    {item.title || 'Conversation sans titre'}
                  </Text>
                  <Text className="mt-1 text-[11px] font-medium text-text-secondary-light/50 dark:text-text-secondary-dark/50">
                    {formatRelativeDate(item.createdAt)}
                  </Text>
                </View>

                {/* RIGHT: Action Button Block */}
                <View className="items-center justify-center pl-2">
                  {isDeleting && deleteVariables === item.id ? (
                    <Loader size="small" />
                  ) : (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(item.id);
                      }}
                      className="h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 dark:bg-red-500/15 active:scale-90 transition-transform"
                    >
                      <Trash2 size={18} color="red" />
                    </Pressable>
                  )}
                </View>

              </Pressable>
            )}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="var(--color-primary)"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}