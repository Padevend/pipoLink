import { useLogout } from '@/features/auth/model/use-logout';
import SettingItem from '@/shared/ui/settings-cards';
import { router } from 'expo-router';
import { ArrowLeft, Key, LogOut, MailPlus, Trash, User } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountsSettingsScreen() {
  const { confirmLogout } = useLogout();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-zinc-950"
      edges={['top', 'left', 'right']}
    >
      {/* HEADER : Panneau Mat Solide */}
      <View className="flex-row items-center gap-2 border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
        <Pressable
          onPress={() => router.back()}
          className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <ArrowLeft size={14} color="#71717A" />
        </Pressable>

        <Text className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Mon Compte
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* SECTION : SÉCURITÉ & INFO (Conteneur Mat Structuré) */}
        <Text className="mb-2 ml-3 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Sécurité & Informations
        </Text>
        <View className="mb-5 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/20">
          <SettingItem
            icon={User}
            label="Informations personnelles"
            value="Nom, email, téléphone, bio"
            onPress={() => router.push('/settings/Account/profile')}
          />
          <View className="mx-4 h-[1px] bg-zinc-100 dark:bg-zinc-900" />
          <SettingItem
            icon={MailPlus}
            label="Changer d'email"
            value="Mettre à jour votre adresse email"
            onPress={() => router.push('/settings/Account/change-email')}
          />
          <View className="mx-4 h-[1px] bg-zinc-100 dark:bg-zinc-900" />
          <SettingItem
            icon={Key}
            label="Changer de mot de passe"
            value="Mettre à jour votre mot de passe"
            onPress={() => router.push('/settings/Account/change-password')}
          />
        </View>

        {/* SECTION : ACTIONS DE COMPTE */}
        <Text className="mb-2 ml-3 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Actions de compte
        </Text>
        <View className="mb-6 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/20">
          <SettingItem
            icon={LogOut}
            label="Déconnexion"
            destructive
            showChevron={false}
            onPress={confirmLogout}
          />
          <View className="mx-4 h-[1px] bg-zinc-100 dark:bg-zinc-900" />
          <SettingItem
            icon={Trash}
            label="Supprimer mon compte"
            destructive
            showChevron={false}
            onPress={() => router.push('/settings/Account/account-delete')}
          />
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}