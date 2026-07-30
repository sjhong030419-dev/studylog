import { CharacterView } from '../components/CharacterView'
import { unlockedAdditions } from './growthStages'
import type { CharacterAppearance, CharacterState, Gender } from '../types'

interface RoomSceneProps {
  state: CharacterState
  gender?: Gender
  appearance?: Partial<CharacterAppearance>
  level: number
  /** Passed straight through to the character — see CharacterView's
   * multi-seat animation-throttling contract. */
  animated?: boolean
}

const DIM_STATES: CharacterState[] = ['away']
const DEFAULT_WALL_COLOR = 'var(--color-home-soft-yellow)'

/**
 * The room grows with level (docs/character-system.md §6) instead of the
 * character itself. `unlockedAdditions` is cumulative, so furniture never
 * disappears once earned.
 *
 * Explicit layer order (back -> front), per
 * docs/StudyLog_Character_System_Fix_PRD_v1.0.md §12:
 *   RoomBackLayer -> RoomBehindDeskLayer -> CharacterLayer -> DeskLayer ->
 *   PetForegroundLayer -> EffectsLayer
 * The desk's opaque surface intentionally sits between the character and
 * the pet/plant layer so it can cover the character's legs without ever
 * clipping the cat or floor plant, which now render after it.
 */
export function RoomScene({ state, gender = 'boy', appearance, level, animated }: RoomSceneProps) {
  const unlocked = unlockedAdditions(level)
  const wallColor = appearance?.backgroundColor ?? DEFAULT_WALL_COLOR

  return (
    <div className="relative w-full h-full overflow-hidden">
      <RoomBackLayer wallColor={wallColor} unlocked={unlocked} />
      <RoomBehindDeskLayer unlocked={unlocked} />

      <div className="absolute" style={{ top: '3%', left: '50%', width: '58%', transform: 'translateX(-50%)' }}>
        <CharacterView state={state} gender={gender} appearance={appearance} size={200} className="w-full h-auto" animated={animated} />
      </div>

      <DeskLayer unlocked={unlocked} />
      <PetForegroundLayer unlocked={unlocked} />

      {DIM_STATES.includes(state) && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none animate-dim-pulse"
          style={{ background: 'rgba(28, 24, 48, 0.28)' }}
        />
      )}
    </div>
  )
}

