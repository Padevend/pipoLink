import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

export interface SettingRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
}

export function SettingRow({ label, value, onPress }: SettingRowProps): JSX.Element {
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-4 dark:bg-slate-900">
      <Text className="text-base text-slate-900 dark:text-white">{label}</Text>
      <View className="flex-row items-center gap-2">
        {value ? <Text className="text-sm text-slate-500 dark:text-slate-400">{value}</Text> : null}
        <ChevronRight size={16} color="#94A3B8" />
      </View>
    </Pressable>
  );
}
