import { useState } from 'react'
import { useAudioStore } from '../../store/audioStore'

export function BgmPlayer() {
  const tracks = useAudioStore((s) => s.tracks)
  const autoStopOnTimerEnd = useAudioStore((s) => s.autoStopOnTimerEnd)
  const toggleTrack = useAudioStore((s) => s.toggleTrack)
  const setVolume = useAudioStore((s) => s.setVolume)
  const stopAll = useAudioStore((s) => s.stopAll)
  const setAutoStop = useAudioStore((s) => s.setAutoStop)

  const [expanded, setExpanded] = useState(false)
  const playingCount = tracks.filter((t) => t.playing).length

  return (
    <div className="fixed bottom-16 left-0 right-0 z-20 flex justify-center pointer-events-none">
      <div className="w-full max-w-sm pointer-events-auto">
        {expanded && (
          <div className="mx-3 mb-1 bg-white/95 backdrop-blur rounded-2xl shadow-lg px-4 py-3 flex flex-col gap-3">
            {tracks.map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleTrack(t.id)}
                  className={`w-8 h-8 shrink-0 rounded-full text-sm ${
                    t.playing ? 'bg-ink text-white' : 'bg-ink/10 text-ink'
                  }`}
                >
                  {t.playing ? '⏸' : '▶'}
                </button>
                <div className="flex-1">
                  <p className="font-cute text-xs text-ink">{t.label}</p>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={t.volume}
                    onChange={(e) => setVolume(t.id, Number(e.target.value))}
                    className="w-full accent-ink"
                  />
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-1 border-t border-ink/10">
              <label className="flex items-center gap-1.5 text-xs font-cute text-ink-soft">
                <input
                  type="checkbox"
                  checked={autoStopOnTimerEnd}
                  onChange={(e) => setAutoStop(e.target.checked)}
                />
                타이머 종료 시 자동 정지
              </label>
              <button
                type="button"
                onClick={stopAll}
                className="font-cute text-xs px-3 py-1 rounded-full border border-ink/20 text-ink-soft"
              >
                전체 정지
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mx-3 mb-1 w-[calc(100%-1.5rem)] flex items-center gap-2 bg-white/90 backdrop-blur rounded-full shadow-md px-4 py-2"
        >
          <span className="text-lg">🎧</span>
          <span className="font-cute text-xs text-ink flex-1 text-left">
            {playingCount > 0 ? `${playingCount}개 재생 중` : 'ASMR / BGM'}
          </span>
          <span className="text-ink-soft text-xs">{expanded ? '접기 ▾' : '펼치기 ▸'}</span>
        </button>
      </div>
    </div>
  )
}
