# StudyLog 보상 토스트 안정성/테스트 커버리지 개선 — 결과 보고서

대상: `src/store/toastStore.ts`, `src/components/feedback/RewardToastHost.tsx`, 관련 테스트. 참고: `docs/Claude_Reward_Feedback_Report.md`

## 시작 시 저장소 상태

- 브랜치: `main`, `origin/main`보다 2커밋 앞선 상태(`31f2939`, `db151a8` — 기존 로컬 커밋, reset/amend 없이 그대로 유지)
- 작업 트리: 미커밋 변경 없음(클린)에서 시작
- HEAD 기준으로 작업, 타이머/포인트/퀘스트/시즌/상점/캐릭터/캡처 로직은 전혀 열지 않았다(읽기조차 하지 않음)

## 1. 발견한 문제

1. **`toastStore.ts`가 `window.setTimeout`을 직접 호출** — 이 프로젝트의 vitest 환경은 `node`(`vite.config.ts`, DOM 없음)인데, `window`는 이 환경에 아예 존재하지 않는다. 실제로 프로브 테스트(`expect(typeof window).toBe('undefined')`)로 확인했다. 즉 `toastStore.ts`를 그대로 유닛테스트하려는 순간 `pushToast` 호출이 `ReferenceError: window is not defined`로 즉시 터진다 — 이번 작업 1(스토어 테스트 추가)이 요구하는 테스트 자체가 수정 없이는 작성 불가능한 상태였다. `window.setTimeout`을 순수 `setTimeout`으로 바꾸는 것만으로 해결되며, 실제 브라우저에서는 `window.setTimeout === setTimeout`이라 런타임 동작은 동일하다.
2. **최대 표시 개수 제한이 없었음** — 짧은 시간에 서로 다른 보상을 여러 개 받으면(예: 여러 퀘스트를 연속 수령) 토스트가 화면 상단에 무한히 쌓일 수 있었다. 요구사항대로 최대 3개로 제한.
3. 재확인했지만 이미 안전했던 것들: `dismissToast`는 존재하지 않는 id를 필터링해도 예외 없이 no-op이라 이미 안전했고(수동 닫기 후 타이머가 뒤늦게 실행돼도 마찬가지), `RewardToastHost`의 접근성 속성(`aria-live="polite"`, `role="status"`, 닫기 버튼 44px, `aria-label`, reduced-motion)은 지난 작업에서 이미 올바르게 갖춰져 있어 추가 수정이 필요 없었다(4절 실측으로 재확인만 함).

## 2. 변경한 파일

```
M  src/store/toastStore.ts        (+24 -2)
A  src/store/toastStore.test.ts   (신규, 15개 테스트)
```

`RewardToastHost.tsx`는 변경하지 않았다 — 최대 개수 제한은 스토어가 `toasts` 배열 자체를 이미 3개로 잘라 내보내므로, 호스트 컴포넌트는 그 배열을 그대로 렌더링만 하면 되고, 접근성 속성도 이미 요구사항을 만족했기 때문이다("필요한 경우에만 최소 범위로 수정" 원칙을 그대로 따름).

### `toastStore.ts`의 두 가지 실제 변경
1. `window.setTimeout(...)` → `setTimeout(...)` (테스트 가능하도록, 런타임 동작 불변)
2. `pushToast`가 새 토스트를 추가한 뒤 `slice(-MAX_VISIBLE_TOASTS)`로 가장 오래된 것부터 잘라내 항상 최대 3개만 유지 (새로 export한 `MAX_VISIBLE_TOASTS = 3` 상수 기준)

퀘스트 보상 금액, 시즌 조건, 포인트 계산, 상점 가격, 구매/착용 로직, 타이머 측정, 데이터 저장 구조는 전혀 건드리지 않았다 — `toastStore.ts`의 공개 API(`pushToast`/`dismissToast`의 시그니처와 `toasts` 데이터 모양)도 그대로다.

## 3. 추가한 테스트 (`src/store/toastStore.test.ts`, 15개)

**작업 1 — 스토어 동작**
- `pushToast` 호출 시 정확히 1개 추가
- 제목/부제목/아이콘/포인트가 손실 없이 저장 (+ 부제목·포인트를 안 넘겼을 때 깔끔히 `undefined`인 것도 확인)
- 같은 밀리초에 20번 연속 호출해도(`Date.now` 고정 모킹) id가 전부 고유
- 3번 연속(cap 이내) 호출해도 전부 유실 없이 순서대로 반영
- `dismissToast`가 지정한 토스트만 제거
- 존재하지 않는 id를 닫아도 예외 없이 다른 토스트에 영향 없음

