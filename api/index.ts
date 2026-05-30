import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Supabase Admin Client
let supabaseUrl = process.env.VITE_SUPABASE_URL;
if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  supabaseUrl = 'https://msttsebafjgzllyabsid.supabase.co';
}

let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseServiceKey || supabaseServiceKey === 'undefined') {
  supabaseServiceKey = process.env.SUPABASE_KEY || '';
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Auth middleware
const authenticateUser = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  req.user = user;
  next();
};

// Admin Auth middleware
const authenticateAdmin = async (req: any, res: any, next: any) => {
  // 1. Try password-based check first (via cookie or header)
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  
  // Extract from cookies
  let cookiePassword = '';
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/admin_auth=([^;]+)/);
  if (match) {
    cookiePassword = decodeURIComponent(match[1]);
  }

  // Extract from custom header
  const headerPassword = req.headers['x-admin-password'];

  if (adminPassword && (cookiePassword === adminPassword || headerPassword === adminPassword)) {
    return next();
  }

  // 2. Try Supabase token-based check
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (!error && user) {
        // Check if user is in default admin list
        const defaultAdmins = ['lms_yemen@outlook.com', 'halmontaser1@gmail.com'];
        if (defaultAdmins.includes(user.email || '')) {
          req.user = user;
          return next();
        }

        // Check profiles table role
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile && (profile.role === 'super_admin' || profile.role === 'teacher')) {
          req.user = user;
          return next();
        }

        // Check memberships table role
        const { data: memberships } = await supabaseAdmin
          .from('memberships')
          .select('role')
          .eq('user_id', user.id);

        const isAuthorized = memberships && memberships.some((m: any) => m.role === 'super_admin' || m.role === 'teacher');
        if (isAuthorized) {
          req.user = user;
          return next();
        }
      }
    } catch (err) {
      console.error('Admin token verification error:', err);
    }
  }

  return res.status(403).json({ success: false, error: 'Access denied: Admin permissions required' });
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'crescent-lms', environment: 'production' });
});

