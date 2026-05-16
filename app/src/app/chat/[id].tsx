import { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatView } from '@/features/messaging/components/chat-view';
import { ChatInfoSheet } from '@/features/messaging/components/chat-info-sheet';
import { useConversations } from '@/entities/conversation/hooks';
import { useAuth } from '@/providers';
import { Avatar } from '@/shared/ui/avatar';
import { ChevronLeft, Info } from 'lucide-react-native';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: conversations } = useConversations();
  const [infoOpen, setInfoOpen] = useState(false);

  const conversation = conversations?.find((c) => c.id === id);
  const name = conversation?.name || conversation?.members[0]?.username || 'Conversation';
  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-row items-center justify-between border-b border-border-light bg-surface-light px-3 py-2 dark:border-border-dark dark:bg-surface-dark">
        <View className="flex-row flex-1 items-center gap-2">
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full">
            <ChevronLeft size={24} color="#111827" />
          </Pressable>
          <Avatar name={name} uri={conversation?.avatarUrl} size="sm" />
          <View className="flex-1">
            <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
              {conversation?.type === 'group' ? 'Groupe' : 'Privé'}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => setInfoOpen(true)} className="h-10 w-10 items-center justify-center rounded-full">
          <Info size={20} color="#6B7280" />
        </Pressable>
      </View>

      <ChatView conversationId={id!} />

      <ChatInfoSheet
        visible={infoOpen}
        onClose={() => setInfoOpen(false)}
        conversation={conversation}
        currentUserId={user?.id}
        isAdmin={isAdmin}
        onAddMember={() => router.push(`/messaging/new?chatId=${id}` as any)}
      />
    </SafeAreaView>
  );
}
