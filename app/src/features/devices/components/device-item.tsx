import { Laptop, Trash2 } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import type { DeviceModel } from '@/entities/device/model';

export interface DeviceItemProps {
  device: DeviceModel;
  onRemove?: () => void;
}

export function DeviceItem({ device, onRemove }: DeviceItemProps): JSX.Element {
  return (
    <View className="flex-row items-center justify-between p-4 bg-zinc-100 dark:bg-[#1A1A1A]">
      <View className="flex-row items-center flex-1 pr-3">
        {/* Conteneur d'icône (arrondi modéré : rounded-xl, fond plein) */}
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-[#222222] mr-4">
          <Laptop size={18} color="#F97316" strokeWidth={2.5} />
        </View>
        
        {/* Informations de l'appareil */}
        <View className="flex-1 justify-center">
          <Text 
            className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white"
            numberOfLines={1}
          >
            {device.name}
          </Text>
          
          {/* Badge de plateforme technique (rounded-full) */}
          <View className="flex-row mt-1.5">
            <View className="rounded-full bg-zinc-200 dark:bg-[#2A2A2A] px-2.5 py-0.5">
              <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
                {device.platform}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bouton de suppression (Bouton d'action : rounded-full) */}
      {onRemove && !device.isPrimary ? (
        <Pressable 
          onPress={onRemove} 
          hitSlop={10}
          className="h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 active:opacity-80"
        >
          <Trash2 size={16} color="#EF4444" strokeWidth={2.5} />
        </Pressable>
      ) : null}
    </View>
  );
}