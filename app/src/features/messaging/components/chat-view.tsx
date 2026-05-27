import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Image as ImageIcon, Paperclip, Send } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';

import { useMessages } from '@/features/messaging/hooks/use-messages';
import { useSendMessage } from '@/features/messaging/hooks/use-send-message';
import { groupMessagesByDate } from '@/features/messaging/lib/group-messages-by-date';
import { useAuth } from '@/providers';
import { messagingApi } from '@/shared/api/messaging';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/utils/cn';
import { MessageBubble } from './message-bubble';

interface ChatViewProps {
  conversationId: string;
}

export function ChatView({ conversationId }: ChatViewProps) {
  const { user } = useAuth();
  const { data, fetchNextPage, hasNextPage } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

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

  const listItems = useMemo(() => {
    const messages = data?.pages.flatMap((page) => page.items) ?? [];
    return groupMessagesByDate(messages);
  }, [data]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage.mutate({ content: text.trim(), type: 'text' });
    setText('');
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
      file: {
        uri: asset.uri,
        name: asset.fileName ?? `image-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize,
      },
    });
    setText('');
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

          const msg = item.message;
          const isMe = msg.sender_id === user?.id;
          const hasAttachments = (msg.attachments?.length ?? 0) > 0;

          return (
            <MessageBubble message={msg} isMine={isMe} hasAttachments={hasAttachments} />
          );
        }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Zone d'input style Glassmorphism floutée et épurée */}
      <View className="border-t border-border-light/30 bg-background-light/80 px-4 pt-3 pb-6 dark:border-border-dark/30 dark:bg-background-dark/80 backdrop-blur-xl">
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