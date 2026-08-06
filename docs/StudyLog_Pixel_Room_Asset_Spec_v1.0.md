# StudyLog 픽셀 스터디룸 에셋 스펙 v1.0

## 0. 공식 레퍼런스

- **파일**: [docs/assets/study-room-approved-v1.png](assets/study-room-approved-v1.png)
- **승인 커밋**: `06adca8 docs: approve StudyLog pixel study room concept`
- **원본 규격**: 1254×1254px PNG (알파 없음)

이 이미지는 **하나로 합쳐진 완성 일러스트**이며 레이어별로 분리된 파일이 아니다. 이 문서가 정의하는 15개 레이어(§2, §4의 `desk-front-study` 포함)는 이 이미지를 참고해 향후 실제로 제작해야 할 자산 목록이지, 이미 존재하는 파일이 아니다. 지금 이 문서를 쓰는 시점에는 `public/sprites/room/` 아래에 실제 파일이 **단 하나도 없다** — 코드 쪽 렌더링 구조(`src/character/room/PixelRoomRenderer.tsx`, `roomAssetManifest.ts`, `roomThemeSupport.ts`)만 미리 준비되어 있고, 전부 비활성 상태다(§8 참고).

**절대 규칙**: 이 확정 이미지 전체를 배경 이미지 하나로 앱에 그대로 사용하지 않는다. 이미지 안에 캐릭터가 고정으로 그려져 있어 기존 `CharacterView`(성별/상태/커스터마이징 전환)와 중복·충돌하기 때문이다. 반드시 배경/소품/책상/캐릭터를 분리된 레이어로 제작한다.

## 1. 캔버스 규격

| 항목 | 값 |
|---|---|
| 기준 캔버스 | 640 × 800 px |
| 화면 비율 | 4:5 |
| 포맷 | RGBA PNG (투명 배경) |
| 표시 배율 | 0.5배 축소 시 320×400로 표시 가능 |
| 렌더링 | `image-rendering: pixelated` |

640×800은 기존 SVG 방(`LegacySvgRoomRenderer`의 `viewBox="0 0 320 400"`)과 **정확히 같은 4:5 비율의 2배 해상도**다 — 캔버스를 새로 설계한 게 아니라 기존 비율을 그대로 2배 확대한 것이므로, 두 렌더러 사이를 전환해도 카드 레이아웃이 흔들리지 않는다 (`src/character/room/roomAssetManifest.test.ts`의 "4:5 aspect ratio" 테스트로 고정됨).

## 2. 레이어 목록과 z-index

렌더 순서는 6단계다: **배경 → 후면 소품 → 캐릭터 → 책상과 공부 도구 → 전경 소품 → 조명과 상태 효과**. 캐릭터는 파일이 아니라 `CharacterView` 컴포넌트이며, 고정 z-index `20`(`ROOM_CHARACTER_Z_INDEX`)을 기준으로 다른 모든 레이어가 상대적으로 배치된다.

