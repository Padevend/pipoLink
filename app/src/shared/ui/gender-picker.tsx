import { Pressable, Text, View } from 'react-native';

import { cn } from '@/shared/utils/cn';

export const GENDERS = [
  { id: 'M', label: 'Homme' },
  { id: 'F', label: 'Femme' },
  { id: 'I', label: 'Non Précisé' },
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
    <View className="gap-2">
      <Text className="ml-1 text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {GENDERS.map((g) => {
          const selected = value === g.id;
          return (
            <Pressable
              key={g.id}
              onPress={() => onChange(g.id)}
              className={cn(
                'rounded-2xl px-4 py-3',
                selected ? 'bg-primary' : 'bg-surface-light dark:bg-surface-dark',
              )}
            >
              <Text
                className={cn(
                  'text-sm font-bold',
                  selected ? 'text-white' : 'text-text-primary-light dark:text-text-primary-dark',
                )}
              >
                {g.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="ml-2 text-xs font-medium text-error">{error}</Text> : null}
    </View>
  );
}
