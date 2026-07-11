import { router } from 'expo-router';
import { BrushCleaning, MessageSquare } from 'lucide-react-native';
import { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeArea } from '@/shared/hooks/use-safe-area';

import { useAnnouncements } from '@/entities/announcement/hooks';
import { conversationKeys, useConversations } from '@/entities/conversation/hooks';
import { ConversationItem } from '@/entities/conversation/ui/conversation-item';
import { AnnouncementListItem } from '@/features/announcements/components/announcement-list-item';
import { queryClient } from '@/providers';
import type { Conversation } from '@/shared/api/messaging';
import { messagingApi } from '@/shared/api/messaging';
import { ANNOUNCEMENTS_ENTRY_ID } from '@/shared/constants/announcements';
import { Skeleton } from '@/shared/ui/skeleton';

// Couleur orange vif électrique partagée
const ORANGE_PRINCIPAL = '#FF6B00';

type ListRow =
  | { kind: 'announcements'; id: typeof ANNOUNCEMENTS_ENTRY_ID }
  | { kind: 'conversation'; id: string; conversation: Conversation };

// Ligne de séparation fine et élégante entre chaque élément
const ItemSeparator = () => <View className="h-[1px] mx-6 bg-zinc-100 dark:bg-zinc-900" />;

export function ConversationList() {
  const insets = useSafeArea();
  const { data: conversations, isLoading, refetch, isRefetching } = useConversations();
  const { data: announcements } = useAnnouncements();
  
  const hasUnread = useMemo(() => {
    return conversations?.some((c) => c.unreadCount > 0) ?? false;
  }, [conversations]);

  const markAllAsRead = () => {
    queryClient.setQueryData<Conversation[]>(conversationKeys.list(), (prev) => {
      if (!prev) return prev;
      return prev.map(c => ({ ...c, unreadCount: 0 }));
    });
    
    const unreadChats = conversations?.filter(c => c.unreadCount > 0) || [];
    unreadChats.forEach(c => {
       messagingApi.markAsRead(c.id).catch(() => {});
    });
  };

  const rows = useMemo<ListRow[]>(() => {
    const list: ListRow[] = [{ kind: 'announcements', id: ANNOUNCEMENTS_ENTRY_ID }];
    for (const c of conversations ?? []) {
      list.push({ kind: 'conversation', id: c.id, conversation: c });
    }
    return list;
  }, [conversations]);

  const announcementPreview = announcements?.[0]?.title;

  // Écran d'attente épuré (pendant le chargement des messages)
  if (isLoading) {
    return (
      <View className="flex-1 px-6 pt-4 bg-white dark:bg-zinc-950">
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} className="flex-row items-center gap-4 py-4 border-b border-zinc-100 dark:border-zinc-900">
            <Skeleton className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-4 w-1/4 rounded bg-zinc-100 dark:bg-zinc-900" />
              <Skeleton className="h-3 w-3/4 rounded bg-zinc-100/60 dark:bg-zinc-900/60" />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950">
      
      {/* Bouton "Tout marquer comme lu" - Rond, épuré, orange vif, sans ombre */}
      {hasUnread && (
        <View 
          className="absolute right-6 z-20 rounded-full bg-orange-500 overflow-hidden"
          style={{ bottom: Math.max(insets.bottom, 24) }}
        >
          <Pressable 
            onPress={markAllAsRead}
            className="h-12 w-12 items-center justify-center active:opacity-90"
          >
            <BrushCleaning size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 40 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
        renderItem={({ item }) => {
          if (item.kind === 'announcements') {
            return (
              <AnnouncementListItem
                preview={announcementPreview}
                onPress={() => router.push('/announcements')}
              />
            );
          }
          return (
            <ConversationItem
              conversation={item.conversation}
              onPress={() => router.push(`/chat/${item.conversation.id}`)}
            />
          );
        }}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} 
            onRefresh={refetch} 
            tintColor={ORANGE_PRINCIPAL}
          />
        }
        ListEmptyComponent={
          rows.length <= 1 ? (
            <View className="items-center justify-center px-8 py-24 mt-10">
              
              {/* Illustration centrale : Icône dans un carré aux angles nets */}
              <View className="mb-6 h-14 w-14 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/50">
                <MessageSquare size={22} color={ORANGE_PRINCIPAL} />
              </View>

              {/* Message principal pour l'utilisateur */}
              <Text className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50 text-center">
                Aucune discussion
              </Text>
              
              {/* Message d'aide explicatif */}
              <Text className="mt-2 px-6 text-center text-xs font-medium leading-relaxed text-zinc-400 dark:text-zinc-500">
                Votre messagerie est vide. Initiez une nouvelle conversation en utilisant le bouton d'action situé en haut de l'écran.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}