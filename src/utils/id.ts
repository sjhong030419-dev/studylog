/**
 * Collision-resistant id generator. Prefers `crypto.randomUUID()` (available
 * in every modern browser); falls back to a timestamp + random suffix for
 * environments where it's missing, matching the existing
 * `session-${Date.now()}-${random}` convention used elsewhere in the app.
 */
export function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
