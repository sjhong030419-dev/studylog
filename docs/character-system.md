# StudyLog 캐릭터 디자인 시스템

**상태:** 확정 스펙 (Official Design System v1.0 레퍼런스 시트 반영) — 이후 모든 캐릭터 관련 작업(디자인, 구현, 리뷰)은 이 문서를 기준으로 한다.
**적용 범위:** 앱 전체 (홈 화면, 스터디룸, 캡처, 마이페이지, 상점)

이 문서는 기존 도트 캐릭터(`DotAvatar`)와 1차 치비 SVG 캐릭터(`ChibiAvatar`)를 모두 대체하는 새로운 캐릭터 시스템의 스펙이다. 두 레거시 구현은 이 문서의 방향과 다르므로 새 스펙 기준으로 재설계한다.

> 일부 항목(작은 라벨 텍스트)은 사용자가 제공한 레퍼런스 시트 이미지에서 옮겨 적은 것으로, 해상도상 완전히 정확하지 않을 수 있다. 실제 제작 시 원본 파일로 재확인이 필요하다.

---

## 1. 캐릭터 디자인 철학

캐릭터는 단순 UI 요소가 아니라 브랜드를 대표하는 핵심 자산이다. 통계가 주인공이 아니고, 타이머가 주인공이 아니다. **캐릭터가 주인공이다.** 사용자가 앱을 켜는 이유는 "오늘 몇 시간 공부했는지"가 아니라 "내 캐릭터를 만나기 위해서"여야 한다.

**브랜드 키워드:** Cute, Warm, Cozy, Study, Pixel Inspired, Healing, Growth, Friendly
**브랜드 필링:** 남/여 캐릭터가 함께 있는 모습으로 대표되며, "오늘도 함께, 성장하자!"를 톤앤매너로 삼는다.

## 2. 비주얼 스타일

- **스타일 정의:** 순수 픽셀아트도 일반 일러스트도 아닌 "고해상도 Pixel Illustration" — 픽셀 감성 + 현대적 해상도
- **레퍼런스:** Nintendo, Animal Crossing, Pokémon, Stardew Valley, MapleStory Worlds — Cozy Game 톤
- 셀 셰이딩 중심, Gradient 최소화, 제한된 색상 팔레트

### 금지 사항 / 제작 규칙 체크리스트

- 매끈한 벡터 느낌 금지
- AI 특유의 피부 질감 금지
- 지나치게 거친 16x16 픽셀 금지
- 검정 외곽선 금지 (외곽선은 짙은 갈색으로 통일)
- Emoji 스타일 금지
- Flat Icon 스타일 금지
- 성인 비율 금지
- 현실적인 얼굴 금지
- 차가운 색감 금지, 어두운/차가운 톤 금지
- 반짝이는 파스텔 색감 유지
- 얇은 선 / 부드러운 실루엣 유지
- 픽셀 감성 유지
- 과도한 디테일 추가 금지
- 검은색 비율 최소화

## 3. 캐릭터 형태

- 치비 캐릭터, 약 2.5~3등신, 큰 머리·작은 몸·둥근 얼굴·큰 눈·짧은 팔다리
- 기본 캐릭터 2종 — **Boy(남학생) / Girl(여학생)** — 동일 디자인 언어에서 헤어스타일·얼굴 디테일·체형만 차이
- 캐릭터 설정: 고등학생, 긍정적·성실함·호기심 많은 성격, 공부·책·고양이·따뜻한 음료를 좋아함, 목표는 "함께 성장해서 더 나은 내일을 만들기"

### 얼굴

- 둥근 얼굴, 큰 눈, 작은 코/입, 볼터치
- 갈색 눈동자 + 하이라이트, 부드러운 눈썹

### 헤어

- 브라운, 앞머리, 둥근 실루엣 (날카로운 실루엣 금지)
- Girl은 머리 액세서리(리본/핀) 착용 가능

### 기본 의상

- 보라색 후드티(크게), 베이지 바지, 흰 운동화

### 외곽선

- 짙은 갈색, 굵기 일정

### 캐릭터 턴어라운드

Boy/Girl 각각 4방향 원화가 필요: **FRONT / SIDE / BACK / 3-4 VIEW**

### 표정 (얼굴 12종, Boy/Girl 각각)

기본, 웃음, 행복, 수줍음, 집중, 생각, 당황, 졸림, 놀람, 슬픔, 뿌듯, 결의

## 4. 컬러 팔레트

