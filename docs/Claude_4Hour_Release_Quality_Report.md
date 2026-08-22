# StudyLog 4-Hour Release Quality Sprint — Report

## 1. 시작 시점 Git 상태

- 브랜치: `main`, `origin/main`과 동기화된 상태로 시작 (사용자 진술 기준)
- 시작 HEAD: `3e4c06c test: harden reward toast lifecycle`
- 직전 5개 커밋:
  ```
  3e4c06c test: harden reward toast lifecycle
  31f2939 feat: add illustrated previews for seasonal skins
  db151a8 fix: clarify first study reward flow
  32169b3 feat: add rainy study cafe seasonal skin
  a1e5827 feat: improve StudyLog reward feedback
  ```
- `git status`: clean (작업 시작 전 확인 완료)
- 작업 중 발견된, 이번 세션과 무관한 미추적(untracked) 파일 3건 — 커밋 대상에서 제외:
  `docs/StudyLog_Shop_Economy_Design_v1.0.md`, `docs/StudyLog_Skin_Concept_Catalog_v1.0.md`, `docs/assets/skin-concepts-batch-v1/`

## 2. 분석한 사용자 여정

- 캐릭터 렌더링 경로: Home / Timer(일반·뽀모도로) / Capture-Share / Shop-Preview 4개 화면 모두 `equipped` → `resolveAvatarAppearance` → `WholeAvatarRenderer`(또는 `RoomScene`→`FullSceneRoomRenderer`) 경로로 수렴함을 확인.
- 3개 시즌 스킨(벚꽃 교복 학생 / 달빛 아카데미 / 비 오는 스터디 카페) × 남/여 2종의 `WHOLE_AVATAR_VARIANTS` 우선순위·경로 해석 로직 확인 (`skin-rainy-study-cafe` priority 4000 > `skin-moonlight-academy` 3000 > `skin-sakura-uniform-ribbon` 2000 > `hair-color-black` 100 > `skin-sakura-uniform-girl` 1000).
- 폴백 순서 확인: whole-avatar 이미지 실패 시 매칭된 변형 → 기본 base 이미지 → (그래도 실패 시) 상위 컴포넌트의 SVG 폴백. 상점 미리보기 이미지는 이번 세션 전까지 폴백이 전혀 없었음(§3).
- 상점 → 구매 → 착용 → Home/Timer/Capture에 동일 반영되는 실제 흐름을 로컬 개발 서버(브라우저 자동화)로 라이브 검증.
- 캡처/공유 화면의 테마 잠금(라벤더/달빛/비 오는 카페) 로직을 라이브로 검증.

## 3. 발견한 문제

| # | 문제 | 영향 범위 |
|---|---|---|
| 1 | `toastStore.test.ts`의 "id 충돌 없음" 테스트가 20개를 push한 뒤 store(cap=3)에서 살아남은 마지막 3개 id만 검사 — 실제로는 전체 생성 id의 유일성을 증명하지 못함 | 테스트 신뢰도(실제 런타임 버그 아님) |
| 2 | `pushToast`(실제 3.2초 setTimeout 예약)를 호출하는 다수의 `describe` 블록이 가짜 타이머 없이 실행되어, 테스트 종료 후에도 실제 타이머가 남음 | 테스트 위생(실제 런타임 버그 아님) |
| 3 | `AvatarShop.tsx`의 배너/그리드 썸네일 `<img>`에 `onError` 핸들러가 전혀 없었음 — 이미지 404 시 브라우저 기본 깨진 이미지 아이콘이 그대로 노출됨 | Phase 3-2·Phase 5 요구사항 직접 해당 (신규 발견) |
| 4 | `wholeAvatarSupport.test.ts`에 `rainy-study-cafe`, `sakura-uniform`(+ribbon) 두 스킨은 남/여 전체 상태 커버리지가 있으나 `moonlight-academy`는 테스트가 전무 | Phase 6 "세 스킨 × 남녀 경로" 요구사항 직접 해당 |
| 5 | `captureTheme.test.ts`에 `rainyCafe`의 "보유 시 잠금 해제" 양성 케이스는 있으나 `moonlight`의 동일 양성 케이스는 없음(교차 비잠금 음성 케이스만 존재) | 테스트 커버리지 비대칭 |
| 6 | 상점 이미지에 `loading`/`decoding` 속성이 전혀 없었음 (그리드 썸네일이 뷰포트 밖이어도 즉시 로드) | Phase 5 성능 |

