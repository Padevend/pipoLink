import React, { useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { format } from 'date-fns';

import { groupMessagesByDate } from '@/features/messaging/lib/group-messages-by-date';
import { useMessages } from '@/features/messaging/hooks/use-messages';
import { useSendMessage } from '@/features/messaging/hooks/use-send-message';
import { useAuth } from '@/providers';
import { Input } from '@/shared/ui/input';
import { Send, Paperclip } from 'lucide-react-native';
import { cn } from '@/shared/utils/cn';

interface ChatViewProps {
  conversationId: string;
}

export function ChatView({ conversationId }: ChatViewProps) {
  const { user } = useAuth();
  const { data, fetchNextPage, hasNextPage } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const listItems = useMemo(() => {
    const messages = data?.pages.flatMap((page) => page.items) ?? [];
    return groupMessagesByDate(messages);
  }, [data]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage.mutate({ content: text.trim(), type: 'text' });
    setText('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className="flex-1"
    >
      <FlatList
        ref={flatListRef}
        data={listItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => {
          if (item.type === 'date') {
            return (
              <View className="my-4 items-center">
                <View className="rounded-full bg-surface-light px-4 py-1.5 dark:bg-surface-dark">
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                    {item.label}
                  </Text>
                </View>
              </View>
            );
          }

          const msg = item.message;
          const isMe = msg.sender_id === user?.id;
          return (
            <View className={cn('mb-3 max-w-[82%]', isMe ? 'self-end' : 'self-start')}>
              <View
                className={cn(
                  'px-4 py-3 rounded-3xl',
                  isMe
                    ? 'rounded-tr-md bg-primary'
                    : 'rounded-tl-md border border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark',
                )}
              >
                <Text
                  className={cn(
                    'text-[15px] leading-[22px]',
                    isMe ? 'text-white' : 'text-text-primary-light dark:text-text-primary-dark',
                  )}
                >
                  {msg.decryptFailed
                    ? 'Message illisible — clé manquante.'
                    : msg.decryptedContent ?? msg.cipherText}
                </Text>
              </View>
              <Text
                className={cn(
                  'mt-1 px-1 text-[10px] text-text-secondary-light dark:text-text-secondary-dark',
                  isMe ? 'text-right' : 'text-left',
                )}
              >
                {format(new Date(msg.created_at), 'HH:mm')}
                {msg.status === 'send' && isMe ? ' · en attente' : ''}
              </Text>
            </View>
          );
        }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View className="border-t border-border-light bg-background-light px-4 py-3 dark:border-border-dark dark:bg-background-dark">
        <View className="flex-row items-end gap-2">
          <Pressable className="mb-1 h-11 w-11 items-center justify-center rounded-2xl bg-surface-light dark:bg-surface-dark">
            <Paperclip size={20} color="#64748B" />
          </Pressable>
          <View className="flex-1">
            <Input
              placeholder="Écrire un message…"
              value={text}
              onChangeText={setText}
              multiline
              containerClassName="min-h-[48px] max-h-[120px] rounded-2xl"
              className="text-[15px]"
              onSubmitEditing={handleSend}
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className={cn(
              'mb-1 h-11 w-11 items-center justify-center rounded-2xl',
              text.trim() ? 'bg-primary' : 'bg-surface-light dark:bg-surface-dark',
            )}
          >
            <Send size={18} color={text.trim() ? '#FFFFFF' : '#94A3B8'} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
