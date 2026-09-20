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
  textClassName?: string; // Ajouté pour faciliter les overrides de texte
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
  textClassName,
}: ButtonProps): JSX.Element {
  const isDisabled = disabled || loading;

  // Palette ultra-plate : Monochrome + Accent Orange
  const variants = {
    primary:   'bg-orange-500',
    secondary: 'bg-zinc-100 dark:bg-[#1A1A1A]',
    outline:   'border-2 border-zinc-200 dark:border-zinc-800 bg-transparent',
    ghost:     'bg-transparent',
    danger:    'bg-red-500',
  };

  const textVariants = {
    primary:   'text-white',
    secondary: 'text-zinc-950 dark:text-white',
    outline:   'text-zinc-950 dark:text-white',
    ghost:     'text-zinc-950 dark:text-white',
    danger:    'text-white',
  };

  // Tailles massives (chunky) avec des bords totalement arrondis
  const sizes = {
    sm: 'h-12 px-6 rounded-full',
    md: 'h-14 px-8 rounded-full',
    lg: 'h-16 px-8 rounded-full',
    xl: 'h-20 px-10 rounded-full',
  };

  // Ajustement de la taille du texte en fonction du bouton
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-sm',
    xl: 'text-base',
  };

  // Gestion dynamique de la couleur du spinner
  const getSpinnerColor = () => {
    if (variant === 'primary' || variant === 'danger') return '#FFFFFF';
    return '#F97316'; // Orange pour les boutons secondaires/fantômes
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center overflow-hidden transition-all',
        pressFeedback,
        variants[variant],
        sizes[size],
        isDisabled && 'opacity-50', // Opacité réduite de façon nette
        className,
      )}
    >
      <View className="flex-row items-center justify-center gap-3">
        {loading ? (
          <ActivityIndicator color={getSpinnerColor()} size="small" />
        ) : (
          leftIcon
        )}

        {!loading && (
          <Text
            className={cn(
              'font-black uppercase tracking-widest', // Typo forte et espacée
              textVariants[variant],
              textSizes[size],
              textClassName
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