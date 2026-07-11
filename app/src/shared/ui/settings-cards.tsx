import { cn } from "@/shared/utils/cn";
import { ChevronRight, User } from "lucide-react-native";
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
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row items-center py-3 px-4",
        destructive 
          ? "active:bg-red-50 dark:active:bg-red-950/20" 
          : "active:bg-zinc-100 dark:active:bg-zinc-900"
      )}
    >
      {/* Conteneur Icône Mat Opaque */}
      <View
        className={cn(
          "mr-3.5 h-8 w-8 items-center justify-center rounded-lg border",
          destructive
            ? "bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30"
            : "bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-800/60",
        )}
      >
        <Icon size={14} color={destructive ? "#EF4444" : "#71717A"} />
      </View>

      {/* Textes alignés */}
      <View className="flex-1 justify-center pr-2">
        <Text
          className={cn(
            "text-xs font-bold tracking-tight",
            destructive
              ? "text-red-600 dark:text-red-400"
              : "text-zinc-900 dark:text-zinc-50",
          )}
        >
          {label}
        </Text>
        {value ? (
          <Text
            className="mt-0.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500"
            numberOfLines={1}
          >
            {value}
          </Text>
        ) : null}
      </View>

      {/* Icône Chevron de navigation */}
      {showChevron && !destructive ? (
        <ChevronRight size={14} color="#A1A1AA" />
      ) : null}
    </Pressable>
  );
}