실제 보상/포인트 지급 로직, 퀘스트 조건, 시즌 보상 조건, 상점 가격 등 Golden Rules로 보호된 영역에서는 문제를 발견하지 못함.

## 4. 수정한 문제

1. **토스트 ID 유일성 증명 강화** (`src/store/toastStore.ts`): `generateToastId()`를 순수 함수로 분리, 모듈 스코프의 단조 증가 카운터(`toastIdSequence`)를 유일성의 근거로 삼음(시각/난수 충돌과 무관하게 항상 유일). `toastStore.test.ts`에 10,000회 샘플링 테스트 + `Date.now`/`Math.random`을 동일 값으로 고정한 상태에서도 500개가 모두 유일함을 증명하는 결정론적 테스트 추가.
2. **타이머 격리** (`toastStore.test.ts`): 파일 전역 `beforeEach`에서 `vi.useFakeTimers()`, `afterEach`에서 `vi.clearAllTimers()`/`vi.useRealTimers()` — 모든 테스트가 가짜 타이머 위에서 실행되어 실제 타이머 누수 제거. cap(3)으로 축출된 토스트의 예약 타이머가 나중에 발화해도 다른 토스트에 영향 없음을 검증하는 테스트 추가.
3. **상점 미리보기 이미지 폴백** (`shopPreviewAssets.ts`, `AvatarShop.tsx`): `resolveShopPreviewBanner`(배너→썸네일→없음)와 `resolveShopPreviewThumbnail`(썸네일→없음) 순수 함수 신설. `AvatarShop.tsx`에 URL 키 기반 `failedImages` 상태와 `onError` 핸들러를 연결 — 실패 시 깨진 이미지 아이콘 대신 다음 폴백 단계로, 최종적으로는 아무것도 렌더링하지 않고 이미 화면에 있는 `CharacterView` 미리보기로 자연스럽게 대체됨. 새 이미지를 만들지 않음, 라이브러리 추가 없음.
4. **moonlight-academy 경로 테스트 커버리지 추가** (`wholeAvatarSupport.test.ts`): `rainy-study-cafe` 블록과 동일한 구조로 남/여 `ALL_STATES` 전체 해석 경로 + `isWholeAvatarItemSupportedForGender` 양성 테스트 추가.
5. **캡처 테마 소유권 테스트 대칭화** (`captureTheme.test.ts`): `moonlight` 테마의 "보유 시에만 잠금 해제" 양성 케이스 추가(기존에는 `rainyCafe`만 있었음).
6. **이미지 로딩 성능** (`WholeAvatarRenderer.tsx`, `FullSceneRoomRenderer.tsx`, `AvatarShop.tsx`): 캐릭터/씬 렌더러 `<img>`에 `decoding="async"` 추가(항상 즉시 보이는 이미지이므로 `loading="lazy"`는 적용하지 않음). 상점 그리드의 화면 밖일 수 있는 썸네일에만 `loading="lazy"` + `decoding="async"` 추가(배너·캐릭터 미리보기는 열릴 때 즉시 보이므로 제외).

## 5. 수정하지 않은 문제와 이유

