import { Pressable, Text, View } from 'react-native';

import { NIVEAUX } from '@/features/auth/lib/onboarding-schema';
import { cn } from '@/shared/utils/cn';

interface LevelPickerProps {
  label?: string;
  value?: string;
  onChange: (level: string) => void;
  error?: string;
}

export function LevelPicker({ label = 'Niveau', value, onChange, error }: LevelPickerProps): JSX.Element {
  return (
    <View className="gap-2">
      <Text className="ml-1 text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {NIVEAUX.map((n) => {
          const selected = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              className={cn(
                'min-w-[52px] items-center rounded-2xl px-4 py-3',
                selected ? 'bg-primary' : 'bg-surface-light dark:bg-surface-dark',
              )}
            >
              <Text className={cn('text-sm font-bold', selected ? 'text-white' : 'text-text-primary-light dark:text-text-primary-dark')}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="ml-2 text-xs font-medium text-error">{error}</Text> : null}
    </View>
  );
}
