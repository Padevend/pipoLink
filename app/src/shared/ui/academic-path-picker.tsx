import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { academicPathsApi, type AcademicFiliere } from '@/shared/api/academic-paths';
import { LEVEL_DATA } from '@/shared/data/level-data';
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

  const fallbackCatalog = useMemo<AcademicFiliere[]>(() => LEVEL_DATA.map((item, filiereIndex) => ({
    id: `legacy-${filiereIndex}`,
    name: item.filiere,
    sortOrder: filiereIndex,
    isActive: true,
    levels: item.niveaux.map((level, levelIndex) => ({
      id: `legacy-${filiereIndex}-${levelIndex}`,
      name: level.label,
      sortOrder: levelIndex,
      isActive: true,
      units: level.ue.map((unit, unitIndex) => ({
        id: `legacy-${filiereIndex}-${levelIndex}-${unitIndex}`,
        name: unit,
        sortOrder: unitIndex,
        isActive: true,
      })),
    })),
  })), []);

  const { data: catalog = fallbackCatalog, isFetching } = useQuery({
    queryKey: ['academic-paths'],
    queryFn: academicPathsApi.list,
    // The old local dataset is only an offline/deployment fallback. Normal
    // operation always renders the database catalogue administered on web.
    placeholderData: fallbackCatalog,
  });

  const selectedFiliere = catalog.find((item) => item.name === filiere);
  const selectedLevel = selectedFiliere?.levels.find((item) => item.name === niveau);
  const filieres = catalog.map((item) => item.name);
  const niveaux = selectedFiliere?.levels.map((item) => item.name) ?? [];
  const ues = selectedLevel?.units.map((item) => item.name) ?? [];

  useEffect(() => {
    setFiliere(value.filiere ?? '');
    setNiveau(value.niveau ?? '');
    setUe(value.ue ?? '');
  }, [value.filiere, value.niveau, value.ue]);

  useEffect(() => {
    if (filiere && niveau && ue) {
      onChange({ filiere, niveau, ue });
    }
  }, [filiere, niveau, ue, onChange]);

  return (
    <View className="gap-y-6">
      <ChipRow
        label="Filière"
        options={filieres}
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
      {isFetching && (
        <Text className="ml-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Synchronisation du catalogue…
        </Text>
      )}
    </View>
  );
}
