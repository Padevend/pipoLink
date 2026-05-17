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
    <View className="gap-2">
      <Text className="ml-1 text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
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
                'rounded-2xl px-4 py-2.5',
                isSelected ? 'bg-primary' : 'bg-surface-light dark:bg-surface-dark',
              )}
            >
              <Text
                className={cn(
                  'text-sm font-bold',
                  isSelected ? 'text-white' : 'text-text-primary-light dark:text-text-primary-dark',
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
    <View className="gap-4">
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
      <ChipRow label="Unité d'enseignement (UE)" options={ues} selected={ue} onSelect={setUe} />
    </View>
  );
}
