import { Pressable, Text, View } from 'react-native';

import type { ConversationModel } from '@/entities/conversation/model';
import { formatTime } from '@/shared/lib/date';
import { Avatar } from '@/shared/ui/avatar';

export interface ConversationItemProps {
  conversation: ConversationModel;
  onPress: () => void;
}

export function ConversationItem({ conversation, onPress }: ConversationItemProps): JSX.Element {
  return (
    <Pressable onPress={onPress} className="mb-3 rounded-3xl bg-white p-4 dark:bg-slate-900">
      <View className="flex-row items-center gap-3">
        <Avatar uri={conversation.avatarUrl} name={conversation.name || 'Conversation'} />
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">{conversation.name}</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400">{formatTime(conversation.lastMessageAt)}</Text>
          </View>
          <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400" numberOfLines={1}>
            {conversation.lastMessage}
          </Text>
        </View>
        {conversation.unreadCount > 0 ? (
          <View className="min-w-6 items-center rounded-full bg-orange-500 px-2 py-1">
            <Text className="text-xs font-semibold text-white">{conversation.unreadCount}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
