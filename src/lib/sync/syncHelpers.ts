import { supabase } from '../supabaseClient'

/**
 * Fire-and-forget error reporting for a background sync call — never
 * throws, never retries. The local store is already the source of truth
 * for the current session (docs/StudyLog_Supabase_Data_Migration_Plan_v2.0.md
 * §2-1/§6-2), so a failed upsert must not block the UI; the next app boot's
 * initial-sync check (resolveInitialSync) naturally retries it.
 */
export function reportSyncError(label: string, error: unknown): void {
  if (!error) return
  console.warn(`[sync:${label}]`, error)
}

/**
 * Lightweight existence check used by every store's first-boot sync: does
 * this user already own at least one row in `table`? Returns false (never
 * throws) if Supabase isn't configured or the check itself fails — callers
 * fall back to `resolveInitialSync`'s 'push' branch in that case, which is
 * the safe direction (never destructively overwrites local data because
 * of a network blip).
 */
export async function hasAnyServerRow(table: string, userId: string): Promise<boolean> {
  if (!supabase) return false
  const { count, error } = await supabase
    .from(table)
    .select('user_id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    reportSyncError(`${table}:existence-check`, error)
    return false
  }
  return (count ?? 0) > 0
}
