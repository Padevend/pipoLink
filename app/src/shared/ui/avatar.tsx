import React from 'react';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { cn } from '@/shared/utils/cn';

export interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  fallbackClassName?: string;
}

export function Avatar({ 
  uri, 
  name, 
  size = 'md', 
  className,
  fallbackClassName
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

  return (
    <View 
      style={{ width: dimension, height: dimension }}
      className={cn('relative items-center justify-center rounded-full overflow-hidden', className)}
    >
      {uri ? (
        <Image 
          source={{ uri }} 
          contentFit="cover"
          transition={200}
          style={{ width: dimension, height: dimension }}
        />
      ) : (
        <View 
          className={cn(
            'items-center justify-center w-full h-full bg-primary/10 dark:bg-primary/20',
            fallbackClassName
          )}
        >
          <Text 
            style={{ fontSize: dimension * 0.4 }}
            className="font-bold text-primary"
          >
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}
