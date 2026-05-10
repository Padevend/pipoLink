import { ActivityIndicator, View } from 'react-native';

import { ACCENT } from '@/shared/constants/colors';

export function Loader(): JSX.Element {
  return (
    <View className="items-center justify-center py-6">
      <ActivityIndicator color={ACCENT} size="large" />
    </View>
  );
}
