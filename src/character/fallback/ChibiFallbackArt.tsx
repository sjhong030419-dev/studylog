import { ASSET_PARTS } from '../catalog/assetPartsRegistry'
import { resolveCatalogEntries } from '../catalog/items'
import type { CharacterAppearance, CharacterState, Gender } from '../types'

interface ChibiFallbackArtProps {
  gender: Gender
  state: CharacterState
  frame: number
  frameCount: number
  appearance: CharacterAppearance
  size: number
}

/**
 * SVG fallback for the docs/character-system.md art spec, used until real
 * PNG sprite sheets exist (see engine/spriteAssetMap.ts). Rather than N
 * hand-authored frames, pose/expression are procedurally derived from
 * `frame/frameCount` on one base drawing — an honest approximation of
 * frame-based motion, not the real thing. Swapping in real sprites later
 * only means changing CharacterView's renderer, not this contract.
 *
 * Cosmetics are resolved through the slot-based catalog
 * (character/catalog/) rather than rendered as emoji text — see
 * docs/StudyLog_Character_System_Fix_PRD_v1.0.md §9.
 */
export function ChibiFallbackArt({ gender, state, frame, frameCount, appearance, size }: ChibiFallbackArtProps) {
  const t = frameCount > 1 ? frame / frameCount : 0
  const wave = Math.sin(t * Math.PI * 2)
  const bounce = Math.abs(wave)

  const pose = computePose(state, t, wave, bounce)
  const { skinTone, hairColor, outfitColor, pantsColor, shoeColor, outlineColor } = appearance

  const equippedParts = resolveCatalogEntries(appearance.equippedAssetIds)
  const outfitEntry = equippedParts.find((p) => p.slot === 'top' || p.slot === 'onePiece')
  const isOnePiece = outfitEntry?.slot === 'onePiece'
  const overlayParts = equippedParts.filter((p) => p.slot !== 'top' && p.slot !== 'onePiece')

  return (
    // width is the literal `size`px (always definite) with max-width:100%
    // as a safe responsive clamp — same reasoning as PixelSpriteRenderer's
    // root div. A bare width:100% here would collapse to 0 whenever this
    // renders inside an indefinite (shrink-to-fit) ancestor, which is every
    // existing non-room screen (MyPage, AvatarShop, PomodoroTimer, ...).
    <svg
      viewBox="0 0 200 240"
      style={{ width: size, maxWidth: '100%', height: 'auto', aspectRatio: '200 / 240' }}
      role="img"
      aria-label={STATE_LABEL[state]}
    >
      {/* CSS transition eases between discrete frame poses — a temporary
          smoothing layer for the placeholder art. Real sprite frames won't
          use this (SPRITE_ASSETS_AVAILABLE branch bypasses this component
          entirely), so it's safe to remove once real frames land. */}
      <g style={{ transform: `translateY(${pose.bodyY}px)`, transition: 'transform 0.2s ease-out' }}>
        {/* hairBack */}
        {gender === 'girl' ? (
          <path
            d="M 44 92 C 38 52, 60 24, 100 24 C 140 24, 162 52, 156 92 L 162 196 C 162 208, 152 210, 146 202 L 146 128 L 54 128 L 54 202 C 48 210, 38 208, 38 196 Z"
            fill={hairColor}
            stroke={outlineColor}
            strokeWidth="2.5"
          />
        ) : (
          <path
            d="M 46 92 C 40 54, 62 26, 100 26 C 138 26, 160 54, 154 92 L 157 150 C 157 160, 148 163, 142 156 L 142 128 L 58 128 L 58 156 C 52 163, 43 160, 43 150 Z"
            fill={hairColor}
            stroke={outlineColor}
            strokeWidth="2.5"
          />
        )}

        {/* neck */}
        <rect x="90" y="112" width="20" height="16" rx="6" fill={skinTone} />

        {/* head */}
        <circle cx="100" cy="80" r="44" fill={skinTone} stroke={outlineColor} strokeWidth="2.5" />
        <circle cx="57" cy="82" r="7" fill={skinTone} stroke={outlineColor} strokeWidth="2" />
        <circle cx="143" cy="82" r="7" fill={skinTone} stroke={outlineColor} strokeWidth="2" />

        {/* blush */}
        <ellipse cx="72" cy="92" rx="8" ry="5" fill="#FFB6C1" opacity={pose.blushOpacity} />
        <ellipse cx="128" cy="92" rx="8" ry="5" fill="#FFB6C1" opacity={pose.blushOpacity} />

        {/* face */}
        <g style={{ transform: `translateY(${pose.headTilt}px)`, transition: 'transform 0.2s ease-out' }}>
          <ChibiFace eyeStyle={pose.eyeStyle} mouth={pose.mouth} eyeOffsetY={pose.eyeOffsetY} />
        </g>

        {/* hairFront (bangs) */}
        <path
          d="M 55 66 C 51 38, 73 22, 100 22 C 127 22, 149 38, 145 66 C 145 72, 138 63, 130 70 C 123 63, 114 72, 106 63 C 99 72, 91 63, 84 70 C 76 63, 68 72, 61 66 C 59 66, 57 66, 55 66 Z"
          fill={hairColor}
          stroke={outlineColor}
          strokeWidth="2"
        />
        <path d="M 52 78 C 48 64, 52 50, 60 44 C 55 58, 55 72, 60 86 C 55 84, 52 82, 52 78 Z" fill={hairColor} stroke={outlineColor} strokeWidth="2" />
        <path d="M 148 78 C 152 64, 148 50, 140 44 C 145 58, 145 72, 140 86 C 145 84, 148 82, 148 78 Z" fill={hairColor} stroke={outlineColor} strokeWidth="2" />

        {/* torso — one-piece (dress) silhouette vs. top (hoodie) silhouette,
            branched by slot (never by item id) */}
        {isOnePiece ? (
          <path
            d="M 62 130 C 62 116, 78 108, 100 108 C 122 108, 138 116, 138 130 L 150 220 L 50 220 Z"
            fill={outfitColor}
            stroke={outlineColor}
            strokeWidth="2.5"
          />
        ) : (
          <>
            <path
              d="M 62 130 C 62 116, 78 108, 100 108 C 122 108, 138 116, 138 130 L 143 214 L 118 214 L 118 226 L 82 226 L 82 214 L 57 214 Z"
              fill={outfitColor}
              stroke={outlineColor}
              strokeWidth="2.5"
            />
            <path d="M 82 116 Q 100 130 118 116 L 118 124 Q 100 136 82 124 Z" fill={outfitColor} style={{ filter: 'brightness(0.85)' }} />
            <rect x="80" y="214" width="16" height="14" fill={pantsColor} />
            <rect x="104" y="214" width="16" height="14" fill={pantsColor} />
          </>
        )}
        <rect x="78" y="226" width="20" height="8" rx="3" fill={shoeColor} stroke={outlineColor} strokeWidth="1.5" />
        <rect x="102" y="226" width="20" height="8" rx="3" fill={shoeColor} stroke={outlineColor} strokeWidth="1.5" />

        <ChibiArms armPose={pose.armPose} wave={wave} outfit={outfitColor} skin={skinTone} outline={outlineColor} />

        {/* equipped cosmetic overlays — resolved through the catalog, never
            an emoji badge (docs/StudyLog_Character_System_Fix_PRD_v1.0.md §9) */}
        {overlayParts.map((part) => {
          const Part = ASSET_PARTS[part.assetKey]
          return Part ? <Part key={part.id} outlineColor={outlineColor} /> : null
        })}

        <ChibiStateEffect state={state} t={t} />
      </g>
    </svg>
  )
}

