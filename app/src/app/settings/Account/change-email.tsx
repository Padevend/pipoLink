import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangeEmailScreen() {
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
                    <Text className="font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark text-xl">Changer d'email</Text>
                </View>
            </View>

        </SafeAreaView>
    )
}