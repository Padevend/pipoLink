import { cn } from '@/shared/utils/cn';
import { Check, ChevronLeft, ChevronRight, Layers, RefreshCw, RotateCcw, Sparkles, Eye } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MarkdownLatexRenderer } from './markdown-latex-renderer';

export interface FlashcardItem {
  id: number;
  front: string;
  back: string;
}

/**
 * Parser pour extraire les cartes mémoire (recto/verso) d'un texte markdown
 */
export function parseFlashcardsFromMarkdown(text: string): FlashcardItem[] {
  const cards: FlashcardItem[] = [];
  const lines = text.split('\n');

  let currentCard: Partial<FlashcardItem> | null = null;
  let cardCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // En-tête de carte: e.g. "### Carte 1", "### Flashcard 1", "**Flashcard 1**"
    const cardMatch = line.match(/^(?:###|\*\*|\d+\.)\s*(?:Carte|Flashcard)\s*\d+[:.]?\s*(.*)/i);
    if (cardMatch || line.toLowerCase().includes('carte ') || line.toLowerCase().includes('flashcard ')) {
      if (currentCard && currentCard.front && currentCard.back) {
        cards.push(currentCard as FlashcardItem);
      }
      cardCount++;
      currentCard = {
        id: cardCount,
        front: cardMatch ? cardMatch[1].replace(/\*\*/g, '').trim() : '',
        back: '',
      };
      continue;
    }

    // Recto / Question: e.g. "**Recto / Question:** ..."
    const frontMatch = line.match(/(?:Recto|Question|Front)[:\s]*(.+)/i);
    if (frontMatch && currentCard) {
      currentCard.front = frontMatch[1].replace(/\*\*/g, '').trim();
      continue;
    }

    // Verso / Réponse: e.g. "**Verso / Réponse:** ..."
    const backMatch = line.match(/(?:Verso|Réponse|Answer|Back)[:\s]*(.+)/i);
    if (backMatch && currentCard) {
      currentCard.back = backMatch[1].replace(/\*\*/g, '').trim();
      continue;
    }

    // Ligne continue si sous recto ou verso
    if (currentCard) {
      if (currentCard.back !== undefined && currentCard.back !== '') {
        currentCard.back += '\n' + line;
      } else if (currentCard.front !== undefined && currentCard.front !== '') {
        currentCard.front += '\n' + line;
      }
    }
  }

  if (currentCard && currentCard.front && currentCard.back) {
    cards.push(currentCard as FlashcardItem);
  }

  return cards;
}

export function InteractiveFlashcardCard({ content }: { content: string }) {
  const cards = useMemo(() => parseFlashcardsFromMarkdown(content), [content]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Suivi des cartes maîtrisées
  const [knownCards, setKnownCards] = useState<Record<number, boolean>>({});

  // Animation 3D Flip
  const flipAnim = useSharedValue(0);

  const toggleFlip = () => {
    if (isFlipped) {
      flipAnim.value = withTiming(0, { duration: 250 });
      setIsFlipped(false);
    } else {
      flipAnim.value = withTiming(1, { duration: 250 });
      setIsFlipped(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      flipAnim.value = 0;
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      flipAnim.value = 0;
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleMarkKnown = (known: boolean) => {
    setKnownCards((prev) => ({ ...prev, [cards[currentIndex].id]: known }));
    handleNext();
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    flipAnim.value = 0;
    setKnownCards({});
  };

  if (cards.length === 0) return null;

  const currentCard = cards[currentIndex];
  const knownCount = Object.values(knownCards).filter(Boolean).length;
  const isDeckCompleted = currentIndex === cards.length - 1 && knownCards[currentCard.id] !== undefined;

  const frontStyle = useAnimatedStyle(() => {
    const rotate = interpolate(flipAnim.value, [0, 1], [0, 180]);
    return {
      transform: [{ rotateY: `${rotate}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotate = interpolate(flipAnim.value, [0, 1], [180, 360]);
    return {
      transform: [{ rotateY: `${rotate}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      className="my-3 rounded-2xl border border-orange-200/80 dark:border-orange-950/60 bg-gradient-to-b from-orange-50/90 to-white dark:from-zinc-900 dark:to-zinc-950 p-4"
    >
      {/* Header Flashcard */}
      <View className="flex-row items-center justify-between border-b border-orange-100 dark:border-zinc-800 pb-3 mb-3">
        <View className="flex-row items-center gap-2">
          <View className="p-2 rounded-xl bg-orange-500/10 dark:bg-orange-500/20">
            <Layers size={18} color="#F97316" />
          </View>
          <View>
            <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Flashcards Interactives
            </Text>
            <Text className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Carte {currentIndex + 1} sur {cards.length} ({knownCount} maîtrisées)
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleReset}
          className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950/50 active:bg-orange-200"
        >
          <RotateCcw size={14} color="#F97316" />
        </Pressable>
      </View>

      {/* Barre de Progression */}
      <View className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full mb-4 overflow-hidden">
        <View
          className="h-full bg-orange-500 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </View>

      {/* Carte à Retournement 3D */}
      <Pressable onPress={toggleFlip} className="min-h-[160px] relative justify-center mb-4">
        {/* RECTO / QUESTION */}
        <Animated.View
          style={[frontStyle]}
          className={cn(
            'p-5 rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm justify-between min-h-[160px]',
            isFlipped ? 'hidden' : 'flex',
            'border-zinc-200 dark:border-zinc-800'
          )}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[10px] font-extrabold uppercase tracking-wider text-orange-500 bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded">
              Question / Recto
            </Text>
            <View className="flex-row items-center gap-1">
              <Eye size={12} color="#A1A1AA" />
              <Text className="text-[10px] text-zinc-400">Toucher pour révéler</Text>
            </View>
          </View>

          <View className="my-auto py-2">
            <MarkdownLatexRenderer content={currentCard.front || 'Question...'} isAi={true} />
          </View>
        </Animated.View>

        {/* VERSO / RÉPONSE */}
        <Animated.View
          style={[backStyle]}
          className={cn(
            'p-5 rounded-2xl border bg-orange-50/90 dark:bg-zinc-900 shadow-sm justify-between min-h-[160px]',
            !isFlipped ? 'hidden' : 'flex',
            'border-orange-300/80 dark:border-orange-950/60'
          )}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
              Réponse / Verso
            </Text>
            <Text className="text-[10px] text-zinc-400">Toucher pour tourner</Text>
          </View>

          <View className="my-auto py-2">
            <MarkdownLatexRenderer content={currentCard.back || 'Réponse...'} isAi={true} />
          </View>
        </Animated.View>
      </Pressable>

      {/* Actions de Maîtrise & Navigation */}
      <View className="flex-row items-center justify-between gap-2">
        <Pressable
          disabled={currentIndex === 0}
          onPress={handlePrev}
          className={cn(
            'p-2.5 rounded-xl border flex-row items-center justify-center',
            currentIndex === 0
              ? 'border-zinc-200 dark:border-zinc-800 opacity-40'
              : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 active:bg-zinc-100'
          )}
        >
          <ChevronLeft size={18} color="#71717A" />
        </Pressable>

        <View className="flex-1 flex-row items-center gap-2 justify-center">
          <Pressable
            onPress={() => handleMarkKnown(false)}
            className="flex-1 py-2.5 px-3 rounded-xl border border-red-200 dark:border-red-950/60 bg-red-50 dark:bg-red-950/30 items-center active:scale-95"
          >
            <Text className="text-xs font-bold text-red-600 dark:text-red-400">
              À réviser
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleMarkKnown(true)}
            className="flex-1 py-2.5 px-3 rounded-xl border border-emerald-200 dark:border-emerald-950/60 bg-emerald-50 dark:bg-emerald-950/30 items-center active:scale-95 flex-row justify-center gap-1"
          >
            <Check size={14} color="#22C55E" />
            <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Maîtrisé
            </Text>
          </Pressable>
        </View>

        <Pressable
          disabled={currentIndex === cards.length - 1}
          onPress={handleNext}
          className={cn(
            'p-2.5 rounded-xl border flex-row items-center justify-center',
            currentIndex === cards.length - 1
              ? 'border-zinc-200 dark:border-zinc-800 opacity-40'
              : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 active:bg-zinc-100'
          )}
        >
          <ChevronRight size={18} color="#71717A" />
        </Pressable>
      </View>
    </Animated.View>
  );
}