- **`public/sprites/room/default-night/background.png` (708KB PNG)**: 유일하게 300KB를 넘는 자산. 그러나 이는 3개 시즌 스킨과 무관한 레거시 레이어드 룸 배경이며, Golden Rules("기존 WebP 재압축 금지, 원본 이미지 삭제 금지")와 "명확한 몇 줄짜리 개선만" 지침에 따라 이미지 자체를 재인코딩하는 작업은 범위 밖으로 판단해 보류.
- **상점 배너/썸네일이 실제로 깨지는 사례 재현 불가**: 라이브 확인 결과 3개 스킨의 배너·썸네일 6개 자산 모두 200 OK — 즉 오늘 시점에는 실제로 깨진 이미지가 발생하지 않음. §4-3의 수정은 향후 자산 누락/배포 실수에 대한 방어 코드로 유지.
- **모바일 320×568 뷰포트 라이브 스크린샷 미실시**: 이 세션의 Browser pane이 컴포지팅이 불가능한(화면 비표시) 상태였음이 확인되어, 픽셀 단위 스크린샷 대신 DOM 구조·`scrollWidth`/`clientWidth`·이미지 로드 상태를 JS 실행으로 직접 검증하는 방식으로 대체함(375×812에서 수행). 320×568/390×844/430×932 각각에 대한 픽셀 단위 육안 검증은 수행하지 못했음 — 컴포넌트가 반응형 Tailwind 클래스만 사용하고 고정 px 레이아웃이 없음을 코드 리뷰로 확인했으나, 완전한 대체 증명은 아님.

## 6. 변경된 파일

```
src/store/toastStore.ts
src/store/toastStore.test.ts
src/components/shop/shopPreviewAssets.ts
src/components/shop/shopPreviewAssets.test.ts
src/components/shop/AvatarShop.tsx
src/character/engine/WholeAvatarRenderer.tsx
src/character/room/FullSceneRoomRenderer.tsx
src/character/engine/wholeAvatarSupport.test.ts
src/utils/captureTheme.test.ts
```
새 파일 없음 (`docs/Claude_4Hour_Release_Quality_Report.md` 본 문서 제외). 삭제 없음. 신규 의존성 없음.

## 7. 추가한 테스트

- `toastStore.test.ts`: `generateToastId` 유일성(10,000 샘플 + 값 고정 결정론적 500 샘플 + 타입 검증) 3건, cap으로 축출된 토스트의 지연 타이머 안전성 1건 — 파일 전체 19 tests.
- `shopPreviewAssets.test.ts`: `resolveShopPreviewBanner` 폴백 체인 4×3+1건, `resolveShopPreviewThumbnail` 2×3+1건 — 파일 전체 20 tests.
- `wholeAvatarSupport.test.ts`: moonlight-academy 남/여 전체 상태(13개 상태×2) + 등록·지원 확인 5개 테스트 블록 — 파일 전체 118 tests.
- `captureTheme.test.ts`: moonlight 양성 잠금 해제 케이스 1건 — 파일 전체 4 tests.

## 8. 모바일 뷰포트 QA 결과 (375×812 기준 라이브 검증)

- 첫 사용자 흐름: 과목 존재/공부 세션 기록 상태에서 오늘의 모험 카드가 `1/3 완료, 12P 중 2P 보유`로 정확히 표시됨. 콘솔 에러 없음(Vite HMR WebSocket 경고 1건은 dev 서버 고유의 무해한 잡음).
- 상점: 카드 3개 모두 정상 렌더, `가로 스크롤 없음`(scrollWidth === clientWidth === 375). 미리보기 클릭 시 배너(960px, informative alt) + 솔로 캐릭터 미리보기 정상 로드. 잔액 부족(2P/120P) 시 구매 버튼이 `disabled`로 원천 차단(별도 에러 토스트 없이 자연스러운 방지 — `min-h-[44px]` 터치 타깃 유지).
- 구매→착용 흐름(테스트용으로 로컬 포인트 500P 임시 부여 후 검증): 구매 시 502P→382P(120P 차감) 정확, `내 옷장 (0)→(1)` 즉시 갱신, 버튼이 `구매하기`→`✓ 착용중`(아이콘+텍스트)로 즉시 전환, 재구매 버튼 소멸(중복 구매 불가 확인). 착용 해제 클릭 시 `role="status"` 토스트가 정확히 1개, `🌸 착용 해제 · 벚꽃 교복 학생`으로 즉시 표시됨.
- 캡처/공유: 정사각형/9:16 토글, 라벤더(항상 가능)/달빛(잠김, "스킨 필요")/비 오는 카페(잠김, "스킨 필요") 정확히 표시. 벚꽃 스킨만 보유한 상태에서 달빛·비 오는 카페 모두 잠김 유지(교차 스킨 오해금 확인). 가로 스크롤 없음.

