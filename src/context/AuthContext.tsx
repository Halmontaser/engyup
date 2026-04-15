import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile, Membership, Tenant } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  memberships: Membership[];
  activeTenant: Tenant | null;
  setActiveTenant: (tenant: Tenant | null) => void;
  enrollments: Record<string, boolean>;
  setEnrollments: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  progress: Record<string, boolean>;
  setProgress: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshData: () => Promise<void>;
  fetchEnrollments: (userId: string, tenantId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [enrollments, setEnrollments] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const refreshData = async () => {
    if (user) {
      await fetchUserData(user.id);
      if (activeTenant) {
        await fetchEnrollments(user.id, activeTenant.id);
      }
    }
  };

  const fetchEnrollments = async (userId: string, tenantId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/my-enrollments?tenantId=${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        const enrollMap: Record<string, boolean> = {};
        data.enrollments.forEach((id: string) => enrollMap[id] = true);
        setEnrollments(enrollMap);

        const progressMap: Record<string, boolean> = {};
        data.progress.forEach((p: any) => progressMap[p.lesson_id] = p.status === 'completed');
        setProgress(progressMap);
      }
    } catch (err) {
      console.error('Error fetching enrollments via API:', err);
    }
  };

  useEffect(() => {
    if (user && activeTenant) {
      fetchEnrollments(user.id, activeTenant.id);

      const enrollmentSubscription = supabase
        .channel('enrollment-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments', filter: `user_id=eq.${user.id}` }, () => {
          fetchEnrollments(user.id, activeTenant.id);
        })
        .subscribe();
      
      const progressSubscription = supabase
        .channel('progress-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_progress', filter: `user_id=eq.${user.id}` }, () => {
          fetchEnrollments(user.id, activeTenant.id);
        })
        .subscribe();

      const profileSubscription = supabase
        .channel('profile-changes')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
          setProfile(payload.new as Profile);
        })
        .subscribe();

      return () => {
        enrollmentSubscription.unsubscribe();
        progressSubscription.unsubscribe();
        profileSubscription.unsubscribe();
      };
    }
  }, [user?.id, activeTenant?.id]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(prev => {
        if (prev?.access_token === session?.access_token) return prev;
        return session;
      });
      
      setUser(prev => {
        if (prev?.id === session?.user?.id) return prev;
        return session?.user ?? null;
      });
      
      if (!session) {
        setProfile(null);
        setMemberships([]);
        setActiveTenant(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData(user.id);
    }
  }, [user?.id]);

  const fetchUserData = async (userId: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const [profileRes, membershipRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('memberships').select('*, tenants(*)').eq('user_id', userId)
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      
      let userMemberships = membershipRes.data || [];

      let generalMembership = userMemberships.find(m => m.tenants?.slug === 'general');

      if (!generalMembership) {
        const { data: generalTenant } = await supabase
          .from('tenants').select('*').eq('slug', 'general').maybeSingle();

        if (generalTenant) {
          const admins = ['lms_yemen@outlook.com', 'halmontaser1@gmail.com'];
          const isDefaultAdmin = admins.includes(user?.email || '');
          const userRole = user?.user_metadata?.role || 'student';
          const finalRole = isDefaultAdmin ? 'super_admin' : userRole;

          const { data: newMembership } = await supabase
            .from('memberships')
            .insert([{ user_id: userId, tenant_id: generalTenant.id, role: finalRole }])
            .select('*, tenants(*)')
            .maybeSingle();

          if (newMembership) {
            userMemberships = [...userMemberships, newMembership];
            generalMembership = newMembership;
          }
        }
      }

      const admins = ['lms_yemen@outlook.com', 'halmontaser1@gmail.com'];
      if (generalMembership && admins.includes(user?.email || '') && generalMembership.role !== 'super_admin') {
        const { data: updatedMembership } = await supabase
          .from('memberships')
          .update({ role: 'super_admin' })
          .eq('id', generalMembership.id)
          .select('*, tenants(*)')
          .maybeSingle();
        
        if (updatedMembership) {
          userMemberships = userMemberships.map(m => m.id === updatedMembership.id ? updatedMembership : m);
        }
      }

      setMemberships(userMemberships);
      
      const preferredTenant = userMemberships.find(m => m.tenants?.slug === 'general')?.tenants || userMemberships[0]?.tenants;
      if (preferredTenant) {
        setActiveTenant(preferredTenant);
        await fetchEnrollments(userId, preferredTenant.id);
      }
    } catch (error) {
      console.error('Unexpected error in fetchUserData:', error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, session, profile, memberships, activeTenant, setActiveTenant, 
      enrollments, setEnrollments, progress, setProgress, fetchEnrollments,
      loading, signOut, refreshData 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
