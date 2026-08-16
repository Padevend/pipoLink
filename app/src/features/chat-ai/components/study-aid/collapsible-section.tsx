import { ChevronDown } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface CollapsibleSectionProps {
  title: string;
  initialExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  initialExpanded = false,
  children,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const rotation = useSharedValue(initialExpanded ? 180 : 0);
  const opacity = useSharedValue(initialExpanded ? 1 : 0);

  useEffect(() => {
    rotation.value = withTiming(expanded ? 180 : 0, { duration: 180 });
    opacity.value = withTiming(expanded ? 1 : 0, { duration: 180 });
  }, [expanded, opacity, rotation]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View className={`overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 ${className}`}>
      <Pressable
        onPress={() => setExpanded((value) => !value)}
        className="min-h-[52px] flex-row items-center justify-between px-4 active:bg-zinc-50 dark:active:bg-zinc-800/60"
      >
        <Text className="flex-1 text-[13px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </Text>
        <Animated.View style={iconStyle}>
          <ChevronDown size={17} color={expanded ? '#F97316' : '#A1A1AA'} />
        </Animated.View>
      </Pressable>
      {expanded && (
        <Animated.View style={contentStyle} className="border-t border-zinc-100 px-4 pb-4 pt-3 dark:border-zinc-800">
          {children}
        </Animated.View>
      )}
    </View>
  );
};
