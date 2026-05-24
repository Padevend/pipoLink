import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useConversations } from '@/entities/conversation/hooks';
import { ChatInfoSheet } from '@/features/messaging/components/chat-info-sheet';
import { ChatView } from '@/features/messaging/components/chat-view';
import { useAuth } from '@/providers';
import { Avatar } from '@/shared/ui/avatar';
import { cn } from '@/shared/utils/cn';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { ArrowLeft, EllipsisVertical, MessageSquareOff, Phone } from 'lucide-react-native';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: conversations } = useConversations();
  const [infoOpen, setInfoOpen] = useState(false);

  const conversation = conversations?.find((c) => c.id === id);

  if (!conversation) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background-light px-6 dark:bg-background-dark">
        <View className="w-full max-w-sm items-center justify-center text-center">

          {/* Conteneur d'icône style Glassmorphism */}
          <View className="mb-6 h-24 w-24 items-center justify-center">
            <View className="p-4 rounded-2xl bg-primary/10 dark:bg-primary/20">
              <MessageSquareOff size={38} className="text-primary" />
            </View>
          </View>

          {/* Textes explicatifs hiérarchisés */}
          <Text className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark text-center">
            Conversation introuvable
          </Text>

          <Text className="mt-2 text-center text-[14px] leading-5 text-text-secondary-light/80 dark:text-text-secondary-dark/80 px-4">
            Cet échange n'existe pas, a été supprimé ou vous n'avez plus les accès requis pour le consulter.
          </Text>

          {/* Bouton de retour d'action épuré */}
          <Pressable
            onPress={() => router.back()}
            className="mt-8 flex-row items-center justify-center gap-2 rounded-full border border-border-light/60 bg-surface-light/80 px-6 py-3 dark:border-border-dark/30 dark:bg-surface-dark/60 active:opacity-80 "
          >
            <ArrowLeft size={16} className="text-text-primary-light dark:text-text-primary-dark" />
            <Text className="text-sm font-semibold tracking-wide text-text-primary-light dark:text-text-primary-dark">
              Retourner aux messages
            </Text>
          </Pressable>

        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    console.log('Conversation loaded:', conversation);
  }, [])

  // get chat name
  const chatName = useMemo(() => {
    if (conversation.type === "group") {
      return conversation.name || 'Groupe';
    }
    const otherMember = conversation.members.find(m => m.id !== user?.id);
    return otherMember?.username || 'Privé';
  }, [conversation.name, conversation.members]);

  const userPhone = useMemo(() => {
    if (conversation.type === "group") return null;
    const otherMember = conversation.members.find(m => m.id !== user?.id);
    console.log(otherMember)

    return otherMember?.phone || null;
  }, [conversation.members, conversation.type]);

  // getchat avatarUrl
  const chatAvatar = useMemo(() => {
    if (conversation.type === "group") {
      return conversation.avatarUrl;
    }
    const otherMember = conversation.members.find(m => m.id !== user?.id);
    return otherMember?.avatarUrl;
  }, [conversation.avatarUrl, conversation.members]);

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>

      {/* Header Style Glassmorphism Épuré */}
      <View className="z-10 flex-row items-center justify-between border-b border-border-light/30 bg-surface-light/75 px-4 py-2.5 dark:border-border-dark/20 dark:bg-surface-dark/75 backdrop-blur-xl ">
        <View className="flex-row flex-1 items-center gap-3">

          {/* Bouton Retour */}
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center active:opacity-80"
          >
            <ArrowLeft size={20} color="#64748B" />
          </Pressable>

          <View className="">
            <Avatar name={chatName} uri={chatAvatar} size="sm" />
          </View>

          <View className="flex-1 justify-center">
            <Text
              className="text-[16px] font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark"
              numberOfLines={1}
            >
              {chatName}
            </Text>

            <View className="flex-row mt-0.5">
              <View className={cn(
                "rounded-full px-2 py-0.5 border",
                conversation?.type === 'group'
                  ? "bg-primary/10 border-primary/20"
                  : "bg-text-secondary-light/10 border-text-secondary-light/10 dark:bg-text-secondary-dark/10"
              )}>
                <Text className={cn(
                  "text-[9px] font-bold uppercase tracking-widest",
                  conversation?.type === 'group' ? "text-primary" : "text-text-secondary-light dark:text-text-secondary-dark"
                )}>
                  {conversation?.type === 'group' ? 'Groupe' : 'Privé'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="flex-row items-center">
          {userPhone && (
            <Pressable
              onPress={() => {
                Linking.openURL(`tel:${userPhone}`);
              }}
              className="h-9 w-9 items-center justify-center rounded-full bg-background-light/40 dark:bg-background-dark/30 active:opacity-80"
            >
              <Phone size={22} color="#64748B" />
            </Pressable>
          )}

          <Pressable
            onPress={() => setInfoOpen(true)}
            className="h-9 w-9 items-center justify-center rounded-full bg-background-light/40 dark:bg-background-dark/30 active:opacity-80"
          >
            <EllipsisVertical size={22} color="#64748B" />
          </Pressable>
        </View>
      </View>

      {/* Vue du Chat */}
      <ChatView conversationId={id!} />

      {/* Sheet d'informations */}
      <ChatInfoSheet
        visible={infoOpen}
        onClose={() => setInfoOpen(false)}
        conversation={conversation}
        name={chatName}
        currentUserId={user?.id}
        isAdmin={isAdmin}
        onAddMember={conversation.type === 'group' ? () => router.push(`/messaging/new?chatId=${id}` as any) : undefined}
      />
    </SafeAreaView>
  );
}