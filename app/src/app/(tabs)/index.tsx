import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConversationList } from '@/features/messaging/components/conversation-list';
import { useAuth } from '@/providers/auth-provider';
import { ActionMenu } from '@/shared/ui/action-menu';
import { AppLogo } from '@/shared/ui/app-logo';

export default function HomeScreen() {
  const { user } = useAuth();
  const { t } = useTranslation('chat');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0A0A0A]" edges={['top']}>
      
      {/* Header : Style Néo-banque massif et épuré */}
      <View className="z-10 flex-row items-center justify-between bg-white dark:bg-[#0A0A0A] px-6 py-4">
        <View className="flex-row items-center gap-4">
          <AppLogo size="sm" />
          
          <View className="justify-center">
            <Text className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white leading-none">
              Messages
            </Text>
            
            <View className="flex-row items-center gap-2 mt-1.5">
              <View className="h-2 w-2 rounded-full bg-orange-500" />
              <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {user?.username ?? 'PipoLink'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bouton d'action géométrique ultra-arrondi */}
        <Pressable
          onPress={() => setMenuOpen(true)}
          className="h-12 w-12 items-center justify-center rounded-full bg-orange-500 active:opacity-80 transition-opacity"
        >
          <Plus size={22} color="#FFFFFF" strokeWidth={3} />
        </Pressable>
      </View>

      <View className="flex-1 bg-white dark:bg-[#0A0A0A]">
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
          {
            id: 'invite_link',
            label: "Utiliser un lien d'invitation",
            subtitle: "Rejoindre un groupe avec un lien ou un jeton",
            onPress: () => router.push('/group/join-group'),
          },
        ]}
      />
    </SafeAreaView>
  );
}