**메인 컬러:** `#8E68FF`(라벤더), `#CD86FF`, `#FFF1DA`(크림), `#FFE4B6`, `#E7CBA1`(베이지), `#B8C651`, `#A67C58`(브라운), `#5B3F2B`(진갈색/외곽선), `#FFFFFF`
**포인트 컬러:** `#FFB6C1`(파스텔 핑크), `#A7D7FF`(스카이블루), `#BEE7C6`(민트), `#FFD98A`, `#FFAE76`

라벤더, 파스텔 핑크, 민트, 크림, 스카이블루, 브라운, 베이지 — **채도 높은 색 금지**

> 위 HEX 값은 레퍼런스 시트에서 옮겨 적은 근사치이며, 실제 에셋 제작 시 원본 팔레트로 재확인 필요.

## 5. 캐릭터 상태 (State Machine)

```
Idle · Study · Thinking · Reading · Typing · Break · Sleep
Happy · Excited · Celebrate · Level Up · Focused
```

### 스프라이트 시트 — 상태별 애니메이션 프레임 수 (Boy/Girl 각각)

| 상태 | 프레임 수 | 내용 |
|---|---|---|
| Idle | 8 | 숨쉬기, 눈 깜빡임, 후드 흔들림 |
| Study | 10 | 연필 쓰기, 고개/눈 움직임 |
| Walk | 8 | 걷기 |
| Sleep | 8 | 꾸벅꾸벅, Zzz |
| Happy | 10 | 점프, 손 흔들기, 웃기 |
| Celebrate | 12 | 별/컨페티/빛 효과 |
| Thinking | 6 | 생각하는 동작 |
| Blink | 2 | 눈 깜빡임 (다른 상태에 합성) |

모든 애니메이션은 루프 형태로 자연스럽게 연결된다. 프레임 뷰(각도)는 상황에 따라 조정될 수 있다.

### 포즈 레퍼런스 (책상 기반, Boy/Girl 각각)

기본(앉기), 공부하기, 독서하기, 타이핑, 휴식하기, 음료 마시기

## 6. 캐릭터 성장 시스템 (레벨 연동 환경)

캐릭터 자체보다 **"주변 환경(방)"이 레벨에 따라 성장**하는 구조. 레벨이 올라갈수록 환경이 성장하며 공부가 즐거워지는 것이 목적.

| 레벨 | 추가/변경 요소 |
|---|---|
| Lv1 | 시작의 책상 (기본 책상) |
| Lv10 | 식물 추가 |
| Lv20 | 고양이 등장 |
| Lv30 | 의자 업그레이드 |
| Lv40 | 책 증가 |
| Lv50 | 듀얼 모니터 |
| Lv70 | 창문과 커튼 |
| Lv100 | Premium Study Room |

> 레퍼런스 시트의 성장 단계 이미지는 Lv1/10/20/30/50/70/100 7단계만 보여주며 Lv40 단계가 별도 이미지로 구분되지 않았다. 실제 구현 시 8단계 그대로 갈지, 7단계로 통합할지 확인 필요.

### 악세서리 / 소품 (상점 연동)

**소지·장착형:** 책, 노트, 연필, 텀블러, 아이스커피, 스탠드, 시계, 식물(소), 식물(대), 고양이, 헤드폰, 안경, 백팩, 포스트잇, 태블릿, 모자

**스터디룸 에셋팩 (환경 오브젝트):** 책상, 의자, 책장, 스탠드, 노트북, 모니터, 러그, 액자, 시계, 책, 화이트보드, 사이드테이블

## 7. 배치 규칙

캐릭터는 홈 화면 세로 공간의 **40~50%**를 차지해야 하고, 통계보다 먼저 시야에 들어와야 한다.

## 8. UI 디자인 시스템 요소 (레퍼런스 시트 포함 내용)

- **버튼:** PRIMARY / PRESSED / DISABLED 3가지 상태, 둥근 모서리, 보라색 계열
- **카드:** "오늘의 공부" 카드 — 캐릭터 아이콘 + 시간(예: 08:24:15) + 목표(예: 10:00:00)
- **뱃지:** 첫 기록 / 7일 연속 / 30시간 / 100시간 등 성취 메달
- **경험치 바:** Lv.24, EXP 2,450 / 4,000 형태의 진행률 바
- **레벨업 이펙트:** "LEVEL UP!" 팝업 + 별 이펙트
- **아이콘 세트:** 카메라/사진, 친구, 메달, 하트, 선물, 설정 등 동일 화풍의 일반 UI 아이콘

## 9. 파일 스펙 (에셋 제작 규격)

