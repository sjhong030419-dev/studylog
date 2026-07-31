import { RoomScene } from '../../character/room/RoomScene'
import type { CharacterAppearance, CharacterState, Gender } from '../../character/types'

interface CharacterRoomCardProps {
  state: CharacterState
  gender: Gender
  appearance: Partial<CharacterAppearance>
  level: number
  speech: string | null
}

/** The Home screen's emotional center: a chibi student studying inside a
 * room that grows with level (docs/character-system.md). The speech bubble
 * lives above the room card (not inside its overflow-hidden bounds) so it
 * can never cover the character's face, regardless of the character art's
 * size or position — including once placeholder SVG art is swapped for
 * final production assets. */
export function CharacterRoomCard({ state, gender, appearance, level, speech }: CharacterRoomCardProps) {
  return (
    <div className="w-full flex flex-col items-center">
      {speech && (
        <div className="relative z-10 -mb-2 max-w-[85%] bg-(--color-home-card) rounded-2xl px-4 py-2 shadow-md">
          <span className="font-cute text-ink text-sm">{speech}</span>
          <div className="absolute left-8 -bottom-1.5 w-3 h-3 bg-(--color-home-card) rotate-45" aria-hidden="true" />
        </div>
      )}

      <div
        className="relative w-full rounded-[24px] shadow-lg overflow-hidden"
        style={{ height: 'clamp(300px, 46dvh, 460px)' }}
      >
        <RoomScene state={state} gender={gender} appearance={appearance} level={level} characterScale={1.3} />
      </div>
    </div>
  )
}
