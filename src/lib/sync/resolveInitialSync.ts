/**
 * Shared decision for every store's first-boot sync (docs/StudyLog_Supabase_Data_Migration_Plan_v2.0.md §4).
 * Pure function so every branch is independently testable — mirrors the
 * `shouldUseSprites`/`resolveCharacterHeightRatio` pattern already used
 * elsewhere in this codebase for exactly this reason.
 *
 * Rule: if the server already has a row for this user in the target table,
 * the server wins (pull) — otherwise this is the first device to sync and
 * the local value is uploaded (push). This is safe under pure anonymous
 * auth (every device has its own auth.uid(), so two devices never see the
 * same "row exists" answer by accident) — see docs §4 for the one known
 * exception (two devices with real local data, then a shared email login)
 * and why it's explicitly out of scope for now.
 */
export type InitialSyncDecision = 'pull' | 'push' | 'unauthenticated'

export interface ResolveInitialSyncInput {
  /** auth.uid() — null means the auth store hasn't reached 'ready' yet. */
  userId: string | null
  /** Whether a lightweight existence check found at least one row owned by
   * this userId in the target table. Irrelevant when userId is null. */
  serverHasRow: boolean
}

export function resolveInitialSync({ userId, serverHasRow }: ResolveInitialSyncInput): InitialSyncDecision {
  if (!userId) return 'unauthenticated'
  return serverHasRow ? 'pull' : 'push'
}