- **파일 형식:** PNG (투명 배경)
- **캔버스 해상도:** 2048 x 2048
- **사용 해상도:** 1024 / 512 / 256 / 128 (지원 픽셀 밀도 — 뷰포트 배율(1x/2x/3x)에 맞춰 선택)
- **색상 모드:** RGB
- **프레임 속도:** 상태별로 다르며, 실제 구현값(`src/character/types.ts` `STATE_FPS`)은 4~12 FPS 범위다 — 이전 버전의 "12~24 FPS" 표기는 실제 구현과 달라 정정한다. 상태별 값은 §5 프레임 표와 함께 관리된다.
- **파일명 규칙:** 레이어별로 다르며 전부 `src/character/engine/spriteManifest.ts`가 중앙에서 관리한다 — §12 참고. 몸/얼굴은 `(gender)_(action)_(frame).png`(예: `boy_study_01.png`), 코스튬(헤어/의상/액세서리)은 `(assetKey)_(frame).png`(예: `ribbon_01.png`), 상태 이펙트는 `(action)_(frame).png`(예: `sleep_01.png`).
- **앵커 위치(배치 기준점):** 캐릭터는 씬 컨테이너 기준 `top: 3%`, 가로 중앙 정렬(`left: 50%`, `translateX(-50%)`), 너비는 컨테이너의 58% (`RoomScene.tsx` 기준). 실제 스프라이트로 교체해도 이 배치 규칙은 유지되어야 하며, 캔버스 내에서 캐릭터가 프레임 중앙 하단에 정렬되어 있어야 이 배치값이 그대로 맞는다.
- **폴백(fallback) 동작:** ① 상태별 아트가 없으면 `idle`로 대체 렌더링한다(`STATE_HAS_ART`, 현재는 12개 상태 전부 `true`). ② 알 수 없거나 아직 카탈로그에 없는 코스튬 아이템 ID는 조용히 무시하고 렌더링을 깨뜨리지 않는다(`resolveCatalogEntries`). 실제 아트로 전환한 뒤에도 이 두 폴백 규칙은 그대로 유지해야 한다.

> 이 스펙은 실제 픽셀 일러스트 PNG 스프라이트 자산의 존재를 전제로 한다. 현재 프로젝트에는 이런 이미지 에셋이 없고 전부 코드(SVG/CSS)로 그려져 있었다 — 엔진/구현 설계 시 이 점을 반드시 반영해야 한다 (아래 "설계 제안"의 공개 이슈 참고).

## 10. 설계 제안 — 실제 아트 자산 교체 경계 (구현 완료, 실제 이미지는 여전히 없음)

**현재 상태 (다시 한번 명확히):** 지금 화면에 보이는 캐릭터는 전부 `src/character/fallback/ChibiFallbackArt.tsx`의 SVG 코드로 그려진 placeholder다. 이 문서의 §9/§12 파일 스펙을 만족하는 실제 PNG/스프라이트 에셋은 **여전히 하나도 존재하지 않는다** (`public/sprites/avatar/` 각 폴더는 `.gitkeep`만 있는 빈 폴더). 이번 단계에서 만든 건 "실제 이미지가 들어오면 즉시 작동하는 렌더링 구조"이지, 실제 이미지 자체가 아니다. 어떤 보고서에서도 이 SVG를 "최종 프로덕션 아트"로 표현해서는 안 된다.

**실제 아트 자산을 넣을 때 건드릴 곳은 정확히 한 곳이다 — 이제 실제로 구현되어 작동한다.**

- 앱 전체에서 캐릭터를 그리는 진입점은 `src/character/components/CharacterView.tsx` 하나뿐이다. 타이머, 스터디룸, 마이페이지, 상점, 캡처 카드, 온보딩, 뽀모도로 전부 이 컴포넌트를 `state`/`gender`/`appearance`/`size` props로만 호출하며, 내부 렌더링 방식(SVG인지 PNG 스프라이트인지)을 전혀 알지 못한다.
- `src/character/engine/spriteAssetMap.ts`의 `SPRITE_ASSETS_AVAILABLE` 플래그가 유일한 스위치다. `CharacterView.tsx`는 이미 이 플래그로 분기하도록 구현되어 있다 — `false`(현재)면 `ChibiFallbackArt`, `true`면 `src/character/engine/PixelSpriteRenderer.tsx`를 렌더링한다. 실제 배포 시 필요한 작업은 §13의 파일 목록을 `public/sprites/avatar/`에 채운 뒤 이 플래그 한 줄만 `true`로 바꾸는 것뿐이다.
- `PixelSpriteRenderer`는 각 레이어를 개별 `<img onError>`로 그려서, 만약 파일이 실제로 없거나 깨져 있어도 브라우저 기본 "깨진 이미지" 아이콘이 노출되지 않는다 — 코스튬/이펙트 레이어가 실패하면 그 레이어만 조용히 빠지고, 필수인 `base` 레이어가 실패하면 그 즉시 `CharacterView`가 `ChibiFallbackArt`로 자동 전환한다(`onBaseLayerError` 콜백). 이 폴백은 실제 이미지가 부분적으로만 준비된 과도기에도 캐릭터가 절대 깨져 보이지 않도록 하기 위함이다.
- 이 교체 작업은 `Timer`, `characterStateMachine`, `profileStore`, `AvatarShop`, `RoomScene`, `LogCaptureCard`, `OnboardingFlow` 어느 파일도 수정할 필요가 없다 — 전부 `CharacterView`/`RoomScene`을 통해서만 캐릭터를 소비하기 때문이다. 실제로 이번 단계에서 이 파일들 중 어느 것도 캐릭터 렌더링 방식 때문에 변경되지 않았다.

