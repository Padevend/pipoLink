import { Megaphone } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { ANNOUNCEMENTS_ENTRY_ID } from '@/shared/constants/announcements';

interface AnnouncementListItemProps {
  preview?: string;
  onPress: () => void;
}

const ORANGE_PRINCIPAL = '#F97316';

export function AnnouncementListItem({ preview, onPress }: AnnouncementListItemProps): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center p-4 my-2"
    >
      <View className="h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-[#0A0A0A]">
        <Megaphone size={22} color={ORANGE_PRINCIPAL} strokeWidth={2.5} />
      </View>

      <View className="ml-4 flex-1 justify-center">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-sm font-black tracking-tight text-zinc-950 dark:text-white uppercase">
            Annonces Générales
          </Text>
          
          <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10">
            <View className="h-2 w-2 rounded-full bg-orange-500" />
            <Text className="text-[10px] font-black uppercase tracking-widest text-orange-500">
              Info
            </Text>
          </View>
        </View>

        <Text
          numberOfLines={1}
          className="text-xs font-bold text-zinc-500 dark:text-zinc-400"
        >
          {preview ?? 'Prendre connaissance des dernières actualités de l’établissement'}
        </Text>
      </View>
    </Pressable>
  );
}

export { ANNOUNCEMENTS_ENTRY_ID };
