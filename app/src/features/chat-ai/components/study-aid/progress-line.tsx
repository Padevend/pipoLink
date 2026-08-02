import React from 'react';
import { View } from 'react-native';

interface ProgressLineProps {
  progress: number;
  className?: string;
}

export const ProgressLine: React.FC<ProgressLineProps> = ({
  progress,
  className = '',
}) => {
  return (
    <View className={`h-0.5 w-full bg-zinc-200/60 dark:bg-zinc-800 rounded-full overflow-hidden ${className}`}>
      <View
        className="h-full bg-orange-500/60 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </View>
  );
};