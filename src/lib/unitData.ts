import { supabase } from './supabase';
import type { CourseHierarchy, ModuleNode, LessonNode, ActivityNode } from '../types/courseHierarchy';
import type { ActivityMedia, ActivityMediaEntry } from '../components/player/ActivityPlayer';

interface UnitJsonActivity {
  title: string;
  content: any;
  book_page?: string;
  book_type?: string;
  lesson_id: string;
  difficulty?: string;
  activity_id: string;
  compensates?: string;
  instruction?: string;
  order_index: number;
  activity_type: string;
}

interface UnitJsonLesson {
  id: string;
  title: string;
  activities: UnitJsonActivity[];
  description?: string;
  order_index: number;
}

interface UnitJsonData {
  grade: string;
  unit: number;
  moduleTitle: string;
  moduleId: string;
  lessons: UnitJsonLesson[];
}

// In-memory cache for loaded unit data
const unitCache = new Map<string, CourseHierarchy>();

/**
 * Fetch unit data from JSON file and transform to CourseHierarchy format.
 * Tries local /media/{unitId}/activities.json first, falls back to Supabase.
 */
export async function fetchUnitData(unitId: string): Promise<CourseHierarchy | null> {
  // Check cache
  if (unitCache.has(unitId)) {
    return unitCache.get(unitId)!;
  }

  // Try loading from local JSON
  try {
    const resp = await fetch(`/media/${unitId}/activities.json`);
    if (resp.ok) {
      const data: UnitJsonData = await resp.json();
      const hierarchy = transformUnitJsonToHierarchy(data, unitId);
      unitCache.set(unitId, hierarchy);
      return hierarchy;
    }
  } catch (e) {
    console.warn(`Failed to load local JSON for ${unitId}, falling back to Supabase`, e);
  }

  // Fallback: fetch from Supabase (original flow)
  return null;
}

/**
 * Transform unit JSON data into the CourseHierarchy format expected by LessonPlayer.
 */
function transformUnitJsonToHierarchy(data: UnitJsonData, unitId: string): CourseHierarchy {
  const lessons: LessonNode[] = data.lessons
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((lesson) => {
      const activities: ActivityNode[] = lesson.activities
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map((activity) => ({
          id: activity.activity_id,
          lesson_id: activity.lesson_id,
          type: activity.activity_type,
          title: activity.title || '',
          instruction: activity.instruction || '',
          data: activity.content,
          media: buildActivityMedia(activity),
          compensates: activity.compensates || null,
          book_type: activity.book_type || null,
          book_page: activity.book_page || null,
          order_index: activity.order_index ?? 0,
          completed: false,
        }));

      return {
        id: lesson.id,
        module_id: data.moduleId,
        title: lesson.title || '',
        order_index: lesson.order_index ?? 0,
        description: lesson.description || '',
        activities,
        completed: false,
      };
    });

  const moduleNode: ModuleNode = {
    id: data.moduleId,
    title: data.moduleTitle || `Unit ${data.unit}`,
    order_index: 0,
    lessons,
    completed: false,
  };

  return {
    id: unitId,
    title: `${data.grade} - Unit ${data.unit}: ${data.moduleTitle}`,
    modules: [moduleNode],
  };
}

/**
 * Build ActivityMedia from raw activity content JSON.
 * Extracts imageUrl and audio references from the content object.
 * Works standalone — no dependency on UnitJsonActivity wrapper.
 */
