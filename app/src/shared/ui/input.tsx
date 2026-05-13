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
import Animated, {
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

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
  const focusAnim = useSharedValue(0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: 200 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusAnim.value = withTiming(0, { duration: 200 });
    onBlur?.(e);
  };

  return (
    <View className={cn('w-full gap-2', containerClassName)}>
      {label && (
        <Text className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark ml-1">
          {label}
        </Text>
      )}
      
      <Animated.View 
        className={cn(
          'h-14 w-full flex-row items-center rounded-2xl bg-surface-light dark:bg-surface-dark px-4',
          error && 'bg-error/5'
        )}
      >
        {LeftIcon && (
          <LeftIcon 
            size={20} 
            color={isFocused ? '#FF7A00' : '#6B7280'} 
            className="mr-3"
          />
        )}
        
        <TextInput
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor="#94A3B8"
          className={cn(
            'flex-1 text-base text-text-primary-light dark:text-text-primary-dark h-full',
            className
          )}
          {...props}
        />
        
        {RightIcon && (
          <Pressable onPress={onRightIconPress} hitSlop={10}>
            <RightIcon 
              size={20} 
              color="#6B7280" 
              className="ml-3"
            />
          </Pressable>
        )}
      </Animated.View>
      
      {error && (
        <Text className="text-xs font-medium text-error ml-2">
          {error}
        </Text>
      )}
    </View>
  );
}
