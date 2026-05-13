import { useConversations } from '@/entities/conversation/hooks';
import { ConversationItem } from '@/entities/conversation/ui/conversation-item';
import { Skeleton } from '@/shared/ui/skeleton';
import { useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import { FlatList, RefreshControl, Text, View } from 'react-native';

export function ConversationList() {
  const { data: conversations, isLoading, refetch, isRefetching } = useConversations();
  const router = useRouter();

  if (isLoading) {
    return (
      <View className="flex-1 px-4 pt-4 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} className="flex-row items-center gap-4">
            <Skeleton className="w-14 p-10 rounded-full" />
            <View className="flex-1 gap-4">
              <Skeleton className="w-1/3 p-5 h-10" />
              <Skeleton className="w-full p-5 h-10" />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ConversationItem
          conversation={item}
          onPress={() => router.push(`/chat/${item.id}`)}
        />
      )}
      refreshControl={
        <RefreshControl 
          refreshing={isRefetching} 
          onRefresh={refetch} 
          tintColor="#FF7A00"
        />
      }
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center py-20 gap-4">
          <View className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center">
            <MessageSquare size={32} color="#64748b" />
          </View>
          <View className="items-center">
            <Text className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
              No conversations
            </Text>
            <Text className="text-text-secondary-light dark:text-text-secondary-dark text-center px-12">
              Start chatting with your classmates to see them here.
            </Text>
          </View>
        </View>
      }
    />
  );
}
