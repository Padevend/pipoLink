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

  useEffect(() => {
    if (!lastMessage || cachedPreview !== undefined) return;
    const getKey = async () => {
      try {
        setChatKey(await ensureChatKeyForChat(conversation.id));
      } catch {
        setChatKey(null);
      }
    };
    getKey();
  }, [conversation.id, lastMessage, cachedPreview]);

  // Déchiffrement du dernier message (Logique métier préservée)
  const decryptedLastMessage = useMemo(() => {
    if (!lastMessage) return 'Aucun message';
    if (cachedPreview !== undefined) return cachedPreview;
    if (!chatKey) return 'Message sécurisé';
    try {
      const plain = decryptMessage(lastMessage.cipherText, lastMessage?.iv, chatKey);
      if (cacheKey) cachePreview(cacheKey, plain);
      return plain;
    } catch {
      return 'Erreur de déchiffrement';
    }
  }, [lastMessage, chatKey, cachedPreview, cacheKey]);

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
          
          {/* Aperçu du dernier message échangé */}
          <Text
            numberOfLines={1}
            className={cn(
              'flex-1 text-xs leading-relaxed',
              isUnread
                ? 'text-zinc-900 dark:text-zinc-200 font-bold'
                : 'text-zinc-400 dark:text-zinc-500'
            )}
          >
            {decryptedLastMessage}
          </Text>

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