# StudyLog 보상 피드백 개선 — 결과 보고서

목표: "보상을 받았을 때 확실히 기분 좋은 경험"을 만드는 것. 참고: `docs/Claude_3Hour_MVP_Quality_Sprint_Report.md`

## 1. 발견한 문제

코드 리뷰와 실제 브라우저 실측(로컬 테스트 데이터, 실사용자 데이터 아님)으로 확인한 문제:

1. **보상/구매/착용에 시각 피드백이 전혀 없었음** — 일일 퀘스트 수령, 달빛 시즌 보상 수령, 상점 구매, 착용/해제 전부 버튼 상태만 바뀔 뿐 사용자에게 "방금 무엇을 얻었는지" 알려주는 피드백이 없었다.
2. **`MoonlightSeasonCard`의 보상 버튼이 32px로, 44px 최소 터치 영역 요구사항을 위반**하고 있었다 (`DailyQuestCard`/`AvatarShop`의 다른 버튼들은 이미 44px를 지키고 있었음 — 이 카드만 예외).
3. **잠긴(잠김) 시즌 보상 카드가 "왜" 잠겼는지 설명하지 않았음** — 남은 XP를 알 수 없어 "조건을 이해할 수 있는 상태"라는 목표에 못 미쳤다.
4. **(구현 중 자체 발견) 토스트를 상단에 배치하자 320px 폭에서 프로필/알림 아이콘과 겹치는 회귀를 만들 뻔했다** — 처음 `top-3`로 배치했을 때 실측(`getBoundingClientRect`)으로 겹침을 확인, `top-20`으로 옮기고 애니메이션 진입 프레임(최대 -12px 이동)까지 포함한 최악의 경우로 재검증해 완전히 해결했다. (자세한 내용은 6절 참고)
5. **재현했지만 실제 버그가 아니었던 것**: 시즌/퀘스트 보상 포인트가 Study XP에 반영되는지 의심했으나, `pointsStore.ts`의 `earn()`(퀘스트·시즌 보상 전용)은 `type: 'earn_other'`이고 `studyXpTotal()`은 `earn_study`만 집계해 이미 완전히 분리되어 있었다(3절 테스트로 재확인).

## 2. 구현한 보상 피드백

### 공통 토스트 시스템
- `src/store/toastStore.ts` — 영속화하지 않는 작은 Zustand 스토어. `pushToast`/`dismissToast`만 제공. 3.2초 후 자동 소멸.
- `src/components/feedback/RewardToastHost.tsx` — `App.tsx`에 한 번만 마운트하는 단일 스택. `role="status"` + 부모 컨테이너 `aria-live="polite"`/`aria-atomic="true"`로 스크린리더가 읽을 수 있게 했고, 닫기 버튼(44×44px)도 제공.
- 애니메이션은 기존 `src/index.css`의 `@keyframes` + `.animate-*` 패턴을 그대로 따라 `toast-in`을 추가했고, 기존 애니메이션들과 **같은 `@media (prefers-reduced-motion: reduce)` 블록**에 등록해 감소 모션 설정을 존중한다.
- **중복 방지**: 토스트는 항상 해당 스토어 액션이 `true`(성공)를 반환했을 때만 표시한다 (`if (claimQuest(id)) pushToast(...)`). `claimQuest`/`claimMoonlightReward`/`purchaseWithPoints`는 이미 "이미 수령/구매함"을 자체적으로 거부하므로, 연속 클릭해도 두 번째 호출은 `false`를 반환해 토스트도 중복 발생하지 않는다. 브라우저에서 같은 버튼을 연속 클릭해 정확히 토스트 1개만 뜨는 것을 확인했다.

### 연결한 5개 행동
| 행동 | 파일 | 토스트 내용 |
|---|---|---|
| 일일 퀘스트 수령 | `DailyQuestCard.tsx` | 퀘스트 이모지 + "퀘스트 완료!" + 퀘스트명 + `+N P` |
| 시즌 포인트 보상 수령 | `MoonlightSeasonCard.tsx` | 보상 이모지 + "시즌 보상 획득!" + 보상명 + `+N P` |
| 달빛 아카데미 스킨 획득 | 〃 | 🏰 + "시즌 스킨 획득!" + 스킨명 |
| (이미 스킨 보유 시 80P 대체) | 〃 | 💰 + "대체 보상 획득!" + "이미 보유한 스킨이라 80P로 지급했어요" + `+80P` — **정직하게 다른 문구**를 사용해 실제로 받은 게 스킨이 아니라 대체 포인트임을 숨기지 않는다 |
| 상점 포인트 구매 성공 | `AvatarShop.tsx` | 아이템 이모지 + "구매 완료!" + 아이템명 |
| 아이템 착용 / 해제 | 〃 | 아이템 이모지 + "착용 완료!"/"착용 해제" + 아이템명 |

