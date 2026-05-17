import { Pressable, Text, View } from 'react-native';
import { Megaphone } from 'lucide-react-native';

import { ANNOUNCEMENTS_ENTRY_ID } from '@/shared/constants/announcements';

interface AnnouncementListItemProps {
  preview?: string;
  onPress: () => void;
}

/** Entrée fixe en tête de liste des conversations (n'est pas un chat). */
export function AnnouncementListItem({ preview, onPress }: AnnouncementListItemProps): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center border-b border-primary/20 bg-primary/5 px-4 py-3 active:bg-primary/10 dark:bg-primary/10"
    >
      <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
        <Megaphone size={26} color="#FFFFFF" />
      </View>
      <View className="ml-4 flex-1 pb-1">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-base font-black text-primary">Annonces</Text>
          <Text className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
            Officiel
          </Text>
        </View>
        <Text
          numberOfLines={1}
          className="text-sm text-text-secondary-light dark:text-text-secondary-dark"
        >
          {preview ?? 'Actualités et informations de l’établissement'}
        </Text>
      </View>
    </Pressable>
  );
}

export { ANNOUNCEMENTS_ENTRY_ID };
