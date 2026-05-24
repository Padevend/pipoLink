import { cn } from '@/shared/utils/cn';
import { type ReactNode } from 'react';
import { Pressable, View, type ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'elevated' | 'flat' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ 
  children, 
  onPress, 
  variant = 'elevated', 
  padding = 'md',
  className,
  ...props 
}: CardProps): JSX.Element {
  const Component = onPress ? Pressable : View;

  const variants = {
    elevated: 'bg-surface-light dark:bg-surface-dark',
    flat: 'bg-surface-light dark:bg-surface-dark',
    outline: 'bg-transparent border border-border-light dark:border-border-dark',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <Component
      onPress={onPress}
      className={cn(
        'rounded-3xl overflow-hidden',
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
