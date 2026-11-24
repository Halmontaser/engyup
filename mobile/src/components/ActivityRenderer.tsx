import React from 'react';
import { Activity } from '@/api/curriculum';
import { McqActivity } from '@/activities/McqActivity';
import { FlashcardActivity } from '@/activities/FlashcardActivity';
import { TrueFalseActivity } from '@/activities/TrueFalseActivity';
import { WordOrderActivity } from '@/activities/WordOrderActivity';
import { MatchPairsActivity } from '@/activities/MatchPairsActivity';
import { CategorySortActivity } from '@/activities/CategorySortActivity';
import { SpellingBeeActivity } from '@/activities/SpellingBeeActivity';
import { GenericActivity } from '@/activities/GenericActivity';

interface ActivityRendererProps {
  activity: Activity;
  onComplete: (correct?: boolean) => void;
}

export function ActivityRenderer({ activity, onComplete }: ActivityRendererProps) {
  // Normalize type: supports camelCase 'type' and snake_case 'activity_type' from Supabase
  const rawType = activity.type || (activity as any).activity_type || '';
  const type = String(rawType).toLowerCase().trim();

  // Normalize data and media from both 'data' and 'content' structures
  const rawData = activity.data || (activity as any).content || {};
  const data = typeof rawData === 'object' && rawData !== null ? rawData : {};
  const media = activity.media || data.media || (activity as any).content?.media;

  switch (type) {
    case 'multiple-choice':
    case 'mcq':
      return <McqActivity data={data} media={media} onComplete={onComplete} />;

    case 'flashcard':
    case 'flashcards':
      return <FlashcardActivity data={data} media={media} onComplete={onComplete} />;

    case 'true-false':
    case 'truefalse':
      return <TrueFalseActivity data={data} media={media} onComplete={onComplete} />;

    case 'word-order':
    case 'sentence-builder':
      return <WordOrderActivity data={data} media={media} onComplete={onComplete} />;

    case 'match-pairs':
    case 'word-association':
      return <MatchPairsActivity data={data} media={media} onComplete={onComplete} />;

    case 'category-sort':
    case 'categorize':
      return <CategorySortActivity data={data} media={media} onComplete={onComplete} />;

    case 'spelling-bee':
    case 'spelling':
      return <SpellingBeeActivity data={data} media={media} onComplete={onComplete} />;

    default:
      return <GenericActivity activity={{ ...activity, type, data, media }} onComplete={onComplete} />;
  }
}
