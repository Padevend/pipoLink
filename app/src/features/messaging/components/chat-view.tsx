import { useSafeArea } from '@/shared/hooks/use-safe-area';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { ChevronDown, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';

import { useMessages, type DecryptedMessage } from '@/features/messaging/hooks/use-messages';
import { useSendMessage } from '@/features/messaging/hooks/use-send-message';
import { activeChat } from '@/features/messaging/lib/active-chat';
import { groupMessagesByDate } from '@/features/messaging/lib/group-messages-by-date';
import { queryClient, useAuth } from '@/providers';
import { messagingApi, type Conversation } from '@/shared/api/messaging';
import type { PaginatedResponse } from '@/shared/api/types';
import { useDraft } from '@/shared/hooks/use-draft';
import { cn } from '@/shared/utils/cn';
import type { InfiniteData } from '@tanstack/react-query';
import { MessageBubble } from './message-bubble';
import { ChatInputBar } from '@/shared/ui/chat-input-bar';

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

  // Gestion du brouillon
  const { text: draftText, setText: setDraft, clearDraft } = useDraft(`chat_${conversationId}`);

  const [responseTo, setResponseTo] = useState<DecryptedMessage | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [hasScrolledInitial, setHasScrolledInitial] = useState(false);

  useEffect(() => {
    activeChat.set(conversationId);
    return () => activeChat.set(null);
  }, [conversationId]);

  const listItems = useMemo(() => {
    const messages = data?.pages.flatMap((page) => page.items) ?? [];
    return groupMessagesByDate(messages, user?.id);
  }, [data, user?.id]);

  const unreadCount = useMemo(() => {
    return listItems.filter(item =>
      item.type === 'message' && item.message.sender_id !== user?.id && item.message.status !== 'read'
    ).length;
  }, [listItems, user?.id]);

  useEffect(() => {
    if (!hasScrolledInitial && listItems.length > 0) {
      const firstUnreadIndex = listItems.findIndex((item) => item.type === 'unread-separator');
      setTimeout(() => {
        if (firstUnreadIndex !== -1) {
          flatListRef.current?.scrollToIndex({ index: firstUnreadIndex, animated: false, viewPosition: 0 });
        } else {
          flatListRef.current?.scrollToEnd({ animated: false });
        }
      }, 100);
      setHasScrolledInitial(true);
    }
  }, [listItems, hasScrolledInitial]);

  const markAsReadAndScroll = useCallback(() => {
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
            items: page.items.map((m) => (m.sender_id !== user?.id && m.status !== 'read') ? { ...m, status: 'read' as const } : m),
          })),
        };
      }
    );

    messagingApi.markAsRead(conversationId).catch(() => undefined);
    import('@/shared/websocket/manager').then(({ wsManager }) => {
      wsManager.send('message.read', { conversationId });
    });
  }, [conversationId, conversation?.isPending, user?.id]);

  const handleSendText = useCallback((content: string) => {
    sendMessage.mutate({
      content,
      type: 'text',
      replyToId: responseTo?.id,
      responseToMsg: responseTo,
      isPending: conversation?.isPending,
      recipientUserId: conversation?.recipientUserId,
    });
    clearDraft();
    setResponseTo(null);
  }, [sendMessage, responseTo, conversation, clearDraft]);

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    sendMessage.mutate({
      content: '',
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
    setResponseTo(null);
  }, [sendMessage, responseTo, conversation]);

  const handlePickDocument = useCallback(() => {
    router.push({
      pathname: '/modal/upload-file',
      params: {
        id: conversationId,
        isPending: conversation?.isPending ? 'true' : 'false',
        recipientUserId: conversation?.recipientUserId
      },
    });
  }, [conversationId, conversation?.isPending, conversation?.recipientUserId]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className="flex-1 bg-white dark:bg-zinc-950"
    >
      <View className="absolute inset-0 pointer-events-none">
        <Image
          source={require("@/assets/images/bg_001.jpg")}
          className="h-full w-full opacity-[0.1] dark:opacity-[0.08]"
          resizeMode="cover"
          blurRadius={5}
        />
      </View>

      <FlatList
        ref={flatListRef}
        data={listItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={15}
        renderItem={({ item }) => {
          if (item.type === 'date' || item.type === 'unread-separator') {
            const isSeparator = item.type === 'unread-separator';
            return (
              <View className="my-5 flex-row items-center justify-center gap-3">
                <View className="h-[1px] flex-1 bg-zinc-200/60 dark:bg-zinc-800/60" />
                <View className={cn(
                  "rounded-full px-3 py-1 border",
                  isSeparator
                    ? "bg-orange-500/10 border-orange-500/20"
                    : "bg-white/60 border-zinc-200/40 dark:bg-zinc-900/60 dark:border-zinc-800/40 backdrop-blur-md"
                )}>
                  <Text className={cn(
                    "font-mono text-[9px] font-bold uppercase tracking-widest",
                    isSeparator ? "text-orange-500" : "text-zinc-500 dark:text-zinc-400"
                  )}>
                    {isSeparator ? 'Messages non lus' : item.label}
                  </Text>
                </View>
                <View className="h-[1px] flex-1 bg-zinc-200/60 dark:bg-zinc-800/60" />
              </View>
            );
          }

          const msg = item.message;
          return (
            <MessageBubble
              message={msg}
              isMine={msg.sender_id === user?.id}
              hasAttachments={(msg.attachments?.length ?? 0) > 0}
              isGroup={type === 'group'}
              onRetry={(message) => sendMessage.retryFailedMessage(message)}
              onDeleteLocal={(id) => sendMessage.deleteFailedMessageLocally(id)}
              onReply={(message) => setResponseTo(message)}
              onPressReplyQuote={(id) => {
                const idx = listItems.findIndex((i) => i.type === 'message' && i.message.id === id);
                if (idx !== -1) flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
              }}
            />
          );
        }}
      />



      {/* ZONE FIXE EN BAS */}
      <View style={{ paddingBottom: Math.max(insets.bottom, 25) }} className="px-3 pt-1">
        {unreadCount > 0 && (
          <View className="mb-5 me-3 items-end z-40">
            <Pressable
              onPress={markAsReadAndScroll}
              className="h-10 w-10 items-center justify-center rounded-full border border-zinc-200/80 bg-white/90 backdrop-blur-md active:scale-95 dark:border-zinc-800 dark:bg-zinc-900/90"
            >
              <ChevronDown size={18} color="#71717A" />
              <View className="absolute -top-1 -right-1 h-4 min-w-[16px] items-center justify-center rounded-full border border-white bg-orange-500 px-1 dark:border-zinc-950">
                <Text className="font-mono text-[8px] font-black text-white">{unreadCount}</Text>
              </View>
            </Pressable>
          </View>
        )}

        {responseTo && (
          <View className="mb-2 flex-row items-center justify-between rounded-2xl border border-zinc-200/50 bg-white/80 p-3 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/80">
            <View className="flex-1 mr-3 border-l-2 border-orange-500 pl-2.5">
              <Text className="font-mono text-[10px] font-bold uppercase tracking-wider text-orange-500">
                Réponse à @{responseTo.sender?.username || 'Utilisateur'}
              </Text>
              <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-300" numberOfLines={1}>
                {responseTo.decryptedContent || 'Fichier joint'}
              </Text>
            </View>
            <Pressable onPress={() => setResponseTo(null)} className="rounded-full bg-zinc-200/50 p-1.5 dark:bg-zinc-800/50">
              <X size={14} color="#71717A" />
            </Pressable>
          </View>
        )}

        {/* COMPOSANT ENFANT SANS RHF (100% Natif & Stable) */}
        <ChatInputBar
          text={draftText}
          setText={setDraft}
          onSend={handleSendText}
          onPickImage={handlePickImage}
          onPickDocument={handlePickDocument}
        />
      </View>
    </KeyboardAvoidingView>
  );
}