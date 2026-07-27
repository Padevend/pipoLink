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
      className="my-3 rounded-2xl border border-orange-200/80 dark:border-orange-950/60 bg-gradient-to-b from-orange-50/90 to-white dark:from-zinc-900 dark:to-zinc-950 p-4 shadow-md"
    >
      {/* Header FAQ */}
      <View className="flex-row items-center justify-between border-b border-orange-100 dark:border-zinc-800 pb-3 mb-3">
        <View className="flex-row items-center gap-2">
          <View className="p-2 rounded-xl bg-orange-500/10 dark:bg-orange-500/20">
            <HelpCircle size={18} color="#F97316" />
          </View>
          <View>
            <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Foire Aux Questions (FAQ)
            </Text>
            <Text className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {items.length} questions fréquentes structurées
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={handleExpandAll}
            className="px-2 py-1 rounded-lg bg-orange-100 dark:bg-orange-950/50 active:bg-orange-200"
          >
            <Text className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
              Tout déplier
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Barre de Recherche */}
      <View className="flex-row items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-3">
        <Search size={14} color="#A1A1AA" />
        <TextInput
          placeholder="Rechercher une question..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#A1A1AA"
          className="flex-1 text-xs text-zinc-800 dark:text-zinc-200 py-1"
        />
      </View>

      {/* Accordéon FAQ */}
      <View className="gap-2.5">
        {filteredItems.map((item, index) => {
          const isExpanded = expandedIds[item.id] ?? index === 0; // Ouvre la première par défaut

          return (
            <View
              key={item.id}
              className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm"
            >
              {/* Question Header */}
              <Pressable
                onPress={() => toggleExpand(item.id)}
                className="flex-row items-center justify-between p-3 bg-zinc-50/50 dark:bg-zinc-900 active:bg-orange-50/50 dark:active:bg-zinc-800/60"
              >
                <View className="flex-row items-start gap-2 flex-1 pr-2">
                  <Text className="text-xs font-bold text-orange-500 mt-0.5">
                    Q{index + 1}.
                  </Text>
                  <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 flex-1 leading-4">
                    {item.question}
                  </Text>
                </View>
                {isExpanded ? (
                  <ChevronUp size={16} color="#F97316" />
                ) : (
                  <ChevronDown size={16} color="#A1A1AA" />
                )}
              </Pressable>

              {/* Réponse déchiffrée Markdown */}
              {isExpanded && (
                <View className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/90">
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