**작업 2 — 최대 3개 제한**
- `MAX_VISIBLE_TOASTS + 2`개를 넣어도 항상 정확히 3개만 유지
- 4번째 추가 시 가장 오래된 것부터 제거, 최신 3개가 순서대로 유지
- `pushToast`가 아무 값도 반환하지 않음을 확인 — cap이 보상 로직에 개입할 여지가 원천적으로 없음을 명시적으로 보임
- cap이 걸린 상태에서도 수동 닫기·자동 소멸이 정상 동작

**작업 3 — 타이머 안전성 (Vitest fake timer 사용)**
- 지정 시간(3200ms) 이전에는 자동 제거되지 않음
- 정확히 지정 시간이 지나면 자동 제거되고, `vi.getTimerCount()`로 남은 타이머가 0임을 직접 확인(정리 로직을 신뢰하는 게 아니라 실제로 검증)
- 수동으로 이미 닫은 토스트의 타이머가 나중에 실행돼도 예외 없음, 그 사이 추가된 다른 토스트에도 영향 없음
- 모든 fake-timer 테스트는 `afterEach`에서 `vi.clearAllTimers()` + `vi.useRealTimers()`로 정리해 테스트 종료 후 잔여 타이머가 없음
- **"컴포넌트가 사라진 뒤 React state 경고" 관련**: 이 프로젝트의 vitest 환경(`node`)에는 DOM/React 렌더러가 없어 실제 마운트/언마운트를 재현할 수는 없다. 대신 그 우려가 애초에 성립하지 않는 이유를 테스트로 보였다 — `dismissToast`는 항상 Zustand `set()`만 호출하고 React `setState`를 직접 호출하지 않으므로, 어떤 컴포넌트도 구독하고 있지 않은 상태(이 테스트 파일 자체가 그런 상태)에서 타이머가 실행돼도 안전함을 확인했다.

**"localStorage에 저장하지 않음"**
- `useToastStore`에 zustand `persist` 미들웨어의 `.persist` 프로퍼티가 없음을 직접 확인(이 스토어는 애초에 `create()`만 쓰고 `persist()`로 감싸지 않았음 — 이 환경엔 `localStorage` 전역도 없어 그 경로 대신 미들웨어 부착 여부로 검증)

## 4. 접근성 확인 (작업 4 — 실측, 수정 없음)

로컬 dev 서버에서 실제 토스트를 띄워 확인:
- `aria-live="polite"`, `aria-atomic="true"` (컨테이너)
- `role="status"` (토스트 각각)
- 닫기 버튼 `aria-label="알림 닫기"`
- 닫기 버튼 실측 44×44px (`getComputedStyle`)
- `prefers-reduced-motion`: `.animate-toast-in`이 `index.css`의 기존 reduced-motion `@media` 블록에 이미 등록되어 있음을 재확인(변경 없음)

전부 기존 상태 그대로 통과해 추가 수정은 하지 않았다.

## 5. 전체 검증 결과

```bash
npx tsc -b --noEmit      # 통과
npm run lint              # 통과 (0 issues)
npm test -- --run         # 통과 — 469 passed (31 files) — 기존 454 + 신규 15
npm run build              # 통과
npm run validate:assets    # 통과 (exit 0) — whole-avatar 5종(검정머리/사쿠라 유니폼/사쿠라 리본/달빛 아카데미/rainy-study-cafe) 전부 valid,
                            #   baked full-scene 40 valid, 상점 미리보기 9 valid, 기존 미완성 레이어 42개는 "optional planned"로 실패 아님
git diff --check           # 통과 (LF/CRLF 정규화 경고만, 실제 공백 오류 없음)
```

**회귀 확인(실측)**: 로컬 dev 서버에서 실제 일일 퀘스트를 수령해 리팩터링된 스토어로도 토스트("✏️퀘스트 완료! 첫 모험 시작 +2P")가 정상 표시되는 것을 확인했다. `pushToast`/`dismissToast`의 시그니처와 `toasts` 데이터 모양이 그대로라 `DailyQuestCard`/`MoonlightSeasonCard`/`AvatarShop`의 호출부는 손대지 않았다.

## 6. 남은 위험

낮음. `MAX_VISIBLE_TOASTS`를 넘겨 밀려난 토스트의 예약된 `setTimeout`은 여전히 나중에 실행되지만, `dismissToast`가 이미 없는 id를 걸러내는 no-op이라 부작용이 없다(테스트로 확인). 별도 타이머 취소 로직을 추가하지 않은 것은 의도적 — "불필요하게 복잡한 타이머 관리자를 만들지 않는다"는 지침에 따랐다.

## 7. 커밋 해시

로컬에 1개 커밋으로 반영, **push 없음**, 기존 로컬 커밋 reset/amend 없음:

- 커밋 메시지: `test: harden reward toast lifecycle`
- 커밋 해시: 최종 채팅 답변 참고
