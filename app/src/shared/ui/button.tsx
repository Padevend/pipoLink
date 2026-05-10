import React, { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  interpolate 
} from 'react-native-reanimated';
import { cn } from '@/shared/utils/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onPress?: () => void;
  className?: string;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  onPress,
  className
}: ButtonProps): JSX.Element {
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    if (!isDisabled) scale.value = withSpring(0.96);
  };

  const onPressOut = () => {
    if (!isDisabled) scale.value = withSpring(1);
  };

  const variants = {
    primary: 'bg-primary shadow-lg shadow-primary/20',
    secondary: 'bg-accent-muted-light dark:bg-accent-muted-dark',
    outline: 'border border-border-light dark:border-border-dark bg-transparent',
    ghost: 'bg-transparent',
    danger: 'bg-error shadow-lg shadow-error/20',
  };

  const textVariants = {
    primary: 'text-white',
    secondary: 'text-primary',
    outline: 'text-text-primary-light dark:text-text-primary-dark',
    ghost: 'text-text-primary-light dark:text-text-primary-dark',
    danger: 'text-white',
  };

  const sizes = {
    sm: 'h-10 px-3 rounded-xl',
    md: 'h-12 px-5 rounded-2xl',
    lg: 'h-14 px-6 rounded-2xl',
    xl: 'h-16 px-8 rounded-3xl',
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isDisabled}
      style={[animatedStyle]}
      className={cn(
        'flex-row items-center justify-center overflow-hidden',
        variants[variant],
        sizes[size],
        isDisabled && 'opacity-60',
        className
      )}
    >
      <View className="flex-row items-center justify-center gap-2">
        {loading ? (
          <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#FF7A00'} />
        ) : (
          leftIcon
        )}
        
        {!loading && (
          <Text className={cn(
            'text-base font-bold tracking-tight',
            textVariants[variant],
            size === 'sm' && 'text-sm'
          )}>
            {label}
          </Text>
        )}
        
        {!loading && rightIcon}
      </View>
    </AnimatedPressable>
  );
}
