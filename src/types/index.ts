export type AvatarStatus = 'studying' | 'idle' | 'resting'

export interface Subject {
  id: string
  name: string
  color: string
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

export interface Answer {
  id: string
  questionId: string
  authorName: string
  authorIsMentor: boolean
  body: string
  createdAt: number
}

export interface Question {
  id: string
  subjectId: string
  title: string
  body: string
  authorName: string
  createdAt: number
  answers: Answer[]
  acceptedAnswerId: string | null
}

export type MentorBadge = 'none' | 'mentor' | 'top'

export interface Mentor {
  id: string
  name: string
  subjectIds: string[]
  bio: string
  badge: MentorBadge
  acceptedAnswerCount: number
  followerCount: number
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
