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
    if (selectedAnswers[qId]) return;
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
      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      {/* Header du Quiz Minimaliste */}
      <View className="flex-row items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50 pb-1.5 mb-1.5">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
            Quiz Interactif
          </Text>
          <Text className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {answeredCount} / {totalQuestions}
          </Text>
        </View>

        {answeredCount > 0 && (
          <Pressable
            onPress={handleReset}
            className="p-1.5 active:opacity-70"
          >
            <RefreshCw size={11} color="#A1A1AA" />
          </Pressable>
        )}
      </View>

      {/* Liste des Questions */}
      <View className="gap-1.5">
        {questions.map((q, qIndex) => {
          const userAns = selectedAnswers[q.id];
          const isAnswered = !!userAns;
          const isCorrect = userAns === q.correctAnswer;

          return (
            <View
              key={q.id}
              className="rounded border border-zinc-200/40 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/50 p-2.5"
            >
              <View className="flex-row items-start gap-1.5 mb-1.5">
                <Text className="text-[11px] font-bold text-orange-500 mt-0.5">
                  {qIndex + 1}.
                </Text>
                <Text className="flex-1 text-[10px] font-medium text-zinc-800 dark:text-zinc-200 leading-4">
                  {q.question}
                </Text>
              </View>

              {/* Options A, B, C, D */}
              <View className="gap-1">
                {q.options.map((opt) => {
                  const isSelected = userAns === opt.key;
                  const isOptionCorrect = opt.key === q.correctAnswer;

                  let optionStyle = 'border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50';
                  let textStyle = 'text-zinc-700 dark:text-zinc-300';
                  let icon = null;

                  if (isAnswered) {
                    if (isOptionCorrect) {
                      optionStyle = 'border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/20';
                      textStyle = 'text-emerald-700 dark:text-emerald-300 font-semibold';
                      icon = <CheckCircle2 size={12} color="#22C55E" />;
                    } else if (isSelected) {
                      optionStyle = 'border-red-500/40 bg-red-500/10 dark:bg-red-950/20';
                      textStyle = 'text-red-700 dark:text-red-300 font-semibold';
                      icon = <XCircle size={12} color="#EF4444" />;
                    }
                  }

                  return (
                    <Pressable
                      key={opt.key}
                      disabled={isAnswered}
                      onPress={() => handleSelectOption(q.id, opt.key)}
                      className={cn(
                        'flex-row items-center justify-between p-1.5 rounded border transition-all active:scale-[0.98]',
                        optionStyle
                      )}
                    >
                      <View className="flex-row items-center gap-1.5 flex-1 pr-1">
                        <View
                          className={cn(
                            'h-3.5 w-3.5 rounded-full items-center justify-center border text-[11px] font-bold',
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
                              'text-[8px] font-bold',
                              isSelected || (isAnswered && isOptionCorrect)
                                ? 'text-white'
                                : 'text-zinc-500 dark:text-zinc-400'
                            )}
                          >
                            {opt.key}
                          </Text>
                        </View>
                        <Text className={cn('text-[10px] flex-1 leading-4', textStyle)}>
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
                <View className="mt-1.5 pl-1.5 border-l-2 border-orange-500/30 dark:border-orange-500/50">
                  <View className="flex-row items-start gap-1">
                    <HelpCircle size={11} color="#F97316" className="mt-0.5" />
                    <View className="flex-1">
                      <Text className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                        {isCorrect ? 'Correct' : `Réponse : ${q.correctAnswer}`}
                      </Text>
                      {q.explanation && (
                        <Text className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-3">
                          {q.explanation}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}
