import { ScientificMarkdown } from './scientific-markdown';
import { useCopyToClipboard } from '@/shared/hooks/use-copy-to-clipboard';
import { cn } from '@/shared/utils/cn';
import { Check, Copy } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

interface MarkdownLatexRendererProps {
  content: string;
  isAi?: boolean;
}

/**
 * Nettoie et formate les symboles LaTeX basiques vers du texte Unicode lisible
 */
function formatLatexString(latexStr: string): string {
  let text = latexStr;

  // Remplace les commandes LaTeX courantes par leurs équivalents Unicode
  text = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');
  text = text.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  text = text.replace(/\\sqrt/g, '√');
  text = text.replace(/\\alpha/g, 'α');
  text = text.replace(/\\beta/g, 'β');
  text = text.replace(/\\gamma/g, 'γ');
  text = text.replace(/\\delta/g, 'δ');
  text = text.replace(/\\epsilon/g, 'ε');
  text = text.replace(/\\theta/g, 'θ');
  text = text.replace(/\\lambda/g, 'λ');
  text = text.replace(/\\mu/g, 'μ');
  text = text.replace(/\\pi/g, 'π');
  text = text.replace(/\\sigma/g, 'σ');
  text = text.replace(/\\omega/g, 'ω');
  text = text.replace(/\\Delta/g, 'Δ');
  text = text.replace(/\\Sigma/g, 'Σ');
  text = text.replace(/\\Omega/g, 'Ω');
  text = text.replace(/\\infty/g, '∞');
  text = text.replace(/\\sum/g, '∑');
  text = text.replace(/\\int/g, '∫');
  text = text.replace(/\\approx/g, '≈');
  text = text.replace(/\\neq/g, '≠');
  text = text.replace(/\\le/g, '≤');
  text = text.replace(/\\ge/g, '≥');
  text = text.replace(/\\times/g, '×');
  text = text.replace(/\\div/g, '÷');
  text = text.replace(/\\pm/g, '±');
  text = text.replace(/\\cdot/g, '·');
  text = text.replace(/\\rightarrow/g, '→');
  text = text.replace(/\\leftarrow/g, '←');
  text = text.replace(/\\Rightarrow/g, '⇒');
  text = text.replace(/\\Leftrightarrow/g, '⇔');

  // Exposants & indices basiques
  text = text.replace(/\^\{([^}]+)\}/g, '^($1)');
  text = text.replace(/_\{([^}]+)\}/g, '_($1)');

  return text.trim();
}

/**
 * Rendu d'une ligne de texte intégrant le formatage Markdown inline et LaTeX math
 */
const InlineTextRenderer = React.memo(function InlineTextRenderer({
  text,
  baseTextColor = 'text-zinc-700 dark:text-zinc-300',
}: {
  text: string;
  baseTextColor?: string;
}) {
  // Regex pour segmenter LaTeX ($...$, $$...$$, \(...\), \[...\]), Code (`...`), Bold (**...**), Italic (*...*)
  const tokens = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return (
    <Text className={`text-xs leading-5 ${baseTextColor}`}>
      {tokens.map((token, index) => {
        if (!token) return null;

        // Display math ($$...$$ ou \[...\])
        if ((token.startsWith('$$') && token.endsWith('$$')) || (token.startsWith('\\[') && token.endsWith('\\]'))) {
          const rawMath = token.startsWith('$$') ? token.slice(2, -2) : token.slice(2, -2);
          const formatted = formatLatexString(rawMath);
          return (
            <View key={index} className="my-1.5 p-2 rounded-lg bg-orange-50 dark:bg-zinc-800/80 border border-orange-200/50 dark:border-zinc-700/60 self-start">
              <Text className="text-xs font-semibold italic text-orange-700 dark:text-orange-300 font-mono">
                {formatted}
              </Text>
            </View>
          );
        }

        // Inline math ($...$ ou \(...\))
        if ((token.startsWith('$') && token.endsWith('$')) || (token.startsWith('\\(') && token.endsWith('\\)'))) {
          const rawMath = token.startsWith('$') ? token.slice(1, -1) : token.slice(2, -2);
          const formatted = formatLatexString(rawMath);
          return (
            <Text key={index} className="font-semibold italic text-orange-600 dark:text-orange-400 bg-orange-50/80 dark:bg-orange-950/40 px-1.5 py-0.5 rounded font-mono">
              {formatted}
            </Text>
          );
        }

        // Inline Code (`code`)
        if (token.startsWith('`') && token.endsWith('`')) {
          return (
            <Text key={index} className="font-mono text-[11px] bg-zinc-200/70 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded">
              {token.slice(1, -1)}
            </Text>
          );
        }

        // Gras (**text**)
        if (token.startsWith('**') && token.endsWith('**')) {
          return (
            <Text key={index} className="font-bold text-zinc-900 dark:text-zinc-100">
              {token.slice(2, -2)}
            </Text>
          );
        }

        // Italique (*text*)
        if (token.startsWith('*') && token.endsWith('*')) {
          return (
            <Text key={index} className="italic text-zinc-800 dark:text-zinc-200">
              {token.slice(1, -1)}
            </Text>
          );
        }

        return <Text key={index}>{token}</Text>;
      })}
    </Text>
  );
});

