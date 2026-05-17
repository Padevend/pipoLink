import { useMemo } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';

import { useConversations } from '@/entities/conversation/hooks';
import { useAnnouncements } from '@/entities/announcement/hooks';
import { AnnouncementListItem } from '@/features/announcements/components/announcement-list-item';
import { ConversationItem } from '@/entities/conversation/ui/conversation-item';
import { ANNOUNCEMENTS_ENTRY_ID } from '@/shared/constants/announcements';
import type { Conversation } from '@/shared/api/messaging';
import { Skeleton } from '@/shared/ui/skeleton';

type ListRow =
  | { kind: 'announcements'; id: typeof ANNOUNCEMENTS_ENTRY_ID }
  | { kind: 'conversation'; id: string; conversation: Conversation };

export function ConversationList() {
  const { data: conversations, isLoading, refetch, isRefetching } = useConversations();
  const { data: announcements } = useAnnouncements();
  const router = useRouter();

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
      <View className="flex-1 gap-2 px-4 pt-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} className="flex-row items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-full" />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.id}
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
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FF7A00" />
      }
      ListEmptyComponent={
        rows.length <= 1 ? (
          <View className="items-center justify-center gap-4 py-20">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <MessageSquare size={32} color="#64748b" />
            </View>
            <Text className="px-12 text-center text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
              Aucune conversation
            </Text>
            <Text className="px-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
              Démarrez une discussion avec vos camarades.
            </Text>
          </View>
        ) : null
      }
    />
  );
}
