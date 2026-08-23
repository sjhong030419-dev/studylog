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
    <div className="pointer-events-none fixed bottom-[94px] left-0 right-0 z-20 flex justify-center px-3">
      <div className="relative w-full max-w-[430px] pointer-events-auto">
        {expanded && (
          <div className="mb-2 rounded-[24px] border border-white/80 bg-white/95 px-4 py-3 shadow-[0_18px_45px_rgba(56,42,68,0.2)] backdrop-blur-xl dark:bg-[#2d2842]/95 flex flex-col gap-3">
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
          className={`ml-auto flex items-center border-2 border-white/90 bg-white/92 backdrop-blur-xl shadow-[0_4px_0_rgba(56,42,68,0.10),0_9px_24px_rgba(56,42,68,0.16)] transition-all dark:bg-[#2d2842]/95 ${
            expanded ? 'w-full gap-2 rounded-[20px] px-4 py-2.5' : 'h-11 w-11 justify-center rounded-[16px]'
          }`}
          aria-label={expanded ? 'ASMR 플레이어 접기' : playingCount > 0 ? `ASMR ${playingCount}개 재생 중` : 'ASMR 플레이어 열기'}
        >
          <span className="text-lg">{playingCount > 0 ? '🎶' : '🎧'}</span>
          <span className={`font-cute text-xs text-ink flex-1 text-left ${expanded ? '' : 'sr-only'}`}>
            {playingCount > 0 ? `${playingCount}개 재생 중` : 'ASMR / BGM'}
          </span>
          {expanded && <span className="text-ink-soft text-xs">접기 ▾</span>}
        </button>
      </div>
    </div>
  )
}
