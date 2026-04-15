import { createClient } from '@supabase/supabase-js';

/**
 * Environment Variables Configuration
 * Vite automatically exposes variables prefixed with VITE_ to client code
 */
const getEnvVars = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return {
    supabaseUrl,
    supabaseAnonKey,
    appUrl,
    googleClientId,
  };
};

const { supabaseUrl, supabaseAnonKey } = getEnvVars();

// Validate required environment variables
if (!supabaseUrl) {
  console.warn('VITE_SUPABASE_URL is not set. Using default or development mode.');
}

if (!supabaseAnonKey) {
  console.warn('VITE_SUPABASE_ANON_KEY is not set. Using default or development mode.');
}

// Create Supabase client with auth configuration
export const supabase = createClient(
  supabaseUrl || 'https://msttsebafjgzllyabsid.supabase.co',
  supabaseAnonKey || '',
  {
    auth: {
      // Store auth tokens in localStorage for persistence
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,

      // Auto-refresh tokens
      autoRefreshToken: true,

      // Detect session changes
      detectSessionInUrl: true,

      // Persist session
      persistSession: true,

      // Flow type for OAuth
      flowType: 'pkce',

      // OAuth redirect options
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,

      // Debug mode for development
      debug: import.meta.env.NODE_ENV === 'development',
    },
  }
);

// Export environment variables for use in components
export const envVars = getEnvVars();

// Export Supabase configuration for debugging
export const supabaseConfig = {
  url: supabaseUrl,
  hasCredentials: !!(supabaseUrl && supabaseAnonKey),
  isProduction: import.meta.env.NODE_ENV === 'production',
};

// Types
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

/**
 * Auth Helper Functions
 */
export const authHelpers = {
  /**
   * Sign in with Google OAuth
   */
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }

    return data;
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  /**
   * Get current session
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Get session error:', error);
      return null;
    }
    return data.session;
  },

  /**
   * Get current user
   */
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Get user error:', error);
      return null;
    }
    return data.user;
  },
};
