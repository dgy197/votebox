import { create } from 'zustand'
import type { User, Participant, UserRole } from '../types'

interface AuthState {
  // Admin auth (Supabase Auth)
  user: (User & { role?: UserRole }) | null
  isAdmin: boolean
  isSuperAdmin: boolean
  
  // Voter auth (event-based)
  participant: Participant | null
  eventId: string | null
  isVoter: boolean
  
  // Actions
  setUser: (user: (User & { role?: UserRole }) | null) => void
  setParticipant: (participant: Participant | null, eventId: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  isSuperAdmin: false,
  participant: null,
  eventId: null,
  isVoter: false,
  
  setUser: (user) => set({ 
    user, 
    isAdmin: !!user,
    isSuperAdmin: user?.role === 'super_admin',
    // Clear voter state when admin logs in
    participant: null,
    eventId: null,
    isVoter: false,
  }),
  
  setParticipant: (participant, eventId) => set({ 
    participant, 
    eventId,
    isVoter: !!participant,
    // Clear admin state when voter logs in
    user: null,
    isAdmin: false,
  }),
  
  logout: () => set({ 
    user: null, 
    isAdmin: false,
    isSuperAdmin: false,
    participant: null,
    eventId: null,
    isVoter: false,
  }),
}))
