import { supabase } from '../lib/supabase';

export interface LMSEventParams {
  eventType: string;
  entityType?: 'lesson' | 'quiz' | 'course' | 'system';
  entityId?: string;
  courseId?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
  isPublic?: boolean;
  score?: number;
  maxScore?: number;
  duration?: string;
}

class EventService {
  private async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  async dispatch(params: LMSEventParams) {
    const session = await this.getSession();
    if (!session) return null;

    try {
      const verbMap: Record<string, string> = {
        'lesson_started': 'start',
        'lesson_completed': 'end',
        'quiz_passed': 'score',
        'quiz_failed': 'score'
      };

      const { data, error } = await supabase.from('xapi_statements').insert([{
        user_id: session.user.id,
        tenant_id: params.tenantId,
        verb: verbMap[params.eventType] || 'store',
        activity_id: params.entityId || 'unknown',
        activity_type: params.entityType,
        score: params.score,
        metadata: { ...params.metadata, event_type: params.eventType, course_id: params.courseId },
        is_public: false,
      }]).select().single();

      if (error) throw error;
      
      // Award XP for lesson completion directly if possible (assuming RLS allows, or drop it if handled by trigger)
      if (params.eventType === 'lesson_completed') {
        await supabase.rpc('award_xp', { p_user_id: session.user.id, p_xp: 12 }).catch(() => {});
      }

      return { success: true, event: data };
    } catch (err) {
      console.error('Event Service Error:', err);
      return null;
    }
  }

  async lessonStarted(lessonId: string, courseId: string, tenantId: string) {
    return this.dispatch({ eventType: 'lesson_started', entityType: 'lesson', entityId: lessonId, courseId, tenantId });
  }

  async lessonCompleted(lessonId: string, courseId: string, tenantId: string) {
    return this.dispatch({ eventType: 'lesson_completed', entityType: 'lesson', entityId: lessonId, courseId, tenantId });
  }

  async quizPassed(quizId: string, score: number, courseId: string, tenantId: string) {
    return this.dispatch({ eventType: 'quiz_passed', entityType: 'quiz', entityId: quizId, courseId, tenantId, score, metadata: { passed: true } });
  }

  async quizFailed(quizId: string, score: number, courseId: string, tenantId: string) {
    return this.dispatch({ eventType: 'quiz_failed', entityType: 'quiz', entityId: quizId, courseId, tenantId, score, metadata: { passed: false } });
  }
}

export const eventService = new EventService();
