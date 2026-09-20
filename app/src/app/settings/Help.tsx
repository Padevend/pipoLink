import { UpdateManager } from "@/processes/update-manager";
import SettingItem from "@/shared/ui/settings-cards";
import { router } from "expo-router";
import { ArrowLeft, Info, MessageCircle, RefreshCw } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function HelpsAndCommentScreen() {
    const { t } = useTranslation("settings");
    const [isChecking, setIsChecking] = useState(false);
    const insets = useSafeAreaInsets();

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
            className="flex-1 bg-white dark:bg-[#0A0A0A]"
            edges={["top", "left", "right"]}
        >
            {/* HEADER : Néo-banque, Plat et Solide */}
            <View className="flex-row items-center border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
                <Pressable
                    onPress={() => router.back()}
                    className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
                >
                    <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
                </Pressable>

                <View className="flex-1 ml-4 justify-center">
                    <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white" numberOfLines={1}>
                        Aide & Support
                    </Text>
                    <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-0.5">
                        Assistance & Infos
                    </Text>
                </View>
            </View>

            {/* CONTENU : Liste de paramètres (Arrondis 2xl, fond plein) */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: insets.bottom + 32 }}
                showsVerticalScrollIndicator={false}
            >
                <Text className="mb-3 text-[11px] font-black uppercase tracking-widest text-zinc-500">
                    Support & À propos
                </Text>
                <View className="overflow-hidden rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]">
                    <SettingItem
                        icon={MessageCircle}
                        label="Feedback & Suggestions"
                        value="Votre avis compte ! Envoyez-nous vos commentaires."
                        onPress={() => router.push("/settings/abouts/comment")}
                    />
                    <View className="h-[1px] w-full bg-zinc-200 dark:bg-[#222222]" />
                    <SettingItem
                        icon={Info}
                        label="À propos"
                        value="Informations sur l'application"
                        onPress={() => router.push("/settings/abouts/about")}
                    />
                    <View className="h-[1px] w-full bg-zinc-200 dark:bg-[#222222]" />
                    <SettingItem
                        icon={RefreshCw}
                        label="Vérifier la mise à jour"
                        value="Rechercher une nouvelle version"
                        onPress={handleCheckUpdate}
                    />
                </View>
            </ScrollView>

            {/* LOADER OVERLAY (Arrondis 2xl, fond plein) */}
            <Modal statusBarTranslucent transparent visible={isChecking} animationType="fade">
                <View className="flex-1 items-center justify-center bg-black/60 p-6">
                    <View className="p-6 bg-white dark:bg-[#1A1A1A] rounded-2xl flex-row items-center gap-x-4 max-w-xs border-2 border-zinc-100 dark:border-zinc-800">
                        <ActivityIndicator size="small" color="#F97316" />
                        <Text className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white">
                            Recherche en cours...
                        </Text>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}