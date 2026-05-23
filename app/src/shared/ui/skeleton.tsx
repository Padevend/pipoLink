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
    // Pulsation fluide et premium (1200ms pour un rythme plus calme)
    Animated.loop(
      Animated.sequence([
        Animated.timing(animated, { 
          toValue: 1, 
          duration: 1200, 
          useNativeDriver: true 
        }),
        Animated.timing(animated, { 
          toValue: 0, 
          duration: 1200, 
          useNativeDriver: true 
        }),
      ]),
    ).start();
  }, [animated]);

  // Opacité subtile s'adaptant parfaitement aux superpositions de verre (Glassmorphism)
  const opacity = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  // Détection intelligente des classes de dimensions Tailwind pour éviter les conflits de styles
  const hasHeightClass = className?.split(' ').some(c => c.startsWith('h-'));
  const hasWidthClass = className?.split(' ').some(c => c.startsWith('w-'));
  const hasRadiusClass = className?.split(' ').some(c => c.startsWith('rounded'));

  return (
    <Animated.View 
      className={cn(
        // Arrière-plan translucide s'adaptant nativement au mode clair et sombre (sans shadow)
        'bg-slate-200/70 dark:bg-slate-800/50', 
        className
      )} 
      style={[
        { opacity },
        // On n'applique les styles en ligne que s'ils ne sont pas définis via Tailwind
        !hasWidthClass && { width: width ?? '100%' },
        !hasHeightClass && { height: height ?? 20 },
        !hasRadiusClass && { borderRadius: radius ?? 8 },
      ] as any} 
    />
  );
}