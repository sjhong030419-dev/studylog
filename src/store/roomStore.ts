import { create } from 'zustand'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from './authStore'
import type { CharacterState, Gender } from '../character/types'

export const DEFAULT_ROOM_ID = '00000000-0000-0000-0000-000000000001'

export interface SeatOccupant {
  seatIndex: number
  occupantId: string | null
  nickname: string | null
  status: CharacterState
  gender: Gender
  online: boolean
}

interface RoomState {
  seats: SeatOccupant[]
  mySeatIndex: number | null
  loading: boolean
  error: string | null

  join: (nickname: string, gender: Gender) => Promise<void>
  leaveChannels: () => void
  claimSeat: (seatIndex: number, nickname: string, gender: Gender) => Promise<boolean>
  releaseSeat: () => Promise<void>
  updateMyStatus: (status: CharacterState, nickname: string, gender: Gender) => void
}

type SetFn = (partial: Partial<RoomState> | ((state: RoomState) => Partial<RoomState>)) => void
type GetFn = () => RoomState

let pgChannel: RealtimeChannel | null = null
let presenceChannel: RealtimeChannel | null = null
let presenceReady = false
let lastKnownStatus: CharacterState = 'idle'
let lastKnownNickname = ''
let lastKnownGender: Gender = 'boy'
let joinPromise: Promise<void> | null = null

function seatCountDefault(): SeatOccupant[] {
  return Array.from({ length: 6 }, (_, i) => ({
    seatIndex: i,
    occupantId: null,
    nickname: null,
    status: 'idle' as CharacterState,
    gender: 'boy' as Gender,
    online: false,
  }))
}

function teardownChannels() {
  if (pgChannel && supabase) supabase.removeChannel(pgChannel)
  if (presenceChannel && supabase) supabase.removeChannel(presenceChannel)
  pgChannel = null
  presenceChannel = null
  presenceReady = false
}

async function performJoin(nickname: string, gender: Gender, set: SetFn, get: GetFn) {
  if (!supabase) {
    set({ error: 'Supabase가 설정되지 않았어요.' })
    return
  }
  const userId = useAuthStore.getState().userId
  if (!userId) return

  set({ loading: true, error: null })

  const { data, error } = await supabase
    .from('room_seats')
    .select('seat_index, occupant_id, occupant_nickname')
    .eq('room_id', DEFAULT_ROOM_ID)
    .order('seat_index', { ascending: true })

  if (error) {
    set({ loading: false, error: error.message })
    return
  }

  const seats: SeatOccupant[] = data.map((row) => ({
    seatIndex: row.seat_index,
    occupantId: row.occupant_id,
    nickname: row.occupant_nickname,
    status: 'idle',
    gender: 'boy',
    online: false,
  }))
  const mySeatIndex = seats.find((s) => s.occupantId === userId)?.seatIndex ?? null
  set({ seats, mySeatIndex, loading: false })

  // Ensure any previous channels are fully removed from the client's
  // registry (not just unsubscribed) before creating new ones — Supabase's
  // realtime client reuses channel objects by topic name, so a stale
  // reference here would make .on() throw on an already-subscribed channel.
  teardownChannels()

  pgChannel = supabase
    .channel(`room-seats-${DEFAULT_ROOM_ID}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'room_seats', filter: `room_id=eq.${DEFAULT_ROOM_ID}` },
      (payload) => {
        type Row = { seat_index: number; occupant_id: string | null; occupant_nickname: string | null }
        const newRow = (payload.new ?? null) as Row | null
        const oldRow = (payload.old ?? null) as Row | null
        const seatIndex = (newRow ?? oldRow)!.seat_index
        const occupantId = newRow?.occupant_id ?? null
        const rowNickname = newRow?.occupant_nickname ?? null

        set((state) => ({
          seats: state.seats.map((s) =>
            s.seatIndex === seatIndex ? { ...s, occupantId, nickname: rowNickname, status: 'idle' } : s,
          ),
          mySeatIndex:
            occupantId === userId
              ? seatIndex
              : state.mySeatIndex === seatIndex
                ? null
                : state.mySeatIndex,
        }))
      },
    )
    .subscribe()

  presenceReady = false
  lastKnownNickname = nickname
  lastKnownGender = gender
  presenceChannel = supabase.channel(`room-presence-${DEFAULT_ROOM_ID}`, {
    config: { presence: { key: userId } },
  })

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel!.presenceState<{ status: CharacterState; nickname: string; gender?: Gender }>()
      set({
        seats: get().seats.map((s) => {
          if (!s.occupantId) return { ...s, online: false }
          const presences = state[s.occupantId]
          if (!presences || presences.length === 0) return { ...s, online: false }
          return { ...s, online: true, status: presences[0].status, gender: presences[0].gender ?? 'boy' }
        }),
      })
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        presenceReady = true
        // Use whatever status/nickname/gender is currently known rather
        // than a hardcoded default — updateMyStatus() may have already
        // been called (and dropped) before the channel finished connecting.
        await presenceChannel!.track({ status: lastKnownStatus, nickname: lastKnownNickname, gender: lastKnownGender })
      }
    })
}

export const useRoomStore = create<RoomState>()((set, get) => ({
  seats: seatCountDefault(),
  mySeatIndex: null,
  loading: false,
  error: null,

  join: (nickname, gender) => {
    // Guard against duplicate concurrent joins (e.g. React StrictMode's
    // double-invoked effects) so we never try to re-subscribe an
    // already-subscribed channel.
    if (joinPromise) return joinPromise
    joinPromise = performJoin(nickname, gender, set, get)
    return joinPromise
  },

  leaveChannels: () => {
    teardownChannels()
    joinPromise = null
  },

  claimSeat: async (seatIndex, nickname, gender) => {
    if (!supabase) return false
    const userId = useAuthStore.getState().userId
    if (!userId) return false

    const { data, error } = await supabase
      .from('room_seats')
      .update({ occupant_id: userId, occupant_nickname: nickname, claimed_at: new Date().toISOString() })
      .eq('room_id', DEFAULT_ROOM_ID)
      .eq('seat_index', seatIndex)
      .is('occupant_id', null)
      .select()

    if (error || !data || data.length === 0) return false

    set({ mySeatIndex: seatIndex })
    lastKnownNickname = nickname
    lastKnownGender = gender
    if (presenceChannel && presenceReady) {
      await presenceChannel.track({ status: lastKnownStatus, nickname, gender })
    }
    return true
  },

  releaseSeat: async () => {
    if (!supabase) return
    const userId = useAuthStore.getState().userId
    const mySeatIndex = get().mySeatIndex
    if (!userId || mySeatIndex == null) return

    await supabase
      .from('room_seats')
      .update({ occupant_id: null, occupant_nickname: null, claimed_at: null })
      .eq('room_id', DEFAULT_ROOM_ID)
      .eq('seat_index', mySeatIndex)
      .eq('occupant_id', userId)

    set({ mySeatIndex: null })
  },

  updateMyStatus: (status, nickname, gender) => {
    lastKnownStatus = status
    lastKnownNickname = nickname
    lastKnownGender = gender
    if (presenceChannel && presenceReady) {
      presenceChannel.track({ status, nickname, gender })
    }
  },
}))
