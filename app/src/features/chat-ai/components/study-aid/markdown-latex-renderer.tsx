import { ScientificMarkdown } from './scientific-markdown';
import React from 'react';
import { Text } from 'react-native';

interface MarkdownLatexRendererProps {
  content: string;
  isAi?: boolean;
}

/**
 * Composant principal de rendu Markdown + LaTeX complet.
 *
 * – Messages utilisateur : texte brut lisible
 * – Messages IA : rendu riche Markdown + LaTeX via WebView
 */
export const MarkdownLatexRenderer = React.memo(function MarkdownLatexRenderer({
  content,
  isAi = true,
}: MarkdownLatexRendererProps) {
  if (!content) return null;

  // Messages utilisateur → texte brut simple
  if (!isAi) {
    return (
      <Text className="text-[13px] leading-5 font-medium text-zinc-900 dark:text-zinc-100">
        {content}
      </Text>
    );
  }

  // Messages IA → rendu Markdown + LaTeX complet
  return <ScientificMarkdown content={content} />;
});
