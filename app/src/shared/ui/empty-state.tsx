import { Text, View } from 'react-native';

import { Button } from './button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps): JSX.Element {
  return (
    <View className="items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
      <Text className="text-lg font-semibold text-slate-900 dark:text-white">{title}</Text>
      <Text className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">{description}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}