캐시(Stripe) 구매는 `purchaseWithCash`가 실제 결제 리다이렉트 시에도 `true`를 반환할 수 있어(현재 페이지를 벗어남), 토스트는 목업 성공(같은 탭에서 즉시 소유됨) 경로에서만 띄우도록 분기했다 — 결제 페이지로 이동하는 중에 뜬금없이 "구매 완료" 토스트가 뜨는 것을 방지.

`alert()`는 사용하지 않았다.

## 3. 시즌 경계 테스트 (작업 3)

`src/store/seasonStore.test.ts`에 추가 (기존 4개 + 신규 7개 = 11개):

- `per-tier XP boundaries` describe 블록: 9XP 거부/정확히 10XP 수령 가능, 44XP 거부/정확히 45XP 수령 가능, 89XP 거부/정확히 90XP 수령 가능 (3개 테스트)
- 이미 받은 보상은 3개 등급 모두에서 재수령 불가 (`never allows a reclaim...`)
- 스킨 중복 보유 시 80P 대체 보상이 **정확히 한 번만** 지급됨(재시도 시 잔액 불변)을 명시적으로 검증
- 보상 포인트(`earn`)가 Study XP(`earn_study`만 집계)에 전혀 반영되지 않음을 직접 검증
- 새로고침 후 상태 유지: 이 프로젝트의 vitest 환경은 `node`라 실제 localStorage rehydration은 불가능(기존 `shopStore.test.ts`도 동일 제약) — 기존 패턴을 따라 `claimedRewardIds`가 `JSON.stringify`/`JSON.parse` 왕복에서 손실 없이 보존되는지로 검증

## 4. 일일 퀘스트 날짜 경계 테스트 (작업 4)

- `src/store/dailyQuestStore.test.ts`: 어제 수령이 오늘 수령을 막지 않음(`dateKeyOffset(todayKey(), -1)`로 정확히 "어제" 시나리오 재현), 29:59/30:00 `focus-30` 퀘스트 수령 경계(스토어 액션 레벨), 오늘 수령이 JSON 왕복 후에도 보존되는지
- `src/quests/dailyQuests.test.ts`: 같은 과목 세션 2개는 "서로 다른 과목 2개" 퀘스트를 완료하지 못함(새 테스트 1개 추가) — 다른 날짜 세션 제외/29:59 vs 30:00 경계는 지난 스프린트에서 이미 `allDailyQuestsComplete` 테스트로 커버되어 있어 중복 추가하지 않았다.

## 5. 변경 파일

```
M  src/App.tsx                                 (+2)
M  src/components/home/DailyQuestCard.tsx       (+7 -1)
M  src/components/shop/AvatarShop.tsx           (+27 -13)
M  src/components/shop/MoonlightSeasonCard.tsx  (+29 -3)
M  src/index.css                                (+8)
M  src/quests/dailyQuests.test.ts               (+6)
M  src/store/dailyQuestStore.test.ts            (+38 -1)
M  src/store/seasonStore.test.ts                (+61 -1)
A  src/store/toastStore.ts                      (신규)
A  src/components/feedback/RewardToastHost.tsx  (신규)
```

캐릭터/방 이미지 에셋, Supabase 스키마, API 계약, 인증, 타이머 시간 측정 로직, 포인트 거래 기록 구조, 상점 구매/착용 데이터 구조는 전혀 건드리지 않았다. 새 외부 라이브러리도 설치하지 않았다(기존 Zustand만 사용).

> 참고: 작업 디렉터리에 이번 작업과 무관한 untracked 파일 2개(`docs/StudyLog_Rainy_Study_Cafe_Visual_Spec_v1.0.md`, `docs/assets/skin-concepts/rainy-study-cafe-v1/`)가 있었다 — 다른 세션이 만든 것으로 보여 전혀 건드리지 않았고, 이번 커밋에도 포함하지 않았다.

