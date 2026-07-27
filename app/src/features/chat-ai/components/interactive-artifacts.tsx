import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import {
  CheckCircle2,
  XCircle,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  Layers,
  Clock,
  Columns,
  Search,
  Check,
} from 'lucide-react-native';
import { cn } from '@/shared/utils/cn';

// ==========================================
// 1. QUIZ ARTIFACT COMPONENT
// ==========================================

interface QuizQuestion {
  id: number;
  question: string;
  options: { key: string; text: string; isCorrect: boolean }[];
  explanation: string;
}

export const QuizArtifact: React.FC<{ content: string }> = ({ content }) => {
  const questions = useMemo<QuizQuestion[]>(() => {
    const parsed: QuizQuestion[] = [];
    const blocks = content.split(/\*\*Question\s*\d+\s*:\*\*/i);

    blocks.slice(1).forEach((block, idx) => {
      const lines = block.trim().split('\n');
      const questionText = lines[0]?.trim() || `Question ${idx + 1}`;
      const options: { key: string; text: string; isCorrect: boolean }[] = [];
      let explanation = '';

      lines.slice(1).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
          const isCorrect = trimmed.startsWith('- [x]');
          const optContent = trimmed.replace(/- \[(x| )\]\s*/, '');
          const match = optContent.match(/^([A-Z]\))\s*(.*)/);
          if (match) {
            options.push({ key: match[1], text: match[2], isCorrect });
          } else {
            options.push({ key: `${options.length + 1}`, text: optContent, isCorrect });
          }
        } else if (trimmed.startsWith('*Explication') || trimmed.startsWith('Explication')) {
          explanation = trimmed.replace(/^\*?Explication\s*:\s*/i, '').replace(/\*$/, '');
        }
      });

      if (options.length > 0) {
        parsed.push({
          id: idx + 1,
          question: questionText,
          options,
          explanation,
        });
      }
    });

    return parsed;
  }, [content]);

  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (questions.length === 0) return null;

  const handleSelect = (qId: number, optionKey: string) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [qId]: optionKey }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q) => {
      const selected = userAnswers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect);
      if (selected && correctOpt && selected === correctOpt.key) {
        score += 1;
      }
    });
    return score;
  };

  const score = calculateScore();

  return (
    <View className="my-3 p-4 rounded-2xl bg-orange-50/40 dark:bg-zinc-900/80 border border-orange-200/60 dark:border-zinc-800">
      <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-orange-100 dark:border-zinc-800">
        <View className="flex-row items-center gap-2">
          <View className="p-1.5 rounded-lg bg-orange-500/10">
            <Sparkles size={16} color="#F97316" />
          </View>
          <Text className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Quiz QCM Interactif</Text>
        </View>
        <Text className="text-xs font-bold text-orange-600 dark:text-orange-400">
          {questions.length} Question{questions.length > 1 ? 's' : ''}
        </Text>
      </View>

      {questions.map((q) => {
        const selectedKey = userAnswers[q.id];

        return (
          <View key={q.id} className="mb-5 p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
            <Text className="font-bold text-xs text-zinc-900 dark:text-zinc-100 mb-3">
              {q.id}. {q.question}
            </Text>

            <View className="space-y-2">
              {q.options.map((opt) => {
                const isSelected = selectedKey === opt.key;
                let bgClass = "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800";
                let textClass = "text-zinc-700 dark:text-zinc-300";

                if (submitted) {
                  if (opt.isCorrect) {
                    bgClass = "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400";
                    textClass = "text-emerald-700 dark:text-emerald-300 font-bold";
                  } else if (isSelected && !opt.isCorrect) {
                    bgClass = "bg-red-50 dark:bg-red-950/30 border-red-400";
                    textClass = "text-red-700 dark:text-red-300";
                  }
                } else if (isSelected) {
                  bgClass = "bg-orange-50 dark:bg-orange-950/30 border-orange-500";
                  textClass = "text-orange-600 dark:text-orange-400 font-bold";
                }

                return (
                  <Pressable
                    key={opt.key}
                    disabled={submitted}
                    onPress={() => handleSelect(q.id, opt.key)}
                    className={cn("flex-row items-center justify-between p-2.5 rounded-lg border", bgClass)}
                  >
                    <Text className={cn("text-xs flex-1 pr-2", textClass)}>
                      <Text className="font-bold">{opt.key} </Text>
                      {opt.text}
                    </Text>

                    {submitted && opt.isCorrect && <CheckCircle2 size={16} color="#10B981" />}
                    {submitted && isSelected && !opt.isCorrect && <XCircle size={16} color="#EF4444" />}
                  </Pressable>
                );
              })}
            </View>

            {submitted && q.explanation ? (
              <View className="mt-3 p-2.5 rounded-lg bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/40">
                <Text className="text-[11px] font-semibold text-orange-800 dark:text-orange-300 leading-4">
                  💡 Explication : {q.explanation}
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}

      {/* Action Bar */}
      {!submitted ? (
        <Pressable
          onPress={() => setSubmitted(true)}
          disabled={Object.keys(userAnswers).length === 0}
          className={cn(
            "py-2.5 rounded-xl items-center justify-center",
            Object.keys(userAnswers).length > 0 ? "bg-orange-500 active:bg-orange-600" : "bg-zinc-200 dark:bg-zinc-800 opacity-50"
          )}
        >
          <Text className="text-xs font-bold text-white">Valider mes réponses</Text>
        </Pressable>
      ) : (
        <View className="items-center p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
          <Text className="text-sm font-bold text-orange-600 dark:text-orange-400 mb-1">
            Résultat : {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
          </Text>
          <Pressable
            onPress={() => {
              setUserAnswers({});
              setSubmitted(false);
            }}
            className="flex-row items-center gap-1.5 mt-2 bg-orange-500 px-4 py-1.5 rounded-lg"
          >
            <RotateCw size={12} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">Recommencer</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

// ==========================================
// 2. FLASHCARDS ARTIFACT COMPONENT
// ==========================================

interface Flashcard {
  id: number;
  recto: string;
  verso: string;
}

export const FlashcardArtifact: React.FC<{ content: string }> = ({ content }) => {
  const cards = useMemo<Flashcard[]>(() => {
    const parsed: Flashcard[] = [];
    const blocks = content.split(/###\s*Flashcard\s*\d+/i);

    blocks.slice(1).forEach((block, idx) => {
      let recto = '';
      let verso = '';

      const lines = block.split('\n');
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.toLowerCase().includes('recto')) {
          recto = trimmed.replace(/^-\s*\*\*Recto[^*]*\*\*:\s*/i, '').trim();
        } else if (trimmed.toLowerCase().includes('verso')) {
          verso = trimmed.replace(/^-\s*\*\*Verso[^*]*\*\*:\s*/i, '').trim();
        }
      });

      if (recto && verso) {
        parsed.push({ id: idx + 1, recto, verso });
      }
    });

    return parsed;
  }, [content]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (cards.length === 0) return null;

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  return (
    <View className="my-3 p-4 rounded-2xl bg-orange-50/40 dark:bg-zinc-900/80 border border-orange-200/60 dark:border-zinc-800">
      <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-orange-100 dark:border-zinc-800">
        <View className="flex-row items-center gap-2">
          <View className="p-1.5 rounded-lg bg-orange-500/10">
            <Layers size={16} color="#F97316" />
          </View>
          <Text className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Flashcards Réviseurs</Text>
        </View>
        <Text className="text-xs font-bold text-orange-600 dark:text-orange-400">
          Carte {currentIndex + 1} / {cards.length}
        </Text>
      </View>

      {/* 3D Flip Card Simulation */}
      <Pressable
        onPress={() => setIsFlipped(!isFlipped)}
        className={cn(
          "min-h-[140px] p-5 rounded-2xl justify-center items-center border shadow-sm my-2",
          isFlipped
            ? "bg-zinc-900 border-zinc-800 dark:bg-zinc-950"
            : "bg-white border-orange-200/80 dark:bg-zinc-900 dark:border-zinc-800"
        )}
      >
        <Text className={cn("text-[10px] uppercase font-bold tracking-widest mb-2", isFlipped ? "text-orange-400" : "text-zinc-400")}>
          {isFlipped ? '● Verso (Réponse)' : '○ Recto (Question)'}
        </Text>

        <Text className={cn("text-sm font-semibold text-center leading-6", isFlipped ? "text-white" : "text-zinc-800 dark:text-zinc-100")}>
          {isFlipped ? currentCard.verso : currentCard.recto}
        </Text>

        <Text className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-4">
          Toucher pour {isFlipped ? 'revenir à la question' : 'révéler la réponse'}
        </Text>
      </Pressable>

      {/* Navigation Controls */}
      <View className="flex-row items-center justify-between mt-3">
        <Pressable
          onPress={handlePrev}
          className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 active:opacity-80"
        >
          <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300">← Précédent</Text>
        </Pressable>

        <Pressable
          onPress={handleNext}
          className="px-4 py-2 rounded-xl bg-orange-500 active:bg-orange-600"
        >
          <Text className="text-xs font-bold text-white">Suivant →</Text>
        </Pressable>
      </View>
    </View>
  );
};

// ==========================================
// 3. FAQ ARTIFACT COMPONENT
// ==========================================

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

export const FaqArtifact: React.FC<{ content: string }> = ({ content }) => {
  const faqItems = useMemo<FaqItem[]>(() => {
    const parsed: FaqItem[] = [];
    const blocks = content.split(/\*\*Q\d+\s*:\s*/i);

    blocks.slice(1).forEach((block, idx) => {
      const qEndIndex = block.indexOf('**');
      if (qEndIndex !== -1) {
        const question = block.substring(0, qEndIndex).trim();
        const rest = block.substring(qEndIndex + 2);
        const answerMatch = rest.match(/\*R\s*:\s*([^*]+)\*/i) || rest.match(/R\s*:\s*(.*)/i);
        const answer = answerMatch ? answerMatch[1].trim() : rest.trim();

        parsed.push({ id: idx + 1, question, answer });
      }
    });

    return parsed;
  }, [content]);

  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  if (faqItems.length === 0) return null;

  const toggleItem = (id: number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredItems = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="my-3 p-4 rounded-2xl bg-orange-50/40 dark:bg-zinc-900/80 border border-orange-200/60 dark:border-zinc-800">
      <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-orange-100 dark:border-zinc-800">
        <View className="flex-row items-center gap-2">
          <View className="p-1.5 rounded-lg bg-orange-500/10">
            <HelpCircle size={16} color="#F97316" />
          </View>
          <Text className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Foire Aux Questions (FAQ)</Text>
        </View>
        <Text className="text-xs font-bold text-orange-600 dark:text-orange-400">
          {faqItems.length} Question{faqItems.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search Input */}
      <View className="flex-row items-center gap-2 bg-white dark:bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-3">
        <Search size={14} color="#A1A1AA" />
        <TextInput
          placeholder="Rechercher dans la FAQ..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="flex-1 text-xs text-zinc-900 dark:text-zinc-50 p-0"
          placeholderTextColor="#A1A1AA"
        />
      </View>

      {/* Accordion List */}
      {filteredItems.map((item) => {
        const isExpanded = !!expandedIds[item.id];

        return (
          <View key={item.id} className="mb-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
            <Pressable
              onPress={() => toggleItem(item.id)}
              className="flex-row items-center justify-between p-3 active:bg-zinc-50 dark:active:bg-zinc-900"
            >
              <Text className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex-1 pr-2">
                Q{item.id}. {item.question}
              </Text>
              {isExpanded ? <ChevronUp size={16} color="#F97316" /> : <ChevronDown size={16} color="#71717A" />}
            </Pressable>

            {isExpanded && (
              <View className="p-3 bg-orange-50/50 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800">
                <Text className="text-xs leading-5 text-zinc-700 dark:text-zinc-300">
                  {item.answer}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

// ==========================================
// 4. TIMELINE ARTIFACT COMPONENT
// ==========================================

interface TimelineItem {
  id: number;
  title: string;
  description: string;
}

export const TimelineArtifact: React.FC<{ content: string }> = ({ content }) => {
  const items = useMemo<TimelineItem[]>(() => {
    const parsed: TimelineItem[] = [];
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- **')) {
        const match = trimmed.match(/^-\s*\*\*([^*]+)\*\*\s*:\s*(.*)/);
        if (match) {
          parsed.push({
            id: idx + 1,
            title: match[1],
            description: match[2],
          });
        }
      }
    });

    return parsed;
  }, [content]);

  if (items.length === 0) return null;

  return (
    <View className="my-3 p-4 rounded-2xl bg-orange-50/40 dark:bg-zinc-900/80 border border-orange-200/60 dark:border-zinc-800">
      <View className="flex-row items-center gap-2 mb-4 pb-2 border-b border-orange-100 dark:border-zinc-800">
        <View className="p-1.5 rounded-lg bg-orange-500/10">
          <Clock size={16} color="#F97316" />
        </View>
        <Text className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Chronologie des Événements</Text>
      </View>

      {/* Vertical Timeline Node List */}
      <View className="pl-2">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <View key={item.id} className="flex-row gap-3 relative pb-4">
              {/* Connector line */}
              {!isLast && (
                <View className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-orange-200 dark:bg-zinc-800" />
              )}

              {/* Node Badge */}
              <View className="h-6 w-6 rounded-full bg-orange-500 items-center justify-center z-10">
                <Text className="text-[10px] font-bold text-white">{idx + 1}</Text>
              </View>

              {/* Card Content */}
              <View className="flex-1 p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
                <Text className="font-bold text-xs text-orange-600 dark:text-orange-400 mb-1">
                  {item.title}
                </Text>
                <Text className="text-xs text-zinc-700 dark:text-zinc-300 leading-5">
                  {item.description}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ==========================================
// 5. COMPARISON ARTIFACT COMPONENT
// ==========================================

export const ComparisonArtifact: React.FC<{ content: string }> = ({ content }) => {
  const tableData = useMemo(() => {
    const lines = content.split('\n').filter((l) => l.trim().startsWith('|'));
    if (lines.length < 2) return null;

    const headers = lines[0]
      .split('|')
      .map((h) => h.trim())
      .filter((h) => h.length > 0);

    const rows = lines.slice(2).map((row) =>
      row
        .split('|')
        .map((c) => c.trim())
        .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
    );

    return { headers, rows };
  }, [content]);

  if (!tableData) return null;

  return (
    <View className="my-3 p-4 rounded-2xl bg-orange-50/40 dark:bg-zinc-900/80 border border-orange-200/60 dark:border-zinc-800">
      <View className="flex-row items-center gap-2 mb-3 pb-2 border-b border-orange-100 dark:border-zinc-800">
        <View className="p-1.5 rounded-lg bg-orange-500/10">
          <Columns size={16} color="#F97316" />
        </View>
        <Text className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Matrice Comparative</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
          {/* Header */}
          <View className="flex-row bg-orange-500/10 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            {tableData.headers.map((head, idx) => (
              <View key={idx} className="p-3 w-36 border-r border-zinc-200 dark:border-zinc-800 justify-center">
                <Text className="font-bold text-xs text-orange-600 dark:text-orange-400">{head}</Text>
              </View>
            ))}
          </View>

          {/* Rows */}
          {tableData.rows.map((row, rIdx) => (
            <View key={rIdx} className={cn("flex-row border-b border-zinc-100 dark:border-zinc-800", rIdx % 2 === 1 ? "bg-zinc-50/50 dark:bg-zinc-900/30" : "")}>
              {row.map((cell, cIdx) => (
                <View key={cIdx} className="p-3 w-36 border-r border-zinc-100 dark:border-zinc-800 justify-center">
                  <Text className="text-xs text-zinc-700 dark:text-zinc-300 leading-4">{cell.replace(/\*\*/g, '')}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
