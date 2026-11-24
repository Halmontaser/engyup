import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/api/supabase';
import { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  grade: string | null;
  city: string | null;
  school_name: string | null;
  role: string | null;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export interface Membership {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  tenants?: Tenant;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  activeTenant: Tenant | null;
  memberships: Membership[];
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, grade?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);

  const fetchUserData = useCallback(async (userId: string) => {
    // 1. Try reading cached profile & tenant first for instant offline startup
    try {
      const [cachedProfile, cachedTenant] = await Promise.all([
        AsyncStorage.getItem(`@engyup_${userId}_profile`).then((v) => v || AsyncStorage.getItem(`@crescent_${userId}_profile`)),
        AsyncStorage.getItem(`@engyup_${userId}_tenant`).then((v) => v || AsyncStorage.getItem(`@crescent_${userId}_tenant`)),
      ]);
      if (cachedProfile) setProfile(JSON.parse(cachedProfile));
      if (cachedTenant) setActiveTenant(JSON.parse(cachedTenant));
    } catch (e) {
      // Ignore local read errors
    }

    try {
      const [profileRes, membershipRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('memberships').select('*, tenants(*)').eq('user_id', userId),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
        AsyncStorage.setItem(`@engyup_${userId}_profile`, JSON.stringify(profileRes.data)).catch(() => {});
      }

      let userMemberships = (membershipRes.data || []) as Membership[];
      let generalMembership = userMemberships.find((m) => m.tenants?.slug === 'general');

      if (!generalMembership) {
        const { data: generalTenant } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', 'general')
          .maybeSingle();

        if (generalTenant) {
          const { data: newMembership } = await supabase
            .from('memberships')
            .insert([{ user_id: userId, tenant_id: generalTenant.id, role: 'student' }])
            .select('*, tenants(*)')
            .maybeSingle();

          if (newMembership) {
            generalMembership = newMembership as Membership;
            userMemberships = [...userMemberships, generalMembership];
          }
        }
      }

      setMemberships(userMemberships);
      const active = generalMembership?.tenants || userMemberships[0]?.tenants || null;
      if (active) {
        setActiveTenant(active);
        AsyncStorage.setItem(`@engyup_${userId}_tenant`, JSON.stringify(active)).catch(() => {});
      }
    } catch (err) {
      console.error('Error fetching user data in mobile AuthContext:', err);
    }
  }, []);

  useEffect(() => {
    // AppState auto-refresh handler to prevent expired JWT after phone locks
    const appStateSub = AppState.addEventListener('change', (state: string) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setProfile(null);
        setMemberships([]);
        setActiveTenant(null);
      }
      setLoading(false);
    });

    return () => {
      appStateSub.remove();
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, grade = 'Grade 7') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, grade, role: 'student' },
      },
    });

    if (!error && data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        grade,
        role: 'student',
      });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setMemberships([]);
    setActiveTenant(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchUserData(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        activeTenant,
        memberships,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