**코스튬 슬롯도 같은 이유로 확장 가능하다 (변경 없음).**

- `src/character/catalog/types.ts`의 `CharacterSlot`은 19개 고정 슬롯(예: `top`, `onePiece`, `hairFront`, `headAccessory` 등)을 정의하고, 각 상점 아이템은 `character/catalog/items.ts`에서 이 슬롯 중 하나에 데이터로 매핑된다. 렌더러(`ChibiFallbackArt`도, 새 `PixelSpriteRenderer`도)는 아이템 ID를 직접 분기하지 않고 슬롯이 매핑된 레이어의 `zIndex`/렌더 순서로만 그린다.
- `top`(상의)과 `onePiece`(원피스)는 서로 다른 슬롯이라 동시 장착 시 상호 배제(`incompatibleItemIds`)로 처리되며, 새 의상 카테고리가 추가되어도 `CharacterSlot`에 슬롯 하나를 추가하고 `SLOT_TO_LAYER`(§12)에 매핑 한 줄을 추가하는 것으로 끝난다 — 렌더러에 새 `if` 분기가 필요 없다.

**알려진 갭 (이번 단계에서 의도적으로 손대지 않음):** `src/components/room/SeatRoom.tsx`의 스터디룸 좌석은 실시간 Supabase presence로 다른 사용자의 성별/상태만 받고, 장착한 코스튬(`equippedAssetIds`)은 받지 않는다 — 내 좌석은 이번에 로컬 `useMyAvatarAppearance()`를 연결해 고쳤지만, 다른 사용자의 좌석은 presence payload 구조 자체를 확장해야 해서 "Supabase/저장 데이터 구조를 불필요하게 바꾸지 않는다"는 이번 작업의 제약과 충돌한다. 다른 사용자는 여전히 기본 프리셋 색상으로만 보인다.

**결론:** 실제 캐릭터 아트가 준비되면 `spriteAssetMap.ts`의 플래그 전환 하나만으로 교체가 끝난다 — 이 경계는 실제로 검증되었다(§14 검증 결과 참고).

## 11. MVP 최소 캐릭터 에셋 세트 (현재 구현 기준 확인)

실제 프로덕션 아트를 제작할 때 최소한 아래 세트를 채워야 기존 기능이 전부 동작한다. 아래 목록은 이미 코드에서 실제로 도달 가능한(트리거되는) 상태/코스튬만 대상으로 하며, 실제 데이터 없이 만들어진 항목은 없다.

**필수 상태 (실제 트리거 조건, `characterStateMachine.ts` 기준):**

| 상태 | CharacterState | 트리거 |
|---|---|---|
| Idle | `idle` | 기본값 |
| Studying/writing | `study` | 타이머 진행 중 |
| Break/paused | `break` | 타이머 일시정지 |
| Sleepy | `sleep` | 연속 집중 50분 초과 (실제 경과시간 기반) |
| Away/distracted | `away` | 화면 이탈 감지 |
| Happy/session complete | `happy` | 실제 기록이 있는 세션 종료 직후 |
| Level up | `levelUp` | 실제 누적 Study XP가 레벨 경계를 넘는 순간 |

**필수 코스튬 (현재 상점 카탈로그 기준, `character/catalog/items.ts` + `store/shopStore.ts`):**

| 요구 항목 | 현재 보유 |
|---|---|
| 의상 3종 | outfit-blue, outfit-pink(원피스), outfit-gold |
| 헤어/머리 액세서리 3종 | hair-ribbon, hair-straw, hair-cap |
| 안경 | acc-glasses |
| 헤드폰 | acc-headphone |
| 소품 1종 | acc-necklace |
| 스터디룸 배경 3종 | bg-sky, bg-night, bg-sakura |

