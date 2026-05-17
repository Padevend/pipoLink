import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useCreateChat } from '@/features/messaging/hooks/use-create-chat';
import { useSearchUsers, type SearchUserResult } from '@/features/messaging/hooks/use-search-users';
import { useAuth } from '@/providers';
import { useToast } from '@/shared/hooks/use-toast';
import { Avatar } from '@/shared/ui/avatar';
import { Header } from '@/shared/ui/header';
import { SearchBar } from '@/shared/ui/search-bar';
import { BRAND } from '@/shared/config/brand';

function displayName(u: SearchUserResult): string {
  if (u.profile?.firstname || u.profile?.lastname) {
    return [u.profile.firstname, u.profile.lastname].filter(Boolean).join(' ');
  }
  return u.username ?? u.email ?? 'User';
}

export default function NewChatScreen(): JSX.Element {
  const { t } = useTranslation('chat');
  const router = useRouter();
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
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <Header title={t('newPrivateChat')} subtitle={t('searchUsers')} showBack />
      <View className="px-4 pb-2">
        <SearchBar value={query} onChangeText={setQuery} placeholder={t('searchUsers')} />
      </View>
      {isLoading && query.length > 0 ? (
        <ActivityIndicator className="mt-8" color={BRAND.primary} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={
            query.length > 0 ? (
              <Text className="py-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
                {t('noUsers')}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => startPrivate(item)}
              disabled={createChat.isPending}
              className="mb-2 flex-row items-center gap-3 rounded-2xl bg-surface-light p-4 dark:bg-surface-dark active:opacity-80"
            >
              <Avatar name={displayName(item)} uri={item.profile?.avatarUrl} size="md" />
              <View className="flex-1">
                <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
                  {displayName(item)}
                </Text>
                <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  {[item.username, item.matricule].filter(Boolean).join(' • ')}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
