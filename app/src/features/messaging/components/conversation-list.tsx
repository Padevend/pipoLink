import { router } from 'expo-router';
import { CheckCheck, MessageSquare } from 'lucide-react-native';
import { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { useAnnouncements } from '@/entities/announcement/hooks';
import { useConversations, conversationKeys } from '@/entities/conversation/hooks';
import { ConversationItem } from '@/entities/conversation/ui/conversation-item';
import { AnnouncementListItem } from '@/features/announcements/components/announcement-list-item';
import type { Conversation } from '@/shared/api/messaging';
import { messagingApi } from '@/shared/api/messaging';
import { ANNOUNCEMENTS_ENTRY_ID } from '@/shared/constants/announcements';
import { queryClient } from '@/providers';
import { Skeleton } from '@/shared/ui/skeleton';

type ListRow =
  | { kind: 'announcements'; id: typeof ANNOUNCEMENTS_ENTRY_ID }
  | { kind: 'conversation'; id: string; conversation: Conversation };

export function ConversationList() {
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

  // État de chargement moderne (Skeleton Loader)
  if (isLoading) {
    return (
      <View className="flex-1 px-5 pt-4 bg-background-light dark:bg-background-dark">
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} className="flex-row items-center gap-4 py-3 border-b border-border-light/10 dark:border-border-dark/10">
            <Skeleton className="h-12 w-12 rounded-full opacity-70" />
            <View className="flex-1 gap-2.5">
              <Skeleton className="mh-3 w-1/4 rounded-md opacity-80" />
              <Skeleton className="min-h-3 w-3/4 rounded-md opacity-50" />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {hasUnread && (
        <View className="px-5 pt-3 pb-1 flex-row justify-end">
          <Pressable 
            onPress={markAllAsRead}
            className="flex-row items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full active:opacity-70"
          >
            <CheckCheck size={14} className="text-primary" />
            <Text className="text-[12px] font-medium text-primary">Tout marquer comme lu</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => (
        <View className="h-[1px] mx-5 bg-border-light/20 dark:bg-border-dark/10" />
      )}
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
          tintColor="var(--color-primary)" 
        />
      }
      ListEmptyComponent={
        rows.length <= 1 ? (
          <View className="items-center justify-center px-6 py-16 mt-10">
            
            {/* Conteneur icône style Verre Dépoli */}
            <View className="mb-5 h-20 w-20 items-center justify-center">
              <View className="p-3 rounded-xl bg-primary/10">
                <MessageSquare size={28} className="text-primary" />
              </View>
            </View>

            <Text className="text-lg font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark text-center">
              Aucune conversation
            </Text>
            
            <Text className="mt-1.5 px-8 text-center text-sm leading-5 text-text-secondary-light/80 dark:text-text-secondary-dark/80">
              Démarrez une discussion avec vos camarades en cliquant sur le bouton d'ajout en haut.
            </Text>
          </View>
        ) : null
      }
    />
    </View>
  );
}