| id | group | z-index | 파일명 | 역할 |
|---|---|---:|---|---|
| background | background | 0 | `background.png` | 벽지, 벽 자체의 베이스 색/패턴 |
| rug | behindCharacter | 9 | `rug.png` | 바닥 러그 (책상보다 뒤, 캐릭터 발밑) |
| window-night | behindCharacter | 10 | `window-night.png` | 밤 창문 + 달 + 마을 실루엣 |
| shelf | behindCharacter | 11 | `shelf.png` | 벽 선반 + 책 + 화분 (캐릭터 뒤) |
| desk-back | behindCharacter | 12 | `desk-back.png` | 의자 등받이 등 캐릭터 바로 뒤의 가구 실루엣 |
| **(캐릭터)** | — | **20** | `CharacterView` | 실제 렌더링되는 동적 캐릭터 (파일 아님) |
| desk-front | deskFront | 30 | `desk-front.png` | 책상 앞면 — `idle`/`sleep`/`happy` 등 study를 제외한 모든 상태에서 사용. 캐릭터 하반신(서 있는 다리)을 가려 "의자에 앉아있다"는 착시를 만드는 역할까지 겸한다 (§3-1 참고) |
| desk-front-study | deskFront | 29 | `desk-front-study.png` | `study` 상태 전용 책상 앞면 — 캐릭터 자산 자체에 이미 책상/책/연필이 그려져 있으므로(§4), 이중 책상을 막기 위한 별도 변형 |
| lamp | deskFront | 31 | `lamp.png` | 책상 스탠드 램프 본체 |
| books | deskFront | 32 | `books.png` | 책상 위에 쌓인 책 |
| mug | deskFront | 33 | `mug.png` | 머그컵 |
| stationery | deskFront | 34 | `stationery.png` | 펜꽂이, 잉크병 등 필기구 |
| plant | foreground | 40 | `plant.png` | 바닥 화분 (Lv10 해금, 기존 `unlockedAdditions`의 `plant`와 동일 기준) |
| cat | foreground | 41 | `cat.png` | 방석 위 고양이 (Lv20 해금, 기존 `cat`과 동일 기준) |
| foreground | foreground | 42 | `foreground.png` | 기타 전경 요소 (예: 커튼 자락 등 화면 최전면에 걸치는 디테일) |
| lamp-glow | lighting | 50 | `lamp-glow.png` | 램프 빛 번짐 — 가산/소프트라이트 블렌드용 오버레이 |

z-index는 그룹 내부의 세부 순서까지 정확히 고정하기 위한 값이며, `roomAssetManifest.test.ts`가 "중복 없음", "배경이 최소값·조명이 최대값", "캐릭터 기준 앞/뒤 그룹 분리"를 회귀 테스트로 고정한다.

## 3. 캐릭터 anchor와 책상 기준선

- **높이 비율**: 캐릭터는 방 높이의 38~45% 차지 (요구사항 그대로). 코드에서는 `CHARACTER_HEIGHT_RATIO = 0.42`로 고정.
- **너비 비율**: `CharacterView`가 사용하는 정사각형(1:1) PNG 캔버스가 방의 4:5 비율 안에서 정확히 `CHARACTER_HEIGHT_RATIO`만큼의 높이로 나오도록, `CHARACTER_WIDTH_RATIO = CHARACTER_HEIGHT_RATIO × (800/640) = 0.525`로 역산한다. 정사각형 캔버스이므로 폭 %만 지정하면(높이는 `h-auto`로 비율 유지) 결과 높이가 정확히 42%가 된다 — `roomAssetManifest.test.ts`가 이 산술을 직접 검증한다.
- **상단 기준선**: `CHARACTER_TOP_RATIO = 0.16` (방 높이의 16% 지점에서 캐릭터 박스 시작) — 얼굴이 선반(z=11)·창문(z=10)보다 먼저 보이도록 충분히 낮은 값.
- **좌우 기준선**: 항상 `left: 50%` + `translateX(-50%)`로 수평 중앙 정렬. 남성형·여성형 모두 같은 anchor를 공유한다 (성별에 따라 anchor를 다르게 주지 않는다).
- **책상 기준선**: `desk-front`(z=30, study 상태에서는 `desk-front-study`가 z=29로 대신 사용됨 — §4)가 캐릭터(z=20)보다 항상 위에 그려지므로, 캐릭터 하반신이 책상 앞면에 자연스럽게 가려진다. 기존 SVG 방의 "책상이 캐릭터 다리를 가린다" 동작과 동일한 원리를 그대로 유지한다.

### 3-1. ⚠️ 캐릭터 포즈 실측 결과 — `idle`/`sleep`/`happy`는 서 있는 전신 포즈다

`public/sprites/avatar/base/`의 실제 PNG를 직접 확인한 결과, 4개 상태(`idle`/`study`/`sleep`/`happy`, 남녀 공통) 중 **`study`만 책상에 앉은 흉상(bust) 포즈**이고 나머지 `idle`/`sleep`/`happy`는 **양발이 다 보이는 전신 서 있는 포즈**다. 이번 요구사항("모든 상태가 의자에 앉아있는 것처럼 보여야 한다")을 문자 그대로 만족시키려면 새로운 앉은 포즈 원화가 필요하지만, 이번 단계에서는 **캐릭터 원화를 새로 생성하지 않기로** 결정했다 — 대신 아래 방식으로 기존 자산만으로 근사한다:

