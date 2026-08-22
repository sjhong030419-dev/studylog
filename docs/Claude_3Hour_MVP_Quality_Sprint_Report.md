# StudyLog 3시간 MVP 품질 스프린트 — 결과 보고서

실행 문서: `docs/Claude_3Hour_MVP_Quality_Sprint.md`

## 1. 시작 시 저장소 상태

- 브랜치: `main` (origin/main보다 1커밋 앞선 상태 — `95c32ff docs: add Claude three-hour MVP quality sprint`, 미푸시)
- 작업 트리: 미커밋 변경 없음 (`git status --short --branch` 클린)
- 기준 검사 결과 (수정 전, 모두 통과):
  - `npm run lint` → 통과 (oxlint, 0 issues)
  - `npm test -- --run` → **399 passed** (27 test files)
  - `npm run build` → 성공 (tsc -b && vite build, code-splitting 적용된 최신 구조)
  - `npm run validate:assets` → 성공 (exit 0). 검정머리/사쿠라 유니폼/사쿠라 리본/달빛 아카데미 whole-avatar 4종 각 208개 파일 전부 valid, baked full-scene room 32개 valid. 기존 avatar-layers 레이어 42개는 "optional planned layer"로 별도 분류되어 실패로 취급되지 않음(스크립트가 이미 이렇게 정책화되어 있었음, 이번 작업과 무관)
- `package.json` 스크립트 확인: `dev`, `server`, `build`, `lint`, `preview`, `test`, `validate:assets`, `validate:assets:strict`
- 결론: 저장소는 이미 매우 안정적인 상태(모든 기준 검사 그린)에서 시작했다. 이는 이전 세션들에서 이미 상당한 하드닝 작업(검정머리/사쿠라 유니폼 남녀 지원, 상점 미리보기, 옷장 뷰, 공부 리워드 모달, 일일 퀘스트, 달빛 시즌 등)이 반영되어 있었기 때문이다.

## 2. 실제로 재현한 문제

### 문제 1 (P0 — 허위 업적 표시): Capture/Share 카드가 실제로는 완료되지 않은 일일 퀘스트를 "완료"로 표시
- **재현 절차**: 로컬 테스트 세션에서 과목 1개, 60초짜리 세션 1건만 기록 (일일 퀘스트 3개 중 "첫 모험 시작"만 실제 완료, 나머지 2개는 미완료) → 캡처 화면 진입 → 카드 상단에 **"오늘의 퀘스트 완료! ✨"** 문구가 표시됨.
- **원인**: `src/components/capture/LogCaptureCard.tsx`의 조건이 `todayTotalSec > 0`(오늘 1초라도 공부했는가)이었고, 실제 `useDailyQuestStore`/`deriveDailyQuests`의 완료 상태를 전혀 참조하지 않았음.
- **원칙 위반**: 실행 문서 §1 "사용자가 실제로 하지 않은 공부, 획득하지 않은 보상, 달성하지 않은 업적을 만들어내지 않는다"를 직접 위반. 공유되는 카드에 노출되는 문제라 영향이 큼.

### 문제 2 (P1 — 접근성 노이즈): 하단 내비게이션 아이콘이 스크린리더에 중복 announce됨
- **재현 절차**: `src/components/layout/BottomNav.tsx`의 `PRIMARY_TABS` 아이콘(`⏱️🪑📸📊`)만 `aria-hidden`이 빠져 있었음 — 같은 파일의 "더보기" 아이콘, `MORE_TABS` 아이콘은 이미 `aria-hidden="true"`로 정확히 처리되어 있어 비교로 확인.
- **영향**: 각 탭 버튼이 이미 보이는 텍스트 라벨("타이머" 등)을 갖고 있어 버튼 자체의 접근 가능한 이름은 정상이지만, 장식용 이모지가 함께 읽혀 스크린리더 사용자에게 불필요한 잡음이 발생.

