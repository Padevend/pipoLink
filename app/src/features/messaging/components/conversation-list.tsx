import { useSafeArea } from '@/shared/hooks/use-safe-area';
import { router } from 'expo-router';
import { Brush, MessageSquare } from 'lucide-react-native';
import { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { useAnnouncements } from '@/entities/announcement/hooks';
import { conversationKeys, useConversations } from '@/entities/conversation/hooks';
import { ConversationItem } from '@/entities/conversation/ui/conversation-item';
import { AnnouncementListItem } from '@/features/announcements/components/announcement-list-item';
import { queryClient } from '@/providers';
import type { Conversation } from '@/shared/api/messaging';
import { messagingApi } from '@/shared/api/messaging';
import { ANNOUNCEMENTS_ENTRY_ID } from '@/shared/constants/announcements';
import { Skeleton } from '@/shared/ui/skeleton';

const ORANGE_PRINCIPAL = '#F97316';

type ListRow =
  | { kind: 'announcements'; id: typeof ANNOUNCEMENTS_ENTRY_ID }
  | { kind: 'conversation'; id: string; conversation: Conversation };

const ItemSeparator = () => <View className="h-[1px] mx-4 bg-zinc-100 dark:bg-[#1A1A1A]" />;

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

  if (isLoading) {
    return (
      <View className="flex-1 px-6 pt-4 bg-white dark:bg-[#0A0A0A]">
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} className="flex-row items-center gap-4 py-4">
            <Skeleton className="h-14 w-14 rounded-full bg-zinc-100 dark:bg-[#1A1A1A]" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-4 w-1/4 rounded bg-zinc-100 dark:bg-[#1A1A1A]" />
              <Skeleton className="h-3 w-3/4 rounded bg-zinc-100 dark:bg-[#1A1A1A]" />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-[#0A0A0A]">
      {hasUnread && (
        <View 
          className="absolute right-6 z-20 rounded-full bg-orange-500 overflow-hidden"
          style={{ bottom: Math.max(insets.bottom, 24) }}
        >
          <Pressable 
            onPress={markAllAsRead}
            className="h-14 w-14 items-center justify-center active:opacity-80"
          >
            <Brush size={22} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        </View>
      )}

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 40 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
        windowSize={7}
        maxToRenderPerBatch={8}
        initialNumToRender={12}
        removeClippedSubviews
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
              <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A]">
                <MessageSquare size={32} color={ORANGE_PRINCIPAL} strokeWidth={2.5} />
              </View>

              <Text className="text-base font-black uppercase tracking-widest text-zinc-950 dark:text-white text-center">
                Aucune discussion
              </Text>
              
              <Text className="mt-3 px-6 text-center text-xs font-bold leading-relaxed text-zinc-400">
                Votre messagerie est vide. Initiez une nouvelle conversation.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}