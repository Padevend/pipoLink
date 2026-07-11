import { cn } from '@/shared/utils/cn';
import { Image } from 'expo-image';
import { BadgeCheck, CheckCheck } from 'lucide-react-native'; // Import du double check
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

  // Ratio de base pour les badges
  const badgeSize = dimension * 0.38;

  return (
    <View className="relative" style={{ width: dimension, height: dimension }}>
      {/* --- Conteneur de l'Avatar --- */}
      <View
        style={{ width: dimension, height: dimension }}
        className={cn('relative items-center justify-center rounded-full overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800', className)}
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
              style={{ fontSize: dimension * 0.4 }}
              className="font-medium text-gray-500 dark:text-gray-400"
            >
              {initials}
            </Text>
          </View>
        )}
      </View>

      {/* --- SECTION BADGES --- */}

      {/* 1. Badge Staff (Vérifié Standard) */}
      {role === 'staff' && (
        <View
          style={{
            width: badgeSize * 1.0,
            height: badgeSize * 1.0,
            bottom: -dimension * 0.03,
            right: -dimension * 0.03,
          }}
          className="absolute items-center justify-center rounded-full bg-white dark:bg-black"
        >
          <BadgeCheck size={badgeSize * 0.85} color="#0084ff" strokeWidth={2.5} />
        </View>
      )}

      {/* 2. Badge Admin (Médaille d'Honneur Supérieure) */}
      {role === 'admin' && (
        <View
          style={{
            width: badgeSize * 1.4,
            height: badgeSize * 1.8,
            bottom: -dimension * 0.3,
            right: -dimension * 0.2,
          }}
          className="absolute items-center"
        >
          <View
            style={{
              width: badgeSize * 0.85,
              height: badgeSize * 0.85,
              marginBottom: -6,
              zIndex: 3,
            }}
            className="rounded-full bg-yellow-400 items-center justify-center border-[1px] border-white dark:border-black z-3"
          >
            <View
              style={{ width: '80%', height: '80%' }}
              className="rounded-full bg-yellow-500 items-center justify-center border border-yellow-600/60"
            >
              <CheckCheck
                size={badgeSize * 0.5}
                color="#FFFFFF"
                strokeWidth={3}
              />
            </View>
          </View>

          <View
            style={{ width: '30%', height: '30%', zIndex: 2 }}
            className="flex-row rounded-b-sm overflow-hidden border border-black/10 dark:border-white/10"
          >
            <View className="flex-1 bg-green-400" />
            <View className="flex-1 bg-red-400" />
            <View className="flex-1 bg-yellow-300" />
          </View>
        </View>
      )}
    </View>
  );
}