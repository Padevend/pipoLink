import { Text, View } from "react-native";

export default function InfoRow({
    Icon,
    title,
    value,
}: {
    Icon: React.ComponentType<{ size: number; color: string }>;
    title: string;
    value: string | null;
}) {
    return (
        <View className="p-4 flex-row items-center gap-x-3.5">
            <View className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-zinc-800 items-center justify-center">
                <Icon size={16} color="#64748B" />
            </View>
            <View className="flex-1">
                <Text className="text-[10px] font-bold uppercase tracking-wide text-neutral-400 dark:text-zinc-500">{title}</Text>
                <Text className="text-[13.5px] font-semibold text-neutral-800 dark:text-zinc-200 mt-0.5">{value}</Text>
            </View>
        </View>
    )
}