// Get My Enrollments and Progress 
app.get('/api/my-enrollments', authenticateUser, async (req: any, res: any) => {
  const { tenantId } = req.query;
  const userId = req.user.id;

  try {
    const [enrollRes, progressRes] = await Promise.all([
      supabaseAdmin.from('enrollments').select('course_id').eq('user_id', userId).eq('tenant_id', tenantId),
      supabaseAdmin.from('user_progress').select('lesson_id, status').eq('user_id', userId)
    ]);

    res.json({ 
      success: true, 
      enrollments: (enrollRes.data || []).map(e => e.course_id),
      progress: progressRes.data || []
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Enroll in course
app.post('/api/enroll', authenticateUser, async (req: any, res: any) => {
  const { courseId, tenantId, role } = req.body;
  const userId = req.user.id;

  try {
    const { data: existing } = await supabaseAdmin
      .from('enrollments').select('id').eq('user_id', userId).eq('course_id', courseId).maybeSingle();
    
    if (existing) return res.status(400).json({ error: 'Already enrolled' });

    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .insert([{ user_id: userId, course_id: courseId, tenant_id: tenantId, role: role || 'student' }])
      .select().single();

    if (error) throw error;
    res.status(201).json({ success: true, enrollment: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Events endpoint
app.post('/api/events', authenticateUser, async (req: any, res: any) => {
  const userId = req.user.id;
  const { eventType, entityType, entityId, courseId, tenantId, score, metadata } = req.body;

  try {
    const { data, error } = await supabaseAdmin.from('xapi_statements').insert([{
      user_id: userId,
      tenant_id: tenantId,
      verb: eventType === 'lesson_started' ? 'start' : 'end',
      activity_id: entityId || 'unknown',
      activity_type: entityType,
      score: score,
      metadata: { ...metadata, event_type: eventType, course_id: courseId },
      is_public: false,
    }]).select().single();

    if (eventType === 'lesson_completed') {
      try {
        await supabaseAdmin.rpc('award_xp', { p_user_id: userId, p_xp: 12 });
      } catch (e) {}
    }

    res.json({ success: true, event: data });
  } catch (err: any) {
    console.error('Event error:', err);
    res.json({ success: true });
  }
});

// Leaderboard
app.get('/api/leaderboard', authenticateUser, async (req: any, res: any) => {
  try {
    const { data } = await supabaseAdmin
      .from('user_stats')
      .select('user_id, total_xp, level, profiles(full_name, avatar_url)')
      .order('total_xp', { ascending: false })
      .limit(10);

    res.json({ success: true, leaderboard: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN API ROUTES

// Get stats
app.get('/admin/api/stats', authenticateAdmin, async (req, res) => {
  try {
    // Get all activities from Supabase
    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from('activities')
      .select('lesson_id, activity_type');

    if (activitiesError) throw activitiesError;

    // Get unique lesson IDs
    const lessonIds = new Set(activities?.map((a) => a.lesson_id) || []);

    // Count activities by type
    const activitiesByType: Record<string, number> = {};
    (activities || []).forEach((a) => {
      const type = a.activity_type;
      activitiesByType[type] = (activitiesByType[type] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        totalActivities: activities?.length || 0,
        totalLessons: lessonIds.size,
        totalUnits: 0,
        totalGrades: 0,
        activitiesByType,
      }
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard statistics' });
  }
});

  // Get all lessons (for admin management)
  app.get('/admin/api/lessons', authenticateAdmin, async (req, res) => {
    try {
      const { data: lessons, error } = await supabaseAdmin
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true })
        .order('title', { ascending: true });

      if (error) throw error;

      res.json({ success: true, lessons: lessons || [] });
    } catch (error: any) {
      console.error('Error fetching lessons:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch lessons' });
    }
  });

  // Get single lesson
  app.get('/admin/api/lessons/:id', authenticateAdmin, async (req, res) => {
    try {
      const { data: lesson, error } = await supabaseAdmin
        .from('lessons')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (error || !lesson) {
        return res.status(404).json({ success: false, error: 'Lesson not found' });
      }

      res.json({ success: true, lesson });
    } catch (error: any) {
      console.error('Error fetching lesson:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch lesson' });
    }
  });

  // Create lesson
  app.post('/admin/api/lessons', authenticateAdmin, async (req, res) => {
    try {
      const { title, description, order_index, module_id, objectives, language_focus, vocabulary, cover_image_src, passing_score } = req.body;

      if (!title || !module_id) {
        return res.status(400).json({ success: false, error: 'Title and module_id are required' });
      }

      const { data: createdLesson, error } = await supabaseAdmin
        .from('lessons')
        .insert({
          title,
          description: description || '',
          order_index: order_index || 0,
          module_id,
          objectives: objectives || null,
          language_focus: language_focus || null,
          vocabulary: vocabulary || null,
          cover_image_src: cover_image_src || null,
          passing_score: passing_score || 70
        })
        .select('*')
        .single();

      if (error || !createdLesson) {
        throw error;
      }

      res.status(201).json({ success: true, lesson: createdLesson });
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      res.status(500).json({ success: false, error: error?.message || 'Failed to create lesson' });
    }
  });

  // Update lesson
  app.patch('/admin/api/lessons/:id', authenticateAdmin, async (req, res) => {
    try {
      const body = req.body;
      
      const updateData: any = {};
      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.order_index !== undefined) updateData.order_index = body.order_index;
      if (body.module_id !== undefined) updateData.module_id = body.module_id;
      if (body.objectives !== undefined) updateData.objectives = body.objectives;
      if (body.language_focus !== undefined) updateData.language_focus = body.language_focus;
      if (body.vocabulary !== undefined) updateData.vocabulary = body.vocabulary;
      if (body.cover_image_src !== undefined) updateData.cover_image_src = body.cover_image_src;
      if (body.passing_score !== undefined) updateData.passing_score = body.passing_score;

      const { data: updatedLesson, error } = await supabaseAdmin
        .from('lessons')
        .update(updateData)
        .eq('id', req.params.id)
        .select('*')
        .single();

      if (error || !updatedLesson) {
        throw error;
      }

      res.json({ success: true, lesson: updatedLesson });
    } catch (error: any) {
      console.error('Error updating lesson:', error);
      res.status(500).json({ success: false, error: error?.message || 'Failed to update lesson' });
    }
  });

  // Delete lesson
  app.delete('/admin/api/lessons/:id', authenticateAdmin, async (req, res) => {
    try {
      const { error } = await supabaseAdmin
        .from('lessons')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;

      res.json({ success: true, message: 'Lesson deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
      res.status(500).json({ success: false, error: error?.message || 'Failed to delete lesson' });
    }
  });

  // Get all modules (units)
  app.get('/admin/api/modules', authenticateAdmin, async (req, res) => {
    try {
      const { data: modules, error } = await supabaseAdmin
        .from('modules')
        .select('id, title, course_id, order_index')
        .order('order_index', { ascending: true });

      if (error) throw error;

      res.json({ success: true, modules: modules || [] });
    } catch (error: any) {
      console.error('Error fetching modules:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch modules' });
    }
  });

// Get all activities
app.get('/admin/api/activities', authenticateAdmin, async (req, res) => {
  try {
    const { data: activities, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform activities to match expected format
    const transformedActivities = (activities || []).map(activity => ({
      id: activity.activity_id,
      lesson_id: activity.lesson_id,
      type: activity.activity_type,
      title: activity.title || '',
      instruction: activity.instruction || '',
      difficulty: activity.difficulty || null,
      book_type: activity.book_type || null,
      book_page: activity.book_page || null,
      compensates: activity.compensates || null,
      data: activity.content,
      sort_order: activity.order_index || 0,
      created_at: activity.created_at,
    }));

    res.json({ success: true, activities: transformedActivities });
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activities' });
  }
});

// Get single activity
app.get('/admin/api/activities/:id', authenticateAdmin, async (req, res) => {
  try {
    const { data: activity, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('activity_id', req.params.id)
      .single();

    if (error || !activity) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }

    // Transform activity to match expected format
    const transformedActivity = {
      id: activity.activity_id,
      lesson_id: activity.lesson_id,
      type: activity.activity_type,
      title: activity.title || '',
      instruction: activity.instruction || '',
      difficulty: activity.difficulty || null,
      book_type: activity.book_type || null,
      book_page: activity.book_page || null,
      compensates: activity.compensates || null,
      data: activity.content,
      sort_order: activity.order_index || 0,
      created_at: activity.created_at,
    };

    res.json({ success: true, activity: transformedActivity });
  } catch (error: any) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity' });
  }
});

// Create activity
app.post('/admin/api/activities', authenticateAdmin, async (req, res) => {
  try {
    const { lesson_id, type, title, instruction, difficulty, data, sort_order } = req.body;

    if (!lesson_id || !type || !title) {
      return res.status(400).json({ success: false, error: 'Missing required fields: lesson_id, type, and title are required' });
    }

    const newActivityData = {
      lesson_id,
      activity_type: type,
      title,
      instruction: instruction || '',
      difficulty,
      content: data || {},
      order_index: sort_order || 0,
    };

    const { data: createdActivity, error } = await supabaseAdmin
      .from('activities')
      .insert(newActivityData)
      .select('*')
      .single();

    if (error || !createdActivity) {
      console.error('Error creating activity:', error);
      return res.status(500).json({ success: false, error: error?.message || 'Failed to create activity' });
    }

    const transformedActivity = {
      id: createdActivity.activity_id,
      lesson_id: createdActivity.lesson_id,
      type: createdActivity.activity_type,
      title: createdActivity.title || '',
      instruction: createdActivity.instruction || '',
      difficulty: createdActivity.difficulty || null,
      book_type: createdActivity.book_type || null,
      book_page: createdActivity.book_page || null,
      compensates: createdActivity.compensates || null,
      data: createdActivity.content,
      sort_order: createdActivity.order_index || 0,
      created_at: createdActivity.created_at,
    };

    res.status(201).json({ success: true, activity: transformedActivity });
  } catch (error: any) {
    console.error('Error creating activity:', error);
    res.status(500).json({ success: false, error: 'Failed to create activity' });
  }
});

// Update activity
app.patch('/admin/api/activities/:id', authenticateAdmin, async (req, res) => {
  try {
    const body = req.body;

    // Check if activity exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('activities')
      .select('activity_id')
      .eq('activity_id', req.params.id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }

    // Build update object - transform field names to match Supabase schema
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.instruction !== undefined) updateData.instruction = body.instruction;
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
    if (body.book_type !== undefined) updateData.book_type = body.book_type;
    if (body.book_page !== undefined) updateData.book_page = body.book_page;
    if (body.compensates !== undefined) updateData.compensates = body.compensates;
    if (body.data !== undefined) updateData.content = body.data;
    if (body.sort_order !== undefined) updateData.order_index = body.sort_order;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'No changes made' });
    }

    // Update activity
    const { data: updatedActivity, error: updateError } = await supabaseAdmin
      .from('activities')
      .update(updateData)
      .eq('activity_id', req.params.id)
      .select('*')
      .single();

    if (updateError || !updatedActivity) {
      console.error('Update error:', updateError);
      return res.status(500).json({ success: false, error: updateError?.message || 'Failed to update activity' });
    }

    // Transform activity to match expected format
    const transformedActivity = {
      id: updatedActivity.activity_id,
      lesson_id: updatedActivity.lesson_id,
      type: updatedActivity.activity_type,
      title: updatedActivity.title || '',
      instruction: updatedActivity.instruction || '',
      difficulty: updatedActivity.difficulty || null,
      book_type: updatedActivity.book_type || null,
      book_page: updatedActivity.book_page || null,
      compensates: updatedActivity.compensates || null,
      data: updatedActivity.content,
      sort_order: updatedActivity.order_index || 0,
      created_at: updatedActivity.created_at,
    };

    res.json({ success: true, activity: transformedActivity });
  } catch (error: any) {
    console.error('Error updating activity:', error);
    res.status(500).json({ success: false, error: 'Failed to update activity' });
  }
});

// Delete activity
app.delete('/admin/api/activities/:id', authenticateAdmin, async (req, res) => {
  try {
    // Check if activity exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('activities')
      .select('activity_id')
      .eq('activity_id', req.params.id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }

    // Delete activity
    const { error: deleteError } = await supabaseAdmin
      .from('activities')
      .delete()
      .eq('activity_id', req.params.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return res.status(500).json({ success: false, error: deleteError.message || 'Failed to delete activity' });
    }

    res.json({ success: true, message: 'Activity deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ success: false, error: 'Failed to delete activity' });
  }
});

export default app;
