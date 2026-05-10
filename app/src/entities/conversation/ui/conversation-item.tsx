import { View, Text, Pressable } from 'react-native';
import { Avatar } from '@/shared/ui/avatar';
import { Conversation } from '@/shared/api/messaging';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/shared/utils/cn';

export interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
}

export function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  const lastMessage = conversation.lastMessage;
  const name = conversation.name || conversation.members[0]?.username || 'Unknown';
  
  return (
    <Pressable 
      onPress={onPress}
      className="flex-row items-center px-4 py-3 active:bg-slate-50 dark:active:bg-slate-900/50"
    >
      <Avatar 
        name={name}
        uri={conversation.avatarUrl}
        size="lg"
      />
      
      <View className="flex-1 ml-4 border-b border-border-light dark:border-border-dark pb-3">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
            {name}
          </Text>
          <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: false })}
          </Text>
        </View>
        
        <View className="flex-row items-center justify-between">
          <Text 
            numberOfLines={1} 
            className={cn(
              "flex-1 text-sm mr-4",
              conversation.unreadCount > 0 
                ? "text-text-primary-light dark:text-text-primary-dark font-semibold" 
                : "text-text-secondary-light dark:text-text-secondary-dark"
            )}
          >
            {lastMessage?.cipherText || 'No messages yet'}
          </Text>
          
          {conversation.unreadCount > 0 && (
            <View className="bg-primary rounded-full min-w-[20px] h-5 px-1.5 items-center justify-center">
              <Text className="text-white text-[10px] font-bold">
                {conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
