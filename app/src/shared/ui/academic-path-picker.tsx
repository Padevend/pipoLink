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
    <View className="gap-y-3">
      <Text className="ml-1 text-[11px] font-black uppercase tracking-widest text-zinc-500">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => onSelect(opt)}
              className={cn(
                'rounded-full px-4 py-2 border-2 active:opacity-80 transition-all',
                isSelected 
                  ? 'bg-orange-500 border-orange-500' 
                  : 'bg-zinc-100 border-transparent dark:bg-[#1A1A1A]',
              )}
            >
              <Text
                className={cn(
                  'text-xs font-black tracking-widest uppercase',
                  isSelected ? 'text-white' : 'text-zinc-950 dark:text-white',
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
    <View className="gap-y-6">
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