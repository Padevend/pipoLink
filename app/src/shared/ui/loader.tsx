import { ActivityIndicator, View } from 'react-native';

import { ACCENT } from '@/shared/constants/colors';

export function Loader({size = "large"}: { size?: 'small' | 'large' }): JSX.Element {
  return (
    <View className="flex-1 items-center justify-center py-6">
      <ActivityIndicator color={ACCENT} size={size} />
    </View>
  );
}
