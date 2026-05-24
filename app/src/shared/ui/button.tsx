import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { pressFeedback } from '@/shared/ui/press-feedback';
import { cn } from '@/shared/utils/cn';

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
  className,
}: ButtonProps): JSX.Element {
  const isDisabled = disabled || loading;

  const variants = {
    primary:   'bg-primary',
    secondary: 'bg-accent-muted-light dark:bg-accent-muted-dark',
    outline:   'border border-border-light dark:border-border-dark bg-transparent',
    ghost:     'bg-transparent',
    danger:    'bg-error',
  };

  const textVariants = {
    primary:   'text-white',
    secondary: 'text-primary',
    outline:   'text-text-primary-light dark:text-text-primary-dark',
    ghost:     'text-text-primary-light dark:text-text-primary-dark',
    danger:    'text-white',
  };

  const sizes = {
    sm: 'h-10 px-3 rounded-xl',
    md: 'h-12 px-5 rounded-2xl',
    lg: 'h-14 px-6 rounded-2xl',
    xl: 'h-16 px-8 rounded-3xl',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center overflow-hidden',
        pressFeedback,
        variants[variant],
        sizes[size],
        isDisabled && 'opacity-60',
        className,
      )}
    >
      <View className="flex-row items-center justify-center gap-2">
        {loading ? (
          <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#FF7A00'} />
        ) : (
          leftIcon
        )}

        {!loading && (
          <Text
            className={cn(
              'text-base font-bold tracking-tight',
              textVariants[variant],
              size === 'sm' && 'text-sm',
            )}
          >
            {label}
          </Text>
        )}

        {!loading && rightIcon}
      </View>
    </Pressable>
  );
}