## 6. 모바일 확인 결과

로컬 dev 서버를 브라우저에서 직접 실행해 4개 뷰포트 × 4개 화면(Home 오늘의 모험, Shop 달빛 시즌, Shop 구매/착용, 보상 알림이 표시된 상태) = 16개 조합을 실측했다.

| 뷰포트 | Home(퀘스트) | Shop(달빛 시즌) | Shop(구매/착용) | 토스트 표시 상태 |
|---|---|---|---|---|
| 320×568 | ✅ | ✅ | ✅ | ✅ (겹침 없음) |
| 375×667 | ✅ | ✅ | ✅ | ✅ |
| 390×844 | ✅ | ✅ | ✅ | ✅ |
| 430×932 | ✅ | ✅ | ✅ | ✅ |

- 가로 스크롤: `document.documentElement.scrollWidth === clientWidth`로 16개 조합 전부 확인.
- **버튼 잘림**: 없음. `MoonlightSeasonCard`의 3개 보상 카드 모두 320px에서 잠금 안내 문구("N XP 더 모으면 열려요")와 44px 버튼이 잘리지 않고 표시됨을 텍스트 덤프로 확인.
- **고정 내비게이션(프로필/알림 아이콘) 겹침**: 처음 토스트를 `top-3`에 배치했을 때 320px에서 실제로 겹치는 것을 `getBoundingClientRect()`로 발견해 `top-20`으로 수정했다. 재검증 시 애니메이션 진입 프레임(가장 겹칠 위험이 큰, `-12px` 이동한 순간)까지 포함해 4개 뷰포트 전부에서 겹침 `false`를 확인했다. 하단 `BottomNav`는 화면 하단, 토스트는 화면 상단에 고정되어 있어 애초에 겹칠 수 없는 구조다.
- **지나치게 작은 글자**: 토스트/시즌 카드에서 사용한 폰트 크기(`text-[13px]`/`text-[10px]`/`text-[9px]`/`text-[8px]`)는 이미 `DailyQuestCard`/`MoonlightSeasonCard`가 기존에 쓰던 크기와 동일한 범위로, 새로운 축소는 없었다.
- 콘솔 에러: 전체 실측 세션 동안 0건.

## 7. 전체 검증 결과

```bash
npm run lint            # 통과 (0 issues)
npm test -- --run       # 통과 — 415 passed (27 files) — 기존 404 + 신규 11
npm run build            # 통과 — tsc -b && vite build 성공
npm run validate:assets  # 통과 (exit 0) — whole-avatar 4종(검정머리/사쿠라 유니폼/사쿠라 리본/달빛 아카데미) 각 208 valid,
                          #   baked full-scene 32 valid, 기존 미완성 레이어 42개는 "optional planned"로 실패 아님
git diff --check         # 통과 (LF/CRLF 정규화 경고만, 실제 공백 오류 없음)
```

**참고**: 요청하신 `npm run validate`는 `package.json`에 존재하지 않는 스크립트 이름이다(`validate:assets`/`validate:assets:strict`만 존재). 지난 3시간 스프린트 보고서와 동일하게 `validate:assets`를 실행했다.

## 8. 남은 위험

낮음.

- 캐시(Stripe) 구매의 목업 성공 여부는 `useShopStore.getState().ownedItemIds`로 사후 확인하는 방식이라, 이론상 같은 프레임 안에서 다른 곳이 동시에 같은 아이템을 소유 처리하면 오탐할 여지가 극히 미세하게 있으나 — 이 앱은 단일 사용자·단일 탭 로컬 상태라 실질적 위험은 없다.
- 토스트가 여러 개 동시에 쌓이는 경우(예: 매우 빠르게 서로 다른 보상을 연속 수령) 화면 상단에 세로로 계속 쌓이는데, 아직 최대 개수 제한을 두지 않았다 — 실사용에서 한 화면에서 몇 초 안에 5개 이상의 서로 다른 보상을 동시에 받는 경우는 설계상 없어 보류했다.

## 9. 커밋 해시

로컬에 1개 커밋으로 반영, **push 없음** (사용자 승인 없이 push/배포하지 않음):

- 커밋 메시지: `feat: improve StudyLog reward feedback`
- 커밋 해시: 최종 채팅 답변 참고
