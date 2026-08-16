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
      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      {/* Header Flashcard Minimaliste */}
      <View className="flex-row items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50 pb-1.5 mb-1.5">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
            Carte mémoire
          </Text>
          <Text className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {currentIndex + 1} / {cards.length}
          </Text>
        </View>

        <Pressable
          onPress={handleReset}
          className="p-1.5 active:opacity-70"
        >
          <RotateCcw size={12} color="#A1A1AA" />
        </Pressable>
      </View>

      {/* Barre de Progression Discrète */}
      <View className="h-0.5 w-full bg-zinc-200/60 dark:bg-zinc-800 rounded-full mb-2 overflow-hidden">
        <View
          className="h-full bg-orange-500/60 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </View>

      {/* Carte à Retournement 3D */}
      <Pressable onPress={toggleFlip} className="min-h-[180px] relative justify-center mb-2">
        {/* RECTO / QUESTION */}
        <Animated.View
          style={[frontStyle]}
          className={cn(
            'min-h-[180px] justify-center',
            isFlipped ? 'hidden' : 'flex'
          )}
        >
          <View className="flex-row items-start justify-between mb-2">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Question
            </Text>
            <Text className="text-[11px] text-zinc-400">Toucher pour révéler</Text>
          </View>

          <View className="my-auto">
            <MarkdownLatexRenderer content={currentCard.front || 'Question...'} isAi={true} />
          </View>
        </Animated.View>

        {/* VERSO / RÉPONSE */}
        <Animated.View
          style={[backStyle]}
          className={cn(
            'max-h-auto justify-center',
            !isFlipped ? 'hidden' : 'flex'
          )}
        >
          <View className="flex-row items-start justify-between mb-2">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Réponse
            </Text>
            <Text className="text-[11px] text-zinc-400">Toucher pour révéler</Text>
          </View>

          <View className="my-auto">
            <MarkdownLatexRenderer content={currentCard.back || 'Réponse...'} isAi={true} />
          </View>
        </Animated.View>
      </Pressable>

      {/* Actions de Maîtrise & Navigation */}
      <View className="flex-row items-center justify-between gap-2 mt-3">
        <Pressable
          disabled={currentIndex === 0}
          onPress={handlePrev}
          className={cn(
            'p-1.5 rounded-full border',
            currentIndex === 0
              ? 'border-zinc-200/50 dark:border-zinc-800/50 opacity-40'
              : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 active:bg-zinc-100'
          )}
        >
          <ChevronLeft size={14} color="#A1A1AA" />
        </Pressable>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => handleMarkKnown(false)}
            className="py-1 px-2.5 rounded-full border border-red-500/30 bg-red-500/10 items-center active:scale-95"
          >
            <Text className="text-[10px] font-semibold text-red-600 dark:text-red-400">
              Réviser
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleMarkKnown(true)}
            className="py-1 px-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 items-center active:scale-95 flex-row justify-center gap-1"
          >
            <Check size={11} color="#22C55E" />
            <Text className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Maîtrisé
            </Text>
          </Pressable>
        </View>

        <Pressable
          disabled={currentIndex === cards.length - 1}
          onPress={handleNext}
          className={cn(
            'p-1.5 rounded-full border',
            currentIndex === cards.length - 1
              ? 'border-zinc-200/50 dark:border-zinc-800/50 opacity-40'
              : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 active:bg-zinc-100'
          )}
        >
          <ChevronRight size={14} color="#A1A1AA" />
        </Pressable>
      </View>
      
      {/* Retour discret au début */}
      {currentIndex > 0 && (
        <Pressable onPress={handleReset} className="items-center mt-2">
          <Text className="text-[11px] text-zinc-400 underline">Recommencer</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}