- `desk-front.png`(study 제외 모든 상태 공통)의 불투명 영역 상단 경계선을 캐릭터 박스 안에서 **머리부터 42~45% 지점(대략 골반~허벅지 높이)** 근처에 오도록 그린다. 이 라인 아래(다리·발)는 `desk-front.png`가 완전히 덮어 가리고, 이 라인 위(상반신·얼굴)는 그대로 노출되어 "책상 뒤에 앉아있는" 인상을 만든다.
- 정확한 %는 캐릭터 박스 높이(`CHARACTER_TOP_RATIO`=16%, 높이 38~45%, 즉 캔버스 y≈128~488px 사이— `characterScale`에 따라 하단이 464~488px 사이에서 움직인다) 기준의 **추정치**다. 남녀 스프라이트의 실제 다리 비율이 서로 조금씩 다를 수 있으므로, `desk-front.png`가 실제로 배치된 뒤 브라우저에서 남녀 × idle/sleep/happy 6가지 조합을 전부 눈으로 확인하고 다리가 삐져나오면 그림의 불투명선을 다시 낮춰야 한다 (§11 구현 순서의 마지막 단계).
- 이 근사는 완벽한 "앉은 포즈"가 아니라 "다리가 안 보이는 서 있는 포즈"에 가깝다는 한계가 있다 — 원목 책상 뒤에 있으면 자연스럽게 다리가 안 보이므로 시각적으로는 크게 위화감이 없을 것으로 예상되지만, 진짜 앉은 자세(무릎 각도, 의자에 걸친 엉덩이 라인)는 아니다. 더 정확한 결과가 필요하면 나중에 앉은 포즈 원화를 별도로 제작하는 선택지가 여전히 열려 있다.

## 4. `boy_study`/`girl_study` 캐릭터 자산의 책상 중복 — 해결 방식 확정

`public/sprites/avatar/base/boy_study_*.png`, `girl_study_*.png`에는 **캐릭터가 앉아있는 책상·펼쳐진 책·연필이 이미 그림 안에 포함**되어 있다(승인된 캐릭터 시트 자체가 그렇게 그려짐). 방 레이어의 `desk-front.png`를 그대로 study 상태에도 겹치면 책상이 이중으로 보이거나 모서리가 어긋난다.

**확정된 해결 방식은 이전 초안의 3가지 옵션 중 옵션 2(상태 전용 desk layer)다.** 코드에도 이미 반영되어 있다:

- `roomAssetManifest.ts`의 `RoomLayerAsset`에 `excludeStates`/`onlyStates` 필드를 추가했다. `desk-front`는 `excludeStates: ['study']`, 새로 추가된 `desk-front-study`는 `onlyStates: ['study']`로 선언되어 있어 — 두 레이어는 상태에 따라 항상 정확히 하나만 렌더링되고 절대 동시에 나타나지 않는다.
- `roomThemeSupport.ts`의 `resolveActiveLayers`가 `state` 파라미터를 받아 이 두 필드로 필터링한다. `getRequiredLayers`(테마 준비 완료 판정)는 상태와 무관하게 두 레이어를 모두 "필수"로 취급한다 — 즉 `default-night` 테마가 준비 완료로 인정되려면 `desk-front`와 `desk-front-study` 둘 다 실제 파일로 존재해야 한다.
- `PixelRoomRenderer.tsx`는 이미 갖고 있던 `state` prop을 그대로 `resolveActiveLayers`에 전달하도록 연결을 마쳤다.
- **옵션 1(책상 없는 study 캐릭터 자산 재제작)과 옵션 3(상태별 anchor 조정)은 채택하지 않았다** — 전자는 캐릭터 원화를 새로 그려야 해서 이번 범위(그림 재생성 없음) 밖이고, 후자는 §3의 "모든 상태가 같은 anchor를 공유한다" 요구와 정면으로 충돌한다.

