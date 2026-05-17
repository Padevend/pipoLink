import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useCreateChat } from '@/features/messaging/hooks/use-create-chat';
import { useSearchUsers, type SearchUserResult } from '@/features/messaging/hooks/use-search-users';
import { useAuth } from '@/providers';
import { useToast } from '@/shared/hooks/use-toast';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Header } from '@/shared/ui/header';
import { Input } from '@/shared/ui/input';
import { SearchBar } from '@/shared/ui/search-bar';
import { BRAND } from '@/shared/config/brand';
import { cn } from '@/shared/utils/cn';

function displayName(u: SearchUserResult): string {
  if (u.profile?.firstname || u.profile?.lastname) {
    return [u.profile.firstname, u.profile.lastname].filter(Boolean).join(' ');
  }
  return u.username ?? 'User';
}

export default function NewGroupScreen(): JSX.Element {
  const { t } = useTranslation('chat');
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const { data, isLoading } = useSearchUsers(query);
  const createChat = useCreateChat();

  const results = useMemo(
    () => (data ?? []).filter((u) => u.id !== user?.id),
    [data, user?.id],
  );

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const create = () => {
    if (!name.trim() || selected.length < 1) return;
    createChat.mutate(
      { type: 'group', name: name.trim(), memberUserIds: selected },
      {
        onSuccess: (chat) => {
          showToast({ type: 'success', message: t('groupCreated') });
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
      <Header title={t('newGroup')} showBack />
      <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
        <Input
          label={t('groupName')}
          placeholder={t('groupNamePlaceholder')}
          value={name}
          onChangeText={setName}
          containerClassName="mb-4 mt-2"
        />
        <Text className="mb-2 text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark">
          {t('selectMembers')}
        </Text>
        <SearchBar value={query} onChangeText={setQuery} placeholder={t('searchUsers')} />
        {isLoading && query.length > 0 ? <ActivityIndicator className="my-4" color={BRAND.primary} /> : null}
        {results.map((item) => {
          const on = selected.includes(item.id);
          return (
            <Pressable
              key={item.id}
              onPress={() => toggle(item.id)}
              className={cn(
                'mb-2 flex-row items-center gap-3 rounded-2xl border p-4',
                on ? 'border-primary bg-primary/5' : 'border-transparent bg-surface-light dark:bg-surface-dark',
              )}
            >
              <Avatar name={displayName(item)} uri={item.profile?.avatarUrl} size="sm" />
              <Text className="flex-1 font-bold text-text-primary-light dark:text-text-primary-dark">
                {displayName(item)}
              </Text>
              {on ? <Text className="text-primary">✓</Text> : null}
            </Pressable>
          );
        })}
        <Button
          label={t('createGroup')}
          onPress={() => void create()}
          loading={createChat.isPending}
          disabled={!name.trim() || selected.length < 1}
          className="my-6"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