function RoomBackLayer({ wallColor, unlocked }: { wallColor: string; unlocked: Set<string> }) {
  return (
    <svg viewBox="0 0 320 400" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <rect x="0" y="0" width="320" height="400" fill={wallColor} />

      {/* window — Lv70 */}
      {unlocked.has('window') && (
        <>
          <rect x="24" y="24" width="78" height="92" rx="10" fill="#cfe6f7" opacity="0.9" />
          <rect x="24" y="24" width="78" height="92" rx="10" fill="none" stroke="#fff" strokeWidth="6" />
          <line x1="63" y1="26" x2="63" y2="114" stroke="#fff" strokeWidth="4" />
          <line x1="26" y1="70" x2="100" y2="70" stroke="#fff" strokeWidth="4" />
          <path d="M 20 26 Q 12 60 20 110" stroke="#ffd9e6" strokeWidth="10" fill="none" opacity="0.7" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

/** Shelf, hanging plant, wall clock, chair back — everything that must sit
 * behind the character but is not part of the desk itself. */
function RoomBehindDeskLayer({ unlocked }: { unlocked: Set<string> }) {
  const chairColor = unlocked.has('chairUpgrade') ? '#9b86d9' : '#c9a876'

  return (
    <svg viewBox="0 0 320 400" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      {/* chair back — behind the character */}
      <rect x="130" y="150" width="60" height="70" rx="14" fill={chairColor} opacity="0.55" />

      {/* shelf — always present */}
      <rect x="210" y="30" width="96" height="10" rx="3" fill="#c99a6b" />
      <rect x="220" y="8" width="12" height="24" rx="2" fill="#f28ba8" />
      <rect x="234" y="4" width="12" height="28" rx="2" fill="#9b86d9" />
      <rect x="248" y="10" width="12" height="22" rx="2" fill="#79b98a" />
      {/* moreBooks — Lv40 */}
      {unlocked.has('moreBooks') && (
        <>
          <rect x="262" y="6" width="12" height="26" rx="2" fill="#e8b94d" />
          <rect x="276" y="10" width="12" height="22" rx="2" fill="#f6a97a" />
        </>
      )}
      <circle cx="288" cy="18" r="12" fill="#fff" stroke="#e8b94d" strokeWidth="3" />
      <line x1="288" y1="18" x2="288" y2="10" stroke="#4a4458" strokeWidth="2" strokeLinecap="round" />
      <line x1="288" y1="18" x2="293" y2="20" stroke="#4a4458" strokeWidth="2" strokeLinecap="round" />

      {/* hanging plant — Lv10 */}
      {unlocked.has('plant') && (
        <>
          <path d="M 268 50 Q 250 70 262 96 Q 272 78 268 50 Z" fill="#79b98a" />
          <path d="M 268 50 Q 286 70 274 96 Q 264 78 268 50 Z" fill="#8fcf9d" />
        </>
      )}
    </svg>
  )
}

function DeskLayer({ unlocked }: { unlocked: Set<string> }) {
  return (
    <svg
      viewBox="0 0 320 400"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      {/* desk surface — Lv1, intentionally covers the character's legs */}
      <rect x="0" y="228" width="320" height="18" fill="#e8c088" />
      <rect x="0" y="246" width="320" height="154" fill="#d9a86a" />
      <rect x="0" y="246" width="320" height="8" fill="#c99a6b" opacity="0.6" />

      {/* lamp */}
      <g>
        <ellipse cx="46" cy="196" rx="30" ry="26" fill="#fff3c2" opacity="0.55" className="animate-sparkle" />
        <rect x="40" y="232" width="12" height="14" rx="2" fill="#8a819c" />
        <path d="M 46 232 L 46 200" stroke="#8a819c" strokeWidth="4" strokeLinecap="round" />
        <path d="M 24 190 L 68 190 L 58 208 L 34 208 Z" fill="#f6a97a" />
      </g>

      {/* books, always present */}
      <rect x="252" y="222" width="46" height="10" rx="2" fill="#f28ba8" />
      <rect x="256" y="212" width="38" height="10" rx="2" fill="#9b86d9" />
      <rect x="260" y="202" width="30" height="10" rx="2" fill="#e8b94d" />

      {/* dual monitor — Lv50 (otherwise a mug) */}
      {unlocked.has('dualMonitor') ? (
        <g>
          <rect x="188" y="196" width="42" height="30" rx="3" fill="#4a4458" />
          <rect x="192" y="200" width="34" height="22" rx="2" fill="#cfe6f7" />
          <rect x="205" y="226" width="10" height="6" fill="#8a819c" />
          <rect x="118" y="200" width="42" height="30" rx="3" fill="#4a4458" />
          <rect x="122" y="204" width="34" height="22" rx="2" fill="#cfe6f7" />
          <rect x="135" y="230" width="10" height="6" fill="#8a819c" />
        </g>
      ) : (
        <g>
          <path d="M 214 224 L 218 244 L 240 244 L 244 224 Z" fill="#fff" />
          <path d="M 244 228 Q 254 228 253 236 Q 252 242 244 240" stroke="#fff" strokeWidth="4" fill="none" />
        </g>
      )}

      {/* notebook, centered under the character's hands */}
      <rect x="118" y="222" width="84" height="30" rx="4" fill="#fff" stroke="#e6e1f0" strokeWidth="2" />
      <line x1="130" y1="232" x2="190" y2="232" stroke="#e6e1f0" strokeWidth="2" />
      <line x1="130" y1="240" x2="178" y2="240" stroke="#e6e1f0" strokeWidth="2" />
    </svg>
  )
}

/** Cat and floor plant render after the desk so they are never clipped by
 * its opaque surface (the bug fixed by this file's restructuring). */
function PetForegroundLayer({ unlocked }: { unlocked: Set<string> }) {
  return (
    <svg viewBox="0 0 320 400" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      {/* floor plant — Lv10 */}
      {unlocked.has('plant') && (
        <>
          <path d="M 26 236 Q 6 208 22 176 Q 34 206 30 236 Z" fill="#79b98a" />
          <path d="M 30 236 Q 44 212 34 182 Q 20 208 20 236 Z" fill="#8fcf9d" />
          <path d="M 12 236 L 44 236 L 40 258 L 16 258 Z" fill="#c99a6b" />
        </>
      )}

      {/* cat — Lv20 */}
      {unlocked.has('cat') && (
        <g>
          <ellipse cx="272" cy="252" rx="22" ry="16" fill="#f0ede4" />
          <circle cx="290" cy="234" r="13" fill="#f0ede4" />
          <path d="M 280 224 L 284 212 L 290 223 Z" fill="#f0ede4" />
          <path d="M 296 224 L 300 212 L 304 224 Z" fill="#f0ede4" />
          <circle cx="286" cy="234" r="1.6" fill="#4a4458" />
          <circle cx="295" cy="234" r="1.6" fill="#4a4458" />
          <path
            d="M 250 254 Q 236 240 246 224"
            stroke="#f0ede4"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
            className="animate-avatar-sway"
            style={{ transformOrigin: '250px 254px' }}
          />
        </g>
      )}

      {/* premium — Lv100: warm accent rug glow */}
      {unlocked.has('premium') && <ellipse cx="160" cy="380" rx="150" ry="24" fill="#f6a97a" opacity="0.25" />}
    </svg>
  )
}
