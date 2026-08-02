import { cn } from '@/shared/utils/cn';
import { ChevronDown, ChevronUp, HelpCircle, Search, Sparkles } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MarkdownLatexRenderer } from './markdown-latex-renderer';

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

/**
 * Parser pour extraire les questions / réponses FAQ d'un texte markdown
 */
export function parseFaqFromMarkdown(text: string): FaqItem[] {
  const items: FaqItem[] = [];
  const lines = text.split('\n');

  let currentItem: Partial<FaqItem> | null = null;
  let count = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Question: e.g. "### Q1. ...", "**Q: ...**", "1. Question ?"
    const qMatch = line.match(/^(?:###|\*\*|\d+\.)?\s*(?:Q\d*[:.]|Question\s*\d*[:.])?\s*(.+\?.*)/i);
    if (qMatch || (line.includes('?') && (line.startsWith('Q:') || line.startsWith('###') || line.startsWith('**')))) {
      if (currentItem && currentItem.question && currentItem.answer) {
        items.push(currentItem as FaqItem);
      }
      count++;
      currentItem = {
        id: count,
        question: qMatch ? qMatch[1].replace(/\*\*/g, '').trim() : line.replace(/\*\*/g, '').replace(/^###\s*/, '').trim(),
        answer: '',
      };
      continue;
    }

    // Answer: e.g. "R: ...", "Réponse: ...", "A: ..."
    const aMatch = line.match(/^(?:R:|Réponse:|Answer:|A:)\s*(.+)/i);
    if (aMatch && currentItem) {
      currentItem.answer = aMatch[1].replace(/\*\*/g, '').trim();
      continue;
    }

    // Append to answer if inside item
    if (currentItem && currentItem.question) {
      if (currentItem.answer !== undefined) {
        currentItem.answer += (currentItem.answer ? '\n' : '') + line;
      }
    }
  }

  if (currentItem && currentItem.question && currentItem.answer) {
    items.push(currentItem as FaqItem);
  }

  return items;
}

export function InteractiveFaqCard({ content }: { content: string }) {
  const items = useMemo(() => parseFaqFromMarkdown(content), [content]);

  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  if (items.length === 0) return null;

  const filteredItems = items.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExpandAll = () => {
    const all: Record<number, boolean> = {};
    items.forEach((item) => (all[item.id] = true));
    setExpandedIds(all);
  };

  const handleCollapseAll = () => {
    setExpandedIds({});
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      className=" bg-white dark:bg-zinc-950 pl-3.5 pr-3 py-2.5"
    >
      {/* Header FAQ Minimaliste */}
      <View className="flex-row items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50 pb-1.5 mb-1.5">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-[9px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
            FAQ
          </Text>
          <Text className="text-[9px] text-zinc-400 dark:text-zinc-500">
            {items.length} questions
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={handleExpandAll}
            className="px-1.5 py-0.5 active:opacity-70"
          >
            <Text className="text-[9px] font-semibold text-orange-600 dark:text-orange-400">
              Tout ouvrir
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Barre de Recherche Discrète */}
      <View className="flex-row items-center gap-1.5 px-2.5 h-7 rounded bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-800/50 mb-1.5">
        <Search size={10} color="#A1A1AA" />
        <TextInput
          placeholder="Rechercher..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#A1A1AA"
          className="flex-1 text-[10px] text-zinc-800 dark:text-zinc-200 py-0"
        />
      </View>

      {/* Accordéon FAQ */}
      <View className="gap-1">
        {filteredItems.map((item, index) => {
          const isExpanded = expandedIds[item.id] ?? index === 0;

          return (
            <View
              key={item.id}
              className="rounded border border-zinc-200/40 dark:border-zinc-800/40 bg-white dark:bg-zinc-900/50 overflow-hidden"
            >
              {/* Question Header */}
              <Pressable
                onPress={() => toggleExpand(item.id)}
                className="flex-row items-center justify-between p-2 bg-zinc-50/30 dark:bg-zinc-900/30 active:bg-zinc-100/60 dark:active:bg-zinc-800/30"
              >
                <View className="flex-row items-start gap-1.5 flex-1 pr-1.5">
                  <Text className="text-[9px] font-bold text-orange-500 mt-0.5">
                    Q{index + 1}.
                  </Text>
                  <Text className="text-[9px] font-medium text-zinc-800 dark:text-zinc-200 flex-1 leading-3.5">
                    {item.question}
                  </Text>
                </View>
                {isExpanded ? (
                  <ChevronUp size={11} color="#F97316" />
                ) : (
                  <ChevronDown size={11} color="#A1A1AA" />
                )}
              </Pressable>

              {/* Réponse déchiffrée Markdown */}
              {isExpanded && (
                <View className="p-2 border-t border-zinc-100 dark:border-zinc-800/40 bg-white dark:bg-zinc-900">
                  <MarkdownLatexRenderer content={item.answer} isAi={true} />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}
