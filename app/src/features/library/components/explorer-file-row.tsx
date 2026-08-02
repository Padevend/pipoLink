import { ChevronRight, DownloadCloud, FileText } from 'lucide-react-native';
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
      className="w-full flex-row items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-900 dark:bg-zinc-900/40 active:bg-zinc-100 dark:active:bg-zinc-900"
    >
      <View className="flex-1 flex-row items-center pr-3">
        
        {/* Conteneur d'icône épuré - Mat */}
        <View className="h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 mr-3">
          <FileText size={15} color="#F97316" />
        </View>
        
        {/* Informations sur le fichier */}
        <View className="flex-1 justify-center">
          <Text
            numberOfLines={1}
            className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            {document.fileName}
          </Text>
          
          <View className="flex-row items-center mt-1 gap-x-2">
            {/* Badge de format technique - Mat Opaque */}
            <View className="rounded bg-zinc-200/60 dark:bg-zinc-800 px-1.5 py-0.5">
              <Text className="font-mono text-[9px] font-bold tracking-wider text-zinc-600 dark:text-zinc-400 uppercase" numberOfLines={1}>
                {document.type || 'DOC'}
              </Text>
            </View>
            
            <Text className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
              {formatBytes(document.fileSize)}
            </Text>
          </View>
        </View>
      </View>

      {/* Flèche d'action minimale */}
      <View className="pl-1 items-center justify-center">
        <ChevronRight size={14} color="#71717A" />
      </View>
    </Pressable>
  );
}

export function RenderDocumentItem({ item, onPress }: { item: Document, onPress: () => void }): JSX.Element {
  return (
    <Pressable 
      onPress={onPress}
      className="w-[155px] h-[115px] m-1 p-3 rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/40 justify-between active:bg-zinc-100 dark:active:bg-zinc-900"
    >
      {/* Ligne Supérieure : Icône Type & Métadonnées */}
      <View className="flex-row items-start justify-between w-full">
        <View className="h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <FileText size={13} color="#F97316" />
        </View>
        
        <View className="items-end flex-1 pl-2">
          <Text className="text-[10px] font-bold text-orange-500 uppercase max-w-full" numberOfLines={1}>
            {item.ue || item.type || 'DOC'}
          </Text>
          <Text className="font-mono text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            {item.fileSize ? formatBytes(item.fileSize) : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Ligne Centrale : Titre fixe épuré (Suppression du ScrollView horizontal horizontal instable) */}
      <View className="w-full my-1">
        <Text 
          className="text-xs font-bold tracking-tight text-zinc-800 dark:text-zinc-100"
          numberOfLines={2}
        >
          {item.title || item.fileName}
        </Text>
      </View>

      {/* Ligne Inférieure : Auteur & Compteur de téléchargements */}
      <View className="flex-row items-center justify-between w-full pt-1.5 border-t border-gray-200 dark:border-zinc-800">
        <Text className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 max-w-[85px]" numberOfLines={1}>
          @{item.uploadedBy?.username || 'Anonyme'}
        </Text>
        
        <View className="flex-row items-center gap-1">
          <DownloadCloud size={11} color="#71717A" />
          <Text className="font-mono text-[9px] font-bold text-zinc-400 dark:text-zinc-500">
            {item.downloadCount || 0}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}