import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { playSound, setSoundVolume, stopAllSounds, stopSound, type SoundId } from '../utils/noiseSynth'

export interface AudioTrack {
  id: SoundId
  label: string
  category: string
  playing: boolean
  volume: number
}

const DEFAULT_TRACKS: AudioTrack[] = [
  { id: 'rain', label: '빗소리', category: '자연음', playing: false, volume: 0.5 },
  { id: 'library', label: '도서관 백색소음', category: '백색소음', playing: false, volume: 0.5 },
  { id: 'bgm', label: '잔잔한 스터디 BGM', category: 'BGM', playing: false, volume: 0.4 },
]

interface AudioState {
  tracks: AudioTrack[]
  autoStopOnTimerEnd: boolean

  toggleTrack: (id: SoundId) => void
  setVolume: (id: SoundId, volume: number) => void
  stopAll: () => void
  setAutoStop: (value: boolean) => void
  stopAllIfAutoStop: () => void
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      tracks: DEFAULT_TRACKS,
      autoStopOnTimerEnd: true,

      toggleTrack: (id) => {
        const track = get().tracks.find((t) => t.id === id)
        if (!track) return
        if (track.playing) {
          stopSound(id)
        } else {
          playSound(id, track.volume)
        }
        set({
          tracks: get().tracks.map((t) => (t.id === id ? { ...t, playing: !t.playing } : t)),
        })
      },

      setVolume: (id, volume) => {
        setSoundVolume(id, volume)
        set({
          tracks: get().tracks.map((t) => (t.id === id ? { ...t, volume } : t)),
        })
      },

      stopAll: () => {
        stopAllSounds()
        set({ tracks: get().tracks.map((t) => ({ ...t, playing: false })) })
      },

      setAutoStop: (value) => set({ autoStopOnTimerEnd: value }),

      stopAllIfAutoStop: () => {
        if (get().autoStopOnTimerEnd) {
          get().stopAll()
        }
      },
    }),
    {
      name: 'studylog-audio',
      partialize: (state) => ({
        autoStopOnTimerEnd: state.autoStopOnTimerEnd,
        tracks: state.tracks.map((t) => ({ ...t, playing: false })),
      }),
    },
  ),
)
