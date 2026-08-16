import React from 'react';
import { View } from 'react-native';
import { cn } from "@/shared/utils/cn";

interface ProgressDotsProps {
  total: number;
  current: number;
  className?: string;
}

export const ProgressDots: React.FC<ProgressDotsProps> = ({
  total,
  current,
  className = '',
}) => {
  return (
    <View className={`flex-row items-center justify-center gap-1.5 ${className}`}>
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === current;
        return (
          <View
            key={index}
            className={cn(
              'h-1.5 w-1.5 rounded-full transition-all',
              isActive
                ? 'bg-orange-500/60 w-4'
                : 'bg-zinc-300 dark:bg-zinc-700'
            )}
          />
        );
      })}
    </View>
  );
};