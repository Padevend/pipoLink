import { ChevronRight, DownloadCloud, FileText } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { Document } from '@/shared/api/types';
import { BRAND } from '@/shared/config/brand';
import { formatBytes } from '@/shared/lib/file';

export interface ExplorerFileRowProps {
  document: Document;
  onPress: () => void;
}

export function ExplorerFileRow({ document, onPress }: ExplorerFileRowProps): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      className="w-full flex-row items-center justify-between rounded-xl border border-border-light/40 bg-surface-light/50 p-3.5 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md active:scale-[0.99] transition-all"
    >
      
      <View className="flex-1 flex-row items-center pr-3">
        
        <View 
          className="h-10 w-10 items-center justify-center rounded-lg border border-primary/5 mr-3.5"
          style={{ backgroundColor: `${BRAND.primary}12` }}
        >
          <FileText size={18} color={BRAND.primary} />
        </View>
        
        {/* Métadonnées et Titre */}
        <View className="flex-1 justify-center">
          <Text
            numberOfLines={1}
            className="text-[14px] font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark"
          >
            {document.fileName}
          </Text>
          
          <View className="flex-row items-center mt-1 gap-x-2">
            <View 
              className="rounded-md border px-1.5 py-0.5"
              style={{ backgroundColor: `${BRAND.primary}08`, borderColor: `${BRAND.primary}15` }}
            >
              <Text 
                className="text-[9px] font-bold tracking-wide uppercase" 
                numberOfLines={1}
                style={{ color: BRAND.primary }}
              >
                {document.type || 'DOC'}
              </Text>
            </View>
            
            <Text className="text-[11px] font-medium text-text-secondary-light/50 dark:text-text-secondary-dark/50">
              {formatBytes(document.fileSize)}
            </Text>
          </View>
        </View>

      </View>

      {/* RIGHT: Action Indicator Block */}
      <View className="pl-1 items-center justify-center">
        <ChevronRight size={16} className="text-text-secondary-light/40 dark:text-text-secondary-dark/40" />
      </View>

    </Pressable>
  );
}

export function RenderDocumentItem({ item, onPress }: { item: Document, onPress: () => void }): JSX.Element {
  return (
    <Pressable 
      onPress={onPress}
      className="w-[170px] h-[105px] m-1.5 p-3 rounded-xl border border-border-light/40 bg-surface-light/40 dark:border-border-dark/20 dark:bg-surface-dark/30 backdrop-blur-md justify-between active:scale-[0.98] transition-all"
    >
      {/* Ligne Supérieure : Icône Type & Métadonnées (Taille / UE) */}
      <View className="flex-row items-start justify-between w-full">
        <View 
          className="h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${BRAND.primary}12` }}
        >
          <FileText size={16} color={BRAND.primary} />
        </View>
        
        <View className="items-end">
          <Text className="text-[10px] font-bold text-primary tracking-wide uppercase max-w-[100px]" numberOfLines={1} style={{ color: BRAND.primary }}>
            {item.ue || item.type || 'DOC'}
          </Text>
          <Text className="text-[9px] font-medium text-text-secondary-light/40 dark:text-text-secondary-dark/50 mt-0.5">
            {item.fileSize ? formatBytes(item.fileSize) : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Ligne Centrale : Titre ou FileName avec défilement horizontal si trop long */}
      <View className="w-full my-1">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          bounces={true}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          <Text 
            className="text-[12px] font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark whitespace-nowrap"
            numberOfLines={1}
          >
            {item.title || item.fileName}
          </Text>
        </ScrollView>
      </View>

      {/* Ligne Inférieure : Auteur & Compteur de téléchargements */}
      <View className="flex-row items-center justify-between w-full pt-1 border-t border-border-light/20 dark:border-border-dark/10">
        <Text className="text-[9px] font-medium text-text-secondary-light/60 dark:text-text-secondary-dark/50 max-w-[95px]" numberOfLines={1}>
          par @{item.uploadedBy?.username || 'Anonyme'}
        </Text>
        
        <View className="flex-row items-center gap-0.5">
          <DownloadCloud size={10} className="text-text-secondary-light/40 dark:text-text-secondary-dark/40" />
          <Text className="text-[9px] font-bold text-text-secondary-light/50 dark:text-text-secondary-dark/50">
            {item.downloadCount || 0}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}