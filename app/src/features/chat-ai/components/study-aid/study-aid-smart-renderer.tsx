import React from 'react';

import { InteractiveComparisonCard, parseComparisonFromMarkdown } from './interactive-comparison-table';
import { InteractiveFaqCard, parseFaqFromMarkdown } from './interactive-faq-accordion';
import { InteractiveFlashcardCard, parseFlashcardsFromMarkdown } from './interactive-flashcard';
import { InteractiveQuizCard, parseQuizFromMarkdown } from './interactive-quiz-card';
import { InteractiveTimelineCard, parseTimelineFromMarkdown } from './interactive-timeline';
import { MarkdownLatexRenderer } from './markdown-latex-renderer';

type StudyAidType = 'summary' | 'faq' | 'quiz' | 'flashcards' | 'timeline' | 'comparison';

interface StudyAidSmartRendererProps {
  content: string;
  isAi?: boolean;
  studyAidType?: StudyAidType;
}

/**
 * Interactive widgets are selected exclusively from the API response type.
 * Natural-language answers are always rendered as Markdown, even when they
 * mention terms such as “quiz” or “flashcard”.
 */
export const StudyAidSmartRenderer = React.memo(function StudyAidSmartRenderer({
  content,
  isAi = true,
  studyAidType,
}: StudyAidSmartRendererProps) {
  if (!isAi) return <MarkdownLatexRenderer content={content} isAi={false} />;

  if (studyAidType === 'quiz' && parseQuizFromMarkdown(content).length > 0) {
    return <InteractiveQuizCard content={content} />;
  }
  if (studyAidType === 'flashcards' && parseFlashcardsFromMarkdown(content).length > 0) {
    return <InteractiveFlashcardCard content={content} />;
  }
  if (studyAidType === 'faq' && parseFaqFromMarkdown(content).length > 0) {
    return <InteractiveFaqCard content={content} />;
  }
  if (studyAidType === 'comparison') {
    const comparison = parseComparisonFromMarkdown(content);
    if (comparison && comparison.rows.length > 0) return <InteractiveComparisonCard content={content} />;
  }
  if (studyAidType === 'timeline' && parseTimelineFromMarkdown(content).length > 0) {
    return <InteractiveTimelineCard content={content} />;
  }

  return <MarkdownLatexRenderer content={content} isAi />;
});
