import { Download, FileText } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import type { DocumentItem } from '@/shared/api/mock-db';
import { formatBytes } from '@/shared/lib/file';

export interface DocumentItemProps {
  document: DocumentItem;
  onPress: () => void;
  onDownload: () => void;
}

export function DocumentItemCard({ document, onPress, onDownload }: DocumentItemProps): JSX.Element {
  return (
    <Pressable onPress={onPress} className="mb-3 rounded-3xl bg-white p-4 dark:bg-slate-900">
      <View className="flex-row items-center gap-3">
        <View className="rounded-2xl bg-orange-100 p-3">
          <FileText color="#FF7A00" size={20} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-slate-900 dark:text-white">{document.title}</Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">{document.ue} • {formatBytes(document.size)}</Text>
        </View>
        <Pressable onPress={onDownload} className="rounded-full bg-slate-100 p-2 dark:bg-slate-800">
          <Download size={18} color="#475569" />
        </Pressable>
      </View>
    </Pressable>
  );
}
