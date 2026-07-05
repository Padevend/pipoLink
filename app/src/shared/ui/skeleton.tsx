import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { cn } from '@/shared/utils/cn';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  className?: string;
}

export function Skeleton({ 
  width, 
  height, 
  radius, 
  className 
}: SkeletonProps): JSX.Element {
  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsation fluide et linéaire, sans à-coups
    Animated.loop(
      Animated.sequence([
        Animated.timing(animated, { 
          toValue: 1, 
          duration: 1000, 
          useNativeDriver: true 
        }),
        Animated.timing(animated, { 
          toValue: 0, 
          duration: 1000, 
          useNativeDriver: true 
        }),
      ]),
    ).start();
  }, [animated]);

  // Changement d'opacité subtil sur une base de couleur mate
  const opacity = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  // Vérification des styles appliqués pour éviter les chevauchements
  const hasHeightClass = className?.split(' ').some(c => c.startsWith('h-'));
  const hasWidthClass = className?.split(' ').some(c => c.startsWith('w-'));
  const hasRadiusClass = className?.split(' ').some(c => c.startsWith('rounded'));

  return (
    <Animated.View 
      className={cn(
        'bg-zinc-100 dark:bg-zinc-900', 
        className
      )} 
      style={[
        { opacity },
        !hasWidthClass && { width: width ?? '100%' },
        !hasHeightClass && { height: height ?? 16 },
        !hasRadiusClass && { borderRadius: radius ?? 12 },
      ] as any} 
    />
  );
}