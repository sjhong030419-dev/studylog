import type { AvatarStatus } from '../../types'

interface DotAvatarProps {
  status: AvatarStatus
  pixelSize?: number
  className?: string
  outfitColor?: string
  hairEmoji?: string
  accessoryEmoji?: string
  backgroundColor?: string
}

// 10 x 9 pixel grid. '.' transparent, '#' outline, 'F' body fill,
// 'e' eye, 'c' cheek blush, 'm' mouth
const GRIDS: Record<AvatarStatus, string[]> = {
  studying: [
    '..######..',
    '.#FFFFFF#.',
    '#FFFFFFFF#',
    '#FFeFFeFF#',
    '#FFFFFFFF#',
    '#FFFmmFFF#',
    '#FFFFFFFF#',
    '.#FFFFFF#.',
    '..######..',
  ],
  idle: [
    '..######..',
    '.#FFFFFF#.',
    '#FFFFFFFF#',
    '#FeeFFeeF#',
    '#FFFFFFFF#',
    '#FFFmmFFF#',
    '#FFFFFFFF#',
    '.#FFFFFF#.',
    '..######..',
  ],
  resting: [
    '..######..',
    '.#FFFFFF#.',
    '#FFFFFFFF#',
    '#FFeFFeFF#',
    '#FcFFFFcF#',
    '#FFmmmFFF#',
    '#FFFFFFFF#',
    '.#FFFFFF#.',
    '..######..',
  ],
  away: [
    '..######..',
    '.#FFFFFF#.',
    '#FFFFFFFF#',
    '#FFeFFeFF#',
    '#FFFFFFFF#',
    '#FFFmmFFF#',
    '#FFFFFFFF#',
    '.#FFFFFF#.',
    '..######..',
  ],
}

const OUTLINE = '#4a4458'
const CHEEK = '#ff9dbe'
const EYE = '#4a4458'
const MOUTH = '#4a4458'

const BODY_COLORS: Record<AvatarStatus, string> = {
  studying: '#ffe29a',
  idle: '#c9d3ff',
  resting: '#c9f5e0',
  away: '#ffc2c2',
}

const STATUS_LABEL: Record<AvatarStatus, string> = {
  studying: '공부 중',
  idle: '자리 비움',
  resting: '휴식 중',
  away: '어디 갔어요? 👀',
}

const STATUS_BADGE_CLASS: Record<AvatarStatus, string> = {
  studying: 'bg-pastel-yellow text-ink',
  idle: 'bg-pastel-lavender text-ink',
  resting: 'bg-pastel-mint text-ink',
  away: 'bg-pastel-pink text-ink',
}

const STATUS_BOB_CLASS: Record<AvatarStatus, string> = {
  studying: 'animate-avatar-bob',
  idle: 'animate-avatar-sway',
  resting: 'animate-avatar-breathe',
  away: 'animate-avatar-alert',
}

function pixelColor(char: string, status: AvatarStatus, outfitColor?: string): string | null {
  switch (char) {
    case '#':
      return OUTLINE
    case 'F':
      return outfitColor ?? BODY_COLORS[status]
    case 'e':
      return EYE
    case 'c':
      return CHEEK
    case 'm':
      return MOUTH
    default:
      return null
  }
}

export function DotAvatar({
  status,
  pixelSize = 12,
  className = '',
  outfitColor,
  hairEmoji,
  accessoryEmoji,
  backgroundColor,
}: DotAvatarProps) {
  const grid = GRIDS[status]
  const cols = grid[0].length
  const rows = grid.length

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        className="relative flex items-center justify-center"
        style={{
          width: cols * pixelSize + pixelSize * 2,
          height: rows * pixelSize + pixelSize * 2,
          background: backgroundColor,
          borderRadius: backgroundColor ? pixelSize : undefined,
        }}
      >
        <div
          className="relative"
          style={{ width: cols * pixelSize, height: rows * pixelSize }}
        >
        <div className={`pixel-crisp ${STATUS_BOB_CLASS[status]}`}>
          {hairEmoji && (
            <span
              className="absolute"
              style={{
                top: -pixelSize * 1.1,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: pixelSize * 1.3,
              }}
            >
              {hairEmoji}
            </span>
          )}
          {accessoryEmoji && (
            <span
              className="absolute"
              style={{
                left: -pixelSize * 1.1,
                top: pixelSize * 3,
                fontSize: pixelSize * 1.1,
              }}
            >
              {accessoryEmoji}
            </span>
          )}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${pixelSize}px)`,
              gridTemplateRows: `repeat(${rows}, ${pixelSize}px)`,
            }}
          >
            {grid.flatMap((row, rowIndex) =>
              row.split('').map((char, colIndex) => {
                const color = pixelColor(char, status, outfitColor)
                const isBlinkEye = status === 'studying' && char === 'e'
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={isBlinkEye ? 'animate-blink' : undefined}
                    style={{
                      backgroundColor: color ?? 'transparent',
                      width: pixelSize,
                      height: pixelSize,
                    }}
                  />
                )
              }),
            )}
          </div>

          {status === 'studying' && (
            <div
              className="absolute animate-pencil"
              style={{
                right: -pixelSize * 1.4,
                top: pixelSize * 2.5,
                transformOrigin: 'bottom left',
              }}
            >
              <div
                style={{
                  width: pixelSize * 2.2,
                  height: pixelSize * 0.6,
                  background: '#e08a4b',
                  borderRadius: 1,
                }}
              />
            </div>
          )}

          {status === 'idle' && (
            <div
              className="absolute font-pixel"
              style={{ right: -pixelSize * 0.5, top: -pixelSize * 0.5 }}
            >
              <span
                className="animate-zzz absolute text-ink-soft"
                style={{ fontSize: pixelSize * 0.9, animationDelay: '0s' }}
              >
                z
              </span>
              <span
                className="animate-zzz absolute text-ink-soft"
                style={{ fontSize: pixelSize * 1.2, animationDelay: '0.8s', left: 6 }}
              >
                z
              </span>
              <span
                className="animate-zzz absolute text-ink-soft"
                style={{ fontSize: pixelSize * 1.5, animationDelay: '1.6s', left: 12 }}
              >
                z
              </span>
            </div>
          )}

          {status === 'resting' && (
            <span
              className="absolute animate-sparkle"
              style={{
                right: -pixelSize * 0.8,
                top: -pixelSize * 0.8,
                fontSize: pixelSize * 1.4,
              }}
            >
              ✨
            </span>
          )}

          {status === 'away' && (
            <span
              className="absolute animate-alert-bounce"
              style={{
                right: -pixelSize * 0.6,
                top: -pixelSize * 1.2,
                fontSize: pixelSize * 1.5,
              }}
            >
              ❗
            </span>
          )}
        </div>
        </div>
      </div>

      <span
        className={`font-cute text-sm px-3 py-1 rounded-full shadow-sm ${STATUS_BADGE_CLASS[status]}`}
      >
        {STATUS_LABEL[status]}
      </span>
    </div>
  )
}
