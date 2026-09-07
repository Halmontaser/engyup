import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000');

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
    res.json({ status: 'ok', app: 'crescent-lms' });
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

  // Events endpoint (for LMS event tracking)
  app.post('/api/events', authenticateUser, async (req: any, res: any) => {
    const userId = req.user.id;
    const { eventType, entityType, entityId, courseId, tenantId, score, metadata } = req.body;

    try {
      // Record the event as xAPI statement
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

      // Update gamification if lesson completed
      if (eventType === 'lesson_completed') {
        // Award XP
        try {
          await supabaseAdmin.rpc('award_xp', { p_user_id: userId, p_xp: 12 });
        } catch (e) {}
      }

      res.json({ success: true, event: data });
    } catch (err: any) {
      console.error('Event error:', err);
      res.json({ success: true }); // Don't fail the lesson flow due to event errors
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
        .select('*, modules(id, title, course_id)')
        .eq('id', req.params.id)
        .single();

      if (error || !lesson) {
        return res.status(404).json({ success: false, error: 'Lesson not found' });
      }

      const mod = lesson.modules;
      const transformed = {
        ...lesson,
        module_title: mod?.title || null,
        course_id: mod?.course_id || null,
        modules: undefined,
      };

      res.json({ success: true, lesson: transformed });
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

  // Get all courses
  app.get('/admin/api/courses', authenticateAdmin, async (req, res) => {
    try {
      const { data: courses, error } = await supabaseAdmin
        .from('courses')
        .select('id, title')
        .order('title', { ascending: true });

      if (error) throw error;
      res.json({ success: true, courses: courses || [] });
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch courses' });
    }
  });

  // Get all modules (units)
  app.get('/admin/api/modules', authenticateAdmin, async (req, res) => {
    try {
      const { data: modules, error } = await supabaseAdmin
        .from('modules')
        .select('id, title, course_id, order_index, courses(id, title)')
        .order('order_index', { ascending: true });

      if (error) throw error;

      const transformed = (modules || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        course_id: m.course_id,
        order_index: m.order_index,
        course_title: m.courses?.title || null,
      }));

      res.json({ success: true, modules: transformed });
    } catch (error: any) {
      console.error('Error fetching modules:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch modules' });
    }
  });

  // Get all courses
  app.get('/admin/api/courses', authenticateAdmin, async (req, res) => {
    try {
      const { data: courses, error } = await supabaseAdmin
        .from('courses')
        .select('id, title')
        .order('title', { ascending: true });

      if (error) throw error;

      res.json({ success: true, courses: courses || [] });
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch courses' });
    }
  });

  // Get all activities (optionally filter by lesson_id)
  app.get('/admin/api/activities', authenticateAdmin, async (req, res) => {
    try {
      const { lesson_id } = req.query;
      let query = supabaseAdmin.from('activities').select('*, lessons(id, title, module_id, modules(id, title, course_id, courses(id, title)))');
      if (lesson_id) query = query.eq('lesson_id', lesson_id);
      query = query.order('order_index', { ascending: true });
      const { data: activities, error } = await query;

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
        // Parent context
        lesson_title: activity.lessons?.title || null,
        module_id: activity.lessons?.modules?.id || null,
        module_title: activity.lessons?.modules?.title || null,
        course_id: activity.lessons?.modules?.courses?.id || null,
        course_title: activity.lessons?.modules?.courses?.title || null,
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

      // Fetch parent context: lesson → module → course
      let parentContext: any = {};
      if (activity.lesson_id) {
        const { data: lesson } = await supabaseAdmin
          .from('lessons')
          .select('id, title, module_id, modules(id, title, course_id, courses(id, title))')
          .eq('id', activity.lesson_id)
          .single();
        if (lesson) {
          const mod = lesson.modules as any;
          parentContext = {
            lesson_title: lesson.title,
            module_id: lesson.module_id,
            module_title: mod?.title || null,
            course_id: mod?.course_id || null,
            course_title: mod?.courses?.title || null,
          };
        }
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
        ...parentContext,
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

  // Reorder activity
  app.patch('/admin/api/activities/:id/reorder', authenticateAdmin, async (req, res) => {
    try {
      const { order_index } = req.body;
      if (order_index === undefined) {
        return res.status(400).json({ success: false, error: 'order_index is required' });
      }

      const { data: updatedActivity, error } = await supabaseAdmin
        .from('activities')
        .update({ order_index })
        .eq('activity_id', req.params.id)
        .select('*')
        .single();

      if (error || !updatedActivity) {
        return res.status(500).json({ success: false, error: error?.message || 'Failed to reorder activity' });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error reordering activity:', error);
      res.status(500).json({ success: false, error: 'Failed to reorder activity' });
    }
  });

  // ═══════════════════════════════════════════
  // ADMIN PARTNER API ROUTES
  // ═══════════════════════════════════════════
  
  app.get('/admin/api/partners', authenticateAdmin, async (req: any, res: any) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('partner_apps')
        .select('id, name, slug, webhook_url, allowed_origins, is_active, rate_limit_per_hour, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json({ success: true, partners: data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/admin/api/partners', authenticateAdmin, async (req: any, res: any) => {
    try {
      const { name, slug, webhook_url, rate_limit_per_hour } = req.body;
      const { data, error } = await supabaseAdmin
        .from('partner_apps')
        .insert([{ 
          name, 
          slug, 
          webhook_url: webhook_url || null, 
          rate_limit_per_hour: rate_limit_per_hour || 1000 
        }])
        .select()
        .single();
      if (error) throw error;
      res.json({ success: true, partner: data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.patch('/admin/api/partners/:id', authenticateAdmin, async (req: any, res: any) => {
    try {
      const { name, webhook_url, is_active, rate_limit_per_hour } = req.body;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (webhook_url !== undefined) updateData.webhook_url = webhook_url;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (rate_limit_per_hour !== undefined) updateData.rate_limit_per_hour = rate_limit_per_hour;

      const { data, error } = await supabaseAdmin
        .from('partner_apps')
        .update(updateData)
        .eq('id', req.params.id)
        .select('id, name, slug, webhook_url, allowed_origins, is_active, rate_limit_per_hour, created_at')
        .single();
      if (error) throw error;
      res.json({ success: true, partner: data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/admin/api/partners/:id/regenerate-keys', authenticateAdmin, async (req: any, res: any) => {
    try {
      const crypto = await import('crypto');
      const new_api_key = crypto.randomBytes(32).toString('hex');
      const new_api_secret = crypto.randomBytes(32).toString('hex');
      
      const { data, error } = await supabaseAdmin
        .from('partner_apps')
        .update({ api_key: new_api_key, api_secret: new_api_secret })
        .eq('id', req.params.id)
        .select()
        .single();
      if (error) throw error;
      res.json({ success: true, partner: data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/admin/api/partners/:id', authenticateAdmin, async (req: any, res: any) => {
    try {
      const { error } = await supabaseAdmin
        .from('partner_apps')
        .delete()
        .eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get activities by lesson ID (for lesson view)
  app.get('/api/activities', async (req, res) => {
    try {
      const { lesson_id } = req.query;

      if (!lesson_id) {
        return res.status(400).json({ success: false, error: 'lesson_id is required' });
      }

      const { data: activitiesData, error } = await supabaseAdmin
        .from('activities')
        .select('*')
        .eq('lesson_id', lesson_id)
        .order('order_index', { ascending: true });

      if (error) throw error;

      const unitNames: Record<string, string> = {
        'flashcard': 'Vocabulary Review',
        'flashcards': 'Vocabulary Review',
        'mcq': 'Multiple Choice',
        'true-false': 'True or False',
        'true_false': 'True or False',
        'gap-fill': 'Fill in the Blanks',
        'gap_fill': 'Fill in the Blanks',
        'match-pairs': 'Match the Pairs',
        'match_pairs': 'Match the Pairs',
        'matching': 'Match the Pairs',
        'word-order': 'Sentence Building',
        'word_order': 'Sentence Building',
        'reading-passage': 'Reading Comprehension',
        'reading_passage': 'Reading Comprehension',
        'dialogue-read': 'Dialogue Reading',
        'dialogue_read': 'Dialogue Reading',
        'transform-sentence': 'Sentence Transformation',
        'transform_sentence': 'Sentence Transformation',
        'image-label': 'Image Labeling',
        'image_label': 'Image Labeling',
        'guessing-game': 'Guessing Game',
        'guessing_game': 'Guessing Game',
        'reading-sequence': 'Reading Sequence',
        'reading_sequence': 'Reading Sequence',
        'pronunciation-practice': 'Pronunciation Practice',
        'pronunciation_practice': 'Pronunciation Practice',
        'listening-comprehension': 'Listening Comprehension',
        'listening_comprehension': 'Listening Comprehension',
        'spelling-bee': 'Spelling Bee',
        'spelling_bee': 'Spelling Bee',
        'dictation': 'Dictation',
        'conversation-sim': 'Conversation Simulation',
        'conversation_sim': 'Conversation Simulation',
        'picture-description': 'Picture Description',
        'picture_description': 'Picture Description',
        'sentence-builder': 'Sentence Builder',
        'sentence_builder': 'Sentence Builder',
        'word-association': 'Word Association',
        'word_association': 'Word Association',
        'category-sort': 'Category Sorting',
        'category_sort': 'Category Sorting',
      };

      const activitiesWithUnits = (activitiesData || []).map(a => ({
        id: a.activity_id,
        type: a.activity_type,
        title: a.title || '',
        instruction: a.instruction || a.title || 'Complete this activity',
        data: a.content,
        compensates: a.compensates || null,
        unit: unitNames[a.activity_type] || formatUnitName(a.activity_type),
        media: { audio: [], images: [] },
      }));

      res.json({ success: true, activities: activitiesWithUnits });
    } catch (error: any) {
      console.error('Error fetching lesson activities:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch activities' });
    }
  });

  function formatUnitName(type: string): string {
    if (!type) return 'Activities';
    return type
      .split(/[_\s-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // ═══════════════════════════════════════════
  // PARTNER API ROUTES (API Key authenticated)
  // ═══════════════════════════════════════════
  const { authenticatePartner } = await import('./src/middleware/partnerAuth.js');
  const { WebhookService } = await import('./src/services/webhookService.js');

  // 1. GET /api/partner/lessons — List available lessons
  app.get('/api/partner/lessons', authenticatePartner(supabaseAdmin), async (req: any, res: any) => {
    const partner = req.partner;
    const { courseId, gradeId } = req.query;

    let query = supabaseAdmin
      .from('lessons')
      .select('id, title, module_id, order_index, description, objectives');

    if (partner.allowed_courses?.length) {
      const { data: modules } = await supabaseAdmin
        .from('modules')
        .select('id')
        .in('course_id', partner.allowed_courses);
      const moduleIds = (modules || []).map((m: any) => m.id);
      query = query.in('module_id', moduleIds);
    }

    if (courseId) {
      const { data: modules } = await supabaseAdmin
        .from('modules')
        .select('id')
        .eq('course_id', courseId);
      query = query.in('module_id', (modules || []).map((m: any) => m.id));
    }

    const { data, error } = await query.order('order_index');
    if (error) return res.status(500).json({ error: error.message });

    await supabaseAdmin.from('partner_api_logs').insert([{
      partner_app_id: partner.id, endpoint: '/api/partner/lessons',
      method: 'GET', status_code: 200
    }]);

    res.json({ success: true, lessons: data });
  });

  // 2. GET /api/partner/lessons/:id/activities — Get full lesson with activities
  app.get('/api/partner/lessons/:id/activities', authenticatePartner(supabaseAdmin), async (req: any, res: any) => {
    const { id } = req.params;

    const { data: activities, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('lesson_id', id)
      .order('order_index');

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, activities });
  });

  // 3. POST /api/partner/embed-token — Generate a signed embed token
  app.post('/api/partner/embed-token', authenticatePartner(supabaseAdmin), async (req: any, res: any) => {
    const { lessonId, externalUserId, displayName } = req.body;
    const partner = req.partner;

    let { data: mapping } = await supabaseAdmin
      .from('partner_user_mappings')
      .select('*')
      .eq('partner_app_id', partner.id)
      .eq('external_user_id', externalUserId)
      .maybeSingle();

    if (!mapping) {
      const { data: newMapping } = await supabaseAdmin
        .from('partner_user_mappings')
        .insert([{
          partner_app_id: partner.id,
          external_user_id: externalUserId,
          display_name: displayName
        }])
        .select()
        .single();
      mapping = newMapping;
    }

    const payload = {
      partnerId: partner.id,
      lessonId,
      externalUserId,
      mappingId: mapping.id,
      exp: Date.now() + 3600000
    };

    const token = Buffer.from(JSON.stringify(payload)).toString('base64url');

    res.json({ success: true, embedToken: token, embedUrl: `/embed?token=${token}` });
  });

  // 4. POST /api/partner/progress — Submit progress from partner
  app.post('/api/partner/progress', authenticatePartner(supabaseAdmin), async (req: any, res: any) => {
    const { externalUserId, activityId, status, score, timeSpentSeconds } = req.body;
    const partner = req.partner;

    const { data: mapping } = await supabaseAdmin
      .from('partner_user_mappings')
      .select('engyup_user_id')
      .eq('partner_app_id', partner.id)
      .eq('external_user_id', externalUserId)
      .maybeSingle();

    const progressData = {
      user_id: mapping?.engyup_user_id || null,
      activity_id: activityId,
      status: status || 'completed',
      score: score || null,
      time_spent_seconds: timeSpentSeconds || 0,
      completed_at: status === 'completed' ? new Date().toISOString() : null
    };

    if (mapping?.engyup_user_id) {
      await supabaseAdmin.from('activity_progress').upsert([{
        ...progressData,
        user_id: mapping.engyup_user_id
      }], { onConflict: 'user_id,activity_id' });
    }

    await supabaseAdmin.from('xapi_statements').insert([{
      user_id: mapping?.engyup_user_id,
      verb: status === 'completed' ? 'end' : 'start',
      activity_id: activityId,
      activity_type: 'activity',
      score: score,
      metadata: {
        partner_app_id: partner.id,
        external_user_id: externalUserId,
        source: 'partner_api'
      }
    }]);

    res.json({ success: true });

    if (partner.webhook_url) {
      WebhookService.dispatch(
        partner.webhook_url,
        partner.api_secret,
        {
          event: status === 'completed' ? 'activity_completed' : 'activity_progress',
          external_user_id: externalUserId,
          data: { activityId, status, score, timeSpentSeconds },
          timestamp: new Date().toISOString()
        }
      ).catch((err: any) => console.error('Webhook dispatch failed:', err));
    }
  });

  // 5. GET /api/partner/users/:externalId/progress — Get user progress
  app.get('/api/partner/users/:externalId/progress',
    authenticatePartner(supabaseAdmin), async (req: any, res: any) => {
    const { externalId } = req.params;
    const partner = req.partner;

    const { data: mapping } = await supabaseAdmin
      .from('partner_user_mappings')
      .select('engyup_user_id')
      .eq('partner_app_id', partner.id)
      .eq('external_user_id', externalId)
      .maybeSingle();

    if (!mapping?.engyup_user_id) {
      return res.json({ success: true, progress: [] });
    }

    const { data: progress } = await supabaseAdmin
      .from('activity_progress')
      .select('activity_id, status, score, time_spent_seconds, completed_at')
      .eq('user_id', mapping.engyup_user_id);

    res.json({ success: true, progress: progress || [] });
  });

  // Create Vite dev server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  🌙 Crescent LMS running at http://localhost:${PORT}\n`);
  });
}

startServer().catch(console.error);
