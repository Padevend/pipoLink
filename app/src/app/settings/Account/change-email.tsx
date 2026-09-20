import { router } from "expo-router";
import { ArrowLeft, Wrench } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChangeEmailScreen() {
    const insets = useSafeAreaInsets();
    return (
        <SafeAreaView
            className="flex-1 bg-white dark:bg-[#0A0A0A]"
            edges={["top", "left", "right"]}
        >
            {/* HEADER : Plat et Solide */}
            <View className="flex-row items-center border-b-2 border-zinc-100 bg-white px-6 py-4 dark:border-[#1A1A1A] dark:bg-[#0A0A0A]">
                <Pressable
                    onPress={() => router.back()}
                    className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] active:opacity-80 transition-opacity"
                >
                    <ArrowLeft size={18} color="#F97316" strokeWidth={2.5} />
                </Pressable>

                <Text className="text-lg font-black tracking-tight text-zinc-950 dark:text-white ml-4" numberOfLines={1}>
                    Changer d'email
                </Text>
            </View>

            {/* Contenu */}
            <View className="flex-1 items-center justify-center px-8" style={{ paddingBottom: insets.bottom + 24 }}>
                <View className="h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-[#1A1A1A] mb-6">
                    <Wrench size={32} color="#F97316" strokeWidth={2.5} />
                </View>
                <Text className="text-base font-black uppercase tracking-widest text-zinc-950 dark:text-white text-center">
                    Fonctionnalité en développement
                </Text>
                <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 text-center mt-2 leading-relaxed">
                    Cette option sera bientôt disponible pour mettre à jour votre adresse email en toute sécurité.
                </Text>
            </View>
        </SafeAreaView>
    );
}