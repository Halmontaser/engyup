import { Membership, Profile } from './supabase';

export function canEditActivities(memberships: Membership[] | undefined, profile?: Profile | null): boolean {
  const hasMembershipRole = memberships && memberships.some(m => m.role === 'teacher' || m.role === 'super_admin');
  const hasProfileRole = profile && (profile.role === 'teacher' || profile.role === 'super_admin');
  return !!(hasMembershipRole || hasProfileRole);
}

export function hasRole(memberships: Membership[] | undefined, role: string): boolean {
  if (!memberships || memberships.length === 0) return false;
  return memberships.some(m => m.role === role);
}

export function isSuperAdmin(memberships: Membership[] | undefined): boolean {
  return hasRole(memberships, 'super_admin');
}

export function isTeacher(memberships: Membership[] | undefined): boolean {
  return hasRole(memberships, 'teacher');
}

export function isAlwaysFreeMode(memberships: Membership[] | undefined, profile?: Profile | null): boolean {
  return isSuperAdmin(memberships) || isTeacher(memberships)
    || profile?.role === 'super_admin' || profile?.role === 'teacher';
}