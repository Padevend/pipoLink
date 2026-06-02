import { router } from 'expo-router';
import { ArrowLeft, GraduationCap, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCreateChat } from '@/features/messaging/hooks/use-create-chat';
import { useSearchUsers, type SearchUserResult } from '@/features/messaging/hooks/use-search-users';
import { useAuth, useToast } from '@/providers';
import { BRAND } from '@/shared/config/brand';
import { Avatar } from '@/shared/ui/avatar';
import { SearchBar } from '@/shared/ui/search-bar';

function displayName(u: SearchUserResult): string {
  if (u.profile?.firstname || u.profile?.lastname) {
    return [u.profile.firstname, u.profile.lastname].filter(Boolean).join(' ');
  }
  return u.username ?? u.email ?? 'Utilisateur';
}

export default function NewChatScreen(): JSX.Element {
  const { t } = useTranslation('chat');
  const { user } = useAuth();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const { data, isLoading } = useSearchUsers(query);
  const createChat = useCreateChat();

  const results = useMemo(
    () => (data ?? []).filter((u) => u.id !== user?.id),
    [data, user?.id],
  );

  const startPrivate = (target: SearchUserResult) => {
    createChat.mutate(
      { type: 'private', memberUserIds: [target.id] },
      {
        onSuccess: (chat) => {
          showToast({ type: 'success', message: t('chatCreated') });
          router.replace(`/chat/${chat.id}` as any);
        },
        onError: (e) => {
          showToast({ type: 'error', message: e instanceof Error ? e.message : 'Error' });
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      
      {/* Header Translucide Style Glassmorphism (Sans Shadow) */}
      <View className="z-10 flex-row items-center border-b border-border-light/20 bg-surface-light/75 px-4 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <Pressable 
          onPress={() => router.back()} 
          className="h-9 w-9 items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} color="#64748B" />
        </Pressable>
        
        <View className="flex-1 ml-3">
          <Text className="text-[17px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Échange privé
          </Text>
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary-light/50 dark:text-text-secondary-dark/50 mt-0.5">
            Rechercher par nom, pseudo ou matricule
          </Text>
        </View>
      </View>

      {/* Barre de Recherche Épurée */}
      <View className="px-5 pt-4 pb-2">
        <SearchBar 
          value={query} 
          onChangeText={setQuery} 
          placeholder="Rechercher par nom, pseudo ou matricule"
        />
      </View>

      {/* Corps de l'Écran / Résultats */}
      <View className="flex-1 px-5 pt-2">
        {isLoading ? (
          <View className="flex-1 items-center justify-center pb-24">
            <ActivityIndicator size="small" color={BRAND.primary} />
          </View>
        ) : results.length > 0 ? (
          <View className="overflow-hidden rounded-2xl border border-border-light/40 bg-surface-light/50 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => (
                <View className="mx-4 h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />
              )}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => startPrivate(item)}
                  disabled={createChat.isPending}
                  className="flex-row items-center gap-3.5 px-4 py-4 active:bg-text-secondary-light/5 dark:active:bg-text-secondary-dark/5 active:scale-[0.99] transition-all"
                >
                  <Avatar name={displayName(item)} uri={item.profile?.avatarUrl} size="md" />
                  
                  <View className="flex-1 justify-center">
                    <Text className="text-[14px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
                      {displayName(item)}
                    </Text>
                    
                    <View className="flex-row items-center gap-1.5 mt-1">
                      <GraduationCap size={12} className="text-text-secondary-light/40 dark:text-text-secondary-dark/40" />
                      <Text className="text-[11px] font-medium text-text-secondary-light/60 dark:text-text-secondary-dark/60">
                        {[item.username, item.matricule].filter(Boolean).join('  •  ')}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              )}
            />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center pb-24">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-text-secondary-light/5 border border-border-light/10 mb-3">
              <Search size={18} color="#64748B" />
            </View>
            <Text className="text-center text-[12px] font-medium text-text-secondary-light/60 dark:text-text-secondary-dark/60">
              Aucun utilisateur trouvé
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}