/**
 * Bloc de Code Fenced avec Bouton de Copie
 */
function FencedCodeBlock({ code, language }: { code: string; language?: string }) {
  const { copyToClipboard } = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(code, 'Code copié');
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <View className="my-2 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-sm">
      <View className="flex-row items-center justify-between px-3 py-1.5 bg-zinc-950 border-b border-zinc-800">
        <Text className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          {language || 'code'}
        </Text>
        <Pressable onPress={handleCopy} className="flex-row items-center gap-1 px-2 py-1 rounded bg-zinc-800 active:bg-zinc-700">
          {copied ? <Check size={11} color="#22C55E" /> : <Copy size={11} color="#A1A1AA" />}
          <Text className="text-[10px] font-semibold text-zinc-300">
            {copied ? 'Copié' : 'Copier'}
          </Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="p-3">
        <Text className="font-mono text-[11px] leading-5 text-emerald-400">
          {code}
        </Text>
      </ScrollView>
    </View>
  );
}

/**
 * Rendu de Tableau Markdown
 */
function MarkdownTableRenderer({ rows }: { rows: string[] }) {
  if (rows.length < 2) return null;

  const parseRow = (rowStr: string) =>
    rowStr
      .split('|')
      .map((c) => c.trim())
      .filter((c, i, arr) => (i > 0 && i < arr.length - 1) || c.length > 0);

  const headers = parseRow(rows[0]);
  const dataRows = rows.slice(2).map(parseRow); // Saute le séparateur |---|

  return (
    <View className="my-3 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          {/* Header */}
          <View className="flex-row bg-orange-50/80 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800">
            {headers.map((head, idx) => (
              <View key={idx} className="p-2.5 min-w-[110px] border-r border-zinc-200/60 dark:border-zinc-800/60">
                <Text className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                  {head}
                </Text>
              </View>
            ))}
          </View>
          {/* Lignes de données */}
          {dataRows.map((r, rIdx) => (
            <View
              key={rIdx}
              className={cn(
                'flex-row border-b border-zinc-100 dark:border-zinc-800/50',
                rIdx % 2 === 1 ? 'bg-zinc-50/50 dark:bg-zinc-900/40' : 'bg-white dark:bg-zinc-900'
              )}
            >
              {r.map((cell, cIdx) => (
                <View key={cIdx} className="p-2.5 min-w-[110px] border-r border-zinc-100 dark:border-zinc-800/40">
                  <InlineTextRenderer text={cell} />
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Composant principal de rendu Markdown + LaTeX complet
 */
export const MarkdownLatexRenderer = React.memo(function MarkdownLatexRenderer({
  content,
  isAi = true,
}: MarkdownLatexRendererProps) {
  if (!isAi) {
    return <Text className="text-xs leading-5 font-medium text-zinc-900 dark:text-zinc-100">{content}</Text>;
  }

  return <ScientificMarkdown content={content} />;
});