### 재현했지만 문제가 아니었던 항목 (기록용)
- `MoonlightSeasonCard`가 Home에서 안 보인다는 초기 의심 — 실제로는 `AvatarShop.tsx` 상점 탭 최상단에 항상 렌더링되고 있었음(§1 흐름의 "상점/시즌 보상 확인" 단계와 일치). 코드 확인 후 버그 아님으로 판정, 수정하지 않음.
- 신규 사용자 흐름(온보딩→과목 없음→과목 생성→자동 선택→타이머 시작/일시정지/재개/종료→세션 저장)의 중복 클릭 방지: `src/store/timerStore.ts`의 `start/pause/resume/stop`이 각각 `isRunning`/`isPaused`를 가드하고 있어 이미 안전함. 실제로 버그를 재현하지 못함.
- Capture 버튼 연속 클릭·실패 후 영구 잠금: `handleSave`/`handleShare` 모두 `if (downloading) return` 가드 + `finally`에서 `setDownloading(false)`가 이미 존재해 실패해도 버튼이 다시 활성화됨. 재현하지 못함.
- 퀘스트/시즌 보상 포인트가 Study XP로 잘못 집계되는지: `pointsStore.ts`의 `earn()`(퀘스트/시즌 포인트 보상용)은 `type: 'earn_other'`, `studyXpTotal()`은 `earn_study`만 집계 — 코드 확인 및 브라우저 실측(19 XP 유지 확인)으로 정상 분리됨을 확인. 재현하지 못함.
- 320~430px 모바일 가로 스크롤: Home/Shop/Capture(정사각형·9:16)/Stats 5개 화면 × 4개 뷰포트 = 20개 조합을 브라우저에서 직접 측정(`document.documentElement.scrollWidth` vs `clientWidth`), 전부 overflow 없음. 재현하지 못함.

## 3. 수정한 문제와 사용자 영향

| 문제 | 수정 | 사용자 영향 |
|---|---|---|
| 캡처 카드 허위 "퀘스트 완료" 표시 | `src/quests/dailyQuests.ts`에 순수 함수 `allDailyQuestsComplete(sessions, dateKey)` 추가(기존 `deriveDailyQuests`를 재사용, 로직 중복 없음) → `LogCaptureCard.tsx`가 `todayTotalSec > 0` 대신 이 함수를 사용 | 사용자가 실제로 3개 퀘스트를 모두 끝냈을 때만 "완료" 문구가 뜨고, 아닐 때는 정직한 "오늘의 성장 기록"으로 표시됨. 공유되는 카드에 없는 성취를 주장하지 않음 |
| 하단 내비 아이콘 스크린리더 노이즈 | `src/components/layout/BottomNav.tsx`의 `PRIMARY_TABS` 아이콘 `<span>`에 `aria-hidden="true"` 추가 | 스크린리더 사용자가 탭 버튼을 탐색할 때 이모지가 중복으로 읽히지 않음 |

두 수정 모두 기존 데이터 구조·상태 관리·라우팅·렌더링 정책을 변경하지 않았고, 새 의존성을 추가하지 않았다.

## 4. 변경 파일 목록

```
M src/components/capture/LogCaptureCard.tsx   (+8 -1)
M src/components/layout/BottomNav.tsx          (+1 -1)
M src/quests/dailyQuests.test.ts               (+30 -1)
M src/quests/dailyQuests.ts                    (+10 -0)
```

## 5. 추가/수정한 테스트

`src/quests/dailyQuests.test.ts`에 `allDailyQuestsComplete` 전용 `describe` 블록 5개 추가:

1. 공부를 시작했지만 어떤 퀘스트도 완료 전이면 `false`
2. 29:59(1799초) 집중 + 2과목이어도 30분 퀘스트 미달이면 `false` (요청된 "정확히 30분 vs 29분 59초" 경계)
3. 정확히 30:00(1800초) + 2과목 + 최소 1세션이면 `true`
4. 한 과목에만 30분 이상 몰아넣어도 "서로 다른 과목 2개" 퀘스트가 안 끝났으므로 `false`
5. 다른 날짜의 세션은 무시하고 오늘 기준으로만 판정하는지 (날짜 경계)

전부 `npx vitest run src/quests/dailyQuests.test.ts`에서 개별 확인 후 전체 스위트에도 포함해 재확인했다.

## 6. 실행한 검증 명령과 결과 (수정 후, 최종)

```bash
npm run lint            # 통과 (0 issues)
npm test -- --run       # 통과 — 404 passed (27 files) — 기존 399 + 신규 5
npm run build           # 통과 — tsc -b && vite build 성공
npm run validate:assets # 통과 (exit 0) — whole-avatar 4종 각 208 valid, baked full-scene 32 valid,
                         #   기존 미완성 레이어 42개는 별도 "optional planned" 분류로 실패 아님
git diff --check        # 통과 (LF/CRLF 정규화 경고만 존재, 실제 공백 오류 없음)
```

## 7. 모바일 확인 결과

로컬 dev 서버(`npm run dev`)를 실제 브라우저에서 실행해 아래 4개 뷰포트 × 5개 화면(Home, Shop, Capture 정사각형, Capture 9:16, Stats) = 20개 조합을 직접 측정했다. 전부 `scrollWidth === clientWidth`로 가로 스크롤 없음을 확인.

