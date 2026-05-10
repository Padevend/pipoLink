import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export interface HeaderProps {
  title: string;
  rightActions?: ReactNode;
  subtitle?: string;
}

export function Header({ title, subtitle, rightActions }: HeaderProps): JSX.Element {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <View>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">{title}</Text>
        {subtitle ? <Text className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</Text> : null}
      </View>
      {rightActions}
    </View>
  );
}
