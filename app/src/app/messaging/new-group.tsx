import { router } from 'expo-router';
import { ArrowLeft, Check, GraduationCap, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

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
            Nouveau groupe
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Espace collaboratif
          </Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 32, paddingBottom: insets.bottom + 32 }} 
        keyboardShouldPersistTaps="handled" 
        showsVerticalScrollIndicator={false}
      >

        {/* Formulaire : Nom du groupe */}
        <View className="mb-8">
          <Input
            label="Nom du groupe"
            placeholder="Ex: Révision Informatique L2"
            value={name}
            onChangeText={setName}
            className="text-sm font-bold text-zinc-950 dark:text-white"
          />
        </View>

        {/* Titre de la recherche de membres */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
            Ajouter des personnes
          </Text>
          {selected.length > 0 && (
            <View className="rounded-full bg-orange-500/10 px-3 py-1">
              <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                {selected.length} sélectionnée{selected.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Barre de recherche */}
        <View className="mb-6">
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un contact..."
          />
        </View>

        {isLoading && (
          <View className="py-6 items-center">
            <ActivityIndicator size="small" color="#F97316" />
          </View>
        )}

        {/* Liste des contacts trouvés */}
        {results.length > 0 ? (
          <View className="overflow-hidden rounded-2xl mb-8">
            {results.map((item, index) => {
              const isSelected = selected.includes(item.id);
              return (
                <View key={item.id}>
                  {index > 0 && <View className="h-[1px] w-full bg-zinc-200 dark:bg-[#222222]" />}

                  <Pressable
                    onPress={() => toggle(item.id)}
                    className={cn(
                      "flex-row items-center justify-between p-4 active:opacity-80 transition-opacity",
                      isSelected && "bg-orange-500/10 dark:bg-orange-950/20"
                    )}
                  >
                    <View className="flex-row items-center gap-4 flex-1 pr-3">
                      <Avatar name={displayName(item)} uri={item.profile?.avatarUrl} size="md" role={item.role as any} />

                      <View className="flex-1 justify-center">
                        <Text className={cn(
                          "text-sm font-bold",
                          isSelected ? "text-orange-500" : "text-zinc-950 dark:text-white"
                        )} numberOfLines={1}>
                          {displayName(item)}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          <GraduationCap size={14} color="#A1A1AA" strokeWidth={2.5} />
                          <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            {item.username ?? 'Étudiant'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Case à cocher géométrique (rounded-full) */}
                    <View className={cn(
                      "h-6 w-6 items-center justify-center rounded-full border-2",
                      isSelected
                        ? "border-orange-500 bg-orange-500"
                        : "border-zinc-300 dark:border-zinc-700 bg-transparent"
                    )}>
                      {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : (
          !isLoading && (
            <View className="items-center justify-center py-16 px-6 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-[#1A1A1A] bg-zinc-50 dark:bg-[#0A0A0A] mb-8">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] mb-4">
                <Search size={24} color="#F97316" strokeWidth={2.5} />
              </View>
              <Text className="text-sm font-black uppercase tracking-widest text-zinc-950 dark:text-white text-center">
                Aucun utilisateur
              </Text>
              <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 text-center mt-2 leading-relaxed">
                Aucun utilisateur ne correspond à votre recherche.
              </Text>
            </View>
          )
        )}

        {/* Bouton de création */}
        <Button
          label="Créer le groupe maintenant"
          onPress={() => void create()}
          loading={createChat.isPending}
          disabled={!name.trim() || selected.length < 1}
          size="lg"
          className="rounded-full h-14 bg-orange-500 active:bg-orange-600"
        />
      </ScrollView>
    </SafeAreaView>
  );
}