`desk-front-study.png`는 캐릭터 자산이 이미 그린 책상 모서리 바로 바깥쪽만 최소한으로 그리거나(예: 책상 다리, 방 자체의 원근 디테일), 극단적으로는 거의 투명에 가깝게 비워둬도 된다 — study 상태의 "책상"은 캐릭터 자산 자체가 이미 전담하고 있으므로, 이 레이어의 역할은 방의 다른 요소(램프/책/머그컵 등, deskFront 그룹의 나머지 레이어들)와 배경 사이의 시각적 이음매를 자연스럽게 채우는 정도로 충분하다.

## 5. 파일명 / 경로 규칙

```
public/sprites/room/{themeId}/{layerId}.png
```

예: `public/sprites/room/default-night/background.png`. 경로 생성은 `roomAssetManifest.ts`의 `assetPath()` 한 곳에서만 하며, 컴포넌트가 직접 문자열을 조립하지 않는다 (캐릭터 스프라이트 시스템의 `spriteManifest.ts`와 동일한 원칙).

## 6. 투명 배경 / 픽셀 밀도 규칙

- 전체화면 레이어(background, window-night, shelf, desk-back, desk-front, rug, foreground)는 640×800 전체를 채우는 RGBA PNG. 배경 레이어(`background.png`)만 완전 불투명해도 되고, 나머지는 그려지지 않은 영역이 반드시 완전 투명(alpha 0)이어야 한다.
- 소품 단독 파일(lamp, books, mug, stationery, plant, cat, lamp-glow)은 필요한 최소 영역만 그리고 나머지는 투명 — manifest의 `anchor`/`width`/`height` 필드로 캔버스 내 위치를 지정한다 (현재 default-night 세트는 전부 전체화면 레이어로 잡아뒀고, 실제 제작 단계에서 소품을 단독 파일로 분리하면 그때 `anchor` 값을 채운다).
- 초록 스크린 등 키잉 잔여 픽셀·번짐이 없어야 한다 (캐릭터 스프라이트 제작 시 확립한 것과 동일한 기준 — `docs/character-system.md` §14 참고).
- `lamp-glow.png`는 조명 레이어이므로 가장자리가 완전히 부드럽게 페이드아웃되는 알파 그라디언트여야 하며, 딱딱한 테두리가 있으면 안 된다.

## 7. 색상 팔레트 / 조명 방향 (레퍼런스 이미지 실측)

아래 색상은 승인된 레퍼런스 이미지(`docs/assets/study-room-approved-v1.png`)에서 실제로 픽셀을 샘플링해 얻은 근사치다 (참고용 — 최종 제작 시 원본 이미지를 직접 다시 확인할 것):

| 용도 | 근사 색상 |
|---|---|
| 밤하늘 (창문 너머) | `#292f55` (짙은 남색) |
| 커튼 | `#6e4a64` (탁한 보라) |
| 벽지 (조명 받은 톤) | `#7a5945` (따뜻한 웜톤 베이지~브라운) |
| 책상 나무 | `#774629` (밝은 원목 갈색) |
| 후드 (캐릭터 의상, 참고용) | `#9e6c97` (더스티 라벤더) |
| 러그 | `#5a4056` (톤다운 자주) |
| 램프 갓 (금속) | `#e5ad5f` (따뜻한 골드) |
| 책 표지 | `#4f2818` (짙은 밤색) |
| 바지(플레이드, 참고용) | `#3b2834` (짙은 자두색) |

**조명 방향**: 광원은 책상 위 스탠드 램프(왼쪽, 캐릭터 기준 화면 좌측) 하나이며, 따뜻한 노란빛이 오른쪽 아래(책상 표면)로 퍼진다. 창문 너머 밤하늘은 차가운 남색으로 램프의 따뜻한 빛과 대비를 이룬다. `lamp-glow.png`는 이 광원 위치(캔버스 좌측, 책상 높이 부근)를 중심으로 한 방사형 글로우로 제작한다.

## 8. 모바일 축소 규칙

