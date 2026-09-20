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

const ORANGE_PRINCIPAL = '#F97316';
const GRIS_NEUTRE = '#A1A1AA';
const NOIR_TEXTE = '#09090B';
const BLANC_TEXTE = '#FAFAFA';

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
    <View className={cn('w-full gap-2', containerClassName)}>
      {/* Label technique minimaliste, très lisible */}
      {label && (
        <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-950 dark:text-zinc-300 ml-4">
          {label}
        </Text>
      )}
      
      {/* Conteneur brut à géométrie arrondie maximale */}
      <View 
        className={cn(
          'w-full flex-row border-2 px-6 transition-all',
          props.multiline 
            ? 'items-start py-5 rounded-[32px] min-h-[64px] max-h-[160px]' 
            : 'items-center h-16 rounded-full',
          error 
            ? 'border-red-500 bg-red-50 dark:bg-red-950' 
            : isFocused 
              ? 'border-orange-500 bg-white dark:bg-[#0A0A0A]' 
              : 'border-transparent bg-zinc-100 dark:bg-[#1A1A1A]'
        )}
      >
        {/* Icône Gauche */}
        {LeftIcon && (
          <LeftIcon 
            size={20} 
            color={isFocused ? ORANGE_PRINCIPAL : GRIS_NEUTRE} 
            className={cn(props.multiline ? 'mr-3 mt-1' : 'mr-3')}
            strokeWidth={isFocused ? 2.5 : 2}
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
            'flex-1 text-base font-bold text-zinc-950 dark:text-white py-0',
            props.multiline ? 'min-h-[40px] max-h-[140px]' : 'h-full',
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
            hitSlop={16}
            className={cn(props.multiline ? 'ml-3 mt-1' : 'ml-3')}
          >
            <RightIcon 
              size={20} 
              color={GRIS_NEUTRE} 
              strokeWidth={2}
            />
          </Pressable>
        )}
      </View>
      
      {/* Alerte système d'erreur */}
      {error && (
        <Text className="text-[10px] font-black uppercase tracking-wider text-red-500 ml-4">
          {error}
        </Text>
      )}
    </View>
  );
}