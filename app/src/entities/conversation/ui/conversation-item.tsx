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

// Cache module-level des aperçus déchiffrés pour éviter fetch clé + déchiffrement à chaque rendu
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

  // Recuperation du user account role si echange prive
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

  // Déchiffrement du dernier message (async → state, avec cache module-level)
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

    if (lastMessage.status === 'fail') {
      return <AlertCircle size={12} color="#EF4444" strokeWidth={2.5} />;
    }
    if (lastMessage.id?.startsWith('temp-')) {
      return <Clock size={12} color="#A1A1AA" strokeWidth={2.5} />;
    }
    if (lastMessage.status === 'read') {
      return <CheckCheck size={12} color="#FF6B00" strokeWidth={2.5} />;
    }
    if (lastMessage.status === 'delivered') {
      return <CheckCheck size={12} color="#A1A1AA" strokeWidth={2.5} />;
    }
    if (lastMessage.status === 'send') {
      return <Check size={12} color="#A1A1AA" strokeWidth={2.5} />;
    }

    return null;
  };

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-6 py-4 bg-white dark:bg-zinc-950 active:bg-zinc-50 dark:active:bg-zinc-900/40"
    >
      {/* Conteneur de la photo de profil : Forme carrée moderne aux angles nets, sans ombre */}
      <View>
        <Avatar name={chatName} uri={chatAvatar} size="lg" role={userAccountRole as any} />
      </View>

      {/* Zone de contenu textuel */}
      <View className="flex-1 ml-4 justify-center">
        <View className="flex-row justify-between items-baseline mb-1">
          
          {/* Nom de l'interlocuteur ou du groupe */}
          <Text 
            className={cn(
              'text-sm tracking-tighter text-zinc-900 dark:text-zinc-50',
              isUnread ? 'font-black' : 'font-medium'
            )}
            numberOfLines={1}
          >
            {chatName}
          </Text>
          
          {/* Indicateur temporel : Orange électrique si non lu, gris sobre si lu */}
          <Text className={cn(
            'text-[10px] uppercase font-bold tracking-wider ml-2',
            isUnread 
              ? 'text-orange-500' 
              : 'text-zinc-400 dark:text-zinc-500'
          )}>
            {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: false })}
          </Text>
        </View>

        <View className="flex-row items-center justify-between gap-4">
          
          {/* Aperçu du dernier message échangé + icône de statut */}
          <View className="flex-1 flex-row items-center gap-1.5 overflow-hidden">
            {renderStatusIcon()}
            <Text
              numberOfLines={1}
              className={cn(
                'flex-1 text-xs leading-relaxed',
                isFailed
                  ? 'text-red-500 font-medium'
                  : isUnread
                    ? 'text-zinc-900 dark:text-zinc-200 font-bold'
                    : 'text-zinc-400 dark:text-zinc-500'
              )}
            >
              {decryptedLastMessage}
            </Text>
          </View>

          {/* Pastille de notification : Format technique, carré adouci et orange vif sans ombre */}
          {isUnread && (
            <View className="bg-orange-500 rounded-lg px-2 h-5 min-w-[20px] items-center justify-center">
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