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
  const { refetch: refetchIsPrimary } = useIsPrimaryDevice();

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-[#0A0A0A]"
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={(
          <RefreshControl
            refreshing={false}
            onRefresh={async () => {
              await refreshUser();
              await refetchIsPrimary();
            }}
            tintColor="#F97316"
          />
        )}
      >
        <View className="px-6 py-6">

          {/* TITRE PRINCIPAL */}
          <Text className="text-3xl font-black tracking-tighter text-zinc-950 dark:text-white mb-8">
            Paramètres
          </Text>

          {/* EN-TÊTE DE PROFIL : Panneau Néo-Banque */}
          <Pressable
            onPress={() => router.push("/settings/Account/profile")}
            className="mb-8 items-center p-8 rounded-[40px] bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
          >
            <View className="p-1 rounded-full bg-white dark:bg-[#0A0A0A]">
              <Avatar
                name={user?.profile?.firstname || user?.username || "User"}
                uri={user?.profile?.avatarUrl ?? undefined}
                size="xl"
                role={user?.role}
              />
            </View>

            <Text className="mt-4 text-xl font-black tracking-tight text-zinc-950 dark:text-white">
              {user?.username}
            </Text>

            <Text className="mt-1 text-sm font-semibold tracking-tight text-zinc-400">
              {user?.email}
            </Text>

            <View className="flex items-center flex-row">
              <View className="mt-3 px-4 py-1.5 rounded-full bg-orange-500">
                <Text className="text-[10px] font-black uppercase tracking-widest text-white">
                  {user?.role || "Étudiant"}
                </Text>
              </View>

              <View className="mt-3 px-4 py-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 ms-3">
                <Text className="text-[10px] font-black uppercase tracking-widest dark:text-white">
                  {user?.subscription?.plan || "Free"}
                </Text>
              </View>
            </View>
          </Pressable>

          {/* SECTION : COMPTE */}
          <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-3 ml-4">
            Compte
          </Text>
          <View className="mb-8 rounded-[32px] bg-zinc-100 dark:bg-[#1A1A1A] p-2 gap-y-1">
            <SettingItem
              icon={User}
              label="Mon compte"
              value="Voir et modifier les détails de votre compte"
              onPress={() => router.push("/settings/Accounts")}
            />
            <View className="h-[1px] bg-zinc-200 dark:bg-[#2A2A2A] mx-4" />
            <SettingItem
              icon={Shield}
              label="Appareils liés"
              value="Voir et gérer les appareils connectés à votre compte"
              onPress={() => router.push("/devices")}
            />
            <View className="h-[1px] bg-zinc-200 dark:bg-[#2A2A2A] mx-4" />
            <SettingItem
              icon={CreditCard}
              label="Abonnement"
              value="Forfait et facturation"
              onPress={() => router.push("/settings/subscription")}
            />
          </View>

          {/* SECTION : PRÉFÉRENCES */}
          <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-3 ml-4">
            Préférences
          </Text>
          <View className="mb-8 rounded-[32px] bg-zinc-100 dark:bg-[#1A1A1A] p-2 gap-y-1">
            <SettingItem
              icon={Palette}
              label="Apparence"
              value="Thème clair, sombre, système"
              onPress={() => router.push("/settings/appearance")}
            />
            <View className="h-[1px] bg-zinc-200 dark:bg-[#2A2A2A] mx-4" />
            <SettingItem
              icon={Globe}
              label="Langue"
              value="Voir et modifier la langue de l'application"
              onPress={() => router.push("/settings/language")}
            />
            <View className="h-[1px] bg-zinc-200 dark:bg-[#2A2A2A] mx-4" />
            <SettingItem
              icon={Bell}
              label="Notifications"
              value="Gérer les notifications"
              onPress={() => router.push("/settings/notifications")}
            />
          </View>

          {/* SECTION : AIDE */}
          <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-3 ml-4">
            Aide & support
          </Text>
          <View className="mb-8 rounded-[32px] bg-zinc-100 dark:bg-[#1A1A1A] p-2">
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