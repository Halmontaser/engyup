import { createClient } from '@supabase/supabase-js'

const getSupabaseConfig = () => {
  const env = (import.meta as any).env || {};

  // For server-side (Next.js API routes), use process.env
  const isServer = typeof window === 'undefined';

  let url: string;
  let key: string;

  if (isServer) {
    // Server-side - use process.env (for Next.js API routes)
    url = process.env.VITE_SUPABASE_URL || '';
    // For server-side admin operations, prefer service role key, fall back to anon key
    key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  } else {
    // Client-side - use import.meta.env (Vite)
    url = env.VITE_SUPABASE_URL || '';
    key = env.VITE_SUPABASE_ANON_KEY || '';
  }

  const defaultUrl = 'https://msttsebafjgzllyabsid.supabase.co';

  const finalUrl = (url && url !== 'undefined' && url.startsWith('http')) ? url : defaultUrl;
  const finalKey = (key && key !== 'undefined') ? key : null;

  return { finalUrl, finalKey };
};

const { finalUrl, finalKey } = getSupabaseConfig();

if (!finalKey) {
  console.error('Supabase Key is missing! Please set VITE_SUPABASE_ANON_KEY in your environment.');
}

export const supabase = createClient(finalUrl, finalKey || 'MISSING_KEY');

export type Profile = {
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

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
};

export type Membership = {
  id: string;
  user_id: string;
  tenant_id: string;
  role: 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent';
  tenants: Tenant;
};

export type Notification = {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  created_at: string;
};

export type XApiStatement = {
  id: string;
  user_id: string;
  tenant_id?: string;
  verb: 'start' | 'end' | 'score' | 'store';
  activity_id: string;
  activity_type?: string;
  score?: number;
  max_score?: number;
  success?: boolean;
  completion?: boolean;
  duration?: string;
  metadata: any;
  is_public: boolean;
  created_at: string;
};
