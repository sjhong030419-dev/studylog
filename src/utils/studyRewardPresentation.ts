export interface StudyRewardPresentation {
  shopCta: string
  closeCta: string
  zeroRewardTitle: string
  zeroRewardHint: string
}

export function deriveStudyRewardPresentation(earnedPoints: number): StudyRewardPresentation {
  if (earnedPoints > 0) {
    return {
      shopCta: '받은 포인트로 상점 구경하기 🛍️',
      closeCta: '홈으로 돌아가기',
      zeroRewardTitle: '',
      zeroRewardHint: '',
    }
  }

  return {
    shopCta: '새 스킨 미리보기 🛍️',
    closeCta: '퀘스트 보상 받으러 가기',
    zeroRewardTitle: '첫 기록 퀘스트가 열렸어요!',
    zeroRewardHint: '홈에서 첫 모험 보상 +2P를 받아보세요 · 공부 보상은 10분마다 1P',
  }
}
