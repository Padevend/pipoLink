import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react-native';

import { ConversationList } from '@/features/messaging/components/conversation-list';
import { useAuth } from '@/providers/auth-provider';
import { AppLogo } from '@/shared/ui/app-logo';
import { ActionMenu } from '@/shared/ui/action-menu';

export default function HomeScreen() {
  const { user } = useAuth();
  const { t } = useTranslation('chat');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top']}>
      
      {/* Header Style Glassmorphism Épuré */}
      <View className="z-10 flex-row items-center justify-between border-b border-border-light/20 bg-surface-light/75 px-6 py-3.5 dark:border-border-dark/10 dark:bg-surface-dark/75 backdrop-blur-xl ">
        <View className="flex-row items-center gap-3">
          <View className=" opacity-95">
            <AppLogo size="sm" />
          </View>
          <View className="justify-center">
            <Text className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
              {t('messages')}
            </Text>
            
            {/* Tag utilisateur style badge minimaliste */}
            <View className="flex-row mt-0.5">
              <View className="rounded-full bg-text-secondary-light/5 px-2 py-0.5 dark:bg-text-secondary-dark/5 border border-border-light/10 dark:border-border-dark/10">
                <Text className="text-[10px] font-semibold tracking-wide text-text-secondary-light/80 dark:text-text-secondary-dark/80">
                  {user?.username ?? 'PipoLink'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bouton d'action de création de chat */}
        <View className="flex-row items-center">
          <Pressable
            onPress={() => setMenuOpen(true)}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary  shadow-primary/20 active:opacity-75"
          >
            <Plus size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Liste des conversations */}
      <View className="flex-1">
        <ConversationList />
      </View>

      {/* Menu d'actions contextuel */}
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