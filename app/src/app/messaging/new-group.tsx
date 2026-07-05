import { router } from 'expo-router';
import { ArrowLeft, Check, GraduationCap, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCreateChat } from '@/features/messaging/hooks/use-create-chat';
import { useSearchUsers, type SearchUserResult } from '@/features/messaging/hooks/use-search-users';
import { useAuth, useToast } from '@/providers';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { SearchBar } from '@/shared/ui/search-bar';
import { cn } from '@/shared/utils/cn';

function displayName(u: SearchUserResult): string {
  if (u.profile?.firstname || u.profile?.lastname) {
    return [u.profile.firstname, u.profile.lastname].filter(Boolean).join(' ');
  }
  return u.username ?? 'Utilisateur';
}

export default function NewGroupScreen(): JSX.Element {
  const { t } = useTranslation('chat');
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
          showToast({ type: 'success', message: 'Le groupe a été créé avec succès.' });
          router.replace(`/chat/${chat.id}` as any);
        },
        onError: (e) => {
          showToast({ type: 'error', message: e instanceof Error ? e.message : 'Impossible de créer le groupe.' });
        },
      },
    );
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
            Nouveau groupe
          </Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Créer un espace de discussion à plusieurs
          </Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-4" 
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }} 
        keyboardShouldPersistTaps="handled" 
        showsVerticalScrollIndicator={false}
      >

        {/* Formulaire : Nom du groupe */}
        <View className="mb-6">
          <Input
            label="Nom du groupe"
            placeholder="Exemple : Groupe de révision Informatique"
            value={name}
            onChangeText={setName}
            className='text-xs h-50'
          />
        </View>

        {/* Titre de la recherche de membres */}
        <View className="flex-row items-center justify-between mb-2 ml-1">
          <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Ajouter des personnes
          </Text>
          {selected.length > 0 && (
            <Text className="text-xs font-bold text-orange-500">
              {selected.length} personne{selected.length > 1 ? 's' : ''} sélectionnée{selected.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Barre de recherche */}
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Écrivez un nom, un prénom ou un identifiant..."
        />

        {/* Icône d'attente circulaire pendant le chargement */}
        {isLoading && (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color="#FF7A00" />
          </View>
        )}

        {/* Liste des contacts trouvés */}
        {results.length > 0 ? (
          <View className="overflow-hidden rounded-xl border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-900 mb-6 mt-4">
            {results.map((item, index) => {
              const isSelected = selected.includes(item.id);
              return (
                <View key={item.id}>
                  {index > 0 && <View className="mx-4 h-[1px] bg-zinc-100 dark:bg-zinc-800" />}

                  <Pressable
                    onPress={() => toggle(item.id)}
                    className={cn(
                      "flex-row items-center justify-between px-4 py-4 active:bg-zinc-50 dark:active:bg-zinc-800/50",
                      isSelected && "bg-orange-500/5 dark:bg-orange-500/10"
                    )}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <Avatar name={displayName(item)} uri={item.profile?.avatarUrl} size="sm" />

                      <View className="flex-1 justify-center">
                        <Text className={cn(
                          "text-sm font-bold",
                          isSelected ? "text-orange-500" : "text-zinc-900 dark:text-zinc-50"
                        )}>
                          {displayName(item)}
                        </Text>
                        <View className="flex-row items-center gap-1.5 mt-1">
                          <GraduationCap size={13} color="#A1A1AA" />
                          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                            {item.username ?? 'Étudiant'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Case à cocher ronde et colorée */}
                    <View className={cn(
                      "h-5 w-5 items-center justify-center rounded-full border",
                      isSelected
                        ? "border-orange-500 bg-orange-500"
                        : "border-zinc-200 dark:border-zinc-800 bg-transparent"
                    )}>
                      {isSelected && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : (
          /* Zone vide si rien n'est trouvé */
          !isLoading && (
            <View className="items-center justify-center py-8 rounded-xl border border-zinc-100 bg-white dark:border-zinc-900 mb-6 mt-4">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800 mb-3">
                <Search size={18} color="#A1A1AA" />
              </View>
              <Text className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                Aucun utilisateur ne correspond à votre recherche.
              </Text>
            </View>
          )
        )}

        {/* Grand bouton de création en bas */}
        <Button
          label="Créer le groupe maintenant"
          onPress={() => void create()}
          loading={createChat.isPending}
          disabled={!name.trim() || selected.length < 1}
          className="rounded-xl h-12 bg-orange-500 active:bg-orange-600 mt-2"
        />
      </ScrollView>
    </SafeAreaView>
  );
}