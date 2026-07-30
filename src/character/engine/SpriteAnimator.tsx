import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

interface SpriteAnimatorProps {
  frameCount: number
  fps: number
  loop?: boolean
  playing?: boolean
  renderFrame: (frameIndex: number) => React.ReactNode
  className?: string
}

/**
 * Asset-agnostic frame player (docs/character-system.md §9). `renderFrame`
 * receives the current frame index and returns whatever should render for
 * it — today that's a procedurally-posed SVG (see fallback/), later it can
 * be a real `boy_study_0N.png` sprite `<img>` without changing this file.
 */
export function SpriteAnimator({
  frameCount,
  fps,
  loop = true,
  playing = true,
  renderFrame,
  className,
}: SpriteAnimatorProps) {
  const [frame, setFrame] = useState(0)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (!playing || reducedMotion || frameCount <= 1) return
    const intervalMs = 1000 / fps
    const id = window.setInterval(() => {
      setFrame((f) => (loop ? (f + 1) % frameCount : Math.min(f + 1, frameCount - 1)))
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [playing, reducedMotion, frameCount, fps, loop])

  return <div className={className}>{renderFrame(reducedMotion ? 0 : frame)}</div>
}
