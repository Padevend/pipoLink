import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { Sparkles, BookOpen, Layers, HelpCircle, Clock, Columns } from 'lucide-react-native';
import { cn } from '@/shared/utils/cn';

interface ThoughtStreamLoaderProps {
  type?: string;
}

const STEPS_MAP: Record<string, { label: string; icon: any; steps: string[] }> = {
  chat: {
    label: 'Chat IA',
    icon: Sparkles,
    steps: [
      '🔍 Analyse du contexte documentaire...',
      '📚 Recherche des passages pertinents dans le notebook...',
      '🧬 Synthèse des connaissances...',
      '✍️ Hiro réfléchit à la meilleure structure...',
      '✨ Hiro peaufine votre réponse...',
    ],
  },
  summary: {
    label: 'Résumé',
    icon: BookOpen,
    steps: [
      '📖 Lecture approfondie des documents...',
      '🧠 Isolation des thèmes majeurs et définitions...',
      '📝 Synthèse des points clés et arguments principaux...',
      '✨ Structuration du résumé synthétique...',
    ],
  },
  faq: {
    label: 'FAQ',
    icon: HelpCircle,
    steps: [
      '🔍 Identification des questions essentielles...',
      '💡 Formulation des réponses claires et concises...',
      '📌 Structuration de la Foire aux Questions...',
    ],
  },
  quiz: {
    label: 'Quiz',
    icon: Sparkles,
    steps: [
      '🎯 Analyse des objectifs de révision...',
      '🎲 Génération des questions QCM et des distracteurs...',
      '✔️ Validation des bonnes réponses et explications...',
      '📌 Assemblage du formulaire interactif...',
    ],
  },
  flashcards: {
    label: 'Flashcards',
    icon: Layers,
    steps: [
      '⚡ Extraction des termes clés et définitions...',
      '🔄 Formatage des paires Recto (Question) / Verso (Réponse)...',
      '🃏 Création de la pile de cartes mémoires...',
    ],
  },
  timeline: {
    label: 'Chronologie',
    icon: Clock,
    steps: [
      '📅 Relevé des jalons, dates et étapes clés...',
      '⏳ Ordonnancement chronologique strict...',
      '📌 Finalisation du fil d\u2019événements...',
    ],
  },
  comparison: {
    label: 'Comparaison',
    icon: Columns,
    steps: [
      '⚖️ Identification des entités et des critères de comparaison...',
      '📊 Analyse croisée des forces et particularités...',
      '📌 Structuration du tableau comparatif...',
    ],
  },
};

