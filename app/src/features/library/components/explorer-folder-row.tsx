import { ChevronRight, Folder } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import type { LibraryFolder } from '@/shared/api/types';

export interface ExplorerFolderRowProps {
  folder: LibraryFolder;
  onPress: () => void;
}

export function ExplorerFolderRow({ folder, onPress }: ExplorerFolderRowProps): JSX.Element {
  const subtitle =
    folder.documentCount > 0
      ? `${folder.documentCount} document${folder.documentCount > 1 ? 's' : ''}`
      : folder.subfolderCount > 0
        ? `${folder.subfolderCount} dossier${folder.subfolderCount > 1 ? 's' : ''}`
        : 'Dossier vide';

  return (
    <Pressable
      onPress={onPress}
      className="mb-2 flex-row items-center rounded-2xl border border-border-light bg-surface-light px-4 py-3.5 dark:border-border-dark dark:bg-surface-dark"
    >
      <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
        <Folder size={22} color="#D97706" />
      </View>
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className="text-base font-bold text-text-primary-light dark:text-text-primary-dark"
        >
          {folder.name}
        </Text>
        <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={20} color="#94A3B8" />
    </Pressable>
  );
}
