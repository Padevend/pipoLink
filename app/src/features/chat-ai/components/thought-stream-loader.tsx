import { BookOpen, Clock, Columns, HelpCircle, Layers, Sparkles } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

interface ThoughtStreamLoaderProps {
  type?: string;
}

const STEPS_MAP: Record<string, { label: string; icon: any; steps: string[] }> = {
  chat: {
    label: 'Réponse',
    icon: Sparkles,
    steps: [
      'Analyse du contexte...',
      'Recherche documentaire...',
      'Synthèse des informations...',
      'Hiro rédige la réponse...',
    ],
  },
  summary: {
    label: 'Résumé',
    icon: BookOpen,
    steps: [
      'Analyse des documents...',
      'Extraction des thèmes clés...',
      'Rédaction du résumé...',
    ],
  },
  faq: {
    label: 'FAQ',
    icon: HelpCircle,
    steps: [
      'Identification des questions...',
      'Formulation des réponses...',
      'Mise en forme de la FAQ...',
    ],
  },
  quiz: {
    label: 'Quiz',
    icon: Sparkles,
    steps: [
      'Analyse des objectifs...',
      'Génération des questions...',
      'Validation des réponses...',
    ],
  },
  flashcards: {
    label: 'Flashcards',
    icon: Layers,
    steps: [
      'Extraction des termes clés...',
      'Formatage Recto / Verso...',
      'Génération de la pile...',
    ],
  },
  timeline: {
    label: 'Chronologie',
    icon: Clock,
    steps: [
      'Relevé des jalons et dates...',
      'Ordonnancement chronologique...',
      'Finalisation de la chronologie...',
    ],
  },
  comparison: {
    label: 'Comparaison',
    icon: Columns,
    steps: [
      'Identification des critères...',
      'Analyse comparative...',
      'Construction du tableau...',
    ],
  },
};

export const ThoughtStreamLoader: React.FC<ThoughtStreamLoaderProps> = ({ type = 'chat' }) => {
  const config = STEPS_MAP[type.toLowerCase()] || STEPS_MAP.chat;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setCurrentStepIndex(0);
    fadeAnim.setValue(1);

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    shimmerLoop.start();

    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateLoop.start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStepIndex((prev) => (prev < config.steps.length - 1 ? prev + 1 : prev));
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }).start();
      });
    }, 2400);

    return () => {
      clearInterval(interval);
      shimmerLoop.stop();
      rotateLoop.stop();
      pulseLoop.stop();
    };
  }, [type]);

  const IconComponent = config.icon;

  return (
    <View className="self-start my-3 flex-row items-center gap-3 p-4 rounded-2xl bg-zinc-100 dark:bg-[#1A1A1A]">
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }],
        }}
        className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#222222]"
      >
        <IconComponent size={18} color="#F97316" strokeWidth={2.5} />
      </Animated.View>

      <Animated.Text
        style={{
          opacity: Animated.multiply(fadeAnim, shimmerAnim),
        }}
        className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400"
      >
        {config.steps[currentStepIndex]}
      </Animated.Text>
    </View>
  );
};