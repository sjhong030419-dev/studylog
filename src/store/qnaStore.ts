import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Answer, Mentor, Question } from '../types'
import { usePointsStore } from './pointsStore'
import { useNotificationStore } from './notificationStore'

export const ASK_QUESTION_COST = 5
export const ACCEPT_ANSWER_REWARD = 10
export const MENTOR_ACCEPTED_ANSWERS_THRESHOLD = 3

const SEED_QUESTIONS: Question[] = [
  {
    id: 'q1',
    subjectId: 'math',
    title: '이차함수 최댓값 구하는 법 헷갈려요',
    body: 'y = -2x^2 + 4x + 1 의 최댓값을 구하는데 완전제곱식으로 바꾸는 과정에서 자꾸 틀려요.',
    authorName: '민지',
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    answers: [
      {
        id: 'a1',
        questionId: 'q1',
        authorName: '수학멘토_지훈',
        authorIsMentor: true,
        body: '-2(x^2 - 2x) + 1 로 묶고 괄호 안을 완전제곱식으로 만들어보세요. -2(x-1)^2 + 3이 나와요!',
        createdAt: Date.now() - 1000 * 60 * 60 * 4,
      },
    ],
    acceptedAnswerId: 'a1',
  },
  {
    id: 'q2',
    subjectId: 'eng',
    title: '관계대명사 that과 which 언제 구분해서 써요?',
    body: '선행사가 사물일 때 that이랑 which 둘 다 쓸 수 있다는데 실제 시험에서는 어떻게 골라야 하나요?',
    authorName: '준서',
    createdAt: Date.now() - 1000 * 60 * 60 * 20,
    answers: [],
    acceptedAnswerId: null,
  },
  {
    id: 'q3',
    subjectId: 'kor',
    title: '고전문학 지문에서 화자의 정서 파악하는 팁 있을까요',
    body: '수능 국어 고전시가만 나오면 화자의 정서를 잘 못 짚어내겠어요.',
    authorName: '하늘',
    createdAt: Date.now() - 1000 * 60 * 60 * 30,
    answers: [
      {
        id: 'a2',
        questionId: 'q3',
        authorName: '국어멘토_서연',
        authorIsMentor: true,
        body: '감정을 직접 드러내는 시어(한탄, 그리움 등)에 먼저 밑줄을 긋고, 화자의 처지(귀양, 이별 등)를 먼저 파악하면 훨씬 쉬워져요.',
        createdAt: Date.now() - 1000 * 60 * 60 * 28,
      },
    ],
    acceptedAnswerId: null,
  },
]

const SEED_MENTORS: Mentor[] = [
  {
    id: 'm1',
    name: '수학멘토_지훈',
    subjectIds: ['math'],
    bio: '수학 1등급, 정시 수학 100점. 개념부터 차근차근 알려드려요.',
    badge: 'top',
    acceptedAnswerCount: 42,
    followerCount: 128,
  },
  {
    id: 'm2',
    name: '국어멘토_서연',
    subjectIds: ['kor'],
    bio: '국어 고전문학/독서 지문 해석 전문. 힌트 위주로 알려드려요.',
    badge: 'mentor',
    acceptedAnswerCount: 19,
    followerCount: 54,
  },
  {
    id: 'm3',
    name: '영어멘토_다은',
    subjectIds: ['eng'],
    bio: '영어 문법/독해 멘토. 실전 문제로 설명해요.',
    badge: 'mentor',
    acceptedAnswerCount: 11,
    followerCount: 33,
  },
]

interface QnaState {
  questions: Question[]
  mentors: Mentor[]
  followedMentorIds: string[]
  isMentor: boolean

  myAcceptedAnswerCount: () => number
  askQuestion: (subjectId: string, title: string, body: string) => boolean
  addAnswer: (questionId: string, body: string) => void
  acceptAnswer: (questionId: string, answerId: string) => void
  toggleFollowMentor: (mentorId: string) => void
  applyForMentor: () => boolean
}

export const useQnaStore = create<QnaState>()(
  persist(
    (set, get) => ({
      questions: SEED_QUESTIONS,
      mentors: SEED_MENTORS,
      followedMentorIds: [],
      isMentor: false,

      myAcceptedAnswerCount: () => {
        return get().questions.filter((q) => {
          const accepted = q.answers.find((a) => a.id === q.acceptedAnswerId)
          return accepted && accepted.authorName === '나'
        }).length
      },

      askQuestion: (subjectId, title, body) => {
        const trimmedTitle = title.trim()
        const trimmedBody = body.trim()
        if (!trimmedTitle || !trimmedBody) return false
        const ok = usePointsStore.getState().spend(ASK_QUESTION_COST, `질문 등록: ${trimmedTitle}`)
        if (!ok) return false

        const question: Question = {
          id: `q-${Date.now()}`,
          subjectId,
          title: trimmedTitle,
          body: trimmedBody,
          authorName: '나',
          createdAt: Date.now(),
          answers: [],
          acceptedAnswerId: null,
        }
        set({ questions: [question, ...get().questions] })
        return true
      },

      addAnswer: (questionId, body) => {
        const trimmed = body.trim()
        if (!trimmed) return
        const answer: Answer = {
          id: `a-${Date.now()}`,
          questionId,
          authorName: '나',
          authorIsMentor: get().isMentor,
          body: trimmed,
          createdAt: Date.now(),
        }
        set({
          questions: get().questions.map((q) =>
            q.id === questionId ? { ...q, answers: [...q.answers, answer] } : q,
          ),
        })
      },

      acceptAnswer: (questionId, answerId) => {
        const question = get().questions.find((q) => q.id === questionId)
        if (!question || question.acceptedAnswerId) return
        const answer = question.answers.find((a) => a.id === answerId)
        if (!answer) return

        set({
          questions: get().questions.map((q) =>
            q.id === questionId ? { ...q, acceptedAnswerId: answerId } : q,
          ),
        })

        if (answer.authorName === '나') {
          usePointsStore.getState().earn(ACCEPT_ANSWER_REWARD, '답변 채택 보상')
          useNotificationStore
            .getState()
            .add(
              'answer_accepted',
              '내 답변이 채택됐어요!',
              `"${question.title}" 질문에서 답변이 채택돼 ${ACCEPT_ANSWER_REWARD}P를 받았어요.`,
              'qna',
            )
        }
      },

      toggleFollowMentor: (mentorId) => {
        const { followedMentorIds } = get()
        set({
          followedMentorIds: followedMentorIds.includes(mentorId)
            ? followedMentorIds.filter((id) => id !== mentorId)
            : [...followedMentorIds, mentorId],
        })
      },

      applyForMentor: () => {
        if (get().isMentor) return true
        if (get().myAcceptedAnswerCount() < MENTOR_ACCEPTED_ANSWERS_THRESHOLD) return false
        set({ isMentor: true })
        useNotificationStore
          .getState()
          .add('mentor_result', '멘토 신청이 승인됐어요! 🌟', '이제 멘토 배지를 달고 답변할 수 있어요.', 'qna')
        return true
      },
    }),
    {
      name: 'studylog-qna',
      partialize: (state) => ({
        questions: state.questions,
        followedMentorIds: state.followedMentorIds,
        isMentor: state.isMentor,
      }),
    },
  ),
)
