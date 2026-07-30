export interface Subject {
  id: string
  name: string
  color: string
  /** Set when the subject is removed but has real study history attached —
   * hidden from new-selection lists everywhere, but the record itself (and
   * its name) is kept so past sessions/planner tasks/stats/result cards can
   * still resolve a real name instead of a raw id. Subjects with zero
   * history are hard-deleted instead (nothing to preserve). */
  archivedAt?: number
}

export interface StudySession {
  id: string
  subjectId: string
  startedAt: number
  durationSec: number
  dateKey: string
}

export type PointTransactionType = 'earn_study' | 'earn_streak' | 'earn_other' | 'spend'

export interface PointTransaction {
  id: string
  type: PointTransactionType
  amount: number
  reason: string
  dateKey: string
  timestamp: number
}

export type ShopCategory = 'hair' | 'outfit' | 'accessory' | 'background'
export type PriceType = 'points' | 'cash'

export interface ShopItem {
  id: string
  category: ShopCategory
  name: string
  priceType: PriceType
  price: number
  emoji: string
  colorHex?: string
}

export type NotificationType = 'rank_overtaken' | 'streak_warning' | 'event'

export type NavTarget = 'timer' | 'capture' | 'ranking' | 'tutor' | 'shop' | 'profile'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  createdAt: number
  linkTarget?: NavTarget
}
