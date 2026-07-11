import { ChevronRight, Folder } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import type { LibraryFolder } from '@/shared/api/types';
import { cn } from '@/shared/utils/cn';

export interface ExplorerFolderRowProps {
  folder: LibraryFolder;
  onPress: () => void;
}

export function ExplorerFolderRow({ folder, onPress }: ExplorerFolderRowProps): JSX.Element {
  const isVoid = folder.documentCount === 0 && folder.subfolderCount === 0;

  const subtitle =
    folder.documentCount > 0
      ? `${folder.documentCount} document${folder.documentCount > 1 ? 's' : ''}`
      : folder.subfolderCount > 0
        ? `${folder.subfolderCount} dossier${folder.subfolderCount > 1 ? 's' : ''}`
        : 'Dossier vide';

  return (
    <Pressable
      onPress={onPress}
      className="w-full flex-row items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-900 dark:bg-zinc-900/40 active:bg-zinc-100 dark:active:bg-zinc-900"
    >
      
      {/* GAUCHE: Bloc de Contenu (Icône + Titre & Badge) */}
      <View className="flex-1 flex-row items-center pr-3">
        
        {/* Wrapper Icône Dossier Mat Opaque */}
        <View 
          className={cn(
            "h-9 w-9 items-center justify-center rounded-lg border mr-3",
            isVoid 
              ? "bg-zinc-200/50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700" 
              : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40"
          )}
        >
          <Folder size={15} color={isVoid ? "#71717A" : "#D97706"} />
        </View>
        
        {/* Corps Textuel */}
        <View className="flex-1 justify-center">
          <Text
            numberOfLines={1}
            className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            {folder.name}
          </Text>
          
          {/* Badge de contenu Mat Opaque */}
          <View className="flex-row mt-1">
            <View className={cn(
              "rounded bg-zinc-200/60 dark:bg-zinc-800 px-1.5 py-0.5",
              !isVoid && "bg-amber-100/70 dark:bg-amber-950/40"
            )}>
              <Text className={cn(
                "text-[9px] font-bold tracking-wider uppercase",
                isVoid
                  ? "text-zinc-500 dark:text-zinc-400"
                  : "text-amber-700 dark:text-amber-400"
              )}>
                {subtitle}
              </Text>
            </View>
          </View>
        </View>

      </View>

      {/* DROITE: Flèche d'Action Épurée */}
      <View className="pl-1 items-center justify-center">
        <ChevronRight size={14} color="#71717A" />
      </View>

    </Pressable>
  );
}