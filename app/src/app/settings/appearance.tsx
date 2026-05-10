import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';
import { Header } from '@/shared/ui/header';

export default function AppearanceScreen(): JSX.Element {
  const { mode, setMode } = useTheme();

  return (
    <View className="flex-1 bg-slate-50 px-4 py-6 dark:bg-slate-950">
      <Header title="Apparence" subtitle="Thème & langue" />
      <View className="gap-3">
        {(['light', 'dark', 'system'] as const).map((item) => (
          <Pressable key={item} onPress={() => setMode(item)} className="rounded-2xl bg-white px-4 py-4 dark:bg-slate-900">
            <Text className="text-slate-900 dark:text-white">{item} {mode === item ? '• actif' : ''}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
