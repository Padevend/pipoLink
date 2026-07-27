import React from 'react';
import { View } from 'react-native';
import { InteractiveComparisonCard, parseComparisonFromMarkdown } from './interactive-comparison-table';
import { InteractiveFaqCard, parseFaqFromMarkdown } from './interactive-faq-accordion';
import { InteractiveFlashcardCard, parseFlashcardsFromMarkdown } from './interactive-flashcard';
import { InteractiveQuizCard, parseQuizFromMarkdown } from './interactive-quiz-card';
import { InteractiveTimelineCard, parseTimelineFromMarkdown } from './interactive-timeline';
import { MarkdownLatexRenderer } from './markdown-latex-renderer';

interface StudyAidSmartRendererProps {
  content: string;
  isAi?: boolean;
}

export const StudyAidSmartRenderer = React.memo(function StudyAidSmartRenderer({
  content,
  isAi = true,
}: StudyAidSmartRendererProps) {
  if (!isAi) {
    return <MarkdownLatexRenderer content={content} isAi={false} />;
  }

  const lowerContent = content.toLowerCase();

  // 1. Détection de Quiz
  if (
    lowerContent.includes('quiz') ||
    lowerContent.includes('question 1') ||
    lowerContent.includes('réponse correcte')
  ) {
    const questions = parseQuizFromMarkdown(content);
    if (questions.length > 0) {
      return <InteractiveQuizCard content={content} />;
    }
  }

  // 2. Détection de Flashcards
  if (
    lowerContent.includes('flashcard') ||
    lowerContent.includes('carte 1') ||
    (lowerContent.includes('recto') && lowerContent.includes('verso'))
  ) {
    const cards = parseFlashcardsFromMarkdown(content);
    if (cards.length > 0) {
      return <InteractiveFlashcardCard content={content} />;
    }
  }

  // 3. Détection de FAQ
  if (
    lowerContent.includes('faq') ||
    lowerContent.includes('foire aux questions') ||
    (lowerContent.includes('q1.') && lowerContent.includes('r1.'))
  ) {
    const faqItems = parseFaqFromMarkdown(content);
    if (faqItems.length > 0) {
      return <InteractiveFaqCard content={content} />;
    }
  }

  // 4. Détection de Comparaison
  if (
    lowerContent.includes('comparaison') ||
    lowerContent.includes('tableau comparatif') ||
    (content.includes('|') && content.split('\n').filter((l) => l.trim().startsWith('|')).length >= 3)
  ) {
    const compData = parseComparisonFromMarkdown(content);
    if (compData && compData.rows.length > 0) {
      return <InteractiveComparisonCard content={content} />;
    }
  }

  // 5. Détection de Chronologie / Timeline
  if (
    lowerContent.includes('chronologie') ||
    lowerContent.includes('frise temporelle') ||
    lowerContent.includes('timeline')
  ) {
    const nodes = parseTimelineFromMarkdown(content);
    if (nodes.length > 0) {
      return <InteractiveTimelineCard content={content} />;
    }
  }

  // Rendu par défaut avec interprétation Markdown + LaTeX intégrée
  return <MarkdownLatexRenderer content={content} isAi={true} />;
});
