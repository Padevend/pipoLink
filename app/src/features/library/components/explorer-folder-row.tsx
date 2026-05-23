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
      className="w-full flex-row items-center justify-between rounded-xl border border-border-light/40 bg-surface-light/50 p-3.5 dark:border-border-dark/20 dark:bg-surface-dark/40 backdrop-blur-md active:scale-[0.99] transition-all"
    >
      
      {/* LEFT: Content Block (Icône + Titre & Badge) */}
      <View className="flex-1 flex-row items-center pr-3">
        
        {/* Wrapper Icône Dossier Ambre Satiné */}
        <View 
          className={cn(
            "h-10 w-10 items-center justify-center rounded-lg border mr-3.5",
            isVoid 
              ? "bg-slate-500/5 border-slate-500/10 dark:bg-slate-500/10" 
              : "bg-amber-500/10 border-amber-500/10 dark:bg-amber-500/15"
          )}
        >
          <Folder size={18} color={isVoid ? "#94A3B8" : "#D97706"} />
        </View>
        
        {/* Corps Textuel */}
        <View className="flex-1 justify-center">
          <Text
            numberOfLines={1}
            className="text-[14px] font-semibold tracking-tight text-text-primary-light dark:text-text-primary-dark"
          >
            {folder.name}
          </Text>
          
          {/* Badge de contenu style minimaliste */}
          <View className="flex-row mt-1">
            <View className={cn(
              "rounded-md border px-1.5 py-0.5",
              isVoid
                ? "bg-text-secondary-light/5 border-border-light/20 dark:bg-text-secondary-dark/5 dark:border-border-dark/10"
                : "bg-amber-500/5 border-amber-500/15 dark:bg-amber-500/10"
            )}>
              <Text className={cn(
                "text-[9px] font-bold tracking-wide uppercase",
                isVoid
                  ? "text-text-secondary-light/50 dark:text-text-secondary-dark/50"
                  : "text-amber-700 dark:text-amber-500"
              )}>
                {subtitle}
              </Text>
            </View>
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