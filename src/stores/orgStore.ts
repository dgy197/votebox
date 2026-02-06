import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Organization, OrganizationType } from '../types/v3'

interface OrgState {
  // Data
  organizations: Organization[]
  currentOrg: Organization | null
  
  // Loading/Error
  loading: boolean
  error: string | null
  
  // Actions
  fetchOrganizations: () => Promise<void>
  fetchOrganization: (id: string) => Promise<Organization | null>
  createOrganization: (data: CreateOrgInput) => Promise<Organization | null>
  updateOrganization: (id: string, data: UpdateOrgInput) => Promise<boolean>
  deleteOrganization: (id: string) => Promise<boolean>
  setCurrentOrg: (org: Organization | null) => void
  clearError: () => void
  reset: () => void
}

export interface CreateOrgInput {
  name: string
  type: OrganizationType
  settings?: Record<string, unknown>
  logo_url?: string
}

export interface UpdateOrgInput {
  name?: string
  type?: OrganizationType
  settings?: Record<string, unknown>
  logo_url?: string
}

const initialState = {
  organizations: [],
  currentOrg: null,
  loading: false,
  error: null,
}

export const useOrgStore = create<OrgState>((set) => ({
  ...initialState,

  fetchOrganizations: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ organizations: data || [], loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  fetchOrganization: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      set({ currentOrg: data, loading: false })
      return data
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return null
    }
  },

  createOrganization: async (input: CreateOrgInput) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          name: input.name,
          type: input.type,
          settings: input.settings || {},
          logo_url: input.logo_url,
        })
        .select()
        .single()

      if (error) throw error
      
      set((state) => ({
        organizations: [data, ...state.organizations],
        loading: false,
      }))
      return data
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return null
    }
  },

  updateOrganization: async (id: string, input: UpdateOrgInput) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        organizations: state.organizations.map((org) =>
          org.id === id ? data : org
        ),
        currentOrg: state.currentOrg?.id === id ? data : state.currentOrg,
        loading: false,
      }))
      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  deleteOrganization: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        organizations: state.organizations.filter((org) => org.id !== id),
        currentOrg: state.currentOrg?.id === id ? null : state.currentOrg,
        loading: false,
      }))
      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  setCurrentOrg: (org) => set({ currentOrg: org }),
  
  clearError: () => set({ error: null }),
  
  reset: () => set(initialState),
}))
