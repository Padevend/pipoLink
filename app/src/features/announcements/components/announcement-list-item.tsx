import { Megaphone } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { ANNOUNCEMENTS_ENTRY_ID } from '@/shared/constants/announcements';
import { cn } from '@/shared/utils/cn';

interface AnnouncementListItemProps {
  preview?: string;
  onPress: () => void;
}

const ORANGE_PRINCIPAL = '#FF6B00';

/** Entrée fixe en tête de liste des conversations (n'est pas un chat). */
export function AnnouncementListItem({ preview, onPress }: AnnouncementListItemProps): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center px-6 py-4 bg-white dark:bg-zinc-950 active:bg-zinc-50 dark:active:bg-zinc-900/50'
      )}
    >
      {/* Conteneur d'icône : Carré technique, sans fond de couleur de remplissage, juste une bordure fine et l'icône orange */}
      <View className="h-11 w-11 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/30">
        <Megaphone size={16} color={ORANGE_PRINCIPAL} />
      </View>

      {/* Zone de texte principale */}
      <View className="ml-4 flex-1 justify-center">
        <View className="flex-row items-center justify-between mb-1">
          
          {/* Titre principal : Noir ou Blanc pur, très gras et serré */}
          <Text className="text-sm font-black tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase">
            Annonces Générales
          </Text>
          
          {/* Indicateur discret : Point orange vif de signalement */}
          <View className="flex-row items-center gap-1">
            <View className="h-2 w-2 rounded-full bg-orange-500" />
            <Text className="text-[10px] font-bold tracking-widest text-orange-500 uppercase">
              Info
            </Text>
          </View>
        </View>

        {/* Aperçu du texte d'information */}
        <Text
          numberOfLines={1}
          className="text-xs font-medium text-zinc-400 dark:text-zinc-500"
        >
          {preview ?? 'Prendre connaissance des dernières actualités de l’établissement'}
        </Text>
      </View>
    </Pressable>
  );
}

export { ANNOUNCEMENTS_ENTRY_ID };