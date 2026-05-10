import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  className?: string
}

export function Skeleton({ width = '100%', height = 20, radius = 8, className }: SkeletonProps): JSX.Element {
  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animated, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(animated, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();
  }, [animated]);

  const opacity = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View 
      className={className} 
      style={{ 
        width, 
        height, 
        borderRadius: radius, 
        opacity, 
        backgroundColor: '#E5E7EB' 
      } as any} 
    />
  );
}
