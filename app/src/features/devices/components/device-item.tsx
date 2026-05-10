import { Trash2 } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import type { DeviceModel } from '@/entities/device/model';

export interface DeviceItemProps {
  device: DeviceModel;
  onRemove?: () => void;
}

export function DeviceItem({ device, onRemove }: DeviceItemProps): JSX.Element {
  return (
    <View className="mb-3 rounded-3xl bg-white p-4 dark:bg-slate-900">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-base font-semibold text-slate-900 dark:text-white">{device.name}</Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">{device.platform.toUpperCase()}</Text>
        </View>
        {onRemove && !device.isPrimary ? (
          <Pressable onPress={onRemove} className="rounded-full bg-red-50 p-2 dark:bg-red-500/10">
            <Trash2 size={18} color="#EF4444" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
