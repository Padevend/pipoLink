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

// Couleurs alignées sur la palette Tailwind (orange-500 et zinc-400)
const ORANGE_PRINCIPAL = '#F97316';
const GRIS_NEUTRE = '#A1A1AA';

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
    <View className={cn('w-full', containerClassName)}>
      {/* Label moderne, aéré et cohérent avec le LoginForm */}
      {label && (
        <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 ml-1">
          {label}
        </Text>
      )}
      
      {/* Conteneur arrondi avec transition fluide (focus et erreur) */}
      <View 
        className={cn(
          'w-full flex-row rounded-2xl border px-4 transition-all duration-200',
          props.multiline 
            ? 'items-start py-3 min-h-[100px] max-h-[160px]' 
            : 'items-center min-h-[52px]', // H-13 environ, pour une large zone de frappe
          error 
            ? 'border-red-500 bg-red-500/5 dark:border-red-500/30' 
            : isFocused 
              ? 'border-orange-500 bg-white dark:border-orange-500/50 dark:bg-zinc-900/80 shadow-sm shadow-orange-500/10' 
              : 'border-zinc-200/80 bg-zinc-100/80 dark:border-zinc-800/80 dark:bg-zinc-800/50'
        )}
      >
        {/* Icône Gauche */}
        {LeftIcon && (
          <LeftIcon 
            size={20} 
            color={isFocused ? ORANGE_PRINCIPAL : GRIS_NEUTRE} 
            className={cn(props.multiline ? 'mr-3 mt-1' : 'mr-3')}
          />
        )}
        
        {/* Champ de Saisie Natif */}
        <TextInput
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor="#A1A1AA"
          textAlignVertical={props.multiline ? 'top' : 'center'}
          style={props.multiline ? { paddingTop: 0, paddingBottom: 0 } : undefined}
          className={cn(
            'flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-50 py-0',
            props.multiline ? 'min-h-[76px]' : 'h-full',
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
        
        {/* Icône Droite (Ex: Œil pour mot de passe) */}
        {RightIcon && (
          <Pressable 
            onPress={onRightIconPress} 
            hitSlop={16} // Augmente la zone de clic
            className={cn(props.multiline ? 'ml-3 mt-1' : 'ml-3')}
          >
            <RightIcon 
              size={20} 
              color={GRIS_NEUTRE} 
            />
          </Pressable>
        )}
      </View>
      
      {/* Alerte système d'erreur claire */}
      {error && (
        <Text className="text-[11px] font-semibold text-red-500 dark:text-red-400 mt-1.5 ml-1">
          {error}
        </Text>
      )}
    </View>
  );
}