import { useAuth } from "@/providers";
import SettingItem from "@/shared/ui/settings-cards";
import { router } from "expo-router";
import { ChevronLeft, Key, LogOut, MailPlus, Trash, User } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountsSettingsScreen() {
    const { logout } = useAuth();
    const { t } = useTranslation("settings");

    const handleLogout = async () => {
        await logout();
        router.replace("/auth/login");
    };

    const handleDeleteAccount = async () => {
        return null;
    }

    return (
        <SafeAreaView
            className="flex-1 bg-background-light dark:bg-background-dark"
            edges={["top"]}
        >
            {/* Header Chat épuré */}
            <View className="z-10 flex-row items-center justify-left border-b border-border-light/30 bg-surface-light/75 px-4 py-3 dark:border-border-dark/20 dark:bg-surface-dark/75 backdrop-blur-xl ">
                <Pressable
                    onPress={() => router.back()}
                    className="flex-row items-center gap-1 h-9 rounded-full bg-background-light/40 pl-2 pr-3 dark:bg-background-dark/30 active:opacity-80"
                >
                    <ChevronLeft size={24} color="#64748B" />
                </Pressable>

                <View className="flex-row items-center">
                    <Text className="font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark text-xl">{t("accountManager")}</Text>
                </View>
            </View>

            <View className="px-4 py-6">
                <View className="mb-6 overflow-hidden backdrop-blur-md py-6">
                    <SettingItem
                        icon={User}
                        label={t("personalInfo")}
                        value={t("personalInfoDesc")}
                        onPress={() => router.push("/settings/Account/profile")}
                    />

                    <SettingItem
                        icon={MailPlus}
                        label={t("changeEmail")}
                        value={t("changeEmailDesc")}
                        onPress={() => router.push("/settings/Account/change-email")}
                    />

                    <SettingItem
                        icon={Key}
                        label={t("changePassword")}
                        value={t("changePasswordDesc")}
                        onPress={() => router.push("/settings/Account/change-password")}
                    />
                </View>


                {/* Section : Action de compte*/}
                <Text className="mb-2.5 ml-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light/60 dark:text-text-secondary-dark/60">
                    {t("actions")}
                </Text>
                <View className="mb-8 overflow-hidden rounded-2xl border border-border-light/40 bg-surface-light/50 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md">
                    <SettingItem
                        icon={LogOut}
                        label={t("logout")}
                        destructive
                        showChevron={false}
                        onPress={() => void handleLogout()}
                    />
                    <View className="mx-4 h-[0.5px] bg-border-light/10 dark:bg-border-dark/5" />
                    <SettingItem
                        icon={Trash}
                        label={t("delete")}
                        destructive
                        showChevron={false}
                        onPress={() => void handleDeleteAccount()}
                    />
                </View>
            </View>

        </SafeAreaView>
    )
}