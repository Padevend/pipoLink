import { useSafeArea } from '@/shared/hooks/use-safe-area';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { ChevronDown, Image as ImageIcon, Paperclip, Send, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';

import { useMessages, type DecryptedMessage } from '@/features/messaging/hooks/use-messages';
import { useSendMessage } from '@/features/messaging/hooks/use-send-message';
import { activeChat } from '@/features/messaging/lib/active-chat';
import { groupMessagesByDate } from '@/features/messaging/lib/group-messages-by-date';
import { queryClient, useAuth } from '@/providers';
import { messagingApi, type Conversation } from '@/shared/api/messaging';
import type { PaginatedResponse } from '@/shared/api/types';
import { useDraft } from '@/shared/hooks/use-draft';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/utils/cn';
import type { InfiniteData } from '@tanstack/react-query';
import { MessageBubble } from './message-bubble';

interface ChatViewProps {
  conversation?: Conversation;
}

export function ChatView({ conversation }: ChatViewProps) {
  const insets = useSafeArea();
  const conversationId = conversation?.id ?? '';
  const type = conversation?.type ?? 'private';
  const { user } = useAuth();
  const { data, fetchNextPage, hasNextPage } = useMessages(conversationId, { enabled: !conversation?.isPending });
  const sendMessage = useSendMessage(conversationId);
  // Brouillon local par conversation (restauré à la réouverture, TTL 24 h)
  const { text, setText, clearDraft } = useDraft(`chat_${conversationId}`);
  const [responseTo, setResponseTo] = useState<DecryptedMessage | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [hasScrolledInitial, setHasScrolledInitial] = useState(false);

  const getReplyPreview = (rep: DecryptedMessage) => {
    if (rep.is_deleted) return 'Ce message a été supprimé';
    if (rep.decryptedContent) return rep.decryptedContent;
    if (rep.attachments && rep.attachments.length > 0) {
      if (rep.attachments[0].mimeType.startsWith('image/')) return '[Image]';
      return rep.attachments.map((att) => `${att.fileName}`).join(', ');
    }
    return 'Message';
  };

  useEffect(() => {
    activeChat.set(conversationId);
    return () => activeChat.set(null);
  }, [conversationId]);

  const listItems = useMemo(() => {
    const messages = data?.pages.flatMap((page) => page.items) ?? [];
    return groupMessagesByDate(messages, user?.id);
  }, [data, user?.id]);

  const unreadCount = useMemo(() => {
    let count = 0;
    for (const item of listItems) {
      if (item.type === 'message' && item.message.sender_id !== user?.id && item.message.status !== 'read') {
        count++;
      }
    }
    return count;
  }, [listItems, user?.id]);

  useEffect(() => {
    if (!hasScrolledInitial && listItems.length > 0) {
      const firstUnreadIndex = listItems.findIndex((item) => item.type === 'unread-separator');
      if (firstUnreadIndex !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: firstUnreadIndex, animated: false, viewPosition: 0 });
        }, 100);
      } else {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
      setHasScrolledInitial(true);
    }
  }, [listItems, hasScrolledInitial]);

  const markAsReadAndScroll = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    
    if (conversation?.isPending) return;

    queryClient.setQueryData<InfiniteData<PaginatedResponse<DecryptedMessage>>>(
      ['messages', conversationId],
      (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((m) => {
              if (m.sender_id !== user?.id && m.status !== 'read') {
                return { ...m, status: 'read' as const };
              }
              return m;
            }),
          })),
        };
      }
    );

    messagingApi.markAsRead(conversationId).catch(() => undefined);
    import('@/shared/websocket/manager').then(({ wsManager }) => {
      wsManager.send('message.read', { conversationId });
    });
  };

  const contextRef = useRef({ conversationId, userId: user?.id, isPending: conversation?.isPending });
  useEffect(() => {
    contextRef.current = { conversationId, userId: user?.id, isPending: conversation?.isPending };
  }, [conversationId, user?.id, conversation?.isPending]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const { conversationId, userId, isPending } = contextRef.current;
    if (isPending) return;

    let unreadVisible = false;
    for (const { item } of viewableItems) {
      if (item.type === 'message') {
        const msg = item.message;
        if (msg.sender_id !== userId && msg.status !== 'read') {
          unreadVisible = true;
          break;
        }
      }
    }
    
    if (unreadVisible) {
      void messagingApi.markAsRead(conversationId).catch(() => undefined);
      import('@/shared/websocket/manager').then(({ wsManager }) => {
        wsManager.send('message.read', { conversationId });
      });
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 250,
  }).current;

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage.mutate({ 
      content: text.trim(), 
      type: 'text', 
      replyToId: responseTo?.id,
      responseToMsg: responseTo,
      isPending: conversation?.isPending,
      recipientUserId: conversation?.recipientUserId,
    });
    clearDraft();
    setResponseTo(null);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    sendMessage.mutate({
      content: text.trim(),
      type: 'image',
      replyToId: responseTo?.id,
      responseToMsg: responseTo,
      isPending: conversation?.isPending,
      recipientUserId: conversation?.recipientUserId,
      file: {
        uri: asset.uri,
        name: asset.fileName ?? `image-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize,
      },
    });
    clearDraft();
    setResponseTo(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : "height"}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className="flex-1 bg-white dark:bg-zinc-950"
    >
      <FlatList
        ref={flatListRef}
        data={listItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        renderItem={({ item }) => {
          if (item.type === 'date' || item.type === 'unread-separator') {
            const isSeparator = item.type === 'unread-separator';
            return (
              <View className="my-6 items-center flex-row justify-center gap-4">
                <View className="flex-1 h-[1px] bg-zinc-100 dark:bg-zinc-900" />
                <View className={cn(
                  "rounded-lg px-3 py-1 border",
                  isSeparator 
                    ? "bg-orange-500/5 border-orange-500/20" 
                    : "bg-zinc-50 border-zinc-100 dark:bg-zinc-900/30 dark:border-zinc-800"
                )}>
                  <Text className={cn(
                    "font-mono text-[9px] font-bold uppercase tracking-widest",
                    isSeparator ? "text-orange-500" : "text-zinc-400 dark:text-zinc-500"
                  )}>
                    {isSeparator ? 'Messages non lus' : item.label}
                  </Text>
                </View>
                <View className="flex-1 h-[1px] bg-zinc-100 dark:bg-zinc-900" />
              </View>
            );
          }

          const msg = item.message;
          const isMe = msg.sender_id === user?.id;
          const hasAttachments = (msg.attachments?.length ?? 0) > 0;

          return (
            <MessageBubble 
              message={msg}
              isMine={isMe}
              hasAttachments={hasAttachments} 
              isGroup={type === 'group'}
              onRetry={(message) => sendMessage.retryFailedMessage(message)}
              onDeleteLocal={(id) => sendMessage.deleteFailedMessageLocally(id)}
              onDelete={async () => {
                try {
                  await messagingApi.deleteMessage(conversationId, msg.id);
                  queryClient.setQueryData<InfiniteData<PaginatedResponse<DecryptedMessage>>>(
                    ['messages', conversationId],
                    (old) => {
                      if (!old?.pages) return old;
                      return {
                        ...old,
                        pages: old.pages.map((page) => ({
                          ...page,
                          items: page.items.map((m) =>
                            m.id === msg.id ? { ...m, is_deleted: true } : m
                          ),
                        })),
                      };
                    }
                  );
                } catch (e) {
                  console.error('Failed to delete message', e);
                }
              }}
              onReply={(message) => setResponseTo(message)}
              onPressReplyQuote={(id) => {
                const idx = listItems.findIndex((i) => i.type === 'message' && i.message.id === id);
                if (idx !== -1) {
                  flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
                }
              }}
            />
          );
        }}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0 });
          }, 500);
        }}
      />
      
      {/* Bouton de saut d'index (Messages récents) technique */}
      {unreadCount > 0 && (
        <View className="absolute right-5 bottom-28 z-50">
          <Pressable
            onPress={markAsReadAndScroll}
            className="h-10 w-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl items-center justify-center active:bg-zinc-50 dark:active:bg-zinc-800"
          >
            <ChevronDown size={16} color="#A1A1AA" />
            <View className="absolute -top-1.5 -right-1.5 bg-orange-500 px-1.5 h-4 min-w-[16px] rounded-md items-center justify-center border border-white dark:border-zinc-950">
              <Text className="font-mono text-[8px] text-white font-black">{unreadCount}</Text>
            </View>
          </Pressable>
        </View>
      )}

      {/* Barre technique inférieure de saisie (Zéro Glassmorphism) */}
      <View 
        className="border-t border-zinc-100 bg-white px-4 pt-3 dark:border-zinc-900 dark:bg-zinc-950"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        
        {/* Volet de citation en cas de réponse à un message */}
        {responseTo && (
          <View className="mb-3 bg-zinc-50 dark:bg-zinc-900/40 border-l-2 border-orange-500 rounded-r-xl px-3 py-2.5 flex-row justify-between items-center">
            <View className="flex-1 mr-4">
              <Text className="text-orange-500 font-mono text-[10px] font-bold uppercase tracking-wider mb-0.5">
                Réponse à @{responseTo.sender?.username || 'Utilisateur'}
              </Text>
              <Text className="text-zinc-500 dark:text-zinc-400 text-xs font-medium" numberOfLines={1}>
                {getReplyPreview(responseTo)}
              </Text>
            </View>
            <Pressable 
              onPress={() => setResponseTo(null)} 
              className="h-6 w-6 items-center justify-center rounded-lg bg-zinc-200/60 dark:bg-zinc-800 active:opacity-70"
            >
              <X size={12} color="#71717A" />
            </Pressable>
          </View>
        )}

        {/* Champ d'encapsulation de la ligne d'envoi */}
        <View className="flex-row items-center gap-2 p-1.5">

          <Pressable
            onPress={() =>
              router.push({
                pathname: '/modal/upload-file',
                params: {
                  id: conversationId,
                  isPending: conversation?.isPending ? 'true' : 'false',
                  recipientUserId: conversation?.recipientUserId,
                },
              })
            }
            className="h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 active:bg-zinc-50"
          >
            <Paperclip size={14} color="#A1A1AA" />
          </Pressable>

          <Pressable
            onPress={() => void handlePickImage()}
            className="h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 active:bg-zinc-50"
          >
            <ImageIcon size={14} color="#A1A1AA" />
          </Pressable>

          <View className="flex-1 justify-center px-1">
            <Input
              placeholder="Écrire un message…"
              value={text}
              onChangeText={setText}
              multiline
              containerClassName="bg-transparent border-0 h-9 justify-center"
              className="text-md text-zinc-900 dark:text-zinc-50 font-medium py-0"
              onSubmitEditing={handleSend}
            />
          </View>

          <Pressable
            onPress={handleSend}
            disabled={!text.trim()}
            className={cn(
              'h-9 w-9 items-center justify-center rounded-lg transition-all',
              text.trim()
                ? 'bg-orange-500 dark:bg-orange-600'
                : 'bg-transparent opacity-30',
            )}
          >
            <Send size={14} color={text.trim() ? '#FFFFFF' : '#A1A1AA'} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}