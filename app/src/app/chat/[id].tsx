import React from 'react';
import { View, SafeAreaView, Pressable, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChatView } from '@/features/messaging/components/chat-view';
import { ChevronLeft, Info, Phone, Video } from 'lucide-react-native';
import { useConversations } from '@/entities/conversation/hooks';
import { Avatar } from '@/shared/ui/avatar';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: conversations } = useConversations();
  
  const conversation = conversations?.find(c => c.id === id);
  const name = conversation?.name || conversation?.members[0]?.username || 'Conversation';

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
        <View className="flex-row items-center gap-3">
          <Pressable 
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-100"
          >
            <ChevronLeft size={24} color="#111827" />
          </Pressable>
          
          <View className="flex-row items-center gap-2">
            <Avatar 
              name={name} 
              uri={conversation?.avatarUrl} 
              size="sm" 
            />
            <View>
              <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
                {name}
              </Text>
              <Text className="text-[10px] text-success font-semibold uppercase tracking-wider">
                Online
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-100">
            <Video size={20} color="#6B7280" />
          </Pressable>
          <Pressable className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-100">
            <Info size={20} color="#6B7280" />
          </Pressable>
        </View>
      </View>

      <ChatView conversationId={id!} />
    </SafeAreaView>
  );
}
