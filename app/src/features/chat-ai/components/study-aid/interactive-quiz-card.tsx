import { cn } from '@/shared/utils/cn';
import { CheckCircle2, HelpCircle, RefreshCw, Sparkles, XCircle } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export interface QuizQuestion {
  id: number;
  question: string;
  options: { key: string; text: string }[];
  correctAnswer: string; // e.g. "A" or "B"
  explanation?: string;
}

/**
 * Parser intelligent pour extraire les questions de quiz d'un texte markdown
 */
export function parseQuizFromMarkdown(text: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const lines = text.split('\n');

  let currentQ: Partial<QuizQuestion> | null = null;
  let qCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Question header: e.g. "### Question 1: ..." or "1. ..." or "**Q1. ...**"
    const qMatch = line.match(/^(?:###|\*\*|\d+\.|\bQ\d+[:.])\s*(?:Question\s*\d+[:.])?\s*(.+)/i);
    if (qMatch && (line.toLowerCase().includes('question') || line.match(/^\d+[\.\)]/))) {
      if (currentQ && currentQ.question && currentQ.options && currentQ.options.length > 0) {
        questions.push(currentQ as QuizQuestion);
      }
      qCount++;
      currentQ = {
        id: qCount,
        question: qMatch[1].replace(/\*\*/g, '').trim(),
        options: [],
        correctAnswer: 'A',
      };
      continue;
    }

    // Option: e.g. "- A) Option text" or "A. Option text" or "* A) Option"
    const optMatch = line.match(/^(?:-|\*|\d+\.)?\s*([A-D])[\.\)]\s*(.+)/i);
    if (optMatch && currentQ) {
      currentQ.options = currentQ.options || [];
      currentQ.options.push({
        key: optMatch[1].toUpperCase(),
        text: optMatch[2].replace(/\*\*/g, '').trim(),
      });
      continue;
    }

    // Answer & Explanation: e.g. "*Réponse correcte:* A" or "Réponse: B - Explication..."
    const ansMatch = line.match(/(?:Réponse|Answer|Correct)[:\s]*([A-D])(?:\s*-\s*(.+))?/i);
    if (ansMatch && currentQ) {
      currentQ.correctAnswer = ansMatch[1].toUpperCase();
      if (ansMatch[2]) {
        currentQ.explanation = ansMatch[2].trim();
      }
      continue;
    }

    const expMatch = line.match(/(?:Explication|Explication:)\s*(.+)/i);
    if (expMatch && currentQ) {
      currentQ.explanation = expMatch[1].replace(/\*\*/g, '').trim();
    }
  }

  if (currentQ && currentQ.question && currentQ.options && currentQ.options.length > 0) {
    questions.push(currentQ as QuizQuestion);
  }

  return questions;
}

