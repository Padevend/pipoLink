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
    <View className="gap-2">
      {label && (
        <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-950 dark:text-zinc-300 ml-4">
          {label}
        </Text>
      )}
      
      {/* Disposition en grille ou en colonne/ligne bien aérée avec des gros blocs arrondis */}
      <View className="flex-row gap-3">
        {GENDERS.map((g) => {
          const selected = value === g.id;
          return (
            <Pressable
              key={g.id}
              onPress={() => onChange(g.id)}
              className={cn(
                'flex-1 h-16 items-center justify-center rounded-full border-2 transition-all',
                selected 
                  ? 'bg-orange-500 border-orange-500' 
                  : 'bg-zinc-100 dark:bg-[#1A1A1A] border-transparent',
              )}
            >
              <Text
                className={cn(
                  'text-xs font-black uppercase tracking-wider',
                  selected ? 'text-white' : 'text-zinc-950 dark:text-white',
                )}
              >
                {g.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      
      {error ? (
        <Text className="text-[10px] font-black uppercase tracking-wider text-red-500 ml-4">
          {error}
        </Text>
      ) : null}
    </View>
  );
}