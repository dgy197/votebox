import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Event, Participant, Question } from '../types'

interface VoteResults {
  yes: number;
  no: number;
  abstain: number;
}

interface EventState {
  // Current event
  currentEvent: Event | null
  events: Event[]
  
  // Participants
  participants: Participant[]
  
  // Questions
  questions: Question[]
  activeQuestion: Question | null
  
  // Voter-specific
  currentQuestion: (Question & { text: string; time_limit?: number; activated_at?: string }) | null
  results: VoteResults | null
  
  // Loading states
  loading: boolean
  
  // Actions
  setCurrentEvent: (event: Event | null) => void
  setEvents: (events: Event[]) => void
  addEvent: (event: Event) => void
  updateEvent: (id: string, updates: Partial<Event>) => void
  removeEvent: (id: string) => void
  
  setParticipants: (participants: Participant[]) => void
  addParticipant: (participant: Participant) => void
  updateParticipant: (id: string, updates: Partial<Participant>) => void
  removeParticipant: (id: string) => void
  
  setQuestions: (questions: Question[]) => void
  addQuestion: (question: Question) => void
  updateQuestion: (id: string, updates: Partial<Question>) => void
  removeQuestion: (id: string) => void
  setActiveQuestion: (question: Question | null) => void
  
  // Voter actions
  fetchCurrentQuestion: (eventId: string) => Promise<void>
  submitVote: (questionId: string, participantId: string, vote: 'yes' | 'no' | 'abstain') => Promise<boolean>
  
  setLoading: (loading: boolean) => void
  reset: () => void
}

const initialState = {
  currentEvent: null,
  events: [],
  participants: [],
  questions: [],
  activeQuestion: null,
  currentQuestion: null,
  results: null,
  loading: false,
}

export const useEventStore = create<EventState>((set) => ({
  ...initialState,
  
  setCurrentEvent: (event) => set({ currentEvent: event }),
  
  setEvents: (events) => set({ events }),
  
  addEvent: (event) => set((state) => ({ 
    events: [event, ...state.events] 
  })),
  
  updateEvent: (id, updates) => set((state) => ({
    events: state.events.map((e) => e.id === id ? { ...e, ...updates } : e),
    currentEvent: state.currentEvent?.id === id 
      ? { ...state.currentEvent, ...updates } 
      : state.currentEvent,
  })),
  
  removeEvent: (id) => set((state) => ({
    events: state.events.filter((e) => e.id !== id),
    currentEvent: state.currentEvent?.id === id ? null : state.currentEvent,
  })),
  
  setParticipants: (participants) => set({ participants }),
  
  addParticipant: (participant) => set((state) => ({
    participants: [...state.participants, participant],
  })),
  
  updateParticipant: (id, updates) => set((state) => ({
    participants: state.participants.map((p) => 
      p.id === id ? { ...p, ...updates } : p
    ),
  })),
  
  removeParticipant: (id) => set((state) => ({
    participants: state.participants.filter((p) => p.id !== id),
  })),
  
  setQuestions: (questions) => set({ questions }),
  
  addQuestion: (question) => set((state) => ({
    questions: [...state.questions, question],
  })),
  
  updateQuestion: (id, updates) => set((state) => ({
    questions: state.questions.map((q) => 
      q.id === id ? { ...q, ...updates } : q
    ),
    activeQuestion: state.activeQuestion?.id === id
      ? { ...state.activeQuestion, ...updates }
      : state.activeQuestion,
  })),
  
  removeQuestion: (id) => set((state) => ({
    questions: state.questions.filter((q) => q.id !== id),
    activeQuestion: state.activeQuestion?.id === id ? null : state.activeQuestion,
  })),
  
  setActiveQuestion: (question) => set({ activeQuestion: question }),
  
  // Voter actions
  fetchCurrentQuestion: async (eventId) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('event_id', eventId)
        .eq('state', 'active')
        .single();

      if (error || !data) {
        set({ currentQuestion: null });
        return;
      }

      set({ 
        currentQuestion: {
          ...data,
          text: data.text_hu,
          time_limit: data.time_limit_seconds || undefined,
          activated_at: data.activated_at || undefined,
        }
      });
    } catch {
      set({ currentQuestion: null });
    }
  },

  submitVote: async (questionId, participantId, vote) => {
    try {
      // Map vote to choices array
      const choiceMap = { yes: ['yes'], no: ['no'], abstain: ['abstain'] };
      
      const { error } = await supabase
        .from('ballots')
        .insert({
          question_id: questionId,
          participant_id: participantId,
          choices: choiceMap[vote],
        });

      if (error) {
        console.error('Vote submission error:', error);
        return false;
      }

      // Mark as voted
      await supabase
        .from('cast_markers')
        .insert({
          question_id: questionId,
          participant_id: participantId,
        });

      return true;
    } catch {
      return false;
    }
  },
  
  setLoading: (loading) => set({ loading }),
  
  reset: () => set(initialState),
}))
