import { ChevronRight, DownloadCloud, FileText } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import type { Document } from '@/shared/api/types';
import { displayFileName } from '@/shared/lib/display-file-name';
import { formatBytes } from '@/shared/lib/file';

export interface ExplorerFileRowProps {
  document: Document;
  onPress: () => void;
}

export function ExplorerFileRow({ document, onPress }: ExplorerFileRowProps): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      className="w-full flex-row items-center justify-between rounded-2xl bg-zinc-100 p-4 dark:bg-[#1A1A1A] active:opacity-80 transition-all"
    >
      <View className="flex-1 flex-row items-center pr-3">
        
        {/* Conteneur d'icône : Carré adouci, fond plein */}
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-[#222222] mr-4">
          <FileText size={18} color="#F97316" strokeWidth={2.5} />
        </View>
        
        {/* Informations sur le fichier */}
        <View className="flex-1 justify-center">
          <Text
            numberOfLines={1}
            className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white"
          >
            {displayFileName(document.fileName)}
          </Text>
          
          <View className="flex-row items-center mt-1.5 gap-x-2.5">
            {/* Badge de format technique - Pilule pleine */}
            <View className="rounded-full bg-zinc-200 dark:bg-[#2A2A2A] px-2 py-0.5">
              <Text className="text-[10px] font-black tracking-widest text-zinc-600 dark:text-zinc-300 uppercase" numberOfLines={1}>
                {document.type || 'DOC'}
              </Text>
            </View>
            
            <Text className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {formatBytes(document.fileSize)}
            </Text>
            
            {document.recommendationReason ? (
              <Text numberOfLines={1} className="flex-1 text-[10px] font-black tracking-widest text-orange-500 uppercase ml-1">
                • {document.recommendationReason}
              </Text> 
            ) : null}
          </View>
        </View>
      </View>

      {/* Flèche d'action assumée */}
      <View className="pl-1 items-center justify-center">
        <ChevronRight size={18} color="#A1A1AA" strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

export function RenderDocumentItem({ item, onPress }: { item: Document, onPress: () => void }): JSX.Element {
  return (
    <Pressable 
      onPress={onPress}
      className="w-[160px] mr-3 p-4 rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A] justify-between active:opacity-80"
    >
      {/* Ligne Supérieure : Icône Type & Métadonnées */}
      <View className="flex-row items-start justify-between w-full">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-[#222222]">
          <FileText size={18} color="#F97316" strokeWidth={2.5} />
        </View>
        
        <View className="items-end flex-1 pl-2">
          <Text className="text-[10px] font-black text-orange-500 uppercase tracking-widest max-w-full" numberOfLines={1}>
            {item.ue || item.type || 'DOC'}
          </Text>
          <Text className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
            {item.fileSize ? formatBytes(item.fileSize) : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Ligne Centrale : Titre clair et structuré */}
      <View className="w-full mt-4 mb-4">
        <Text 
          className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white leading-tight"
          numberOfLines={2}
        >
          {item.title || displayFileName(item.fileName)}
        </Text>
      </View>

      {/* Ligne Inférieure : Auteur & Compteur séparés par une ligne franche */}
      <View className="flex-row items-center justify-between w-full pt-3 border-t-2 border-zinc-200 dark:border-[#222222]">
        <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider max-w-[80px]" numberOfLines={1}>
          @{item.uploadedBy?.username || 'Anonyme'}
        </Text>
        
        <View className="flex-row items-center gap-1.5">
          <DownloadCloud size={12} color="#A1A1AA" strokeWidth={2.5} />
          <Text className="text-[10px] font-black text-zinc-500 tracking-widest">
            {item.downloadCount || 0}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}