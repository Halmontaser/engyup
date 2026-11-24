import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://msttsebafjgzllyabsid.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_eS3m4pnX9V7rK9RS92jghA_waa7unBI';

const getSupabaseConfig = () => {
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const procEnv = (typeof process !== 'undefined' && process.env) || {};

  const url =
    metaEnv.VITE_SUPABASE_URL ||
    procEnv.VITE_SUPABASE_URL ||
    procEnv.NEXT_PUBLIC_SUPABASE_URL ||
    procEnv.SUPABASE_URL ||
    '';

  const key =
    metaEnv.VITE_SUPABASE_ANON_KEY ||
    procEnv.VITE_SUPABASE_ANON_KEY ||
    procEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    procEnv.SUPABASE_ANON_KEY ||
    procEnv.SUPABASE_SERVICE_ROLE_KEY ||
    procEnv.SUPABASE_KEY ||
    '';

  const finalUrl = (url && url !== 'undefined' && url.startsWith('http')) ? url : DEFAULT_SUPABASE_URL;
  const finalKey = (key && key !== 'undefined' && key.trim() !== '') ? key : DEFAULT_SUPABASE_ANON_KEY;

  return { finalUrl, finalKey };
};

const { finalUrl, finalKey } = getSupabaseConfig();

export const supabase = createClient(finalUrl, finalKey);

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
