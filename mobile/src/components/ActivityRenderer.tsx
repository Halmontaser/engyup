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
  const type = (activity.type || '').toLowerCase();

  switch (type) {
    case 'multiple-choice':
    case 'mcq':
      return <McqActivity data={activity.data || {}} media={activity.media} onComplete={onComplete} />;

    case 'flashcard':
    case 'flashcards':
      return <FlashcardActivity data={activity.data || {}} media={activity.media} onComplete={onComplete} />;

    case 'true-false':
    case 'truefalse':
      return <TrueFalseActivity data={activity.data || {}} media={activity.media} onComplete={onComplete} />;

    case 'word-order':
    case 'sentence-builder':
      return <WordOrderActivity data={activity.data || {}} media={activity.media} onComplete={onComplete} />;

    case 'match-pairs':
    case 'word-association':
      return <MatchPairsActivity data={activity.data || {}} media={activity.media} onComplete={onComplete} />;

    case 'category-sort':
    case 'categorize':
      return <CategorySortActivity data={activity.data || {}} media={activity.media} onComplete={onComplete} />;

    case 'spelling-bee':
    case 'spelling':
      return <SpellingBeeActivity data={activity.data || {}} media={activity.media} onComplete={onComplete} />;

    default:
      return <GenericActivity activity={activity} onComplete={onComplete} />;
  }
}
