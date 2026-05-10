import { Pressable, Text, View } from 'react-native';

import type { Folder } from '@/shared/api/mock-db';

export interface FolderItemProps {
  folder: Folder;
  onPress: () => void;
}

export function FolderItem({ folder, onPress }: FolderItemProps): JSX.Element {
  return (
    <Pressable onPress={onPress} className="flex-1 rounded-3xl bg-white p-4 dark:bg-slate-900">
      <View className="h-12 w-12 rounded-2xl bg-orange-100" />
      <Text className="mt-3 text-base font-semibold text-slate-900 dark:text-white">{folder.name}</Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400">{folder.documentCount} docs</Text>
    </Pressable>
  );
}
