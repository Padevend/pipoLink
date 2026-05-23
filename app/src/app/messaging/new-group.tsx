import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Check, Users, Search, GraduationCap } from 'lucide-react-native';

import { useCreateChat } from '@/features/messaging/hooks/use-create-chat';
import { useSearchUsers, type SearchUserResult } from '@/features/messaging/hooks/use-search-users';
import { useAuth } from '@/providers';
import { useToast } from '@/shared/hooks/use-toast';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { SearchBar } from '@/shared/ui/search-bar';
import { BRAND } from '@/shared/config/brand';
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
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      
      {/* Header Translucide Style Glassmorphism (Sans Shadow) */}
      <View className="z-10 flex-row items-center border-b border-border-light/20 bg-surface-light/75 px-4 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl">
        <Pressable 
          onPress={() => router.back()} 
          className="h-9 w-9 items-center justify-center rounded-full bg-background-light/40 border border-border-light/20 dark:bg-background-dark/30 active:scale-95 transition-transform"
        >
          <ChevronLeft size={20} className="text-text-primary-light dark:text-text-primary-dark" />
        </Pressable>
        
        <View className="flex-1 ml-3">
          <Text className="text-[17px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            {t('newGroup')}
          </Text>
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary-light/50 dark:text-text-secondary-dark/50 mt-0.5">
            Espace collaboratif
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Section 1 : Informations du groupe */}
        <Input
          label={t('groupName')}
          placeholder={t('groupNamePlaceholder')}
          value={name}
          onChangeText={setName}
          containerClassName="mb-6 bg-surface-light/50 dark:bg-surface-dark/40 border-border-light/40 dark:border-border-dark/20"
        />

        {/* Section 2 : Recherche des membres */}
        <View className="flex-row items-center justify-between mb-3 ml-2">
          <Text className="text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
            {t('selectMembers')}
          </Text>
          {selected.length > 0 && (
            <Text className="text-[11px] font-bold text-primary">
              {selected.length} sélectionné{selected.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        <SearchBar 
          value={query} 
          onChangeText={setQuery} 
          placeholder={t('searchUsers')}
        />

        {/* Indicateur de chargement */}
        {isLoading && query.length > 0 && (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color={BRAND.primary} />
          </View>
        )}

        {/* Liste des résultats encapsulée */}
        {results.length > 0 ? (
          <View className="overflow-hidden rounded-2xl border border-border-light/40 bg-surface-light/50 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md mb-6 mt-3">
            {results.map((item, index) => {
              const isSelected = selected.includes(item.id);
              return (
                <View key={item.id}>
                  {index > 0 && <View className="mx-4 h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />}
                  
                  <Pressable
                    onPress={() => toggle(item.id)}
                    className={cn(
                      "flex-row items-center justify-between px-4 py-3.5 transition-all active:scale-[0.99]",
                      isSelected ? "bg-primary/5 dark:bg-primary/10" : "active:bg-text-secondary-light/5 dark:active:bg-text-secondary-dark/5"
                    )}
                  >
                    <View className="flex-row items-center gap-3.5 flex-1">
                      <Avatar name={displayName(item)} uri={item.profile?.avatarUrl} size="sm" />
                      
                      <View className="flex-1 justify-center">
                        <Text className={cn(
                          "text-[14px] font-semibold tracking-tight",
                          isSelected ? "text-primary" : "text-text-primary-light dark:text-text-primary-dark"
                        )}>
                          {displayName(item)}
                        </Text>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                          <GraduationCap size={11} className="text-text-secondary-light/40" />
                          <Text className="text-[11px] font-medium text-text-secondary-light/50 dark:text-text-secondary-dark/50">
                            {item.username ?? 'Étudiant'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Case à cocher / Checkbox circulaire sur mesure */}
                    <View className={cn(
                      "h-5 w-5 items-center justify-center rounded-full border transition-all",
                      isSelected 
                        ? "border-primary bg-primary" 
                        : "border-border-light/60 dark:border-border-dark/40 bg-transparent"
                    )}>
                      {isSelected && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : (
          query.length > 0 && !isLoading && (
            <View className="items-center justify-center py-8 rounded-2xl border border-border-light/40 bg-surface-light/30 dark:border-border-dark/10 dark:bg-surface-dark/20 backdrop-blur-sm mb-6">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-text-secondary-light/5 border border-border-light/10 mb-2">
                <Search size={16} color="#64748B" />
              </View>
              <Text className="text-center text-[12px] font-medium text-text-secondary-light/60 dark:text-text-secondary-dark/60">
                Aucun utilisateur trouvé
              </Text>
            </View>
          )
        )}

        {/* Bouton de validation inférieur */}
        <Button
          label={t('createGroup')}
          onPress={() => void create()}
          loading={createChat.isPending}
          disabled={!name.trim() || selected.length < 1}
          className="rounded-xl h-12 mt-2"
        />
      </ScrollView>
    </SafeAreaView>
  );
}