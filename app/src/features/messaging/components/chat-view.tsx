import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { FileText, Paperclip, Send, Image as ImageIcon, Check, CheckCircle2, SpellCheck2, CheckCheck } from 'lucide-react-native';

import { groupMessagesByDate } from '@/features/messaging/lib/group-messages-by-date';
import { useMessages } from '@/features/messaging/hooks/use-messages';
import { useSendMessage } from '@/features/messaging/hooks/use-send-message';
import { useAuth } from '@/providers';
import { messagingApi } from '@/shared/api/messaging';
import type { MessageAttachment } from '@/shared/api/types';
import { Input } from '@/shared/ui/input';
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

  useEffect(() => {
    void messagingApi.markAsRead(conversationId).catch(() => undefined);
  }, [conversationId]);

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
            <View className={cn('mb-4 max-w-[85%]', isMe ? 'self-end items-end' : 'self-start items-start')}>
              <View
                className={cn(
                  'rounded-3xl px-4 py-3 ',
                  isMe
                    ? 'rounded-tr-lg bg-primary shadow-primary/10'
                    : 'rounded-tl-lg border border-border-light/40 bg-surface-light/60 dark:border-border-dark/30 dark:bg-surface-dark/60 backdrop-blur-lg',
                )}
              >
                {hasAttachments &&
                  msg.attachments!.map((att: MessageAttachment) => (
                    <View
                      key={att.id}
                      className={cn(
                        'mb-2 flex-row items-center gap-3 rounded-2xl px-3 py-2.5 border',
                        isMe 
                          ? 'bg-white/10 border-white/10' 
                          : 'bg-background-light/50 border-border-light/30 dark:bg-background-dark/50 dark:border-border-dark/30',
                      )}
                    >
                      <View className={cn('p-2 rounded-xl', isMe ? 'bg-white/15' : 'bg-primary/10')}>
                        <FileText size={18} color={isMe ? '#FFFFFF' : '#3B82F6'} />
                      </View>
                      <View className="flex-1">
                        <Text
                          className={cn(
                            'text-sm font-medium tracking-wide',
                            isMe ? 'text-white' : 'text-text-primary-light dark:text-text-primary-dark',
                          )}
                          numberOfLines={1}
                        >
                          {att.fileName}
                        </Text>
                        <Text
                          className={cn(
                            'text-[11px] mt-0.5 opacity-80',
                            isMe ? 'text-white/70' : 'text-text-secondary-light dark:text-text-secondary-dark',
                          )}
                        >
                          {(att.fileSize / 1024).toFixed(0)} Ko
                        </Text>
                      </View>
                    </View>
                  ))}

                {(msg.decryptedContent || !hasAttachments) && (
                  <Text
                    className={cn(
                      'text-[15px] leading-[22px] tracking-wide',
                      isMe ? 'text-white font-normal' : 'text-text-primary-light dark:text-text-primary-dark',
                    )}
                  >
                    {msg.decryptFailed
                      ? 'Message illisible — clé manquante.'
                      : msg.decryptedContent ?? msg.cipherText}
                  </Text>
                )}
              </View>
              
              {/* Métadonnées du message (Heure + Statut) */}
              <View className="flex-row items-center mt-1 px-1 gap-1.5">
                <Text className="text-[10px] font-medium tracking-wide text-text-secondary-light/60 dark:text-text-secondary-dark/60">
                  {format(new Date(msg.created_at), 'HH:mm')}
                </Text>
                {msg.status === 'send' && isMe && (
                  <Text className="text-[10px] font-medium text-primary/70 dark:text-primary/90">
                    <Check size={12}/>
                  </Text>
                )}
                {msg.status === 'read' && isMe && (
                  <Text className="text-[10px] font-medium text-primary/70 dark:text-primary/90">
                    <CheckCheck size={12}/>
                  </Text>
                )}
              </View>
            </View>
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
                ? 'bg-primary shadow-primary/20' 
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