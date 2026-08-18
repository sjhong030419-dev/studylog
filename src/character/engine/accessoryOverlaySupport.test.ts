import { describe, expect, it } from 'vitest'
import {
  hasSakuraRibbon,
  resolveAvatarRibbonPath,
  resolveRoomRibbonPath,
  resolveRoomRibbonPathFromScenePath,
} from './accessoryOverlaySupport'

describe('sakura ribbon accessory overlay', () => {
  it('only enables the overlay when the ribbon is equipped', () => {
    expect(hasSakuraRibbon({ equippedAssetIds: ['hair-ribbon'] })).toBe(true)
    expect(hasSakuraRibbon({ equippedAssetIds: ['acc-glasses'] })).toBe(false)
  })

  it('resolves gender/state-aware avatar and room paths', () => {
    expect(resolveAvatarRibbonPath('girl', 'study')).toBe(
      '/sprites/avatar-layers/head-accessory/ribbon/girl/study.png',
    )
    expect(resolveRoomRibbonPath('sakura-uniform', 'boy', 'happy')).toBe(
      '/sprites/room/sakura-uniform/accessories/ribbon/boy/happy.png',
    )
    expect(resolveRoomRibbonPathFromScenePath('/sprites/room/default-night/scenes/girl/sleep.webp')).toBe(
      '/sprites/room/default-night/accessories/ribbon/girl/sleep.png',
    )
  })
})
