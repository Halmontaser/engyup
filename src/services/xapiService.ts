import { supabase } from '../lib/supabase';

export const xapiService = {
  async trackStatement(params: {
    verb: string;
    activityId: string;
    activityType?: string;
    score?: number;
    maxScore?: number;
    success?: boolean;
    completion?: boolean;
    duration?: string;
    tenantId?: string;
    metadata?: any;
    isPublic?: boolean;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('xapi_statements')
      .insert([{
        user_id: user.id,
        tenant_id: params.tenantId,
        verb: params.verb,
        activity_id: params.activityId,
        activity_type: params.activityType,
        score: params.score,
        max_score: params.maxScore,
        success: params.success,
        completion: params.completion,
        duration: params.duration,
        metadata: params.metadata || {},
        is_public: params.isPublic || false,
      }])
      .select()
      .single();

    if (error) {
      console.error('xAPI tracking error:', error);
      return null;
    }

    return data;
  }
};