const STATE_LABEL: Record<CharacterState, string> = {
  idle: '자리에 앉아 쉬는 중',
  study: '공부 중',
  thinking: '생각 중',
  reading: '읽는 중',
  typing: '입력 중',
  break: '잠깐 쉬는 중',
  sleep: '졸린 중',
  happy: '기뻐하는 중',
  excited: '신난 중',
  celebrate: '축하하는 중',
  levelUp: '레벨 업',
  focused: '집중 중',
  away: '자리 비움',
}

type ArmPose = 'default' | 'study' | 'raised' | 'thinking' | 'reading' | 'typing'
type EyeStyle = 'normal' | 'closed' | 'wide'

interface Pose {
  bodyY: number
  headTilt: number
  eyeStyle: EyeStyle
  eyeOffsetY: number
  mouth: 'smile' | 'flat' | 'open' | 'yawn' | 'surprised'
  blushOpacity: number
  armPose: ArmPose
}

function computePose(state: CharacterState, t: number, wave: number, bounce: number): Pose {
  switch (state) {
    case 'study':
      return { bodyY: 0, headTilt: wave * 1.5, eyeStyle: 'normal', eyeOffsetY: 1.5, mouth: 'flat', blushOpacity: 0.5, armPose: 'study' }
    case 'break':
      return { bodyY: 0, headTilt: 0, eyeStyle: 'normal', eyeOffsetY: 0, mouth: 'flat', blushOpacity: 0.4, armPose: 'default' }
    case 'sleep':
      return { bodyY: wave * 2 + 2, headTilt: 4 + wave * 2, eyeStyle: 'closed', eyeOffsetY: 0, mouth: 'yawn', blushOpacity: 0.35, armPose: 'default' }
    case 'happy':
      return {
        bodyY: -bounce * 10,
        headTilt: wave * 3,
        eyeStyle: t > 0.5 ? 'closed' : 'normal',
        eyeOffsetY: 0,
        mouth: 'open',
        blushOpacity: 0.8,
        armPose: 'raised',
      }
    case 'celebrate':
    case 'levelUp':
      return { bodyY: -bounce * 14, headTilt: wave * 4, eyeStyle: 'normal', eyeOffsetY: 0, mouth: 'open', blushOpacity: 0.85, armPose: 'raised' }
    case 'excited':
      return { bodyY: -bounce * 13, headTilt: wave * 5, eyeStyle: 'wide', eyeOffsetY: 0, mouth: 'open', blushOpacity: 0.9, armPose: 'raised' }
    case 'away':
      return { bodyY: 0, headTilt: wave * 5, eyeStyle: 'wide', eyeOffsetY: 0, mouth: 'surprised', blushOpacity: 0.5, armPose: 'default' }
    case 'thinking':
      return { bodyY: wave * 1, headTilt: 0, eyeStyle: 'normal', eyeOffsetY: -3, mouth: 'flat', blushOpacity: 0.4, armPose: 'thinking' }
    case 'reading':
      return { bodyY: wave * 1, headTilt: 0, eyeStyle: 'normal', eyeOffsetY: 2.5, mouth: 'smile', blushOpacity: 0.4, armPose: 'reading' }
    case 'typing':
      return { bodyY: wave * 1.5, headTilt: 0, eyeStyle: 'normal', eyeOffsetY: 1, mouth: 'flat', blushOpacity: 0.4, armPose: 'typing' }
    case 'focused':
      // Deliberately minimal motion (no bodyY wave) to read as "reduced
      // expression motion and attentive eyes" versus idle's gentle bob.
      return { bodyY: 0, headTilt: 0, eyeStyle: 'normal', eyeOffsetY: 0.5, mouth: 'flat', blushOpacity: 0.3, armPose: 'default' }
    case 'idle':
    default:
      return {
        bodyY: wave * 1.5,
        headTilt: 0,
        eyeStyle: t > 0.85 && t < 0.95 ? 'closed' : 'normal',
        eyeOffsetY: 0,
        mouth: 'smile',
        blushOpacity: 0.5,
        armPose: 'default',
      }
  }
}