- 지원 폭: 320px / 390px / 430px.
- 방 컨테이너는 항상 4:5 비율을 유지한 채(`aspect-ratio: 640/800`) 뷰포트 폭에 맞춰 축소된다 — 가로 스크롤이 생기지 않는다.
- 정수 배율로 딱 떨어지지 않아도 되며(320~430px 폭 전부 640px의 정수 배수가 아님), CSS `aspect-ratio` + `object-fit`류가 아닌 %기반 레이아웃으로 항상 안정적으로 축소되도록 한다 — 실제 픽셀이 뭉개지는 것을 막는 것은 `image-rendering: pixelated`의 역할이지, 배율을 정수로 강제하는 것의 역할이 아니다.
- 캐릭터/소품의 anchor(%) 값은 뷰포트 폭과 무관하게 동일 — 축소되어도 상대 위치가 절대 어긋나지 않는다.
- 캡처 카드(`LogCaptureCard`)도 동일한 `RoomScene`을 재사용하므로 구도가 항상 같다.

## 9. 레벨별 소품 연결

기존 SVG 방의 `growthStages.ts`(`GROWTH_STAGES`)와 정확히 같은 레벨 기준을 그대로 재사용한다 — 렌더러를 바꿔도 "언제 무엇이 해금되는지"는 절대 달라지지 않는다.

| 레벨 | 기존 SVG 방 | 픽셀 방 매핑 |
|---:|---|---|
| 1 | 시작의 책상 (desk) | 항상 표시되는 baseline 레이어 전체 |
| 10 | 식물 추가 (plant) | `plant.png`, `minLevel: 10` |
| 20 | 고양이 등장 (cat) | `cat.png`, `minLevel: 20` |
| 30 | 의자 업그레이드 (chairUpgrade) | *(아직 픽셀 레이어 미정 — §11 참고)* |
| 40 | 책 증가 (moreBooks) | *(아직 픽셀 레이어 미정)* |
| 50 | 듀얼 모니터 (dualMonitor) | *(아직 픽셀 레이어 미정)* |
| 70 | 창문과 커튼 (window) | 픽셀 방은 창문/커튼이 이미 baseline에 포함(레퍼런스 이미지 자체가 밤창문 구도) — SVG 방과 언락 시점이 다르다는 뜻이므로 §11에서 재검토 필요 |
| 100 | Premium Study Room | *(아직 픽셀 레이어 미정)* |

**주의**: 레퍼런스 이미지는 창문이 이미 그려진 하나의 완성 장면이라, 기존 SVG 방처럼 "Lv70에 창문이 열린다"는 연출을 그대로 재현하려면 창문이 없는 버전의 `window-night.png` 변형이 별도로 필요하다. 이 gap도 §11에 명시한다.

## 10. 상점 테마 확장 방법

1. 새 레퍼런스 콘셉트 이미지를 승인받아 `docs/assets/`에 추가하고 커밋한다 (이 문서의 §0과 동일한 절차).
2. `roomAssetManifest.ts`의 `RoomThemeId`에 새 테마 id를 추가한다 (예: `'default-sky'`).
3. `ROOM_ASSET_MANIFEST`에 그 테마의 레이어 배열을 추가한다 — group/zIndex 규칙은 §2와 동일하게 유지.
4. 실제 파일이 준비되면 `roomThemeSupport.ts`의 `CONFIRMED_ROOM_LAYER_IDS`에 해당 레이어 id를 추가한다 — 이 순간부터 `isRoomThemeReady`가 그 테마에 대해 `true`를 반환하기 시작한다.
5. 특정 상점 아이템을 장착해야만 보이는 개별 소품이 필요하면 그 레이어에 `shopItemId`를 지정한다 (메커니즘은 이미 구현·테스트되어 있음 — `roomThemeSupport.test.ts`의 synthetic-layer 테스트 참고). 오늘 시점 상점 카탈로그에는 개별 방 소품을 구매하는 아이템이 없으므로, 실제로 이 필드를 쓰는 레이어는 아직 없다.

`bg-sky`/`bg-sakura`(현재 상점의 배경 아이템)는 오늘은 SVG 방의 단색 벽 색상만 바꾸는 용도다 — 별도의 승인된 레퍼런스 이미지가 나오기 전까지는 픽셀 테마로 자동 확장되지 않으며, 이 문서가 그 상태를 임의로 대신 그려 넣지 않는다.

## 11. 아직 필요한 이미지 목록 (실제 제작 착수 전 확정해야 할 것)