export function buildActivityMediaFromContent(content: any): ActivityMedia {
  const data = content || {};
  const audio: ActivityMediaEntry[] = [];
  const images: ActivityMediaEntry[] = [];

  // Activity-level imageUrl
  if (data.imageUrl) {
    images.push({
      filename: data.imageUrl.split('/').pop() || '',
      url: data.imageUrl,
    });
  }

  // Activity-level image field (for picture-description)
  if (data.image && typeof data.image === 'string' && data.image.startsWith('/media/')) {
    images.push({
      filename: data.image.split('/').pop() || '',
      url: data.image,
    });
  }

  // Activity-level audioSrc
  if (data.audioSrc) {
    audio.push({
      filename: data.audioSrc.split('/').pop() || '',
      url: data.audioSrc,
    });
  }

  // Activity-level audio (used by multiple activities)
  if (data.audio && typeof data.audio === 'string') {
    audio.push({
      filename: data.audio.split('/').pop() || '',
      url: data.audio,
    });
  }

  // Item-level media (flashcards, mcq options, etc.)
  const items = data.items || data.cards || data.questions || [];
  if (Array.isArray(items)) {
    items.forEach((item: any, idx: number) => {
      if (item.imageUrl) {
        images.push({
          filename: item.imageUrl.split('/').pop() || '',
          url: item.imageUrl,
          prompt: '',
        } as ActivityMediaEntry);
        // Add idx for flashcard image lookup
        (images[images.length - 1] as any).idx = idx;
      }
      // Object-form image (guessing-game puzzles)
      if (item.image && typeof item.image === 'object' && item.image.src && typeof item.image.src === 'string' && item.image.src.startsWith('/media/')) {
        images.push({
          filename: item.image.src.split('/').pop() || '',
          url: item.image.src,
          prompt: item.image.alt || '',
        } as ActivityMediaEntry);
        (images[images.length - 1] as any).idx = idx;
      }
      // String-form item image (mcq questions, etc.)
      if (item.image && typeof item.image === 'string' && (item.image.startsWith('/') || item.image.startsWith('http'))) {
        images.push({
          filename: item.image.split('/').pop() || '',
          url: item.image,
          prompt: '',
        } as ActivityMediaEntry);
        (images[images.length - 1] as any).idx = idx;
      }
      if (item.wordAudio) {
        audio.push({
          filename: item.wordAudio.split('/').pop() || '',
          url: item.wordAudio,
          text: item.word || item.term || '',
          audioType: 'word',
        } as ActivityMediaEntry);
        (audio[audio.length - 1] as any).idx = idx;
      }
      if (item.audio) {
        audio.push({
          filename: item.audio.split('/').pop() || '',
          url: item.audio,
          text: item.text || '',
        });
      }
      // MCQ options with audio/images
      if (Array.isArray(item.options)) {
        item.options.forEach((opt: any) => {
          if (opt.image && typeof opt.image === 'string' && opt.image.startsWith('/media/')) {
            images.push({
              filename: opt.image.split('/').pop() || '',
              url: opt.image,
            });
          }
          if (opt.audio) {
            audio.push({
              filename: opt.audio.split('/').pop() || '',
              url: opt.audio,
            });
          }
        });
      }
    });
  }

  // Pairs with images/audio (match-pairs)
  const pairs = data.pairs || [];
  if (Array.isArray(pairs)) {
    pairs.forEach((p: any, idx: number) => {
      const leftImg = p.leftImage || p.imgUrl;
      const rightImg = p.rightImage || p.imgUrl;
      if (leftImg && typeof leftImg === 'string') {
        images.push({
          filename: leftImg.split('/').pop() || '',
          url: leftImg,
          prompt: p.left || '',
        } as ActivityMediaEntry);
        (images[images.length - 1] as any).idx = idx;
      }
      if (rightImg && typeof rightImg === 'string') {
        images.push({
          filename: rightImg.split('/').pop() || '',
          url: rightImg,
          prompt: p.right || '',
        } as ActivityMediaEntry);
        (images[images.length - 1] as any).idx = idx;
      }
      if (p.leftAudio && typeof p.leftAudio === 'string') {
        audio.push({
          filename: p.leftAudio.split('/').pop() || '',
          url: p.leftAudio,
          text: p.left || '',
        } as ActivityMediaEntry);
        (audio[audio.length - 1] as any).idx = idx;
      }
      if (p.rightAudio && typeof p.rightAudio === 'string') {
        audio.push({
          filename: p.rightAudio.split('/').pop() || '',
          url: p.rightAudio,
          text: p.right || '',
        } as ActivityMediaEntry);
        (audio[audio.length - 1] as any).idx = idx;
      }
    });
  }

  // Sentences with media (dictation, gap-fill)
  const sentences = data.sentences || [];
  if (Array.isArray(sentences)) {
    sentences.forEach((s: any, idx: number) => {
      if (s.image && typeof s.image === 'string') {
        images.push({
          filename: s.image.split('/').pop() || '',
          url: s.image,
          prompt: s.text || '',
        } as ActivityMediaEntry);
        (images[images.length - 1] as any).idx = idx;
      }
      if (s.audio) {
        audio.push({
          filename: s.audio.split('/').pop() || '',
          url: s.audio,
        });
      }
    });
  }

  return { audio, images };
}

/**
 * Build ActivityMedia from a UnitJsonActivity (wraps buildActivityMediaFromContent).
 */
function buildActivityMedia(activity: UnitJsonActivity): ActivityMedia {
  return buildActivityMediaFromContent(activity.content);
}

/**
 * Clear the unit data cache (useful for testing or forced refresh).
 */
export function clearUnitCache(unitId?: string) {
  if (unitId) {
    unitCache.delete(unitId);
  } else {
    unitCache.clear();
  }
}
