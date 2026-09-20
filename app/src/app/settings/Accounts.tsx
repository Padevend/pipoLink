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
      className="flex-1 bg-white dark:bg-[#0A0A0A]"
      edges={['top', 'left', 'right']}
    >
      {/* HEADER : Néo-banque Plat et Solide */}
      <View className="flex-row items-center border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
        </Pressable>

        <View className="flex-1 ml-4 justify-center">
          <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
            Mon Compte
          </Text>
          <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
            Sécurité & Paramètres
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* SECTION : SÉCURITÉ & INFO */}
        <Text className="mb-3 text-[11px] font-black uppercase tracking-widest text-zinc-500">
          Sécurité & Informations
        </Text>
        <View className="mb-6 rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A] overflow-hidden p-2">
          <SettingItem
            icon={User}
            label="Informations personnelles"
            value="Nom, email, téléphone, bio"
            onPress={() => router.push('/settings/Account/profile')}
          />
          <View className="h-[2px] w-full bg-zinc-200 dark:bg-[#222222]" />
          <SettingItem
            icon={MailPlus}
            label="Changer d'email"
            value="Mettre à jour votre adresse email"
            onPress={() => router.push('/settings/Account/change-email')}
          />
          <View className="h-[2px] w-full bg-zinc-200 dark:bg-[#222222]" />
          <SettingItem
            icon={Key}
            label="Changer de mot de passe"
            value="Mettre à jour votre mot de passe"
            onPress={() => router.push('/settings/Account/change-password')}
          />
        </View>

        {/* SECTION : ACTIONS DE COMPTE */}
        <Text className="mb-3 text-[11px] font-black uppercase tracking-widest text-zinc-500">
          Actions de compte
        </Text>
        <View className="mb-6 rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A] overflow-hidden p-2">
          <SettingItem
            icon={LogOut}
            label="Déconnexion"
            destructive
            showChevron={false}
            onPress={confirmLogout}
          />
          <View className="h-[2px] w-full bg-zinc-200 dark:bg-[#222222]" />
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