> §4의 책상 중복 문제는 "study 전용 desk layer(옵션 2)"로 확정되었고 코드에도 이미 반영되어 있다 (`excludeStates`/`onlyStates`, §4 참고) — 남은 것은 순수하게 아래 그림 제작뿐이다. 캐릭터 원화(idle/sleep/happy/study PNG)는 이번 범위에서 **건드리지 않는다**.

1. **default-night 테마 15개 레이어 실제 제작**: `background.png`, `rug.png`, `window-night.png`, `shelf.png`, `desk-back.png`, `desk-front.png`, `desk-front-study.png`, `lamp.png`, `books.png`, `mug.png`, `stationery.png`, `plant.png`, `cat.png`, `foreground.png`, `lamp-glow.png` — 전부 640×800 RGBA, §6 투명 배경 규칙 준수. (기존 14개 세트에 `desk-front-study.png` 1개가 추가되어 15개.)
2. **`desk-front.png`의 다리 가림선(§3-1)** — 캐릭터 박스 상단에서 42~45% 지점 근처를 목표로 그리되, 최종 확정은 실제 파일 배치 후 브라우저에서 남녀 × idle/sleep/happy 6개 조합을 직접 보고 다리가 삐져나오지 않는지 확인해서 조정한다 (구현 순서 4번 참고).
3. **레벨 30/40/50/100 픽셀 소품**(§9의 "아직 픽셀 레이어 미정" 항목) — 의자 업그레이드, 책 증가, 듀얼 모니터, Premium 장식의 픽셀 버전. 이번 15개 세트에는 포함되어 있지 않다.
4. **창문 없는 baseline 변형**(§9 주의사항) — 레퍼런스처럼 완성된 밤창문이 아니라, 기존 SVG 방처럼 Lv70 전에는 커튼만 있고 Lv70에 창문이 열리는 연출을 유지하려면 별도 자산이 필요. (또는 이 언락 연출 자체를 픽셀 테마에서는 없애기로 제품 결정을 내려도 된다 — 코드 관점에서는 어느 쪽이든 `minLevel: 70`을 `window-night` 레이어에 추가하기만 하면 되므로 구현 난이도 차이는 없다.)

각 레이어가 실제로 준비되면 `roomThemeSupport.ts`의 `CONFIRMED_ROOM_LAYER_IDS`에 해당 id를 추가하는 것만으로 `PixelRoomRenderer`가 자동으로 활성화된다 — 그 전까지 사용자는 계속 `LegacySvgRoomRenderer`(기존 SVG 방)를 본다. `desk-front`와 `desk-front-study`는 **둘 다** 추가해야 `default-night` 테마가 준비 완료로 인정된다(§4).

## 12. 구현 순서 (그림 제작 이후)

1. 위 §11의 15개 PNG를 `public/sprites/room/default-night/`에 배치한다.
2. `roomThemeSupport.ts`의 `CONFIRMED_ROOM_LAYER_IDS['default-night']`에 15개 id를 전부 추가한다 — 이 한 줄 변경이 `PixelRoomRenderer` 활성화의 전부다. `roomAssetManifest.ts`/`PixelRoomRenderer.tsx`/`RoomScene.tsx`는 이미 완성되어 있어 추가 코드 변경이 필요 없다.
3. `npm run build`와 기존 room 테스트(`roomAssetManifest.test.ts`, `roomThemeSupport.test.ts`)가 여전히 통과하는지 확인한다.
4. 브라우저에서 320/390/430px 폭 × 남/여 × idle/study/sleep/happy 조합을 실제로 확인한다 — 다리 삐져나옴(§3-1), study 상태 이중 책상 여부(§4), 레이어 간 이음매/여백을 눈으로 검증하고 필요하면 `desk-front.png`/`desk-front-study.png`를 다시 그린다.
5. 문제가 없으면 `LegacySvgRoomRenderer`는 코드에서 삭제하지 않고 그대로 안전망(폴백)으로 남겨둔다 — `PixelRoomRenderer`가 런타임에 필수 레이어 로드를 실패하면 자동으로 이쪽으로 폴백한다(`onCriticalLayerError`).
