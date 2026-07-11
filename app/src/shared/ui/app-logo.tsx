import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { BRAND } from '@/shared/config/brand';
import { cn } from '@/shared/utils/cn';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

const SIZES = { sm: 40, md: 56, lg: 80 } as const;

export function AppLogo({ size = 'md', showWordmark = false, className }: AppLogoProps): JSX.Element {
  const dim = SIZES[size];

  return (
    <View className={cn('items-center', className)}>
      <Image
        source={BRAND.logoUri}
        style={{ width: dim, height: dim, borderRadius: dim * 0.22 }}
        contentFit="cover"
        accessibilityLabel="PipoLink"
      />
      {showWordmark ? (
        <Text className="mt-2 text-lg font-black tracking-tight">
          <Text style={{ color: BRAND.primary }}>Pipo</Text>
          <Text style={{ color: BRAND.secondary }}>link</Text>
        </Text>
      ) : null}
    </View>
  );
}