| 뷰포트 | Home | Shop | Capture(정사각형) | Capture(9:16) | Stats |
|---|---|---|---|---|---|
| 320×568 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 375×667 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 390×844 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 430×932 | ✅ | ✅ | ✅ | ✅ | ✅ |

추가로 같은 세션에서 실제 사용자 플로우를 실행해 확인:
- 빈 신규 사용자 → 과목 2개 생성 → 세션 기록 → 일일 퀘스트 3개 모두 "받기" 클릭 → 정확히 1회씩만 지급(19P → 31P, 중복 없음) → 새로고침 후 "받음" 상태와 잔액 유지
- 달빛 시즌 카드에서 10 XP 보상 "받기" 클릭 → 31P → 41P 정상 반영
- 콘솔 에러 0건 (전체 세션 동안)

## 8. 구현하지 않고 보류한 항목과 이유

이번 패스에서 코드/실측으로 재현되지 않은 나머지 P1/P2 체크리스트 항목(예: Zustand selector 렌더링 최적화, 날짜/보상 계산의 추가적인 코드 중복 정리 등)은 다음 이유로 구현하지 않았다:

1. **재현 근거 부족** — 실행 문서 §6 "확실하지 않은 문제를 추측으로 고치지 않는다"에 따라, 코드 리뷰와 실측 모두에서 실제 결함으로 확인되지 않은 항목은 임의로 건드리지 않았다. 특히 `DailyQuestCard.tsx`와 `dailyQuestStore.ts`에 동일한 날짜 비교 로직(`claimedDateKey === key ? claimedIds : []`)이 중복돼 있는 것을 발견했으나, 두 곳의 로직이 완전히 일치하고 기존 테스트(`dailyQuestStore.test.ts`)로 이미 보호되고 있어 "버그"가 아니라 §4.9의 P2 코드 중복 정리 후보로만 남긴다.
2. **시간 배분** — 문서의 §8 시간 운영 가이드에 따라 P0 핵심 흐름과 데이터 안전성, 그리고 필수 요구사항인 모바일 뷰포트 검증에 집중했고, 렌더링 성능 프로파일링(§4.8)처럼 실측에 별도의 프로파일링 도구·긴 세션이 필요한 P2 항목은 이번 패스 범위 밖으로 남겼다.
3. **범위 제한** — 새 이미지 에셋이 필요한 항목, DB 스키마 변경이 필요한 항목은 발견되지 않았다(있었다면 §6에 따라 구현하지 않고 여기 기록했을 것).

## 9. 다음 작업 추천 (3개 이하)

1. `dailyQuestStore.ts`의 `claimQuest`와 `DailyQuestCard.tsx`가 공유하는 "오늘 기준 유효 클레임 목록" 계산(`claimedDateKey === key ? claimedIds : []`)을 `src/quests/dailyQuests.ts`의 순수 함수로 추출해 두 곳의 중복을 제거하면, 향후 한쪽만 수정되어 어긋나는 위험을 원천 차단할 수 있다.
2. `src/components/**`에 컴포넌트 레벨 테스트가 전혀 없다(`vite.config.ts`가 현재 "pure-logic unit tests only" 정책). 이번에 고친 캡처 카드 같은 "UI 조건이 실제 상태와 일치하는가" 류의 버그는 순수 함수 테스트만으로는 못 잡는 경우가 있으므로, jsdom 기반 컴포넌트 테스트 도입 여부를 제품팀과 논의해볼 가치가 있다.
3. `moonlight-45`/`moonlight-90` 보상처럼 아직 실측 경계 테스트가 없는 시즌 보상 단계의 "정확히 임계값 XP"/"임계값-1 XP" 경계 테스트를 `seasonStore.test.ts`에 보강하면 좋다(현재는 최종 스킨 중복 보유 케이스만 테스트되어 있음).

## 10. 커밋 여부와 커밋 해시

로컬에 1개의 커밋으로 반영함 (원격 push는 하지 않음 — 문서 §10 "사용자가 따로 지시하지 않았다면 git push와 배포는 하지 않는다"):

- 커밋 메시지: `fix: harden StudyLog MVP user journey`
- 커밋 해시: 이 보고서 파일 자체가 그 커밋에 포함되어 자기참조가 불가능하므로, 정확한 해시는 `git log -1 --oneline`으로 확인하거나 최종 채팅 답변을 참고
