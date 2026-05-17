export type NiveauOption = {
  label: string;
  ue: string[];
};

export type FiliereOption = {
  filiere: string;
  niveaux: NiveauOption[];
};

/** Filière → Niveau → UE (données locales pour les sélecteurs en cascade). */
export const LEVEL_DATA: FiliereOption[] = [
  {
    filiere: 'Mathématiques',
    niveaux: [
      { label: 'L1', ue: ['Algèbre', 'Analyse', 'Probabilités'] },
      { label: 'L2', ue: ['Analyse 2', 'Algèbre linéaire', 'Statistiques'] },
      { label: 'L3', ue: ['Topologie', 'Équations différentielles', 'Optimisation'] },
    ],
  },
  {
    filiere: 'Sciences',
    niveaux: [
      { label: 'L1', ue: ['Biologie', 'Chimie générale', 'Physique'] },
      { label: 'L2', ue: ['Biochimie', 'Physique 2', 'Géologie'] },
      { label: 'L3', ue: ['Génétique', 'Thermodynamique', 'Écologie'] },
    ],
  },
  {
    filiere: 'Physique',
    niveaux: [
      { label: 'L1', ue: ['Mécanique', 'Électricité', 'Optique'] },
      { label: 'L2', ue: ['Électromagnétisme', 'Thermodynamique', 'Ondes'] },
      { label: 'L3', ue: ['Mécanique quantique', 'Physique nucléaire', 'Relativité'] },
    ],
  },
  {
    filiere: 'Informatique',
    niveaux: [
      { label: 'L1', ue: ['Algorithmique', 'Programmation', 'Architecture'] },
      { label: 'L2', ue: ['Bases de données', 'Réseaux', 'Structures de données'] },
      { label: 'L3', ue: ['Systèmes distribués', 'IA', 'Sécurité'] },
    ],
  },
];

export function getFilieres(): string[] {
  return LEVEL_DATA.map((f) => f.filiere);
}

export function getNiveauxForFiliere(filiere: string): NiveauOption[] {
  return LEVEL_DATA.find((f) => f.filiere === filiere)?.niveaux ?? [];
}

export function getUeForNiveau(filiere: string, niveauLabel: string): string[] {
  const niveau = getNiveauxForFiliere(filiere).find((n) => n.label === niveauLabel);
  return niveau?.ue ?? [];
}
