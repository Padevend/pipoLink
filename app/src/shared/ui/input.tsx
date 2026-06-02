import { cn } from '@/shared/utils/cn';
import { BRAND } from '@/shared/config/brand';
import { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps
} from 'react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  onRightIconPress?: () => void;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onRightIconPress,
  containerClassName,
  onFocus,
  onBlur,
  className,
  ...props
}: InputProps): JSX.Element {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View className={cn('w-full gap-1.5', containerClassName)}>
      {/* Label Épuré aux dimensions de l'application */}
      {label && (
        <Text className="text-[11px] font-bold uppercase tracking-wide text-text-secondary-light/60 dark:text-text-secondary-dark/60 ml-1">
          {label}
        </Text>
      )}
      
      {/* Conteneur adaptatif Style Glassmorphism */}
      <View 
        className={cn(
          'w-full flex-row rounded-xl bg-surface-light/50 dark:bg-surface-dark/40 border px-4 transition-all',
          // Gestion des hauteurs et alignements selon le mode d'affichage
          props.multiline 
            ? 'items-start py-3.5 min-h-[40px] max-h-[200px]' 
            : 'items-center h-16',
          error 
            ? 'border-error/40 bg-error/5 dark:border-error/30' 
            : isFocused 
              ? 'border-primary bg-surface-light dark:border-primary dark:bg-surface-dark' 
              : 'border-border-light/40 dark:border-border-dark/20'
        )}
      >
        {/* Icône Gauche (Ajustement de marge si multiline) */}
        {LeftIcon && (
          <LeftIcon 
            size={16} 
            color={isFocused ? BRAND.primary : '#64748B'} 
            className={cn(props.multiline ? 'mr-3 mt-0.5' : 'mr-3')}
          />
        )}
        
        {/* Champ de Saisie Natif */}
        <TextInput
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor="#64748B"
          
          textAlignVertical={props.multiline ? 'top' : 'center'}
          style={props.multiline ? { paddingTop: 5, paddingBottom: 0 } : undefined}
          className={cn(
            'flex-1 text-[13px] font-medium text-text-primary-light dark:text-text-primary-dark',
            props.multiline ? 'h-full text-start' : 'h-full',
            className
          )}
          placeholder={props.placeholder}
          onChangeText={props.onChangeText}
          value={props.value}
          multiline={props.multiline}
          secureTextEntry={props.secureTextEntry}
          keyboardType={props.keyboardType}
          autoCapitalize={props.autoCapitalize}
        />
        
        {/* Icône Droite (Ajustement de marge si multiline) */}
        {RightIcon && (
          <Pressable 
            onPress={onRightIconPress} 
            hitSlop={10}
            className={cn(props.multiline ? 'ml-3 mt-0.5' : 'ml-3')}
          >
            <RightIcon 
              size={16} 
              color="#64748B" 
            />
          </Pressable>
        )}
      </View>
      
      {/* Message d'erreur micro-ajusté */}
      {error && (
        <Text className="text-[11px] font-semibold text-error ml-1.5 mt-0.5">
          {error}
        </Text>
      )}
    </View>
  );
}