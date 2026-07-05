import { router } from 'expo-router';
import { Plus, MessageSquare } from 'lucide-react-native';
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
    // Fond technique radical : Blanc pur en light, Zinc noir le plus sombre en dark
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top']}>
      
      {/* Header : Découpe nette, sans fioritures rétro, inspiré des interfaces de dev */}
      <View className="z-10 flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 px-6 py-4">
        
        <View className="flex-row items-center gap-4">
          <AppLogo size="sm" />
          
          <View className="justify-center">
            {/* Titre : Ultra-gras, serré, style industriel */}
            <Text className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
              Messages
            </Text>
            
            {/* Tag Utilisateur : Format Métadonnée / Code avec point Orange Électrique */}
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <View className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <Text className="text-[10px] font-mono tracking-widest text-zinc-400 dark:text-zinc-500">
                {user?.username ?? 'PipoLink'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bouton d'action : Carré technique, focus Orange Électrique puissant */}
        <View className="flex-row items-center">
          <Pressable
            onPress={() => setMenuOpen(true)}
            className="h-10 w-10 items-center justify-center rounded-xl bg-orange-500 dark:bg-orange-600 active:opacity-90 transition-all"
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={3} />
          </Pressable>
        </View>
      </View>

      {/* Zone de Contenu : Continuité parfaite du fond pour éviter l'effet "blocs empilés" */}
      <View className="flex-1 bg-white dark:bg-zinc-950">
        <ConversationList />
      </View>

      {/* Menu d'actions : Structure épurée passée à la modale */}
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
            onPress: () => router.push('/join-group' as any),
          },
        ]}
      />
    </SafeAreaView>
  );
}