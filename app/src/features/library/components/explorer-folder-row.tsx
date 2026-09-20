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
      // Conteneur Liste/Carte = rounded-2xl, fond plein
      className="w-full flex-row items-center justify-between rounded-2xl bg-zinc-100 p-4 dark:bg-[#1A1A1A] active:opacity-80 transition-all"
    >
      
      <View className="flex-1 flex-row items-center pr-3">
        
        {/* Conteneur Icône = rounded-xl (pas full), fond plein */}
        <View 
          className={cn(
            "h-10 w-10 items-center justify-center rounded-xl mr-4",
            isVoid 
              ? "bg-white dark:bg-[#222222]" 
              : "bg-orange-100 dark:bg-orange-950/40"
          )}
        >
          <Folder size={18} color={isVoid ? "#A1A1AA" : "#F97316"} strokeWidth={2.5} />
        </View>
        
        {/* Corps Textuel */}
        <View className="flex-1 justify-center">
          <Text
            numberOfLines={1}
            className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white"
          >
            {folder.name}
          </Text>
          
          {/* Badge de contenu = rounded-full */}
          <View className="flex-row mt-1.5">
            <View className={cn(
              "rounded-full px-2.5 py-0.5",
              isVoid ? "bg-zinc-200 dark:bg-[#2A2A2A]" : "bg-orange-500"
            )}>
              <Text className={cn(
                "text-[10px] font-black tracking-widest uppercase",
                isVoid
                  ? "text-zinc-500 dark:text-zinc-400"
                  : "text-white"
              )}>
                {subtitle}
              </Text>
            </View>
          </View>
        </View>

      </View>

      {/* Flèche droite bien dessinée */}
      <View className="pl-1 items-center justify-center">
        <ChevronRight size={18} color="#A1A1AA" strokeWidth={2.5} />
      </View>

    </Pressable>
  );
}