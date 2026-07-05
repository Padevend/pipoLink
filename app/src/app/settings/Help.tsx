import { UpdateManager } from "@/processes/update-manager";
import SettingItem from "@/shared/ui/settings-cards";
import { router } from "expo-router";
import { ArrowLeft, Info, MessageCircle, RefreshCw } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HelpsAndCommentScreen() {
    const { t } = useTranslation("settings");
    const [isChecking, setIsChecking] = useState(false);

    const handleCheckUpdate = async () => {
        try {
            setIsChecking(true);
            const updateData = await UpdateManager.checkAndHandleUpdates();
            
            if (updateData) {
                router.replace('/updates/changelog');
            } else {
                Alert.alert("Mise à jour", "Votre application est déjà à jour.");
            }
        } catch (error) {
            Alert.alert("Erreur", "Impossible de vérifier les mises à jour.");
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <SafeAreaView
            className="flex-1 bg-white dark:bg-zinc-950"
            edges={["top"]}
        >
            {/* HEADER : Panneau Mat Solide */}
            <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-900 dark:bg-zinc-950">
                <Pressable
                    onPress={() => router.back()}
                    className="h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
                >
                    <ArrowLeft size={14} color="#71717A" />
                </Pressable>

                <Text className="flex-1 ml-3 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Aide & Support
                </Text>
            </View>

            {/* CONTENU : Liste de paramètres opaque mate */}
            <View className="flex-1 px-4 py-5">
                <View className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950">
                    <SettingItem
                        icon={MessageCircle}
                        label="Feedback & Suggestions"
                        value="Votre avis compte ! Envoyez-nous vos commentaires."
                        onPress={() => router.push("/settings/abouts/comment")}
                    />
                    <View className="mx-4 h-[1px] bg-zinc-100 dark:bg-zinc-900" />
                    <SettingItem
                        icon={Info}
                        label="À propos"
                        value="Informations sur l'application"
                        onPress={() => router.push("/settings/abouts/about")}
                    />
                    <View className="mx-4 h-[1px] bg-zinc-100 dark:bg-zinc-900" />
                    <SettingItem
                        icon={RefreshCw}
                        label="Vérifier la mise à jour"
                        value="Rechercher une nouvelle version"
                        onPress={handleCheckUpdate}
                    />
                </View>
            </View>

            {/* LOADER OVERLAY : Mat et sans ombre portée */}
            <Modal transparent visible={isChecking} animationType="fade">
                <View className="flex-1 items-center justify-center bg-black/50">
                    <View className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex-row items-center gap-x-3.5 max-w-[80%]">
                        <ActivityIndicator size="small" color="#F97316" />
                        <Text className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Recherche en cours...
                        </Text>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}