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
                router.replace('/updates');
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
            className="flex-1 bg-background-light dark:bg-background-dark"
            edges={["top"]}
        >
            {/* Header Chat épuré */}
            <View className="z-10 flex-row items-center justify-left border-b border-border-light/30 bg-surface-light/75 px-4 py-3 dark:border-border-dark/20 dark:bg-surface-dark/75 backdrop-blur-xl ">
                <Pressable
                    onPress={() => router.back()}
                    className="flex-row items-center gap-1 h-9 pl-2 pr-3 active:opacity-80"
                >
                    <ArrowLeft size={20} color="#64748B" />
                </Pressable>

                <View className="flex-row items-center">
                    <Text className="font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark text-xl">Aide & Support</Text>
                </View>
            </View>

            <View className="px-4 py-6">
                <View className="mb-6 overflow-hidden backdrop-blur-md py-6">
                    <SettingItem
                        icon={MessageCircle}
                        label="Feedback & Suggestions"
                        value="Votre avis compte ! Envoyez-nous vos commentaires et suggestions."
                        onPress={()=>router.push("/settings/abouts/comment")}
                    />
                    <SettingItem
                        icon={Info}
                        label="À propos"
                        value="Informations sur l'application"
                        onPress={() => router.push("/settings/abouts/about")}
                    />
                    <SettingItem
                        icon={RefreshCw}
                        label="Vérifier la mise à jour"
                        value="Rechercher une nouvelle version"
                        onPress={handleCheckUpdate}
                    />
                </View>
            </View>

            {/* Loading Modal */}
            <Modal transparent visible={isChecking} animationType="fade">
                <View className="flex-1 items-center justify-center bg-black/50">
                    <View className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl items-center flex-row gap-4 shadow-lg">
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text className="text-text-primary-light dark:text-text-primary-dark font-medium text-lg">Recherche en cours...</Text>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}