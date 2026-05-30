// Auto-generated from Supabase migrations — update manually when schema changes

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: {
          activity_id: string;
          lesson_id: string;
          activity_type: ActivityType;
          title: string | null;
          instruction: string | null;
          difficulty: string | null;
          book_type: string | null;
          book_page: string | null;
          compensates: string | null;
          content: Record<string, any>;
          order_index: number;
          is_required: boolean;
          xp_reward: number;
          time_estimate_minutes: number | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['activities']['Row']> & {
          activity_id?: string;
          lesson_id: string;
          activity_type: ActivityType;
          content: Record<string, any>;
        };
        Update: Partial<Database['public']['Tables']['activities']['Row']>;
      };
      activity_progress: {
        Row: {
          progress_id: string;
          user_id: string;
          activity_id: string;
          status: 'not_started' | 'in_progress' | 'completed';
          score: number | null;
          time_spent_seconds: number;
          completed_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['activity_progress']['Row']> & {
          user_id: string;
          activity_id: string;
        };
        Update: Partial<Database['public']['Tables']['activity_progress']['Row']>;
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          username: string | null;
          avatar_url: string | null;
          phone: string | null;
          whatsapp: string | null;
          role: 'student' | 'parent' | 'teacher' | 'school_admin' | 'super_admin' | null;
          grade: string | null;
          city: string | null;
          address: string | null;
          school_name: string | null;
          parent_id: string | null;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
    };
  };
}

// All activity types supported by the app
export type ActivityType =
  | 'mcq'
  | 'flashcard'
  | 'gap-fill'
  | 'true-false'
  | 'match-pairs'
  | 'word-order'
  | 'reading-passage'
  | 'category-sort'
  | 'dialogue-read'
  | 'transform-sentence'
  | 'image-label'
  | 'guessing-game'
  | 'reading-sequence'
  | 'sentence-builder'
  | 'word-association'
  | 'pronunciation-practice'
  | 'listening-comprehension'
  | 'spelling-bee'
  | 'dictation'
  | 'conversation-sim'
  | 'picture-description';

// Content shapes per activity type
export interface McqContent {
  questions: {
    question?: string;
    text?: string;
    image?: string;
    imageUrl?: string;
    audio?: string;
    options: (string | { text: string; image?: string; audio?: string; isCorrect?: boolean; feedback?: string })[];
    answer?: string;
    explanation?: string;
  }[];
}

export interface FlashcardContent {
  items?: { word?: string; term?: string; front?: string; definition?: string; meaning?: string; back?: string; translation?: string; example?: string; imageUrl?: string; wordAudio?: string }[];
  cards?: FlashcardContent['items'];
}

export interface GapFillContent {
  sentences: { text: string; blanks?: string[]; hint?: string; image?: string; audio?: string }[];
}

export interface TrueFalseContent {
  statements: { statement: string; isTrue: boolean; explanation?: string; imageUrl?: string; audio?: string }[];
}

export interface MatchPairsContent {
  pairs: { left: string; right: string; leftImage?: string; rightImage?: string; leftAudio?: string; rightAudio?: string }[];
}

export interface WordOrderContent {
  sentences: { correctOrder?: string[] | string; answer?: string; sentence?: string; imageUrl?: string; audio?: string }[];
}

export interface ReadingPassageContent {
  title?: string;
  passage: string;
  imageUrl?: string;
  audio?: string;
  questions?: { question: string; options: { text: string; isCorrect: boolean }[] }[];
}

export interface CategorySortContent {
  categories: { name: string; image?: string; items: string[] }[];
}

export interface DialogueReadContent {
  lines: { speaker: string; text: string; audio?: string }[];
  imageUrl?: string;
}

export interface TransformSentenceContent {
  sentences: { prompt?: string; original?: string; answer?: string; correct?: string; hint?: string; imageUrl?: string; audio?: string }[];
  items?: TransformSentenceContent['sentences'];
  prompts?: TransformSentenceContent['sentences'];
}

export interface DictationContent {
  sentences: { expectedText: string; hints?: string[]; difficulty?: string; imageUrl?: string }[];
}

export type ActivityContent =
  | McqContent
  | FlashcardContent
  | GapFillContent
  | TrueFalseContent
  | MatchPairsContent
  | WordOrderContent
  | ReadingPassageContent
  | CategorySortContent
  | DialogueReadContent
  | TransformSentenceContent
  | DictationContent
  | Record<string, any>;
