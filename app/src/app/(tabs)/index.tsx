import React from 'react';
import { View, Text, SafeAreaView, Pressable } from 'react-native';
import { ConversationList } from '@/features/messaging/components/conversation-list';
import { Search, Plus } from 'lucide-react-native';
import { useAuth } from '@/providers/auth-provider';
import { Avatar } from '@/shared/ui/avatar';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Avatar 
            name={user?.username || 'User'} 
            uri={null} 
            size="sm" 
          />
          <Text className="text-xl font-black text-text-primary-light dark:text-text-primary-dark tracking-tight">
            Messages
          </Text>
        </View>
        
        <View className="flex-row items-center gap-2">
          <Pressable 
            onPress={() => router.push('/search')}
            className="w-10 h-10 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark"
          >
            <Search size={20} color="#6B7280" />
          </Pressable>
          <Pressable 
            onPress={() => router.push('/messaging/new')}
            className="w-10 h-10 items-center justify-center rounded-full bg-primary"
          >
            <Plus size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1">
        <ConversationList />
      </View>
    </SafeAreaView>
  );
}
