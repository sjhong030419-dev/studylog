import { RoomScene } from '../../character/room/RoomScene'
import type { CharacterAppearance, CharacterState, Gender } from '../../character/types'

interface CharacterRoomCardProps {
  state: CharacterState
  gender: Gender
  appearance: Partial<CharacterAppearance>
  level: number
  speech: string | null
  onOpenShop?: () => void
  fill?: boolean
}

/** The Home screen's emotional center: a chibi student studying inside a
 * room that grows with level (docs/character-system.md). The speech bubble
 * lives above the room card (not inside its overflow-hidden bounds) so it
 * can never cover the character's face, regardless of the character art's
 * size or position — including once placeholder SVG art is swapped for
 * final production assets. */
export function CharacterRoomCard({ state, gender, appearance, level, speech, onOpenShop, fill = false }: CharacterRoomCardProps) {
  return (
    <section className={`relative flex w-full min-h-0 flex-col items-center ${fill ? 'h-full' : ''}`} aria-label="나의 공부방">
      {speech && (
        <div className={`${fill ? 'absolute left-1/2 top-2 z-20 -translate-x-1/2 whitespace-nowrap max-[700px]:hidden' : 'relative z-10 -mb-2'} max-w-[88%] rounded-2xl border border-white/80 bg-(--color-home-card) px-4 py-2 shadow-[0_8px_22px_rgba(71,54,82,0.14)]`}>
          <span className="font-cute text-ink text-sm">{speech}</span>
          <div className="absolute left-8 -bottom-1.5 w-3 h-3 bg-(--color-home-card) rotate-45" aria-hidden="true" />
        </div>
      )}

      <div
        className={`relative min-h-0 overflow-hidden rounded-[28px] border-[4px] border-white shadow-[0_7px_0_rgba(82,57,75,0.12),0_18px_36px_rgba(82,57,75,0.20)] ${fill ? 'aspect-[4/5] h-full max-h-full w-auto max-w-full' : 'aspect-[4/5] w-full'}`}
        style={fill ? undefined : { maxHeight: 'clamp(340px, 51dvh, 500px)' }}
      >
        <RoomScene
          state={state}
          gender={gender}
          appearance={appearance}
          level={level}
          characterScale={1.3}
          preferFullScene
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(28,20,39,0.06)_0%,transparent_24%,transparent_68%,rgba(31,21,38,0.22)_100%)]" aria-hidden="true" />
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-2xl border border-white/70 bg-ink/72 px-3 py-2 text-white shadow-lg backdrop-blur-md">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-white/15 text-sm" aria-hidden="true">✦</span>
          <div className="leading-none">
            <span className="block font-cute text-[8px] tracking-[0.12em] text-white/70">MY STUDY ROOM</span>
            <span className="mt-1 block font-pixel text-[9px]">LV.{level}</span>
          </div>
        </div>
        {onOpenShop && (
          <button
            type="button"
            onClick={onOpenShop}
            className="absolute right-3 top-3 grid min-h-[44px] min-w-[44px] place-items-center rounded-2xl border-2 border-white bg-white/88 text-xl shadow-[0_4px_0_rgba(55,39,67,0.18)] backdrop-blur transition-transform active:translate-y-0.5 active:shadow-none"
            aria-label="캐릭터 옷장과 상점 열기"
          >
            🎒
          </button>
        )}
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/55 bg-ink/62 px-4 py-1.5 font-cute text-[10px] text-white/90 shadow-lg backdrop-blur max-[700px]:hidden" aria-hidden="true">
          {state === 'study' || state === 'focused' ? '집중 모험 진행 중 ✏️' : state === 'sleep' ? '잠깐 쉬어가는 중 Zzz' : state === 'happy' || state === 'celebrate' ? '오늘의 모험 완료! ✨' : '오늘은 어떤 모험을 시작할까요?'}
        </div>
      </div>
    </section>
  )
}
