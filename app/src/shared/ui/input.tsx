import { cn } from '@/shared/utils/cn';
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

const ORANGE_PRINCIPAL = '#FF6B00';
const GRIS_NEUTRE = '#71717A';

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
    <View className={cn('w-full gap-1', containerClassName)}>
      {/* Label technique style terminal */}
      {label && (
        <Text className="font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
          {label}
        </Text>
      )}
      
      {/* Conteneur brut à géométrie stricte */}
      <View 
        className={cn(
          'w-full flex-row rounded-lg bg-zinc-100 dark:bg-zinc-900/40 border px-3 transition-all',
          props.multiline 
            ? 'items-start py-2 min-h-[40px] max-h-[160px]' 
            : 'items-center min-h-15',
          error 
            ? 'border-red-500 bg-red-500/5 dark:border-red-500/30' 
            : isFocused 
              ? 'border-orange-500 bg-white dark:border-orange-600 dark:bg-zinc-900' 
              : 'border-zinc-100 dark:border-zinc-900'
        )}
      >
        {/* Icône Gauche */}
        {LeftIcon && (
          <LeftIcon 
            size={14} 
            color={isFocused ? ORANGE_PRINCIPAL : GRIS_NEUTRE} 
            className={cn(props.multiline ? 'mr-2.5 mt-1' : 'mr-2.5')}
          />
        )}
        
        {/* Champ de Saisie Natif Rectifié */}
        <TextInput
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor="#A1A1AA"
          textAlignVertical={props.multiline ? 'top' : 'center'}
          style={props.multiline ? { paddingTop: 2, paddingBottom: 2 } : undefined}
          className={cn(
            'flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-50 py-0 min-h-[40px] max-h-[160px]',
            className
          )}
          placeholder={props.placeholder}
          onChangeText={props.onChangeText}
          value={props.value}
          multiline={props.multiline}
          secureTextEntry={props.secureTextEntry}
          keyboardType={props.keyboardType}
          autoCapitalize={props.autoCapitalize}
          {...props}
        />
        
        {/* Icône Droite */}
        {RightIcon && (
          <Pressable 
            onPress={onRightIconPress} 
            hitSlop={12}
            className={cn(props.multiline ? 'ml-2.5 mt-1' : 'ml-2.5')}
          >
            <RightIcon 
              size={14} 
              color={GRIS_NEUTRE} 
            />
          </Pressable>
        )}
      </View>
      
      {/* Alerte système d'erreur */}
      {error && (
        <Text className="font-mono text-[9px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400 ml-1 mt-0.5">
          {error}
        </Text>
      )}
    </View>
  );
}