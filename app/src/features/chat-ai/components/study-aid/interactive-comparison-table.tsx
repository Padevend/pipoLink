import { cn } from '@/shared/utils/cn';
import { Columns, LayoutGrid, Search, Sparkles, Table as TableIcon } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MarkdownLatexRenderer } from './markdown-latex-renderer';

export interface ComparisonData {
  headers: string[];
  rows: { criteria: string; values: string[] }[];
}

/**
 * Parser pour extraire les tableaux de comparaison du markdown
 */
export function parseComparisonFromMarkdown(text: string): ComparisonData | null {
  const lines = text.split('\n');
  const tableLines = lines.filter((l) => l.trim().startsWith('|') && l.trim().endsWith('|'));

  if (tableLines.length < 2) return null;

  const parseRow = (rowStr: string) =>
    rowStr
      .split('|')
      .map((c) => c.trim())
      .filter((c, i, arr) => (i > 0 && i < arr.length - 1) || c.length > 0);

  const rawHeaders = parseRow(tableLines[0]);
  if (rawHeaders.length < 2) return null;

  const headers = rawHeaders;
  const rows: { criteria: string; values: string[] }[] = [];

  // Ignore la ligne de séparation |---|---|
  const dataLines = tableLines.slice(2);
  for (const line of dataLines) {
    const cells = parseRow(line);
    if (cells.length > 0) {
      rows.push({
        criteria: cells[0],
        values: cells.slice(1),
      });
    }
  }

  return { headers, rows };
}

export function InteractiveComparisonCard({ content }: { content: string }) {
  const data = useMemo(() => parseComparisonFromMarkdown(content), [content]);

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<number>(0);

  if (!data || data.rows.length === 0) return null;

  const filteredRows = data.rows.filter(
    (r) =>
      r.criteria.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.values.some((v) => v.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const subjects = data.headers.slice(1);

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      {/* Header Comparaison Minimaliste */}
      <View className="flex-row items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50 pb-3 mb-3">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-[11px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
            Comparaison
          </Text>
          <Text className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {subjects.length} sujets • {data.rows.length} critères
          </Text>
        </View>

        {/* Switcher Mode de Vue */}
        <View className="flex-row items-center p-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50">
          <Pressable
            onPress={() => setViewMode('cards')}
            className={cn(
              'p-1 rounded-full flex-row items-center gap-1 px-2',
              viewMode === 'cards' ? 'bg-white dark:bg-zinc-900 shadow-2xs' : ''
            )}
          >
            <LayoutGrid size={12} color={viewMode === 'cards' ? '#F97316' : '#A1A1AA'} />
          </Pressable>
          <Pressable
            onPress={() => setViewMode('table')}
            className={cn(
              'p-1 rounded-full flex-row items-center gap-1 px-2',
              viewMode === 'table' ? 'bg-white dark:bg-zinc-900 shadow-2xs' : ''
            )}
          >
            <TableIcon size={12} color={viewMode === 'table' ? '#F97316' : '#A1A1AA'} />
          </Pressable>
        </View>
      </View>

      {/* Barre de Recherche de Critères */}
      <View className="flex-row items-center gap-1.5 px-3 h-10 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-800/50 mb-1.5">
        <Search size={10} color="#A1A1AA" />
        <TextInput
          placeholder="Filtrer..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#A1A1AA"
          className="flex-1 text-[12px] text-zinc-800 dark:text-zinc-200 py-0"
        />
      </View>

      {/* MODE CARTES CÔTÉ-À-CÔTE / ONGLETS */}
      {viewMode === 'cards' && (
        <View>
          {/* Onglets des sujets */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-1.5">
            <View className="flex-row gap-1">
              {subjects.map((subj, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setActiveTab(idx)}
                  className={cn(
                    'px-2.5 py-0.5 rounded-full border transition-all',
                    activeTab === idx
                      ? 'bg-orange-500/20 border-orange-500/40'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800/60'
                  )}
                >
                  <Text
                    className={cn(
                      'text-[12px] font-semibold',
                      activeTab === idx ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-300'
                    )}
                  >
                    {subj}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Grille des critères pour l'onglet actif */}
          <View className="gap-1.5">
            {filteredRows.map((row, rIdx) => {
              const val = row.values[activeTab] || 'N/A';
              return (
                <View
                  key={rIdx}
                  className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40"
                >
                  <Text className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-0.5">
                    {row.criteria}
                  </Text>
                  <MarkdownLatexRenderer content={val} isAi={true} />
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* MODE TABLEAU INTERACTIF */}
      {viewMode === 'table' && (
        <View className="rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden bg-white dark:bg-zinc-900/80">
          <ScrollView horizontal showsHorizontalScrollIndicator={true} className="max-h-[200px]">
            <View>
              {/* En-tête de Table */}
              <View className="flex-row bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-200/60 dark:border-zinc-800/60">
                <View className="p-1.5 min-w-[80px] border-r border-zinc-200/60 dark:border-zinc-800/60">
                  <Text className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                    {data.headers[0]}
                  </Text>
                </View>
                {subjects.map((s, idx) => (
                  <View key={idx} className="p-1.5 min-w-[100px] border-r border-zinc-200/60 dark:border-zinc-800/60">
                    <Text className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100">
                      {s}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Lignes de Données */}
              {filteredRows.map((row, rIdx) => (
                <View
                  key={rIdx}
                  className={cn(
                    'flex-row border-b border-zinc-100 dark:border-zinc-800/40',
                    rIdx % 2 === 1 ? 'bg-zinc-50/30 dark:bg-zinc-900/30' : 'bg-white dark:bg-zinc-900'
                  )}
                >
                  <View className="p-1.5 min-w-[80px] border-r border-zinc-100 dark:border-zinc-800/40 justify-center">
                    <Text className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200">
                      {row.criteria}
                    </Text>
                  </View>
                  {row.values.map((v, cIdx) => (
                    <View key={cIdx} className="p-1.5 min-w-[100px] border-r border-zinc-100 dark:border-zinc-800/40 justify-center">
                      <MarkdownLatexRenderer content={v} isAi={true} />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </Animated.View>
  );
}
