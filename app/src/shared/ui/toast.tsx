import { Text, View } from 'react-native';

import type { ToastType } from '@/providers';

export interface ToastProps {
  type: ToastType;
  message: string;
}

export function Toast({ type, message }: ToastProps): JSX.Element {
  const backgroundColor =
    type === 'success' ? '#22C55E' : type === 'error' ? '#EF4444' : type === 'warning' ? '#EAB308' : '#FF7A00';

  return (
    <View style={{ backgroundColor }} className="rounded-2xl px-4 py-3">
      <Text className="text-sm font-medium text-white">{message}</Text>
    </View>
  );
}
