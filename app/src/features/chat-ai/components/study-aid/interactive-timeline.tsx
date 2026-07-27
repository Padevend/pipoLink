import { cn } from '@/shared/utils/cn';
import { Clock, Sparkles } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MarkdownLatexRenderer } from './markdown-latex-renderer';

export interface TimelineNode {
  id: number;
  period: string;
  title: string;
  description: string;
}

export function parseTimelineFromMarkdown(text: string): TimelineNode[] {
  const nodes: TimelineNode[] = [];
  const lines = text.split('\n');

  let current: Partial<TimelineNode> | null = null;
  let count = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // e.g. "### 1914-1918 : Première Guerre mondiale" or "**1. Step 1 (2020)**"
    const timeMatch = line.match(/^(?:###|\*\*|\d+\.)\s*(?:(\d{4}[^\:]*|Étape\s*\d+))[:\s-]*(.*)/i);
    if (timeMatch) {
      if (current && current.title) {
        nodes.push(current as TimelineNode);
      }
      count++;
      current = {
        id: count,
        period: timeMatch[1].replace(/\*\*/g, '').trim(),
        title: timeMatch[2].replace(/\*\*/g, '').trim() || timeMatch[1].replace(/\*\*/g, '').trim(),
        description: '',
      };
      continue;
    }

    if (current && current.title) {
      current.description += (current.description ? '\n' : '') + line;
    }
  }

  if (current && current.title) {
    nodes.push(current as TimelineNode);
  }

  return nodes;
}

export function InteractiveTimelineCard({ content }: { content: string }) {
  const nodes = useMemo(() => parseTimelineFromMarkdown(content), [content]);

  if (nodes.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      className="my-3 rounded-2xl border border-orange-200/80 dark:border-orange-950/60 bg-gradient-to-b from-orange-50/90 to-white dark:from-zinc-900 dark:to-zinc-950 p-4 shadow-md"
    >
      {/* Header Chronologie */}
      <View className="flex-row items-center gap-2 border-b border-orange-100 dark:border-zinc-800 pb-3 mb-4">
        <View className="p-2 rounded-xl bg-orange-500/10 dark:bg-orange-500/20">
          <Clock size={18} color="#F97316" />
        </View>
        <View>
          <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Chronologie & Frise Temporelle
          </Text>
          <Text className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {nodes.length} jalons chronologiques clés
          </Text>
        </View>
      </View>

      {/* Frise Temporelle Connectée */}
      <View className="pl-2 relative">
        {nodes.map((node, index) => {
          const isLast = index === nodes.length - 1;

          return (
            <View key={node.id} className="flex-row items-start relative mb-4">
              {/* Ligne verticale de connexion */}
              {!isLast && (
                <View className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-orange-200 dark:bg-zinc-800" />
              )}

              {/* Noeud de jalon */}
              <View className="h-6 w-6 rounded-full bg-orange-500 items-center justify-center border-2 border-white dark:border-zinc-900 shadow-sm z-10 mr-3 mt-0.5">
                <Text className="text-[10px] font-extrabold text-white">
                  {node.id}
                </Text>
              </View>

              {/* Contenu du jalon */}
              <View className="flex-1 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex-1">
                    {node.title}
                  </Text>
                  {node.period && (
                    <Text className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded ml-2">
                      {node.period}
                    </Text>
                  )}
                </View>
                {node.description ? (
                  <MarkdownLatexRenderer content={node.description} isAi={true} />
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}
