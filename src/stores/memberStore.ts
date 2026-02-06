import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Member, MemberRole } from '../types/v3'

interface MemberState {
  // Data
  members: Member[]
  currentMember: Member | null
  
  // Loading/Error
  loading: boolean
  error: string | null
  
  // Actions
  fetchMembers: (orgId: string) => Promise<void>
  fetchMember: (id: string) => Promise<Member | null>
  createMember: (data: CreateMemberInput) => Promise<Member | null>
  updateMember: (id: string, data: UpdateMemberInput) => Promise<boolean>
  deleteMember: (id: string) => Promise<boolean>
  importMembersFromCSV: (orgId: string, csvData: CSVMemberRow[]) => Promise<ImportResult>
  setCurrentMember: (member: Member | null) => void
  clearError: () => void
  reset: () => void
}

export interface CreateMemberInput {
  org_id: string
  name: string
  email?: string
  phone?: string
  weight?: number
  weight_label?: string
  role?: MemberRole
  user_id?: string
}

export interface UpdateMemberInput {
  name?: string
  email?: string
  phone?: string
  weight?: number
  weight_label?: string
  role?: MemberRole
  is_active?: boolean
}

export interface CSVMemberRow {
  name: string
  email?: string
  phone?: string
  weight?: number | string
  weight_label?: string
  role?: string
}

export interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

const initialState = {
  members: [],
  currentMember: null,
  loading: false,
  error: null,
}

export const useMemberStore = create<MemberState>((set) => ({
  ...initialState,

  fetchMembers: async (orgId: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('org_id', orgId)
        .order('name', { ascending: true })

      if (error) throw error
      set({ members: data || [], loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  fetchMember: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      set({ currentMember: data, loading: false })
      return data
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return null
    }
  },

  createMember: async (input: CreateMemberInput) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('members')
        .insert({
          org_id: input.org_id,
          name: input.name,
          email: input.email,
          phone: input.phone,
          weight: input.weight ?? 1.0,
          weight_label: input.weight_label,
          role: input.role ?? 'voter',
          user_id: input.user_id,
        })
        .select()
        .single()

      if (error) throw error
      
      set((state) => ({
        members: [...state.members, data].sort((a, b) => 
          a.name.localeCompare(b.name)
        ),
        loading: false,
      }))
      return data
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return null
    }
  },

  updateMember: async (id: string, input: UpdateMemberInput) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('members')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        members: state.members
          .map((m) => (m.id === id ? data : m))
          .sort((a, b) => a.name.localeCompare(b.name)),
        currentMember: state.currentMember?.id === id ? data : state.currentMember,
        loading: false,
      }))
      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  deleteMember: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        members: state.members.filter((m) => m.id !== id),
        currentMember: state.currentMember?.id === id ? null : state.currentMember,
        loading: false,
      }))
      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  importMembersFromCSV: async (orgId: string, csvData: CSVMemberRow[]) => {
    set({ loading: true, error: null })
    const result: ImportResult = { success: 0, failed: 0, errors: [] }

    const validRoles: MemberRole[] = ['admin', 'chair', 'secretary', 'voter', 'observer']
    
    const membersToInsert = csvData.map((row, index) => {
      // Validate and parse
      if (!row.name?.trim()) {
        result.failed++
        result.errors.push(`Row ${index + 1}: Missing name`)
        return null
      }

      let weight = 1.0
      if (row.weight !== undefined) {
        const parsed = typeof row.weight === 'string' ? parseFloat(row.weight) : row.weight
        if (!isNaN(parsed) && parsed >= 0) {
          weight = parsed
        }
      }

      let role: MemberRole = 'voter'
      if (row.role && validRoles.includes(row.role as MemberRole)) {
        role = row.role as MemberRole
      }

      return {
        org_id: orgId,
        name: row.name.trim(),
        email: row.email?.trim() || null,
        phone: row.phone?.trim() || null,
        weight,
        weight_label: row.weight_label?.trim() || null,
        role,
      }
    }).filter(Boolean) as Array<{
      org_id: string
      name: string
      email: string | null
      phone: string | null
      weight: number
      weight_label: string | null
      role: MemberRole
    }>

    if (membersToInsert.length === 0) {
      set({ loading: false, error: 'No valid members to import' })
      return result
    }

    try {
      const { data, error } = await supabase
        .from('members')
        .insert(membersToInsert)
        .select()

      if (error) throw error

      result.success = data?.length || 0

      if (data) {
        set((state) => ({
          members: [...state.members, ...data].sort((a, b) =>
            a.name.localeCompare(b.name)
          ),
          loading: false,
        }))
      }
    } catch (err) {
      result.failed = membersToInsert.length
      result.errors.push((err as Error).message)
      set({ error: (err as Error).message, loading: false })
    }

    set({ loading: false })
    return result
  },

  setCurrentMember: (member) => set({ currentMember: member }),
  
  clearError: () => set({ error: null }),
  
  reset: () => set(initialState),
}))
