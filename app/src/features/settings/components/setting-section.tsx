import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export interface SettingSectionProps {
  title: string;
  children: ReactNode;
}

export function SettingSection({ title, children }: SettingSectionProps): JSX.Element {
  return (
    <View className="gap-3">
      <Text className="px-1 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}
