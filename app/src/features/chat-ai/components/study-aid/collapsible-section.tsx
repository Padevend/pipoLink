import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';

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
  const animatedHeight = useSharedValue(0);
  const animatedOpacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  const toggleExpanded = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    if (nextExpanded) {
      animatedHeight.value = withTiming(1, { duration: 200 });
      animatedOpacity.value = withTiming(1, { duration: 200 });
      rotate.value = withTiming(180, { duration: 200 });
    } else {
      animatedHeight.value = withTiming(0, { duration: 200 });
      animatedOpacity.value = withTiming(0, { duration: 200 });
      rotate.value = withTiming(0, { duration: 200 });
    }
  };

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value * 10000,
      opacity: animatedOpacity.value,
      overflow: 'hidden',
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateY: `${rotate.value}deg` }],
    };
  });

  return (
    <View className={`border border-zinc-200/40 dark:border-zinc-800/40 rounded-lg bg-white dark:bg-zinc-950/80 ${className}`}>
      <Pressable
        onPress={toggleExpanded}
        className="flex-row items-center justify-between p-3.5 active:bg-zinc-50/60 dark:active:bg-zinc-900/40"
      >
        <Text className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </Text>
        <Animated.View style={animatedIconStyle}>
          {expanded ? (
            <ChevronUp size={14} color="#F97316" />
          ) : (
            <ChevronDown size={14} color="#A1A1AA" />
          )}
        </Animated.View>
      </Pressable>
      <Animated.View style={animatedContentStyle}>
        {children}
      </Animated.View>
    </View>
  );
};