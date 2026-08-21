export type MoonlightReward =
  | { id: 'moonlight-10'; requiredXp: 10; kind: 'points'; amount: 10; label: '별빛 포인트 10P'; emoji: '⭐' }
  | { id: 'moonlight-45'; requiredXp: 45; kind: 'points'; amount: 25; label: '달빛 포인트 25P'; emoji: '🌙' }
  | { id: 'moonlight-90'; requiredXp: 90; kind: 'cosmetic'; itemId: 'skin-moonlight-academy'; label: '달빛 아카데미 스킨'; emoji: '🏰' }

export const MOONLIGHT_SEASON_TARGET_XP = 90

export const MOONLIGHT_REWARDS: readonly MoonlightReward[] = [
  { id: 'moonlight-10', requiredXp: 10, kind: 'points', amount: 10, label: '별빛 포인트 10P', emoji: '⭐' },
  { id: 'moonlight-45', requiredXp: 45, kind: 'points', amount: 25, label: '달빛 포인트 25P', emoji: '🌙' },
  { id: 'moonlight-90', requiredXp: 90, kind: 'cosmetic', itemId: 'skin-moonlight-academy', label: '달빛 아카데미 스킨', emoji: '🏰' },
]

export function moonlightSeasonProgress(studyXp: number) {
  const currentXp = Math.max(0, Math.min(studyXp, MOONLIGHT_SEASON_TARGET_XP))
  return {
    currentXp,
    targetXp: MOONLIGHT_SEASON_TARGET_XP,
    percent: Math.round((currentXp / MOONLIGHT_SEASON_TARGET_XP) * 100),
    complete: studyXp >= MOONLIGHT_SEASON_TARGET_XP,
  }
}

export function canClaimMoonlightReward(reward: MoonlightReward, studyXp: number, claimedIds: readonly string[]) {
  return studyXp >= reward.requiredXp && !claimedIds.includes(reward.id)
}
