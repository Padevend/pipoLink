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
    filiere: "MSP",
    niveaux: [
      {
        label: "N1",
        ue: [
          "Analyse réelle I & II",
          "Algèbre Générale",
          "Géométrie euclidienne et affine",
          "Algèbre linéaire",
          "Electromagnétisme I & II",
          "Mécanique du point",
          "Technologie et sciences des matériaux",
          "TP Physique",
          "Informatique I & II",
          "Eléments de Chimie",
          "Langue (Anglais/Français)",
          "Dessin technique",
          "Comportement et Sport"
        ],
      },
      {
        label: "N2",
        ue: [
          "Algèbre multilinéaire",
          "Analyse dans les espaces vectoriels de dimensions finies",
          "Séries intégrales",
          "Analyse numérique",
          "Probabilités et Statistiques",
          "Circuits Electriques et électroniques",
          "Mécanique des solides",
          "Optique Géométrique et Ondulatoire",
          "Electrocinétique",
          "Thermodynamique",
          "Informatique III & IV",
          "Statique",
          "Anglais/Français",
          "TP Physique"
        ],
      },
    ],
  },
  {
    filiere: "Génie Informatique",
    niveaux: [
      {
        label: "N3",
        ue: [
          "Architecture des ordinateurs",
          "Base de données relationnelles",
          "Mathématiques de base",
          "Fondements de management I & II",
          "Probabilités et Statistiques",
          "Système d'exploitation",
          "Science de l'information",
          "Programmation par objet I & II",
          "Introduction aux réseaux",
          "Programmation système",
          "Systèmes formels et IA",
          "Projet BD",
          "Conception des SI",
          "Analyse Numérique I & II",
          "Architecture des réseaux et ordinateur"
        ],
      },
      {
        label: "N4",
        ue: [
          "Grammaires et langages",
          "Electroniques et interfaçage",
          "Technique de management",
          "Analyse des données",
          "Intelligence artificielle et applications",
          "Admin réseaux",
          "Conduite des projets",
          "Programmation Web",
          "Interface homme machine",
          "Informatique décisionnelle",
          "Recherche opérationnelle",
          "Sécurité informatique",
          "Introduction à l'informatique quantique",
          "Communication d'entreprise",
          "Aspects juridiques de l'entreprise"
        ],
      },
      {
        label: "N5",
        ue: [
          "Datamining",
          "Traitements d'images SIG et Webmapping",
          "e-commerce",
          "Systèmes temps-réel et embarqués",
          "Génie logiciel I & II",
          "Deeplearning",
          "Systèmes distribués et virtualisation",
          "Système tuteur intelligent"
        ],
      },
    ],
  },
  {
    filiere: "Génie Telecom",
    niveaux: [
      {
        label: "N3",
        ue: [
          "Electronique analogique I & II",
          "Radio and television technics",
          "Automatique de base",
          "Power conversion",
          "Traitement de signal",
          "Machines électriques",
          "Systèmes asservis",
          "Droit du travail et des affaires",
          "Transmissions analogiques et numériques",
          "Informatique industrielle et microprocesseurs",
          "Techniques de modulation analogique et numérique",
          "Production transport et distribution d'énergie",
          "Architecture des réseaux et ordinateur",
          "Signaux et système"
        ],
      },
      {
        label: "N4",
        ue: [
          "Recherche opérationnelle",
          "Méthodes numériques en électromagnétisme",
          "Optoélectronique",
          "TP Electronique I & II",
          "Ingénierie des télecommunications",
          "Théorie des graphes",
          "Digital system design",
          "Microélectronique",
          "Traitement numérique du signal",
          "Electrical engineering schematics",
          "Architecture des réseaux et ordinateur",
          "Antennes et propagation",
          "TP Télécommunications",
          "Instrumentation electronique"
        ],
      },
      {
        label: "N5",
        ue: [
          "Système de télécommunication par satellite",
          "Techniques de création d'entreprise",
          "Modern system Control",
          "Commandes des systèmes échantillonnés",
          "Management",
          "Traitement et transport d'images",
          "Télédétection",
          "Transmission des données et réseaux numériques",
          "Séminaire",
          "Projet d'ingénieur"
        ],
      },
    ],
  },
  {
    filiere: "Génie Electrique",
    niveaux: [
      {
        label: "N3",
        ue: [
          "Electronique analogique I & II",
          "Automatique de base",
          "Power conversion",
          "Traitement de signal",
          "Machines électriques",
          "Systèmes asservis",
          "Droit du travail et des affaires",
          "Transmissions analogiques et numériques",
          "Informatique industrielle et microprocesseurs",
          "Techniques de modulation analogique et numérique",
          "Production transport et distribution d'énergie"
        ],
      },
      {
        label: "N4",
        ue: [
          "TP Electronique I & II",
          "Analyse numérique",
          "Advanced power electronics",
          "Eléments finis",
          "Machines électriques avancées",
          "Electrical engineering schematics",
          "Sequentiel control",
          "Digital system design",
          "Capteurs et instruments électroniques",
          "Electricité industrielle",
          "Réseaux électriques",
          "Matériaux pour génie électrique",
          "TP Automatique I & II",
          "Recherche opérationnelle",
          "Energies renouvelables",
          "Régulation des systèmes échantillonnés",
          "Microélectronique"
        ],
      },
      {
        label: "N5",
        ue: [
          "Restructured electronic system",
          "TP Automatique",
          "Techniques de création d'entreprise",
          "Modern system Control",
          "Méthodes d'analyse des réseaux électriques",
          "Management",
          "Actionneurs spéciaux",
          "Protections d'installations électriques",
          "Efficacité énergétique",
          "Entrainements électriques",
          "Projet d'ingénieur"
        ],
      },
    ],
  },
  {
    filiere: "Génie Civil",
    niveaux: [
      {
        label: "N3",
        ue: [
          "Technologie du bâtiment",
          "Analyse mathématique",
          "Thermique et thermodynamique acoustique",
          "Probabilités et Statistiques",
          "Mécanique des milieux continus",
          "Dessin de génie civil",
          "Méthodes numériques",
          "Topographie",
          "Urbanisme et transport",
          "Gitologie et exploitation des carrières",
          "TP de topographie",
          "Résistance des matériaux",
          "CAO-DAO",
          "TP Matériaux et géologie"
        ],
      },
      {
        label: "N4",
        ue: [
          "Méthodes des éléments finis",
          "Construction en terre",
          "Hydraulique appliquée",
          "Métré et devis",
          "Construction bois",
          "Béton armé I & II",
          "Organisation des chantiers",
          "Géotechnique I & II",
          "Calcul des structures",
          "Béton précontraint",
          "Réseaux et domotiques",
          "Recherche opérationnelle",
          "Plaques et coques",
          "TP Géotechnique",
          "Assainissement"
        ],
      },
      {
        label: "N5",
        ue: [
          "Management des projets d'investissements",
          "Entretien routier et projet de route",
          "Calcul dynamique",
          "Ossature bâtiment",
          "Ouvrages d'art",
          "Logiciels et BET",
          "Habitat et outils qualité",
          "Equipements urbains",
          "Législation du travail",
          "Assainissement et Adduction d'eau",
          "Projet technique d'aménagement et Analyse de site",
          "Projet technique du bâtiment",
          "Management de l'environnement et déchets",
          "Droit foncier et Droit de la construction"
        ],
      },
    ],
  },
  {
    filiere: "Génie Mécanique",
    niveaux: [
      {
        label: "N3",
        ue: [
          "Construction mécanique",
          "Procédés de fabrication mécanique",
          "Mécanique des milieux continus",
          "Electronique numérique et de puissance",
          "Turbomachines",
          "Transferts thermiques",
          "Méthodes de fabrication mécanique",
          "Résistance des matériaux",
          "Mécanique des fluides appliqués",
          "Algorithme et programmation",
          "Transformation des matériaux et métallurgie",
          "Electrotechnique (Machines électriques)",
          "Asservissement",
          "Thermodynamique appliquée",
          "Elasticité",
          "Dessins assistés par ordinateur (DAO)",
          "Informatique"
        ],
      },
      {
        label: "N4",
        ue: [
          "Construction mécanique",
          "Procédés de fabrication mécanique",
          "Mécanique des solides",
          "Vibrations",
          "Thermique industrielle",
          "Froid industriel et Climatisation",
          "Maintenance et fiabilité des systèmes industriels",
          "Matériaux de construction mécanique",
          "Modélisation mécanique",
          "Qualité",
          "TP Mécanique des solides",
          "TP Mécanique des fluides",
          "TP Thermique",
          "TP Métallurgie",
          "CAO",
          "Informatique industrielle",
          "Mécanique non linéaire",
          "Energétique industrielle",
          "Hydraulique",
          "Centrales hydrauliques et thermiques",
          "Droit du travail et des affaires"
        ],
      },
      {
        label: "N5",
        ue: [
          "Construction mécanique",
          "Management de l'environnement/Risque industriel",
          "CMAO/Simulation",
          "Montage et soumission des DAO gestion et rentabilité des projets",
          "Commandes numériques des systèmes asservis/CFAO",
          "TP mécanique",
          "TP moteur thermique",
          "TP productique",
          "TP métallurgie",
          "Recherche opérationnelle",
          "Plasticité",
          "Dynamique des machines",
          "Calcul des structures",
          "Management de l'entreprise et développement social"
        ],
      },
    ],
  },
  {
    filiere: "Génie Industriel",
    niveaux: [
      {
        label: "N3",
        ue: [
          "Construction mécanique",
          "Technologie de fabrication mécanique et méthodes",
          "Asservissement",
          "Electronique numérique et de puissance",
          "Turbomachines",
          "Transferts thermiques",
          "Algorithme et programmation",
          "Résistance des matériaux",
          "Mécanique des fluides appliqués",
          "Processus de fabrication et méthode",
          "Froid industriel et climatisation",
          "Thermodynamique appliquée",
          "Fondements de management I & II",
          "TP Matériaux et géologie",
          "Thermique industrielle",
          "Gestion",
          "Economie"
        ],
      },
      {
        label: "N4",
        ue: [
          "Production industrielle",
          "Montage et gestion des projets",
          "Système d'information",
          "Satisfaction du client",
          "Mécanique des solides",
          "Création d'entreprise",
          "Organisation des chantiers",
          "TP Fabrication (Tournage/Fraisage/Ajustage)",
          "Qualité",
          "TP Mécanique des solides",
          "TP énergétique",
          "TP productique",
          "Rentabilité des projets",
          "CAO",
          "Informatique industrielle",
          "Tribologie",
          "Communication en entreprise"
        ],
      },
      {
        label: "N5",
        ue: [
          "Projet productique",
          "Modélisation mécanique",
          "Méthodes de conception",
          "Projet énergétique",
          "Projet mécanique",
          "Logistique",
          "Management de l'entreprise et développement social",
          "Management de l'environnement/Risque industriel",
          "CMAO/Simulation",
          "Méthodes quantitatives"
        ],
      },
    ],
  }
];
export function getFilieres(): string[] {
  return LEVEL_DATA.map((f) => f.filiere);
}

export function getNiveauxForFiliere(filiere: string): NiveauOption[] {
  return LEVEL_DATA.find((f) => f.filiere === filiere)?.niveaux ?? [];
}

export function getUeForNiveau(filiere: string, niveauLabel: string): string[] {
  const niveau = getNiveauxForFiliere(filiere).find(
    (n) => n.label === niveauLabel,
  );
  return niveau?.ue ?? [];
}