현재 상점 구성이 이 최소 세트를 정확히 충족한다 — 이번 단계에서 새 카탈로그 항목을 추가하지 않았다.

## 12. 레이어 구조와 파일 폴더 (구현 완료: `src/character/engine/spriteManifest.ts`)

캐릭터는 하나의 고정 이미지가 아니라 **10개의 독립적으로 확장 가능한 렌더 레이어**(뒤→앞)로 그린다. 이 순서와 슬롯→레이어 매핑은 `spriteManifest.ts` 한 곳에서만 관리하며, 컴포넌트 어디에도 레이어 순서나 파일 경로를 직접 적지 않는다.

**레이어 순서 (뒤 → 앞):** `base`(몸/신체 베이스) → `skin`(피부) → `eyes`(눈) → `mouth`(입/표정) → `hairBack`(뒷머리) → `outfit`(의상) → `hairFront`(앞머리) → `accessory`(액세서리) → `handheld`(손에 든 아이템) → `stateEffect`(상태 이펙트)

**19개 코스튬 슬롯(§10, 변경 없음) → 10개 레이어 매핑:**

| 슬롯 | 레이어 |
|---|---|
| bodyBase | base |
| skin | skin |
| hairBack | hairBack |
| face, eyes, eyebrows | eyes |
| mouth, blush | mouth |
| bottom, shoes, top, onePiece, outerwear | outfit |
| hairFront | hairFront |
| faceAccessory, headAccessory, backAccessory | accessory |
| handheld | handheld |
| stateEffect | stateEffect |

**실제 파일이 놓이는 6개 폴더** (`public/sprites/avatar/`, 이번 단계에서 실제로 생성함 — 전부 빈 폴더, `.gitkeep`만 있음):

```
public/sprites/avatar/
  base/       -- 몸/피부 (base, skin 레이어)
  face/       -- 눈/입/표정 (eyes, mouth 레이어)
  hair/       -- 뒷머리 + 앞머리 (hairBack, hairFront 레이어 — 파일명으로 구분)
  outfit/     -- 의상 (outfit 레이어)
  accessory/  -- 액세서리 + 손에 든 아이템 (accessory, handheld 레이어)
  effects/    -- 상태 이펙트 (stateEffect 레이어)
```

**파일명 규칙 (레이어별, `spriteManifest.ts`의 `resolve*Path` 함수가 실제로 구현):**

- `base/(gender)_(state)_(frame).png`, `face/(gender)_(state)_(frame).png` — 상태별 애니메이션, §5 프레임 표 그대로
- `hair|outfit|accessory/(assetKey)_(frame).png` — 코스튬 1종당 파일 1장(기본), `assetKey`는 `character/catalog/items.ts`의 기존 값 그대로 재사용 (예: `ribbon_01.png`)
- `effects/(state)_(frame).png` — 성별 무관, 상태 이펙트 공용

## 13. 지금 당장 필요한 이미지 목록 (§11 최소 세트 기준, 실제 코드의 프레임 수 그대로 계산)

§11의 실제로 트리거되는 7개 상태(idle/study/break/sleep/away/happy/levelUp)만 채우면 기존 기능이 전부 정상 동작한다. 프레임 수는 `src/character/types.ts`의 `STATE_FRAME_COUNT`를 그대로 사용:

| 상태 | 프레임 수 | base(성별×2) | face(성별×2) | effects(성별 무관) |
|---|---:|---:|---:|---:|
| idle | 8 | 16 | 16 | 8 |
| study | 10 | 20 | 20 | 10 |
| break | 4 | 8 | 8 | 4 |
| sleep | 8 | 16 | 16 | 8 |
| away | 4 | 8 | 8 | 4 |
| happy | 10 | 20 | 20 | 10 |
| levelUp | 12 | 24 | 24 | 12 |
| **합계** | **56** | **112장** | **112장** | **56장** |

**+ 코스튬 9장** (현재 상점 아이템과 1:1, 각 1프레임): `ribbon`, `strawHat`, `cap`(hair/) · `hoodie`, `dress`(outfit/ — `hoodie`는 outfit-blue/outfit-gold가 공유) · `glasses`, `headphones`, `necklace`(accessory/)

**MVP 최소 합계: 112 + 112 + 56 + 9 = 289장.** 나머지 6개 상태(thinking/reading/typing/excited/celebrate/focused)는 §11 기준 아직 실제 트리거가 없어(또는 `STATE_HAS_ART`가 이미 안전한 SVG 폴백을 제공하고 있어) 이번 최소 세트에는 포함하지 않았다 — 전부 채우면 §5 프레임 표 기준 상태 13개 × 성별 2 × (base+face) + 이펙트가 더 필요하다.
