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
      {label && (
        <Text className="text-[11px] font-black uppercase tracking-widest text-zinc-950 dark:text-zinc-300 ml-4">
          {label}
        </Text>
      )}
      
      {/* Grille moderne de sélecteurs de niveaux massifs */}
      <View className="flex-row flex-wrap gap-3">
        {NIVEAUX.map((n) => {
          const selected = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              className={cn(
                'min-w-[72px] h-14 flex-1 items-center justify-center rounded-full border-2 transition-all',
                selected 
                  ? 'bg-orange-500 border-orange-500' 
                  : 'bg-zinc-100 dark:bg-[#1A1A1A] border-transparent',
              )}
            >
              <Text 
                className={cn(
                  'text-sm font-black tracking-wider', 
                  selected ? 'text-white' : 'text-zinc-950 dark:text-white'
                )}
              >
                {n}
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