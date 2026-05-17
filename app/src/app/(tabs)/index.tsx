import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react-native';

import { ConversationList } from '@/features/messaging/components/conversation-list';
import { useAuth } from '@/providers/auth-provider';
import { AppLogo } from '@/shared/ui/app-logo';
import { ActionMenu } from '@/shared/ui/action-menu';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation('chat');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-row items-center justify-between px-6 py-4">
        <View className="flex-row items-center gap-3">
          <AppLogo size="sm" />
          <View>
            <Text className="text-xl font-black text-text-primary-light dark:text-text-primary-dark tracking-tight">
              {t('messages')}
            </Text>
            <Text className="text-[10px] font-bold text-text-secondary-light dark:text-text-secondary-dark">
              {user?.username ?? 'PipoLink'}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => router.push('/search')}
            className="h-10 w-10 items-center justify-center rounded-full border border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark"
          >
            <Search size={20} color="#6B7280" />
          </Pressable>
          <Pressable
            onPress={() => setMenuOpen(true)}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary"
          >
            <Plus size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <View className="flex-1">
        <ConversationList />
      </View>

      <ActionMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={[
          {
            id: 'private',
            label: t('newPrivateChat'),
            subtitle: t('searchUsers'),
            onPress: () => router.push('/messaging/new' as any),
          },
          {
            id: 'group',
            label: t('newGroup'),
            subtitle: t('selectMembers'),
            onPress: () => router.push('/messaging/new-group' as any),
          },
        ]}
      />
    </SafeAreaView>
  );
}
