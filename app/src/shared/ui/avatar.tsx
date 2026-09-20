import { cn } from '@/shared/utils/cn';
import { Image } from 'expo-image';
import { ShieldCheck, Verified } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { getStaticUri } from '../lib/static';

export interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  fallbackClassName?: string;
  role?: 'admin' | 'staff' | 'student';
}

export function Avatar({
  uri,
  name,
  size = 'md',
  className,
  fallbackClassName,
  role = 'student'
}: AvatarProps): JSX.Element {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const sizes = {
    xs: 24,
    sm: 32,
    md: 44,
    lg: 56,
    xl: 80,
  };

  const dimension = typeof size === 'number' ? size : sizes[size];
  const badgeSize = Math.max(dimension * 0.38, 20);

  return (
    <View className="relative" style={{ width: dimension, height: dimension }}>
      {/* Conteneur principal de l'avatar */}
      <View
        style={{ width: dimension, height: dimension }}
        className={cn('relative items-center justify-center rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-900', className)}
      >
        {uri ? (
          <Image
            source={{ uri: getStaticUri(uri) }}
            contentFit="cover"
            transition={200}
            style={{ width: dimension, height: dimension }}
          />
        ) : (
          <View className={cn('items-center justify-center w-full h-full', fallbackClassName)}>
            <Text
              style={{ fontSize: dimension * 0.38 }}
              className="font-black text-zinc-500 dark:text-zinc-400"
            >
              {initials}
            </Text>
          </View>
        )}
      </View>

      {/* Badge Staff : Certifié Moderne (Noir / Blanc inversé) */}
      {role === 'staff' && (
        <View
          style={{
            width: badgeSize,
            height: badgeSize,
            bottom: -2,
            right: -2,
          }}
          className="absolute items-center justify-center rounded-full bg-blue-500 border-2 border-white dark:border-[#0A0A0A]"
        >
          <Verified 
            size={badgeSize * 0.58}
            color="#FFFFFF" 
            strokeWidth={2.5} 
          />
        </View>
      )}

      {role === 'admin' && (
        <View
          style={{
            width: badgeSize * 1.15,
            height: badgeSize * 1.15,
            bottom: -3,
            right: -3,
          }}
          className="absolute items-center justify-center rounded-full bg-orange-500 border-2 border-white dark:border-[#0A0A0A]"
        >
          <ShieldCheck 
            size={badgeSize * 0.62} 
            color="#FFFFFF" 
            strokeWidth={3} 
          />
        </View>
      )}
    </View>
  );
}