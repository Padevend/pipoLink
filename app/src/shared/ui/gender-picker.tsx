import { Pressable, Text, View } from 'react-native';

import { cn } from '@/shared/utils/cn';

export const GENDERS = [
  { id: 'M', label: 'Homme' },
  { id: 'F', label: 'Femme' },
  { id: 'I', label: 'Non Spécifié' },
] as const;

export type GenderId = (typeof GENDERS)[number]['id'];

interface GenderPickerProps {
  label?: string;
  value?: GenderId;
  onChange: (gender: GenderId) => void;
  error?: string;
}

export function GenderPicker({ label = 'Genre', value, onChange, error }: GenderPickerProps): JSX.Element {
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="ml-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {label}
        </Text>
      )}
      
      <View className="flex-row flex-wrap gap-2">
        {GENDERS.map((g) => {
          const selected = value === g.id;
          return (
            <Pressable
              key={g.id}
              onPress={() => onChange(g.id)}
              className={cn(
                'rounded-lg px-3.5 h-8 justify-center border transition-colors',
                selected 
                  ? 'bg-orange-500 border-orange-500 active:bg-orange-600' 
                  : 'bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800',
              )}
            >
              <Text
                className={cn(
                  'text-xs font-bold',
                  selected ? 'text-white' : 'text-zinc-900 dark:text-zinc-50',
                )}
              >
                {g.label}
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