import { Membership } from './supabase';

export function canEditActivities(memberships: Membership[] | undefined): boolean {
  if (!memberships || memberships.length === 0) return false;
  return memberships.some(m => m.role === 'teacher' || m.role === 'super_admin');
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