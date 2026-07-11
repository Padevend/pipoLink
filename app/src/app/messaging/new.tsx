import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, GraduationCap, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useConversations, useAddMember } from '@/entities/conversation/hooks';
import { useSearchUsers, type SearchUserResult } from '@/features/messaging/hooks/use-search-users';
import { useAuth } from '@/providers';
import { Avatar } from '@/shared/ui/avatar';
import { SearchBar } from '@/shared/ui/search-bar';
import { cn } from '@/shared/utils/cn';

function displayName(u: SearchUserResult): string {
  if (u.profile?.firstname || u.profile?.lastname) {
    return [u.profile.firstname, u.profile.lastname].filter(Boolean).join(' ');
  }
  return u.username ?? u.email ?? 'Utilisateur';
}

export default function NewChatScreen(): JSX.Element {
  const { t } = useTranslation('chat');
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const { data, isLoading } = useSearchUsers(query);
  const { data: conversations } = useConversations();

  const { chatId, existingMemberIds } = useLocalSearchParams<{ chatId?: string; existingMemberIds?: string }>();
  const addMemberMutation = useAddMember();
  const [addingUserIds, setAddingUserIds] = useState<string[]>([]);

  const existingMemberIdsSet = useMemo(() => {
    if (!existingMemberIds) return new Set<string>();
    return new Set<string>(existingMemberIds.split(','));
  }, [existingMemberIds]);

  const results = useMemo(
    () => (data ?? []).filter((u) => u.id !== user?.id),
    [data, user?.id],
  );

  const handleSelectUser = async (target: SearchUserResult) => {
    if (chatId) {
      setAddingUserIds((prev) => [...prev, target.id]);
      addMemberMutation.mutateAsync({ chatId, userId: target.id })
        .then(() => {
          setAddingUserIds((prev) => prev.filter((id) => id !== target.id));
        })
        .catch((err) => {
          console.error('Failed to add member to conversation:', err);
          setAddingUserIds((prev) => prev.filter((id) => id !== target.id));
        });
    } else {
      const existing = conversations?.find(
        (c) => c.type === 'private' && c.members.some((m) => m.id === target.id)
      );
      if (existing) {
        router.replace(`/chat/${existing.id}` as any);
      } else {
        router.replace(`/chat/${target.id}` as any);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      
      {/* Barre supérieure simple et claire */}
      <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-4 dark:border-zinc-900 dark:bg-zinc-900">
        <Pressable 
          onPress={() => router.back()} 
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800 active:opacity-70"
        >
          <ArrowLeft size={18} color="#71717A" />
        </Pressable>
        
        <View className="flex-1 ml-3">
          <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            {chatId ? 'Ajouter un membre' : 'Nouvelle discussion'}
          </Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {chatId ? 'Trouver un contact à inviter dans ce groupe' : 'Lancer un échange privé avec un étudiant'}
          </Text>
        </View>
      </View>

      {/* Barre de Recherche Épurée */}
      <View className="px-4 pt-4 pb-2">
        <SearchBar 
          value={query} 
          onChangeText={setQuery} 
          placeholder="Écrivez un nom, un prénom ou un identifiant..."
        />
      </View>

      {/* Résultats de la recherche */}
      <View className="flex-1 px-4 pt-2">
        {isLoading ? (
          <View className="flex-1 items-center justify-center pb-24">
            <ActivityIndicator size="small" color="#FF7A00" />
          </View>
        ) : results.length > 0 ? (
          <View className="overflow-hidden rounded-xl border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-900">
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => (
                <View className="mx-4 h-[1px] bg-zinc-100 dark:bg-zinc-800" />
              )}
              renderItem={({ item }) => {
                const isAdding = addingUserIds.includes(item.id);
                const isAlreadyMember = existingMemberIdsSet.has(item.id);
                return (
                  <Pressable
                    disabled={isAdding || isAlreadyMember}
                    onPress={() => handleSelectUser(item)}
                    className={cn(
                      "flex-row items-center justify-between px-4 py-4 active:bg-zinc-50 dark:active:bg-zinc-800/50",
                      isAlreadyMember && "opacity-40"
                    )}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <Avatar name={displayName(item)} uri={item.profile?.avatarUrl} size="md" />
                      
                      <View className="flex-1 justify-center">
                        <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                          {displayName(item)}
                        </Text>
                        
                        <View className="flex-row items-center gap-1.5 mt-1">
                          <GraduationCap size={13} color="#A1A1AA" />
                          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                            {[item.username, item.matricule].filter(Boolean).join('  •  ')}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {isAlreadyMember && (
                      <View className="rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
                        <Text className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                          Déjà présent
                        </Text>
                      </View>
                    )}

                    {isAdding && (
                      <ActivityIndicator size="small" color="#FF7A00" />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        ) : (
          /* Zone vide si aucun résultat */
          <View className="flex-1 items-center justify-center pb-24">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 mb-4">
              <Search size={22} color="#A1A1AA" />
            </View>
            <Text className="text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Aucun utilisateur ne correspond à votre recherche.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}