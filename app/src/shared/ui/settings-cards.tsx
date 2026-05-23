import { cn } from "@/shared/utils/cn";
import {
    ChevronRight,
    User
} from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

export default function SettingItem({
    icon: Icon,
    label,
    value,
    onPress,
    showChevron = true,
    destructive = false,
}: {
    icon: typeof User;
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    destructive?: boolean;
}) {
    return (
        (
            <Pressable
                onPress={onPress}
                className="flex-row items-center py-3.5 px-4 active:bg-text-secondary-light/5 dark:active:bg-text-secondary-dark/5 transition-all active:scale-[0.99]"
            >
                {/* Conteneur Icône Épuré */}
                <View
                    className={cn(
                        "mr-4 h-9 w-9 items-center justify-center rounded-xl border",
                        destructive
                            ? "bg-error/10 border-error/10"
                            : "bg-text-secondary-light/5 border-border-light/10 dark:bg-text-secondary-dark/5 dark:border-border-dark/10",
                    )}
                >
                    <Icon size={16} color={destructive ? "#EF4444" : "#64748B"} />
                </View>

                {/* Textes alignés */}
                <View className="flex-1 justify-center pr-2">
                    <Text
                        className={cn(
                            "text-[14px] font-semibold tracking-tight",
                            destructive
                                ? "text-error"
                                : "text-text-primary-light dark:text-text-primary-dark",
                        )}
                    >
                        {label}
                    </Text>
                    {value ? (
                        <Text
                            className="mt-0.5 text-[11px] font-medium text-text-secondary-light/60 dark:text-text-secondary-dark/60"
                            numberOfLines={1}
                        >
                            {value}
                        </Text>
                    ) : null}
                </View>

                {showChevron ? (
                    <View className="opacity-40">
                        <ChevronRight size={16} color="#64748B" />
                    </View>
                ) : null}
            </Pressable>
        )
    )
};