import { router } from "expo-router";
import { ArrowLeft, Toolbox } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangeEmailScreen() {
    return (
        <SafeAreaView
            className="flex-1 bg-white dark:bg-zinc-950"
            edges={["top"]}
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
                    Changer d'email
                </Text>
            </View>

            {/* Contenu de la page à intégrer ici */}
            <View className="flex-1 flex items-center justify-center gap-5">
                <View className="flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4 rounded-full">
                    <Toolbox size={30} color="#71717A" />
                </View>
                <Text className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Fonctionnalites en cours de conception
                </Text>
            </View>
        </SafeAreaView>
    );
}