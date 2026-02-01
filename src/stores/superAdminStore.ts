import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Organization, UserRole } from '../types';

interface SuperAdminState {
  organizations: Organization[];
  currentOrg: Organization | null;
  userRole: UserRole | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchOrganizations: () => Promise<void>;
  createOrganization: (name: string, slug: string) => Promise<Organization | null>;
  deleteOrganization: (id: string) => Promise<boolean>;
  setCurrentOrg: (org: Organization | null) => void;
  checkUserRole: () => Promise<UserRole | null>;
  impersonateOrg: (orgId: string) => void;
}

export const useSuperAdminStore = create<SuperAdminState>((set, get) => ({
  organizations: [],
  currentOrg: null,
  userRole: null,
  isLoading: false,
  error: null,

  fetchOrganizations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ organizations: data || [], isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createOrganization: async (name: string, slug: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert({ name, slug })
        .select()
        .single();

      if (error) throw error;
      
      const orgs = get().organizations;
      set({ organizations: [data, ...orgs], isLoading: false });
      return data;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  deleteOrganization: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      const orgs = get().organizations.filter(o => o.id !== id);
      set({ organizations: orgs, isLoading: false });
      return true;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return false;
    }
  },

  setCurrentOrg: (org) => {
    set({ currentOrg: org });
    if (org) {
      localStorage.setItem('currentOrgId', org.id);
    } else {
      localStorage.removeItem('currentOrgId');
    }
  },

  checkUserRole: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = (data?.role as UserRole) || 'org_admin';
      set({ userRole: role });
      return role;
    } catch {
      return null;
    }
  },

  impersonateOrg: (orgId: string) => {
    const org = get().organizations.find(o => o.id === orgId);
    if (org) {
      set({ currentOrg: org });
      localStorage.setItem('impersonatedOrgId', orgId);
    }
  },
}));
