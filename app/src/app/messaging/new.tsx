import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, GraduationCap, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAddMember, useConversations } from '@/entities/conversation/hooks';
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
  const { data, isLoading, refetch } = useSearchUsers(query);
  const { data: conversations } = useConversations();
  const insets = useSafeAreaInsets();

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
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top', 'left', 'right']}>
      
      {/* HEADER : Plat et Solide */}
      <View className="flex-row items-center border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <Pressable 
          onPress={() => router.back()} 
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>
        
        <View className="flex-1 ml-4 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            {chatId ? 'Ajouter un membre' : 'Nouvelle discussion'}
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            {chatId ? 'Invitation groupe' : 'Échange privé'}
          </Text>
        </View>
      </View>

      {/* Barre de Recherche */}
      <View className="px-6 pt-6 pb-4">
        <SearchBar 
          value={query} 
          onChangeText={setQuery} 
          placeholder="Écrivez un nom, un prénom ou un identifiant..."
        />
      </View>

      {/* Résultats de la recherche */}
      <View className="flex-1 px-6 pb-6">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="small" color="#F97316" />
          </View>
        ) : results.length > 0 ? (
          <View className="overflow-hidden rounded-2xl">
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
              ItemSeparatorComponent={() => <View className="h-[1px] w-full bg-zinc-200 dark:bg-[#222222]" />}
              renderItem={({ item }) => {
                const isAdding = addingUserIds.includes(item.id);
                const isAlreadyMember = existingMemberIdsSet.has(item.id);
                return (
                  <Pressable
                    disabled={isAdding || isAlreadyMember}
                    onPress={() => handleSelectUser(item)}
                    className={cn(
                      "flex-row items-center justify-between p-4 active:opacity-80 transition-opacity",
                      isAlreadyMember && "opacity-50"
                    )}
                  >
                    <View className="flex-row items-center gap-4 flex-1 pr-3">
                      <Avatar name={displayName(item)} uri={item.profile?.avatarUrl} size="md" role={item.role as any} />
                      
                      <View className="flex-1 justify-center">
                        <Text className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
                          {displayName(item)}
                        </Text>
                        
                        <View className="flex-row items-center gap-2 mt-1">
                          <GraduationCap size={14} color="#A1A1AA" strokeWidth={2.5} />
                          <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            {[item.username, item.matricule].filter(Boolean).join(' • ')}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {isAlreadyMember && (
                      <View className="rounded-full bg-white dark:bg-[#222222] px-3 py-1">
                        <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          Déjà présent
                        </Text>
                      </View>
                    )}

                    {isAdding && (
                      <ActivityIndicator size="small" color="#F97316" />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-[#1A1A1A] bg-zinc-50 dark:bg-[#0A0A0A] p-6">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] mb-4">
              <Search size={24} color="#F97316" strokeWidth={2.5} />
            </View>
            <Text className="text-sm font-black uppercase tracking-widest text-zinc-950 dark:text-white text-center">
              Aucun résultat
            </Text>
            <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 text-center mt-2 leading-relaxed">
              Aucun utilisateur ne correspond à votre recherche.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}