import { ConversationList } from '@/features/messaging/components/conversation-list';
import { useAuth } from '@/providers/auth-provider';
import { AppLogo } from '@/shared/ui/app-logo';
import { useRouter } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <AppLogo size="sm" />
          <View>
            <Text className="text-xl font-black text-text-primary-light dark:text-text-primary-dark tracking-tight">
              Messages
            </Text>
            <Text className="text-[10px] font-bold text-text-secondary-light dark:text-text-secondary-dark">
              {user?.username ?? 'PipoLink'}
            </Text>
          </View>
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
