import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { Sparkles, BookOpen, Layers, HelpCircle, Clock, Columns } from 'lucide-react-native';

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

  // Text transition fade
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Continuous Shimmer effect loop
  const shimmerAnim = useRef(new Animated.Value(0.5)).current;

  // Smooth rotation for loader icon (ChatGPT / Gemini style)
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for loader icon glow
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setCurrentStepIndex(0);
    fadeAnim.setValue(1);

    // Continuous shimmer loop
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

    // Continuous rotation loop
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateLoop.start();

    // Pulse loop for icon
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

    // Automatic step transition interval
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
    <View className="self-start my-1.5 flex-row items-center gap-2">
      {/* Animated icon (rotates & pulses smoothly) */}
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }],
        }}
      >
        <IconComponent size={14} color="#F97316" />
      </Animated.View>

      {/* Text with shimmer effect & automatic step transition */}
      <Animated.Text
        style={{
          opacity: Animated.multiply(fadeAnim, shimmerAnim),
        }}
        className="text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-tight"
      >
        {config.steps[currentStepIndex]}
      </Animated.Text>
    </View>
  );
};


