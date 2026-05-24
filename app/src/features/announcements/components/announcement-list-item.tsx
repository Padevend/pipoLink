import { Megaphone } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { ANNOUNCEMENTS_ENTRY_ID } from '@/shared/constants/announcements';
import { cn } from '@/shared/utils/cn';

interface AnnouncementListItemProps {
  preview?: string;
  onPress: () => void;
}

/** Entrée fixe en tête de liste des conversations (n'est pas un chat). */
export function AnnouncementListItem({ preview, onPress }: AnnouncementListItemProps): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center px-5 py-4 transition-all active:opacity-90',
        'bg-primary/[0.04] dark:bg-primary/[0.07] active:bg-primary/[0.08]'
      )}
    >
      {/* Conteneur d'icône style Verre Lumineux */}
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary">
        <Megaphone size={22} color="#FFFFFF" className="opacity-95" />
      </View>

      {/* Zone textuelle épurée (sans border-b pour s'aligner sur la FlatList) */}
      <View className="ml-4 flex-1 justify-center">
        <View className="flex-row items-baseline justify-between mb-1">
          <Text className="text-[15px] font-bold tracking-tight text-primary">
            Annonces
          </Text>
          
          {/* Badge Officiel Style Pilule Translucide */}
          <View className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5">
            <Text className="text-[9px] font-bold uppercase tracking-widest text-primary">
              Officiel
            </Text>
          </View>
        </View>

        {/* Aperçu du contenu de l'annonce */}
        <Text
          numberOfLines={1}
          className="text-[13px] leading-4 tracking-wide text-text-secondary-light/80 dark:text-text-secondary-dark/80"
        >
          {preview ?? 'Actualités et informations de l’établissement'}
        </Text>
      </View>
    </Pressable>
  );
}

export { ANNOUNCEMENTS_ENTRY_ID };
