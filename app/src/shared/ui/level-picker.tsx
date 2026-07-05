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
    <View className="gap-1.5">
      {label && (
        <Text className="ml-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {label}
        </Text>
      )}
      
      <View className="flex-row flex-wrap gap-2">
        {NIVEAUX.map((n) => {
          const selected = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              className={cn(
                'min-w-[48px] items-center justify-center rounded-lg px-3 h-8 border transition-colors',
                selected 
                  ? 'bg-orange-500 border-orange-500 active:bg-orange-600' 
                  : 'bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800',
              )}
            >
              <Text 
                className={cn(
                  'text-xs font-bold', 
                  selected ? 'text-white' : 'text-zinc-900 dark:text-zinc-50'
                )}
              >
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
      
      {error ? (
        <Text className="ml-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
          {error}
        </Text>
      ) : null}
    </View>
  );
}