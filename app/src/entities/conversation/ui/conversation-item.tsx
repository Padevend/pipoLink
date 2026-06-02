import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';
import { useAuth } from '@/providers';
import { Conversation } from '@/shared/api/messaging';
import { decryptMessage } from '@/shared/crypto';
import { Avatar } from '@/shared/ui/avatar';
import { cn } from '@/shared/utils/cn';
import { formatDistanceToNow } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
}

export const ConversationItem = React.memo(function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  const { user } = useAuth();

  const lastMessage = conversation.lastMessage;
  const [chatKey, setChatKey] = useState<Uint8Array | null>(null);
  const safeUnreadCount = Math.max(0, conversation.unreadCount);
  const isUnread = safeUnreadCount > 0;

  // Récupération du nom du chat (Logique métier préservée)
  const chatName = useMemo(() => {
    if (conversation.type === 'group') {
      return conversation.name || 'Groupe';
    }
    const otherMember = conversation.members.find((m) => m.id !== user?.id);
    return otherMember?.username || 'Privé';
  }, [conversation.name, conversation.members, user?.id]);

  // Récupération de l'avatar du chat (Logique métier préservée)
  const chatAvatar = useMemo(() => {
    if (conversation.type === 'group') {
      return conversation.avatarUrl;
    }
    const otherMember = conversation.members.find((m) => m.id !== user?.id);
    return otherMember?.avatarUrl;
  }, [conversation.avatarUrl, conversation.members, user?.id]);

  useEffect(() => {
    const getKey = async () => {
      try {
        setChatKey(await ensureChatKeyForChat(conversation.id));
      } catch {
        setChatKey(null);
      }
    };
    getKey();
  }, [conversation.id]);

  // Déchiffrement mémoïsé du dernier message
  const decryptedLastMessage = useMemo(() => {
    if (!lastMessage) return 'Aucun message';
    if (!chatKey) return 'Message sécurisé';
    try {
      return decryptMessage(lastMessage.cipherText, lastMessage?.iv, chatKey);
    } catch {
      return 'Erreur de déchiffrement';
    }
  }, [lastMessage, chatKey]);

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center px-5 py-4 transition-all active:opacity-90',
        isUnread 
          ? 'bg-primary/5 dark:bg-primary/5' 
          : 'active:bg-surface-light/40 dark:active:bg-surface-dark/30'
      )}
    >
      {/* Conteneur Avatar avec légère ombre diffuse */}
      <View className="">
        <Avatar name={chatName} uri={chatAvatar} size="lg" />
      </View>

      {/* Contenu textuel épuré (sans border-b intrusif) */}
      <View className="flex-1 ml-4 justify-center">
        <View className="flex-row justify-between items-baseline mb-1">
          <Text 
            className={cn(
              'text-[15px] tracking-tight text-text-primary-light dark:text-text-primary-dark',
              isUnread ? 'font-semibold' : 'font-medium'
            )}
            numberOfLines={1}
          >
            {chatName}
          </Text>
          
          <Text className={cn(
            'text-[11px] font-medium tracking-wide',
            isUnread 
              ? 'text-primary font-semibold' 
              : 'text-text-secondary-light/60 dark:text-text-secondary-dark/60'
          )}>
            {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: false })}
          </Text>
        </View>

        <View className="flex-row items-center justify-between gap-2">
          <Text
            numberOfLines={1}
            className={cn(
              'flex-1 text-[13px] leading-4 tracking-wide',
              isUnread
                ? 'text-text-primary-light dark:text-text-primary-dark font-medium'
                : 'text-text-secondary-light/70 dark:text-text-secondary-dark/70'
            )}
          >
            {decryptedLastMessage}
          </Text>

          {/* Badge de notification style capsule moderne */}
          {isUnread && (
            <View className="bg-primary rounded-full min-w-[20px] h-[20px] px-1.5 items-center justify-center shadow-sm">
              <Text className="text-white text-[11px] font-bold tracking-tighter">
                {safeUnreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}, (prev, next) => {
  return prev.conversation.id === next.conversation.id &&
         prev.conversation.updatedAt === next.conversation.updatedAt &&
         prev.conversation.unreadCount === next.conversation.unreadCount;
});