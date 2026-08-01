import { create } from 'zustand'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

type AuthStatus = 'idle' | 'loading' | 'ready' | 'unconfigured' | 'error'
export type LinkEmailStatus = 'idle' | 'sending' | 'sent' | 'error'

interface AuthState {
  userId: string | null
  /** Non-null once this session has a real email attached — Supabase's
   * anonymous users never carry one, so this is the same signal
   * docs/StudyLog_Supabase_Data_Migration_Plan_v2.0.md §3-1 uses to tell
   * "still anonymous" apart from "linked to an email account". */
  email: string | null
  status: AuthStatus
  errorMessage: string | null
  linkEmailStatus: LinkEmailStatus
  linkEmailError: string | null
  init: () => Promise<void>
  /** Sends a magic link to `email` via `signInWithOtp` — clicking it in the
   * mail client upgrades this anonymous session to that email account
   * (same `auth.uid()`, §3-1/§5 of the migration plan) without ever asking
   * for a password. */
  linkEmail: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  userId: null,
  email: null,
  status: 'idle',
  errorMessage: null,
  linkEmailStatus: 'idle',
  linkEmailError: null,

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
      let email = sessionData.session?.user.email ?? null

      if (!userId) {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) throw error
        userId = data.user?.id ?? null
        email = data.user?.email ?? null
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        useAuthStore.setState({ userId: session?.user.id ?? null, email: session?.user.email ?? null })
      })

      set({ userId, email, status: 'ready' })
    } catch (err) {
      console.error('Supabase auth init failed:', err)
      set({ status: 'error', errorMessage: err instanceof Error ? err.message : '인증 오류' })
    }
  },

  linkEmail: async (email) => {
    if (!supabase) {
      const error = 'Supabase가 설정되지 않았어요.'
      set({ linkEmailStatus: 'error', linkEmailError: error })
      return { ok: false, error }
    }

    const trimmed = email.trim()
    if (!trimmed) {
      const error = '이메일을 입력해주세요.'
      set({ linkEmailStatus: 'error', linkEmailError: error })
      return { ok: false, error }
    }

    set({ linkEmailStatus: 'sending', linkEmailError: null })
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: trimmed })
      if (error) throw error
      set({ linkEmailStatus: 'sent' })
      return { ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : '이메일 전송에 실패했어요.'
      set({ linkEmailStatus: 'error', linkEmailError: message })
      return { ok: false, error: message }
    }
  },
}))
