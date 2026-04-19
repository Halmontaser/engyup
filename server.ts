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
        await supabaseAdmin.rpc('award_xp', { p_user_id: userId, p_xp: 12 }).catch(() => {});
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
