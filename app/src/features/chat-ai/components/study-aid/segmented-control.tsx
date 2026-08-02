import { cn } from '@/shared/utils/cn';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface SegmentedControlOption {
  id: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  selectedOption: string;
  onSelect: (optionId: string) => void;
  className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedOption,
  onSelect,
  className = '',
}) => {
  return (
    <View className={`flex-row rounded-full bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 p-0.5 ${className}`}>
      {options.map((option, index) => {
        const isSelected = option.id === selectedOption;
        return (
          <Pressable
            key={option.id}
            onPress={() => onSelect(option.id)}
            className={cn(
              'px-3 py-1 rounded-full transition-all',
              isSelected
                ? 'bg-orange-500/20 dark:bg-orange-500/30'
                : 'bg-transparent'
            )}
            style={index > 0 ? { marginLeft: -1} : {}}
          >
            <Text
              className={cn(
                'text-[11px] font-semibold',
                isSelected
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-zinc-600 dark:text-zinc-400'
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};