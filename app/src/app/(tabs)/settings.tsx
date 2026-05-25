import { useIsPrimaryDevice } from "@/features/devices/hooks/use-is-primary-device";
import { useAuth } from "@/providers";
import { Avatar } from "@/shared/ui/avatar";
import SettingItem from "@/shared/ui/settings-cards";
import { router } from "expo-router";
import {
  Bell,
  CreditCard,
  Globe,
  HelpCircle,
  Palette,
  Shield,
  User
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { data: isPrimary } = useIsPrimaryDevice();

  const { t } = useTranslation("settings");

  return (
    <SafeAreaView
      className="flex-1 bg-background-light dark:bg-background-dark"
      edges={["top"]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-5 py-6">
          {/* Titre Principal Raffiné */}
          <Text className="mb-6 text-[26px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Profil
          </Text>

          {/* En-tête de Profil Façon Badge Volant */}
          <Pressable
            onPress={() => router.push("/settings/Account/profile")}
            className="mb-8 items-center rounded-3xl border border-border-light/40 bg-surface-light/40 p-5 dark:border-border-dark/20 dark:bg-surface-dark/30 active:scale-[0.99] transition-all"
          >
            <View className="rounded-full p-1 bg-background-light/60 dark:bg-background-dark/40">
              <Avatar
                name={user?.profile?.firstname || user?.username || "User"}
                uri={user?.profile?.avatarUrl ?? undefined}
                size="xl"
                className="border-2 border-white dark:border-slate-900"
              />
            </View>
            <Text className="mt-3 text-[18px] font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
              {user?.username}
            </Text>

            <View className="mt-1.5 rounded-full bg-primary/10 border border-primary/10 px-2.5 py-0.5">
              <Text className="text-[9px] font-bold uppercase tracking-wider text-primary">
                {user?.role}
              </Text>
            </View>
          </Pressable>

          {/* Section : Compte */}
          <Text className="mb-2.5 ml-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
            Compte
          </Text>
          <View className="mb-6 overflow-hidden rounded-2xl border border-border-light/40 bg-surface-light/50 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">
            <SettingItem
              icon={User}
              label="Mon compte"
              value="Voir et modifier les détails de votre compte"
              onPress={() => router.push("/settings/Accounts")}
            />
            {isPrimary && (
              <>
                <View className="mx-4 h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />
                <SettingItem
                  icon={Shield}
                  label="Appareils liés"
                  value="Voir et gérer les appareils connectés à votre compte"
                  onPress={() => router.push("/devices")}
                />
                <View className="mx-4 h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />
              </>
            )}
            <View className="mx-4 h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />
            <SettingItem
              icon={CreditCard}
              label="Abonnement"
              value="Forfait et facturation"
              onPress={() => router.push("/settings/subscription")}
            />
          </View>

          {/* Section : Préférences */}
          <Text className="mb-2.5 ml-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
            Préférences
          </Text>
          <View className="mb-6 overflow-hidden rounded-2xl border border-border-light/40 bg-surface-light/50 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">
            <SettingItem
              icon={Palette}
              label="Apparence"
              value="Thème clair, sombre, système"
              onPress={() => router.push("/settings/appearance")}
            />
            <View className="mx-4 h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />
            <SettingItem
              icon={Globe}
              label="Langue"
              value="Voir et modifier la langue de l'application"
              onPress={() => router.push("/settings/language")}
            />
            <View className="mx-4 h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />
            <SettingItem
              icon={Bell}
              label="Notifications"
              value="Gérer les notifications"
              onPress={() => router.push("/settings/notifications")}
            />
          </View>

          {/* Section : Aide */}
          <Text className="mb-2.5 ml-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
            Aide & support
          </Text>
          <View className="mb-8 overflow-hidden rounded-2xl border border-border-light/40 bg-surface-light/50 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">
            <SettingItem
              icon={HelpCircle}
              label="Centre d'aide"
              value="Obtenir de l'aide et du support"
              onPress={() => router.push("/settings/Help")}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
