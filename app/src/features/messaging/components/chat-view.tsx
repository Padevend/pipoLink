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
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/utils/cn';
import type { InfiniteData } from '@tanstack/react-query';
import { MessageBubble } from './message-bubble';

interface ChatViewProps {
  conversation?: Conversation;
}

export function ChatView({ conversation }: ChatViewProps) {
  const conversationId = conversation?.id ?? '';
  const type = conversation?.type ?? 'private';
  const { user } = useAuth();
  const { data, fetchNextPage, hasNextPage } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const [text, setText] = useState('');
  const [responseTo, setResponseTo] = useState<DecryptedMessage | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [hasScrolledInitial, setHasScrolledInitial] = useState(false);

  const getReplyPreview = (rep: DecryptedMessage) => {
    if (rep.is_deleted) return 'Ce message a été supprimé';
    if (rep.decryptedContent) return rep.decryptedContent;
    if (rep.attachments && rep.attachments.length > 0) {
      if (rep.attachments[0].mimeType.startsWith('image/')) return '📷 Photo';
      return '📎 Document';
    }
    return 'Message';
  };

  useEffect(() => {
    activeChat.set(conversationId);
    return () => activeChat.set(null);
  }, [conversationId]);

  const listItems = useMemo(() => {
    data?.pages
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

  // onViewableItemsChanged to detect when unread messages from other users become visible
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    let unreadVisible = false;
    for (const { item } of viewableItems) {
      if (item.type === 'message') {
        const msg = item.message;
        if (msg.sender_id !== user?.id && msg.status !== 'read') {
          unreadVisible = true;
          break;
        }
      }
    }
    
    if (unreadVisible) {
      void messagingApi.markAsRead(conversationId).catch(() => undefined);
      // Broadcast read receipt instantly via WebSocket
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
      responseToMsg: responseTo
    });
    setText('');
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
      file: {
        uri: asset.uri,
        name: asset.fileName ?? `image-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize,
      },
    });
    setText('');
    setResponseTo(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : "height"}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className="flex-1 bg-background-light dark:bg-background-dark"
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
        renderItem={({ item }) => {
          if (item.type === 'date') {
            return (
              <View className="my-6 items-center">
                <View className="rounded-full bg-surface-light/40 border border-border-light/20 px-4 py-1 dark:bg-surface-dark/40 dark:border-border-dark/20 backdrop-blur-md">
                  <Text className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary-light/80 dark:text-text-secondary-dark/80">
                    {item.label}
                  </Text>
                </View>
              </View>
            );
          }

          if (item.type === 'unread-separator') {
            return (
              <View className="my-6 items-center">
                <View className="rounded-full bg-surface-light/40 border border-border-light/20 px-4 py-1 dark:bg-surface-dark/40 dark:border-border-dark/20 backdrop-blur-md">
                  <Text className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary-light/80 dark:text-text-secondary-dark/80">
                    Messages non lus
                  </Text>
                </View>
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
              onReply={(message) => {
                setResponseTo(message);
              }}
              onPressReplyQuote={(id) => {
                const idx = listItems.findIndex((i) => i.type === 'message' && i.message.id === id);
                if (idx !== -1) {
                  flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
                }
              }}
            />
          );
        }}
        onContentSizeChange={() => {
           // On new message sent by the user, or keyboard opening, we scroll to bottom.
           // However, if there are unread messages, we don't force scroll to bottom on mount.
        }}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0 });
          }, 500);
        }}
      />
      
      {unreadCount > 0 && (
        <View className="absolute right-5 bottom-24 z-50">
          <Pressable
            onPress={markAsReadAndScroll}
            className="h-10 w-10 bg-surface-light dark:bg-surface-dark border border-border-light/20 dark:border-border-dark/20 rounded-full shadow-lg items-center justify-center backdrop-blur-md active:opacity-80"
          >
            <ChevronDown size={20} color="#64748B" />
            <View className="absolute -top-1.5 -right-1.5 bg-primary h-5 min-w-[20px] rounded-full items-center justify-center px-1 border-2 border-background-light dark:border-background-dark">
              <Text className="text-[10px] text-white font-bold">{unreadCount}</Text>
            </View>
          </Pressable>
        </View>
      )}

      {/* Zone d'input style Glassmorphism floutée et épurée */}
      <View className="border-t border-border-light/30 bg-background-light/80 px-4 pt-3 pb-6 dark:border-border-dark/30 dark:bg-background-dark/80 backdrop-blur-xl">
        {responseTo && (
          <View className="mb-2 bg-surface-light/80 dark:bg-surface-dark/80 border-l-4 border-primary rounded-r-lg px-3 py-2 flex-row justify-between items-center relative">
            <View className="flex-1 mr-4">
              <Text className="text-primary text-[12px] font-bold mb-0.5">
                {responseTo.sender?.username || 'Utilisateur'}
              </Text>
              <Text className="text-text-primary-light dark:text-text-primary-dark text-[13px]" numberOfLines={1}>
                {getReplyPreview(responseTo)}
              </Text>
            </View>
            <Pressable onPress={() => setResponseTo(null)} className="h-6 w-6 items-center justify-center rounded-full bg-border-light/50 dark:bg-border-dark/50 active:opacity-80">
              <X size={14} className="text-text-secondary-light dark:text-text-secondary-dark" />
            </Pressable>
          </View>
        )}
        <View className="flex-row items-center gap-2.5 bg-surface-light/50 dark:bg-surface-dark/40 border border-border-light/40 dark:border-border-dark/20 rounded-3xl p-1.5 ">

          {/* Bouton Pièce Jointe */}
          <Pressable
            onPress={() =>
              router.push({ pathname: '/modal/upload-file', params: { id: conversationId } })
            }
            className="h-10 w-10 items-center justify-center rounded-full bg-background-light/40 dark:bg-background-dark/40 active:opacity-80"
          >
            <Paperclip size={18} color="#64748B" />
          </Pressable>

          {/* Bouton Image (Changement d'icône pour une icône Image appropriée) */}
          <Pressable
            onPress={() => void handlePickImage()}
            className="h-10 w-10 items-center justify-center rounded-full bg-background-light/40 dark:bg-background-dark/40 active:opacity-80"
          >
            <ImageIcon size={18} color="#64748B" />
          </Pressable>

          {/* Champ de Saisie de texte de base neutre */}
          <View className="flex-1 bottom-0.5">
            <Input
              placeholder="Écrire un message…"
              value={text}
              onChangeText={setText}
              multiline
              containerClassName="bg-transparent border-0"
              className="text-[15px] text-text-primary-light dark:text-text-primary-dark scroll-m-0"
              onSubmitEditing={handleSend}
            />
          </View>

          {/* Bouton Envoyer */}
          <Pressable
            onPress={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className={cn(
              'h-10 w-10 items-center justify-center rounded-full  active:opacity-80',
              text.trim()
                ? 'bg-primary'
                : 'bg-transparent opacity-40',
            )}
          >
            <Send size={16} color={text.trim() ? '#FFFFFF' : '#64748B'} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}