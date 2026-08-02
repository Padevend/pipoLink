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
      className=" bg-white dark:bg-zinc-950 pl-3.5 pr-3 py-2.5"
    >
      {/* Header Chronologie Minimaliste */}
      <View className="flex-row items-center gap-1.5 border-b border-zinc-200/50 dark:border-zinc-800/50 pb-1.5 mb-1.5">
        <Text className="text-[9px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
          Chronologie
        </Text>
        <Text className="text-[9px] text-zinc-400 dark:text-zinc-500">
          {nodes.length} jalons clés
        </Text>
      </View>

      {/* Frise Temporelle Connectée */}
      <View className="pl-2 relative">
        {nodes.map((node, index) => {
          const isLast = index === nodes.length - 1;

          return (
            <View key={node.id} className="flex-row items-start relative mb-2.5">
              {/* Ligne verticale de connexion */}
              {!isLast && (
                <View className="absolute left-[11px] top-5 bottom-[-10px] w-[1.5px] bg-zinc-200 dark:bg-zinc-800" />
              )}

              {/* Noeud de jalon */}
              <View className="h-4 w-4 rounded-full bg-orange-500 items-center justify-center border-2 border-white dark:border-zinc-950 z-10 mr-2.5 mt-0.5">
                <Text className="text-[8px] font-bold text-white">
                  {node.id}
                </Text>
              </View>

              {/* Contenu du jalon */}
              <View className="flex-1 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-[10px] font-semibold text-zinc-900 dark:text-zinc-100 flex-1">
                    {node.title}
                  </Text>
                  {node.period && (
                    <Text className="text-[8px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-full ml-1">
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
