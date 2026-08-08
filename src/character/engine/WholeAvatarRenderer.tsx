import { SPRITE_CANVAS_SIZE } from './spriteManifest'
import { resolveWholeAvatarPath } from './wholeAvatarSupport'
import type { CharacterAppearance, CharacterState, Gender } from '../types'

interface WholeAvatarRendererProps {
  gender: Gender
  state: CharacterState
  frame: number
  appearance: CharacterAppearance
  size: number
  fit?: 'width' | 'height'
  onError?: () => void
}

/**
 * Renders exactly one approved character image. No facial, hair, outfit or
 * accessory layers are composited here. Cosmetic looks are added later as
 * complete baked variants through wholeAvatarSupport.ts.
 */
export function WholeAvatarRenderer({
  gender,
  state,
  frame,
  appearance,
  size,
  fit = 'width',
  onError,
}: WholeAvatarRendererProps) {
  const boxStyle =
    fit === 'height'
      ? { position: 'relative' as const, height: '100%', width: 'auto', maxWidth: '100%', aspectRatio: '1 / 1' }
      : { position: 'relative' as const, width: size, maxWidth: '100%', aspectRatio: '1 / 1' }

  return (
    <div style={boxStyle}>
      <img
        src={resolveWholeAvatarPath(gender, state, frame, appearance)}
        alt=""
        aria-hidden="true"
        width={SPRITE_CANVAS_SIZE}
        height={SPRITE_CANVAS_SIZE}
        draggable={false}
        onError={onError}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  )
}
