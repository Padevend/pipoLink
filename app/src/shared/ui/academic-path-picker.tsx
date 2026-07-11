import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  getFilieres,
  getNiveauxForFiliere,
  getUeForNiveau,
} from '@/shared/data/level-data';
import { cn } from '@/shared/utils/cn';

export type AcademicPath = {
  filiere: string;
  niveau: string;
  ue: string;
};

interface AcademicPathPickerProps {
  value: Partial<AcademicPath>;
  onChange: (path: AcademicPath) => void;
}

function ChipRow({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected?: string;
  onSelect: (v: string) => void;
}) {
  if (!options.length) return null;

  return (
    <View className="gap-1.5 mt-3">
      <Text className="ml-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {options.map((opt) => {
          const isSelected = selected === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => onSelect(opt)}
              className={cn(
                'rounded-lg px-3 py-1.5 border',
                isSelected 
                  ? 'bg-orange-500 border-orange-500 active:bg-orange-600' 
                  : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800',
              )}
            >
              <Text
                className={cn(
                  'text-[11px] font-bold tracking-wide uppercase',
                  isSelected ? 'text-white' : 'text-zinc-600 dark:text-zinc-400',
                )}
              >
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AcademicPathPicker({ value, onChange }: AcademicPathPickerProps): JSX.Element {
  const [filiere, setFiliere] = useState(value.filiere ?? '');
  const [niveau, setNiveau] = useState(value.niveau ?? '');
  const [ue, setUe] = useState(value.ue ?? '');

  const niveaux = filiere ? getNiveauxForFiliere(filiere).map((n) => n.label) : [];
  const ues = filiere && niveau ? getUeForNiveau(filiere, niveau) : [];

  useEffect(() => {
    if (filiere && niveau && ue) {
      onChange({ filiere, niveau, ue });
    }
  }, [filiere, niveau, ue, onChange]);

  return (
    <View className="gap-3.5">
      <ChipRow
        label="Filière"
        options={getFilieres()}
        selected={filiere}
        onSelect={(f) => {
          setFiliere(f);
          setNiveau('');
          setUe('');
        }}
      />
      <ChipRow
        label="Niveau"
        options={niveaux}
        selected={niveau}
        onSelect={(n) => {
          setNiveau(n);
          setUe('');
        }}
      />
      <ChipRow 
        label="Unité d'enseignement (UE)" 
        options={ues} 
        selected={ue} 
        onSelect={setUe} 
      />
    </View>
  );
}