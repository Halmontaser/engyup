export interface MediaEntry {
  filename: string;
  url: string;
  text?: string;
  audioType?: string;
  prompt?: string;
  idx?: number;
}

export interface ActivityMedia {
  audio: MediaEntry[];
  images: MediaEntry[];
}

export interface ActivityNode {
  id: string;
  lesson_id: string;
  type: string;
  title: string;
  instruction: string;
  data: any;
  media?: ActivityMedia;
  compensates?: string | null;
  order_index: number;
  completed?: boolean;
  difficulty?: string | null;
  book_type?: string | null;
  book_page?: string | null;
  is_required?: boolean;
  xp_reward?: number;
  time_estimate_minutes?: number | null;
}

export interface LessonNode {
  id: string;
  module_id: string;
  title: string;
  order_index: number;
  description: string;
  activities: ActivityNode[];
  completed?: boolean;
  objectives?: string | null;
  vocabulary?: string | null;
  language_focus?: string | null;
  cover_image_src?: string | null;
}

export interface ModuleNode {
  id: string;
  title: string;
  order_index: number;
  lessons: LessonNode[];
  completed?: boolean;
}

export interface CourseHierarchy {
  id: string;
  title: string;
  modules: ModuleNode[];
}

export interface HierarchicalPosition {
  moduleId: string;
  lessonId: string;
  activityId: string;
  activityIndex: number;
}

export type StudyMode = 'free' | 'guided';
