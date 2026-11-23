import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};
const SUPABASE_URL = extra.supabaseUrl || 'https://msttsebafjgzllyabsid.supabase.co';
const SUPABASE_ANON_KEY = extra.supabaseAnonKey || 'sb_publishable_eS3m4pnX9V7rK9RS92jghA_waa7unBI';

export const CDN_BASE_URL = extra.cdnUrl || 'https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev';

export function getMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const cleanCdn = CDN_BASE_URL.endsWith('/') ? CDN_BASE_URL.slice(0, -1) : CDN_BASE_URL;
  return `${cleanCdn}/${cleanPath}`;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
