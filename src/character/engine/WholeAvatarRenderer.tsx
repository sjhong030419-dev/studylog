import { useState } from 'react'
import { SPRITE_CANVAS_SIZE } from './spriteManifest'
import { resolveWholeAvatarSourceChain } from './wholeAvatarSupport'
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
 *
 * A matched cosmetic variant (e.g. black-hair) is tried first; if that one
 * image fails to load, the approved default base image for this exact
 * gender/state/frame is retried before giving up — `onError` (which flips
 * the caller, CharacterView, to its non-PNG SVG fallback) only fires once
 * BOTH have failed. This keeps a single missing/broken cosmetic frame from
 * ever swapping the whole character's art style, not just its hair color.
 * See wholeAvatarSupport.ts#resolveWholeAvatarLoadState for the (pure,
 * unit-tested) decision logic this delegates to.
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
  const sources = resolveWholeAvatarSourceChain(gender, state, frame, appearance)

  // The last `primary` src that failed to load — not a permanent flag.
  // Comparing it against the current resolution's `primary` inside
  // `resolveWholeAvatarLoadState` (recomputed every render) is what lets a
  // state/frame change immediately retry the real variant image again
  // instead of getting stuck on the fallback forever.
  const [failedSources, setFailedSources] = useState<string[]>([])
  const sourceIndex = Math.max(0, sources.findIndex((candidate) => !failedSources.includes(candidate)))
  const src = sources[sourceIndex]
  const isFinalAttempt = sourceIndex === sources.length - 1

  function handleError() {
    if (isFinalAttempt) {
      onError?.()
      return
    }
    setFailedSources((current) => (current.includes(src) ? current : [...current, src]))
  }

  const boxStyle =
    fit === 'height'
      ? { position: 'relative' as const, height: '100%', width: 'auto', maxWidth: '100%', aspectRatio: '1 / 1' }
      : { position: 'relative' as const, width: size, maxWidth: '100%', aspectRatio: '1 / 1' }

  return (
    <div style={boxStyle}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        width={SPRITE_CANVAS_SIZE}
        height={SPRITE_CANVAS_SIZE}
        draggable={false}
        decoding="async"
        onError={handleError}
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