export const ThoughtStreamLoader: React.FC<ThoughtStreamLoaderProps> = ({ type = 'chat' }) => {
  const config = STEPS_MAP[type.toLowerCase()] || STEPS_MAP.chat;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Fade animation for step transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  // Pulse animation for icon
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setCurrentStepIndex(0);
    fadeAnim.setValue(1);
    progressAnim.setValue(0);

    // Pulse animation loop for icon
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    const interval = setInterval(() => {
      // Fade out current step
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStepIndex((prev) => {
          const nextIndex = prev < config.steps.length - 1 ? prev + 1 : prev;
          return nextIndex;
        });
        // Fade in new step
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 2800);

    return () => {
      clearInterval(interval);
      pulseLoop.stop();
    };
  }, [type]);

  // Animate progress bar based on step
  useEffect(() => {
    const targetProgress = (currentStepIndex + 1) / config.steps.length;
    Animated.timing(progressAnim, {
      toValue: targetProgress,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [currentStepIndex, config.steps.length]);

  const IconComponent = config.icon;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View className="mx-4 my-3 p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40">
      {/* Header with pulsing icon */}
      <View className="flex-row items-center gap-2 mb-3">
        <Animated.View
          style={{ transform: [{ scale: pulseAnim }] }}
          className="p-1.5 rounded-lg bg-orange-500/10 dark:bg-orange-500/20"
        >
          <IconComponent size={16} color="#F97316" />
        </Animated.View>
        <Text className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
          Hiro travaille sur votre {config.label}
        </Text>
      </View>

      {/* Progress bar */}
      <View className="h-1 rounded-full bg-orange-200/50 dark:bg-zinc-800 mb-3 overflow-hidden">
        <Animated.View
          className="h-full rounded-full bg-orange-500"
          style={{ width: progressWidth }}
        />
      </View>

      {/* Thought Stream Line with fade transition */}
      <View className="flex-row items-center gap-2 mb-4 bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-xl border border-orange-100 dark:border-zinc-800">
        <View className="h-4 w-4 rounded-full bg-orange-500/20 items-center justify-center">
          <View className="h-2 w-2 rounded-full bg-orange-500" />
        </View>
        <Animated.Text
          style={{ opacity: fadeAnim }}
          className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1"
        >
          {config.steps[currentStepIndex]}
        </Animated.Text>
      </View>

      {/* Skeleton Preview Placeholder tailored per artifact */}
      {type === 'flashcards' && (
        <View className="h-24 rounded-xl border border-dashed border-orange-300/60 dark:border-orange-800/40 bg-orange-100/30 dark:bg-orange-900/10 items-center justify-center p-3">
          <View className="w-1/2 h-3 bg-orange-200 dark:bg-zinc-800 rounded mb-2" />
          <View className="w-3/4 h-2 bg-orange-200/60 dark:bg-zinc-800/60 rounded mb-3" />
          <View className="flex-row justify-center gap-2">
            <View className="px-3 py-1 rounded bg-orange-200/50 dark:bg-zinc-800/50">
              <Text className="text-[9px] text-orange-400 font-bold">RECTO</Text>
            </View>
            <View className="px-3 py-1 rounded bg-zinc-200/50 dark:bg-zinc-700/50">
              <Text className="text-[9px] text-zinc-400 font-bold">VERSO</Text>
            </View>
          </View>
        </View>
      )}

      {type === 'quiz' && (
        <View className="space-y-2">
          <View className="w-3/4 h-3 bg-orange-200/80 dark:bg-zinc-800 rounded mb-2" />
          <View className="h-7 bg-white dark:bg-zinc-900 rounded-lg border border-orange-100 dark:border-zinc-800 mb-1.5 flex-row items-center px-2.5">
            <View className="h-3 w-3 rounded-full border border-orange-200 dark:border-zinc-700 mr-2" />
            <View className="flex-1 h-2 bg-orange-100/80 dark:bg-zinc-800/60 rounded" />
          </View>
          <View className="h-7 bg-white dark:bg-zinc-900 rounded-lg border border-orange-100 dark:border-zinc-800 mb-1.5 flex-row items-center px-2.5">
            <View className="h-3 w-3 rounded-full border border-orange-200 dark:border-zinc-700 mr-2" />
            <View className="flex-1 h-2 bg-orange-100/60 dark:bg-zinc-800/40 rounded" />
          </View>
          <View className="h-7 bg-white dark:bg-zinc-900 rounded-lg border border-orange-100 dark:border-zinc-800 flex-row items-center px-2.5">
            <View className="h-3 w-3 rounded-full border border-orange-200 dark:border-zinc-700 mr-2" />
            <View className="flex-1 h-2 bg-orange-100/40 dark:bg-zinc-800/30 rounded" />
          </View>
        </View>
      )}

      {type === 'faq' && (
        <View className="space-y-1.5">
          {[0.9, 0.7, 0.5].map((opacity, i) => (
            <View
              key={i}
              className="rounded-lg border border-orange-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 flex-row items-center justify-between"
              style={{ opacity }}
            >
              <View className="flex-1 h-2.5 bg-orange-100 dark:bg-zinc-800 rounded mr-3" />
              <View className="h-3 w-3 rounded bg-orange-200/60 dark:bg-zinc-700" />
            </View>
          ))}
        </View>
      )}

      {type === 'comparison' && (
        <View className="rounded-xl border border-orange-100 dark:border-zinc-800 overflow-hidden">
          {/* Header row */}
          <View className="flex-row bg-orange-100/50 dark:bg-zinc-900">
            {[1, 2, 3].map((col) => (
              <View key={col} className="flex-1 p-2 border-r border-orange-100/60 dark:border-zinc-800">
                <View className="h-2.5 bg-orange-200/80 dark:bg-zinc-700 rounded" />
              </View>
            ))}
          </View>
          {/* Data rows */}
          {[0.8, 0.5].map((opacity, rIdx) => (
            <View key={rIdx} className="flex-row border-t border-orange-100/40 dark:border-zinc-800" style={{ opacity }}>
              {[1, 2, 3].map((col) => (
                <View key={col} className="flex-1 p-2 border-r border-orange-100/30 dark:border-zinc-800/60">
                  <View className="h-2 bg-orange-100/60 dark:bg-zinc-800/60 rounded" />
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      {type === 'timeline' && (
        <View className="pl-2">
          {[0.9, 0.6, 0.3].map((opacity, i) => (
            <View key={i} className="flex-row gap-2 pb-2" style={{ opacity }}>
              <View className="items-center">
                <View className="h-5 w-5 rounded-full bg-orange-300/60 dark:bg-zinc-700" />
                {i < 2 && <View className="w-0.5 flex-1 bg-orange-200/50 dark:bg-zinc-800 mt-1" />}
              </View>
              <View className="flex-1 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-orange-100 dark:border-zinc-800">
                <View className="h-2.5 w-1/3 bg-orange-200/80 dark:bg-zinc-700 rounded mb-1.5" />
                <View className="h-2 w-3/4 bg-orange-100/60 dark:bg-zinc-800/60 rounded" />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Default skeleton for summary/chat */}
      {type !== 'flashcards' && type !== 'quiz' && type !== 'faq' && type !== 'comparison' && type !== 'timeline' && (
        <View className="space-y-2">
          <View className="w-full h-2.5 bg-orange-200/60 dark:bg-zinc-800/80 rounded" />
          <View className="w-4/5 h-2.5 bg-orange-200/40 dark:bg-zinc-800/60 rounded" />
          <View className="w-2/3 h-2.5 bg-orange-200/30 dark:bg-zinc-800/40 rounded" />
        </View>
      )}
    </View>
  );
};