function ChibiFace({
  eyeStyle,
  mouth,
  eyeOffsetY,
}: {
  eyeStyle: EyeStyle
  mouth: Pose['mouth']
  eyeOffsetY: number
}) {
  return (
    <>
      {eyeStyle === 'closed' ? (
        <>
          <path d="M 76 80 Q 84 87 92 80" stroke="#3d3550" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M 108 80 Q 116 87 124 80" stroke="#3d3550" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      ) : eyeStyle === 'wide' ? (
        <>
          <circle cx="84" cy="80" r="9" fill="#3d3550" />
          <circle cx="116" cy="80" r="9" fill="#3d3550" />
          <circle cx="87" cy="77" r="2.5" fill="#fff" />
          <circle cx="119" cy="77" r="2.5" fill="#fff" />
        </>
      ) : (
        <>
          <ellipse cx="84" cy={80 + eyeOffsetY} rx="6.5" ry="8" fill="#3d3550" />
          <ellipse cx="116" cy={80 + eyeOffsetY} rx="6.5" ry="8" fill="#3d3550" />
          <circle cx="86" cy={77.5 + eyeOffsetY} r="1.8" fill="#fff" />
          <circle cx="118" cy={77.5 + eyeOffsetY} r="1.8" fill="#fff" />
        </>
      )}
      <path d="M 78 64 Q 84 60 90 64" stroke="#3d3550" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 110 64 Q 116 60 122 64" stroke="#3d3550" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {mouth === 'smile' && <path d="M 94 98 Q 100 102 106 98" stroke="#3d3550" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
      {mouth === 'flat' && <path d="M 95 99 L 105 99" stroke="#3d3550" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
      {mouth === 'open' && <path d="M 86 96 Q 100 112 114 96 Q 100 104 86 96 Z" fill="#3d3550" />}
      {mouth === 'yawn' && <ellipse cx="100" cy="99" rx="4.5" ry="5.5" fill="#3d3550" opacity="0.85" />}
      {mouth === 'surprised' && <ellipse cx="100" cy="99" rx="4.5" ry="5.5" fill="#3d3550" opacity="0.85" />}
    </>
  )
}

function ChibiArms({
  armPose,
  wave,
  outfit,
  skin,
  outline,
}: {
  armPose: ArmPose
  wave: number
  outfit: string
  skin: string
  outline: string
}) {
  if (armPose === 'raised') {
    const lift = 8 + Math.abs(wave) * 6
    return (
      <g>
        <path d={`M 68 130 Q 46 ${112 - lift} 52 ${78 - lift}`} stroke={outfit} strokeWidth="20" strokeLinecap="round" fill="none" />
        <circle cx="52" cy={75 - lift} r="11" fill={skin} stroke={outline} strokeWidth="2" />
        <path d={`M 132 130 Q 154 ${112 - lift} 148 ${78 - lift}`} stroke={outfit} strokeWidth="20" strokeLinecap="round" fill="none" />
        <circle cx="148" cy={75 - lift} r="11" fill={skin} stroke={outline} strokeWidth="2" />
      </g>
    )
  }

  if (armPose === 'thinking') {
    return (
      <g>
        <path d="M 68 130 Q 56 168 76 198" stroke={outfit} strokeWidth="20" strokeLinecap="round" fill="none" />
        <circle cx="76" cy="201" r="11" fill={skin} stroke={outline} strokeWidth="2" />
        <path d="M 132 130 Q 148 140 112 100" stroke={outfit} strokeWidth="20" strokeLinecap="round" fill="none" />
        <circle cx="110" cy="97" r="10" fill={skin} stroke={outline} strokeWidth="2" />
      </g>
    )
  }

  if (armPose === 'reading') {
    return (
      <g>
        <path d="M 68 130 Q 60 155 84 168" stroke={outfit} strokeWidth="20" strokeLinecap="round" fill="none" />
        <circle cx="84" cy="170" r="10" fill={skin} stroke={outline} strokeWidth="2" />
        <path d="M 132 130 Q 140 155 116 168" stroke={outfit} strokeWidth="20" strokeLinecap="round" fill="none" />
        <circle cx="116" cy="170" r="10" fill={skin} stroke={outline} strokeWidth="2" />
        <rect x="78" y="158" width="44" height="32" rx="3" fill="#fff" stroke={outline} strokeWidth="2" />
        <line x1="100" y1="158" x2="100" y2="190" stroke={outline} strokeWidth="1.5" />
      </g>
    )
  }

  if (armPose === 'typing') {
    const tap = wave * 2
    return (
      <g>
        <path d="M 68 130 Q 58 165 80 194" stroke={outfit} strokeWidth="20" strokeLinecap="round" fill="none" />
        <circle cx="80" cy={197 - tap} r="10" fill={skin} stroke={outline} strokeWidth="2" />
        <path d="M 132 130 Q 142 163 120 192" stroke={outfit} strokeWidth="20" strokeLinecap="round" fill="none" />
        <circle cx="120" cy={195 + tap} r="10" fill={skin} stroke={outline} strokeWidth="2" />
        <rect x="74" y="192" width="52" height="8" rx="2" fill="#8a819c" />
        <rect x="80" y="176" width="40" height="16" rx="2" fill="#cfe6f7" stroke={outline} strokeWidth="1.5" />
      </g>
    )
  }

  // 'default' and 'study' share the same resting arm geometry; 'study' adds a pencil.
  return (
    <g>
      <path d="M 68 130 Q 56 168 76 198" stroke={outfit} strokeWidth="20" strokeLinecap="round" fill="none" />
      <circle cx="76" cy="201" r="11" fill={skin} stroke={outline} strokeWidth="2" />
      <path d="M 132 130 Q 144 166 122 196" stroke={outfit} strokeWidth="20" strokeLinecap="round" fill="none" />
      <circle cx="122" cy="199" r="11" fill={skin} stroke={outline} strokeWidth="2" />
      {armPose === 'study' && (
        <g transform={`translate(122,196) rotate(${-25 + wave * 8})`}>
          <rect x="-3" y="-34" width="6" height="34" rx="2" fill="#e8b94d" />
          <rect x="-3" y="-38" width="6" height="6" fill="#5B3F2B" />
        </g>
      )}
    </g>
  )
}

function ChibiStateEffect({ state, t }: { state: CharacterState; t: number }) {
  switch (state) {
    case 'sleep':
      return (
        <g fill="#8a819c" opacity={0.4 + 0.6 * t}>
          <text x="132" y="46" fontSize="11">z</text>
          <text x="140" y="34" fontSize="15">z</text>
          <text x="149" y="20" fontSize="19">z</text>
        </g>
      )
    case 'celebrate':
    case 'levelUp':
    case 'excited': {
      const sparkles = [0, 1, 2, 3, 4]
      return (
        <g>
          {sparkles.map((i) => {
            const angle = (i / sparkles.length) * Math.PI * 2 + t * Math.PI * 2
            const r = 78
            const x = 100 + Math.cos(angle) * r
            const y = 50 + Math.sin(angle) * (r * 0.6)
            return <Sparkle key={i} x={x} y={y} scale={0.8 + 0.3 * Math.sin(t * Math.PI * 2 + i)} />
          })}
        </g>
      )
    }
    case 'thinking':
      return (
        <g fill="#8a819c" opacity={0.5 + 0.5 * Math.sin(t * Math.PI * 2)}>
          <circle cx="130" cy="55" r="2.5" />
          <circle cx="138" cy="46" r="3.5" />
          <circle cx="148" cy="35" r="5" />
        </g>
      )
    case 'away':
      return <ellipse cx="138" cy="65" rx="3" ry="4.5" fill="#a9d4ff" opacity="0.85" />
    default:
      return null
  }
}

function Sparkle({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <path
      d="M 0 -6 L 1.6 -1.6 L 6 0 L 1.6 1.6 L 0 6 L -1.6 1.6 L -6 0 L -1.6 -1.6 Z"
      fill="#e8b94d"
      transform={`translate(${x},${y}) scale(${scale})`}
    />
  )
}