export function InteractiveQuizCard({ content }: { content: string }) {
  const questions = useMemo(() => parseQuizFromMarkdown(content), [content]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});

  if (questions.length === 0) return null;

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = questions.filter(
    (q) => selectedAnswers[q.id] === q.correctAnswer
  ).length;

  const handleSelectOption = (qId: number, optionKey: string) => {
    if (selectedAnswers[qId]) return; // Verrouille après sélection pour donner un vrai feedback de quiz
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionKey }));
    setShowExplanations((prev) => ({ ...prev, [qId]: true }));
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowExplanations({});
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      className="my-3 rounded-2xl border border-orange-200/80 dark:border-orange-950/60 bg-gradient-to-b from-orange-50/90 to-white dark:from-zinc-900 dark:to-zinc-950 p-4 shadow-md"
    >
      {/* Header du Quiz */}
      <View className="flex-row items-center justify-between border-b border-orange-100 dark:border-zinc-800 pb-3 mb-3">
        <View className="flex-row items-center gap-2">
          <View className="p-2 rounded-xl bg-orange-500/10 dark:bg-orange-500/20">
            <Sparkles size={18} color="#F97316" />
          </View>
          <View>
            <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Quiz Interactif
            </Text>
            <Text className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {answeredCount} sur {totalQuestions} questions répondues
            </Text>
          </View>
        </View>

        {answeredCount > 0 && (
          <Pressable
            onPress={handleReset}
            className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/50 active:bg-orange-200"
          >
            <RefreshCw size={12} color="#F97316" />
            <Text className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
              Réinitialiser
            </Text>
          </Pressable>
        )}
      </View>

      {/* Barre de Score de Progression */}
      {answeredCount === totalQuestions && (
        <Animated.View
          entering={FadeIn.duration(200)}
          className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-2">
            <Sparkles size={20} color="#F97316" />
            <View>
              <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Quiz Terminé !
              </Text>
              <Text className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Score final : {correctCount} / {totalQuestions} ({Math.round((correctCount / totalQuestions) * 100)}%)
              </Text>
            </View>
          </View>
          <View className="px-3 py-1 rounded-full bg-orange-500">
            <Text className="text-xs font-extrabold text-white">
              {Math.round((correctCount / totalQuestions) * 100)}%
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Liste des Questions */}
      <View className="gap-4">
        {questions.map((q, qIndex) => {
          const userAns = selectedAnswers[q.id];
          const isAnswered = !!userAns;
          const isCorrect = userAns === q.correctAnswer;

          return (
            <View
              key={q.id}
              className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 shadow-sm"
            >
              <View className="flex-row items-start gap-2 mb-2.5">
                <Text className="text-xs font-bold text-orange-500 mt-0.5">
                  {qIndex + 1}.
                </Text>
                <Text className="flex-1 text-xs font-semibold text-zinc-800 dark:text-zinc-100 leading-4">
                  {q.question}
                </Text>
              </View>

              {/* Options A, B, C, D */}
              <View className="gap-2">
                {q.options.map((opt) => {
                  const isSelected = userAns === opt.key;
                  const isOptionCorrect = opt.key === q.correctAnswer;

                  let optionStyle = 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900';
                  let textStyle = 'text-zinc-700 dark:text-zinc-300';
                  let icon = null;

                  if (isAnswered) {
                    if (isOptionCorrect) {
                      optionStyle = 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30';
                      textStyle = 'text-emerald-700 dark:text-emerald-300 font-bold';
                      icon = <CheckCircle2 size={14} color="#22C55E" />;
                    } else if (isSelected) {
                      optionStyle = 'border-red-500 bg-red-500/10 dark:bg-red-950/30';
                      textStyle = 'text-red-700 dark:text-red-300 font-bold';
                      icon = <XCircle size={14} color="#EF4444" />;
                    }
                  }

                  return (
                    <Pressable
                      key={opt.key}
                      disabled={isAnswered}
                      onPress={() => handleSelectOption(q.id, opt.key)}
                      className={cn(
                        'flex-row items-center justify-between p-2.5 rounded-lg border transition-all active:scale-[0.99]',
                        optionStyle
                      )}
                    >
                      <View className="flex-row items-center gap-2 flex-1 pr-2">
                        <View
                          className={cn(
                            'h-5 w-5 rounded-full items-center justify-center border text-[10px] font-bold',
                            isSelected
                              ? isCorrect
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'bg-red-500 border-red-500'
                              : isAnswered && isOptionCorrect
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                          )}
                        >
                          <Text
                            className={cn(
                              'text-[10px] font-bold',
                              isSelected || (isAnswered && isOptionCorrect)
                                ? 'text-white'
                                : 'text-zinc-600 dark:text-zinc-400'
                            )}
                          >
                            {opt.key}
                          </Text>
                        </View>
                        <Text className={cn('text-xs flex-1 leading-4', textStyle)}>
                          {opt.text}
                        </Text>
                      </View>
                      {icon}
                    </Pressable>
                  );
                })}
              </View>

              {/* Explication */}
              {isAnswered && (q.explanation || isCorrect) && (
                <Animated.View
                  entering={FadeIn.duration(150)}
                  className="mt-3 p-2.5 rounded-lg bg-orange-50/70 dark:bg-zinc-800/80 border border-orange-200/50 dark:border-zinc-700/50 flex-row items-start gap-2"
                >
                  <HelpCircle size={14} color="#F97316" className="mt-0.5" />
                  <View className="flex-1">
                    <Text className="text-[11px] font-bold text-orange-700 dark:text-orange-300">
                      {isCorrect ? 'Excellente réponse !' : `Réponse correcte : Option ${q.correctAnswer}`}
                    </Text>
                    {q.explanation && (
                      <Text className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-0.5 leading-4">
                        {q.explanation}
                      </Text>
                    )}
                  </View>
                </Animated.View>
              )}
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}
