import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';
import { useAuth } from '@/providers';
import { Conversation } from '@/shared/api/messaging';
import { decryptMessage } from '@/shared/crypto';
import { Avatar } from '@/shared/ui/avatar';
import { cn } from '@/shared/utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Check, CheckCheck, Clock } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
}

const previewCache = new Map<string, string>();
const PREVIEW_CACHE_MAX = 200;

function cachePreview(key: string, value: string): void {
  if (previewCache.size >= PREVIEW_CACHE_MAX) {
    const oldest = previewCache.keys().next().value;
    if (oldest !== undefined) previewCache.delete(oldest);
  }
  previewCache.set(key, value);
}

export const ConversationItem = React.memo(function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  const { user } = useAuth();

  const lastMessage = conversation.lastMessage;
  const [chatKey, setChatKey] = useState<Uint8Array | null>(null);
  const safeUnreadCount = Math.max(0, conversation.unreadCount);
  const isUnread = safeUnreadCount > 0;

  const chatName = useMemo(() => {
    if (conversation.type === 'group') {
      return conversation.name || 'Groupe';
    }
    const otherMember = conversation.members.find((m) => m.id !== user?.id);
    return otherMember?.username || 'Privé';
  }, [conversation.name, conversation.members, user?.id]);

  const chatAvatar = useMemo(() => {
    if (conversation.type === 'group') {
      return conversation.avatarUrl;
    }
    const otherMember = conversation.members.find((m) => m.id !== user?.id);
    return otherMember?.avatarUrl;
  }, [conversation.avatarUrl, conversation.members, user?.id]);

  const userAccountRole = useMemo(() => {
    if (conversation.type === 'group') {
      return null;
    }
    const otherMember = conversation.members.find((m) => m.id !== user?.id);
    return otherMember?.accountRole;
  }, [conversation.type, conversation.members, user?.id]);

  const cacheKey = lastMessage ? `${lastMessage.id}:${lastMessage.iv}` : null;
  const cachedPreview = cacheKey ? previewCache.get(cacheKey) : undefined;

  const directPlain = useMemo(() => {
    if (!lastMessage) return null;
    if (lastMessage.decryptedContent) return lastMessage.decryptedContent;
    if (lastMessage.status === 'fail' || lastMessage.id?.startsWith('temp-')) {
      return lastMessage.cipherText || 'Message non envoyé';
    }
    return null;
  }, [lastMessage]);

  useEffect(() => {
    if (!lastMessage || directPlain !== null || cachedPreview !== undefined) return;
    const getKey = async () => {
      try {
        setChatKey(await ensureChatKeyForChat(conversation.id));
      } catch {
        setChatKey(null);
      }
    };
    getKey();
  }, [conversation.id, lastMessage, directPlain, cachedPreview]);

  const [decryptedLastMessage, setDecryptedLastMessage] = useState<string>(() => {
    if (!lastMessage) return 'Aucun message';
    if (directPlain !== null) return directPlain;
    return cachedPreview !== undefined ? cachedPreview : 'Message sécurisé';
  });

  useEffect(() => {
    if (!lastMessage) {
      setDecryptedLastMessage('Aucun message');
      return;
    }
    if (directPlain !== null) {
      setDecryptedLastMessage(directPlain);
      return;
    }
    if (cachedPreview !== undefined) {
      setDecryptedLastMessage(cachedPreview);
      return;
    }
    if (!chatKey) {
      setDecryptedLastMessage('Message sécurisé');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const plain = await decryptMessage(lastMessage.cipherText, lastMessage.iv, chatKey);
        if (plain !== null && cacheKey) cachePreview(cacheKey, plain);
        if (!cancelled) setDecryptedLastMessage(plain ?? 'Erreur de déchiffrement');
      } catch {
        if (!cancelled) setDecryptedLastMessage('Erreur de déchiffrement');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lastMessage, chatKey, directPlain, cachedPreview, cacheKey]);

  const isMine = useMemo(() => {
    if (!lastMessage || !user?.id) return false;
    return lastMessage.sender_id === user.id || lastMessage.sender?.id === user.id;
  }, [lastMessage, user?.id]);

  const isFailed = lastMessage && lastMessage.status === 'fail';

  const renderStatusIcon = () => {
    if (!lastMessage || !isMine) return null;
    if (lastMessage.status === 'fail') return <AlertCircle size={14} color="#EF4444" strokeWidth={2.5} />;
    if (lastMessage.id?.startsWith('temp-')) return <Clock size={14} color="#A1A1AA" strokeWidth={2.5} />;
    if (lastMessage.status === 'read') return <CheckCheck size={14} color="#F97316" strokeWidth={2.5} />;
    if (lastMessage.status === 'delivered') return <CheckCheck size={14} color="#A1A1AA" strokeWidth={2.5} />;
    if (lastMessage.status === 'send') return <Check size={14} color="#A1A1AA" strokeWidth={2.5} />;
    return null;
  };

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-2 px-4 my-1.5"
    >
      <View>
        <Avatar name={chatName} uri={chatAvatar} size="lg" role={userAccountRole as any} />
      </View>

      <View className="flex-1 ml-4 justify-center">
        <View className="flex-row justify-between items-baseline mb-1">
          <Text 
            className={cn(
              'text-sm tracking-tight text-zinc-950 dark:text-white',
              isUnread ? 'font-black' : 'font-bold'
            )}
            numberOfLines={1}
          >
            {chatName}
          </Text>
          
          <Text className={cn(
            'text-[10px] font-black uppercase tracking-widest ml-2',
            isUnread ? 'text-orange-500' : 'text-zinc-400'
          )}>
            {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: false })}
          </Text>
        </View>

        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1 flex-row items-center gap-2 overflow-hidden">
            {renderStatusIcon()}
            <Text
              numberOfLines={1}
              className={cn(
                'flex-1 text-xs',
                isFailed
                  ? 'text-red-500 font-bold'
                  : isUnread
                    ? 'text-zinc-950 dark:text-white font-black'
                    : 'text-zinc-500 dark:text-zinc-400 font-medium'
              )}
            >
              {decryptedLastMessage}
            </Text>
          </View>

          {isUnread && (
            <View className="bg-orange-500 rounded-full px-2.5 h-6 min-w-[24px] items-center justify-center">
              <Text className="text-white text-[10px] font-black tracking-tighter">
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