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
import { Pressable, ScrollView, Text, View } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { user, refreshUser } = useAuth();
  const { data: isPrimary, refetch: refetchIsPrimary } = useIsPrimaryDevice();

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-zinc-950"
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={false}
            onRefresh={async () => {
              await refreshUser();
              await refetchIsPrimary();
            }}
          />
        )}
      >
        <View className="px-4 py-5">

          {/* TITRE PRINCIPAL MAT */}
          <Text className="mb-5 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Profil
          </Text>

          {/* EN-TÊTE DE PROFIL : Panneau Mat Solide */}
          <Pressable
            onPress={() => router.push("/settings/Account/profile")}
            className="mb-6 items-center rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-900 dark:bg-zinc-900/40 active:bg-zinc-100 dark:active:bg-zinc-900"
          >
            <View className="rounded-full p-0.5 bg-zinc-200 dark:bg-zinc-800">
              <Avatar
                name={user?.profile?.firstname || user?.username || "User"}
                uri={user?.profile?.avatarUrl ?? undefined}
                size="xl"
                className="border border-white dark:border-zinc-950"
              />
            </View>

            <Text className="mt-2.5 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {user?.username}
            </Text>

            <View className="mt-1.5 rounded bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5">
              <Text className="text-[9px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                {user?.role}
              </Text>
            </View>
          </Pressable>

          {/* SECTION : COMPTE */}
          <Text className="mb-2 ml-3 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Compte
          </Text>
          <View className="mb-5 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/20">
            <SettingItem
              icon={User}
              label="Mon compte"
              value="Voir et modifier les détails de votre compte"
              onPress={() => router.push("/settings/Accounts")}
            />
            {isPrimary && (
              <>
                <View className="mx-4 h-[1px] bg-zinc-100 dark:bg-zinc-900" />
                <SettingItem
                  icon={Shield}
                  label="Appareils liés"
                  value="Voir et gérer les appareils connectés à votre compte"
                  onPress={() => router.push("/devices")}
                />
              </>
            )}
            <View className="mx-4 h-[1px] bg-zinc-100 dark:bg-zinc-900" />
            <SettingItem
              icon={CreditCard}
              label="Abonnement"
              value="Forfait et facturation"
              onPress={() => router.push("/settings/subscription")}
            />
          </View>

          {/* SECTION : PRÉFÉRENCES */}
          <Text className="mb-2 ml-3 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Préférences
          </Text>
          <View className="mb-5 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/20">
            <SettingItem
              icon={Palette}
              label="Apparence"
              value="Thème clair, sombre, système"
              onPress={() => router.push("/settings/appearance")}
            />
            <View className="mx-4 h-[1px] bg-zinc-100 dark:bg-zinc-900" />
            <SettingItem
              icon={Globe}
              label="Langue"
              value="Voir et modifier la langue de l'application"
              onPress={() => router.push("/settings/language")}
            />
            <View className="mx-4 h-[1px] bg-zinc-100 dark:bg-zinc-900" />
            <SettingItem
              icon={Bell}
              label="Notifications"
              value="Gérer les notifications"
              onPress={() => router.push("/settings/notifications")}
            />
          </View>

          {/* SECTION : AIDE */}
          <Text className="mb-2 ml-3 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Aide & support
          </Text>
          <View className="mb-6 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/20">
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