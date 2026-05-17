import { ChevronRight, FileText } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import type { Document } from '@/shared/api/types';
import { formatBytes } from '@/shared/lib/file';

export interface ExplorerFileRowProps {
  document: Document;
  onPress: () => void;
}

export function ExplorerFileRow({ document, onPress }: ExplorerFileRowProps): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      className="mb-2 flex-row items-center rounded-2xl border border-border-light bg-surface-light px-4 py-3.5 dark:border-border-dark dark:bg-surface-dark"
    >
      <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
        <FileText size={22} color="#64748B" />
      </View>
      <View className="flex-1">
        <Text
          numberOfLines={2}
          className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark"
        >
          {document.title}
        </Text>
        <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
          {document.ue ?? document.type} · {formatBytes(document.fileSize)}
        </Text>
      </View>
      <ChevronRight size={20} color="#94A3B8" />
    </Pressable>
  );
}
