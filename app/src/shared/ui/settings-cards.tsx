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
        "flex-row items-center py-3.5 px-4 active:opacity-80 transition-all rounded-2xl",
        destructive 
          ? "active:bg-red-50 dark:active:bg-red-950/20" 
          : "active:bg-zinc-100/50 dark:active:bg-[#1A1A1A]/50"
      )}
    >
      {/* Conteneur Icône : Plat, sans bordure, angles modérés */}
      <View
        className={cn(
          "mr-4 h-10 w-10 items-center justify-center rounded-xl",
          destructive
            ? "bg-red-50 dark:bg-red-900/20"
            : "bg-zinc-100 dark:bg-[#222222]",
        )}
      >
        <Icon 
          size={18} 
          strokeWidth={2.5} 
          color={destructive ? "#EF4444" : "#71717A"} 
        />
      </View>

      {/* Textes : Tailles standards mais graisses affirmées pour la lisibilité */}
      <View className="flex-1 justify-center pr-3">
        <Text
          className={cn(
            "text-sm font-bold tracking-tight",
            destructive
              ? "text-red-500"
              : "text-zinc-950 dark:text-white",
          )}
        >
          {label}
        </Text>
        {value ? (
          <Text
            className="mt-0.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400"
            numberOfLines={1}
          >
            {value}
          </Text>
        ) : null}
      </View>

      {/* Chevron : Plus épais pour coller au design industriel/flat */}
      {showChevron && !destructive ? (
        <ChevronRight size={18} strokeWidth={2.5} color="#A1A1AA" />
      ) : null}
    </Pressable>
  );
}