## 9. 최종 검증 결과

| 항목 | 명령 | 결과 |
|---|---|---|
| 전체 테스트 | `npm test -- --run` | **519 passed** (31 files) |
| 타입 검사 | `npx tsc -b --noEmit` | 0 errors |
| 린트 | `npm run lint` | 0 issues (oxlint) |
| 프로덕션 빌드 | `npm run build` | 성공 (5.37s) |
| 자산 검증 | `npm run validate:assets` | "All production assets are valid." (3개 시즌 스킨 whole-avatar 208개씩, room scene 40개, shop preview 9개 모두 valid; 42개는 사전부터 미배포 상태인 선택적 레이어 자산으로 이번 변경과 무관) |
| 공백 검사 | `git diff --check` | 통과 (LF/CRLF 줄바꿈 경고만, 오류 없음) |

콘솔 에러: 없음(HMR WebSocket 경고 제외). 가로 스크롤: 없음. 기존 기능 삭제: 없음. 신규 의존성: 없음. 임시 캡처/이미지 파일 잔여물: 없음(작업 디렉터리 확인 완료).

## 10. 남은 리스크

- Phase 3-3의 "3 스킨 × 2 성별 × 4 상태 × 4 화면" 전수 매트릭스는 순수 함수 테스트(§7)로 대부분 커버했으나, Home/Timer/Capture-Share 3개 화면에 대한 라이브 스크린샷 육안 대조는 이번 세션에서 수행하지 못함(컴포지팅 불가 환경).
- `default-night/background.png`(708KB)는 성능 관점에서 여전히 무거운 편이나, 원본 자산 편집은 이번 세션 범위(코드 몇 줄 수정) 밖으로 남겨둠.
- 320×568/390×844/430×932 세 뷰포트는 반응형 클래스 검토로 간접 확인했을 뿐, 375×812처럼 직접 라이브 검증하지 못함.

## 11. 생성한 커밋

(아래 커밋은 이 보고서 작성 직후 순서대로 생성 예정 — push는 하지 않음)

1. `test: isolate reward toast lifecycle` — `src/store/toastStore.ts`, `src/store/toastStore.test.ts`
2. `fix: harden seasonal skin preview fallbacks` — `src/components/shop/shopPreviewAssets.ts`, `src/components/shop/shopPreviewAssets.test.ts`, `src/components/shop/AvatarShop.tsx`, `src/character/engine/WholeAvatarRenderer.tsx`, `src/character/room/FullSceneRoomRenderer.tsx`
3. `test: close moonlight-academy and capture theme coverage gaps` — `src/character/engine/wholeAvatarSupport.test.ts`, `src/utils/captureTheme.test.ts`

## 12. 다음 단계 제안 (최대 3개)

1. Browser pane이 정상적으로 화면에 표시되는 환경에서 320/375/390/430px 4개 뷰포트에 대한 실제 스크린샷 육안 검증을 한 차례 더 수행해, 이번에 DOM 기반으로만 확인한 항목들을 시각적으로 재확인할 것.
2. `default-night/background.png`를 별도 작업으로 WebP 재인코딩(원본은 보존)하면 룸 관련 초기 로드 용량을 눈에 띄게 줄일 수 있음.
3. 상점 미리보기 이미지의 실제 404 폴백 동작(§4-3)은 코드·단위 테스트로만 검증됨 — 스테이징 환경에서 의도적으로 자산 하나를 잘못된 경로로 배포해 폴백 체인이 실제로 작동하는지 1회성으로 확인해볼 것.
