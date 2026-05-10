import React, { useState, useRef, useMemo } from 'react';
import { View, Text, FlatList, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useMessages } from '@/features/messaging/hooks/use-messages';
import { useSendMessage } from '@/features/messaging/hooks/use-send-message';
import { useAuth } from '@/providers';
import { Input } from '@/shared/ui/input';
import { Send, Image as ImageIcon, Paperclip } from 'lucide-react-native';
import { format } from 'date-fns';
import { cn } from '@/shared/utils/cn';

interface ChatViewProps {
  conversationId: string;
}

export function ChatView({ conversationId }: ChatViewProps) {
  const { user } = useAuth();
  const { data, isLoading, fetchNextPage, hasNextPage } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const messages = useMemo(() => {
    return data?.pages.flatMap(page => page.items) || [];
  }, [data]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage.mutate({
      content: text.trim(),
      type: 'text'
    });
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
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => {
          const isMe = item.sender_id === user?.id;
          return (
            <View className={cn(
              'mb-4 max-w-[80%]',
              isMe ? 'self-end' : 'self-start'
            )}>
              <View className={cn(
                'px-4 py-3 rounded-3xl',
                isMe 
                  ? 'bg-primary rounded-tr-none' 
                  : 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-tl-none'
              )}>
                <Text className={cn(
                  'text-base',
                  isMe ? 'text-white' : 'text-text-primary-light dark:text-text-primary-dark'
                )}>
                  {item.cipherText}
                </Text>
              </View>
              <Text className={cn(
                'text-[10px] mt-1 px-2 text-text-secondary-light dark:text-text-secondary-dark',
                isMe ? 'text-right' : 'text-left'
              )}>
                {format(new Date(item.created_at), 'HH:mm')}
              </Text>
            </View>
          );
        }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View className="px-4 py-4 bg-background-light dark:bg-background-dark border-t border-border-light dark:border-border-dark">
        <View className="flex-row items-center gap-2">
          <Pressable className="w-10 h-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Paperclip size={20} color="#64748B" />
          </Pressable>
          
          <View className="flex-1">
            <Input
              placeholder="Message..."
              value={text}
              onChangeText={setText}
              containerClassName="h-10"
              className="h-10 text-sm"
              onSubmitEditing={handleSend}
            />
          </View>
          
          <Pressable 
            onPress={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className={cn(
              'w-10 h-10 items-center justify-center rounded-full',
              text.trim() ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-800'
            )}
          >
            <Send size={18} color={text.trim() ? '#FFFFFF' : '#94A3B8'} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
