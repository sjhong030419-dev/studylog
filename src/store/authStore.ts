import { create } from 'zustand'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

type AuthStatus = 'idle' | 'loading' | 'ready' | 'unconfigured' | 'error'

interface AuthState {
  userId: string | null
  status: AuthStatus
  errorMessage: string | null
  init: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  userId: null,
  status: 'idle',
  errorMessage: null,

  init: async () => {
    if (get().status === 'loading' || get().status === 'ready') return

    if (!isSupabaseConfigured || !supabase) {
      set({ status: 'unconfigured' })
      return
    }

    set({ status: 'loading' })

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      let userId = sessionData.session?.user.id ?? null

      if (!userId) {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) throw error
        userId = data.user?.id ?? null
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        useAuthStore.setState({ userId: session?.user.id ?? null })
      })

      set({ userId, status: 'ready' })
    } catch (err) {
      console.error('Supabase auth init failed:', err)
      set({ status: 'error', errorMessage: err instanceof Error ? err.message : '인증 오류' })
    }
  },
}))
