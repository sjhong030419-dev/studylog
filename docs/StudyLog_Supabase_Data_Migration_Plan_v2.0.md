# StudyLog: localStorage → Supabase 데이터 전환 계획 v2.0

**상태**: 분석 및 설계 제안 — 아직 코드를 수정하지 않았음. 아래 내용에 대한 최종 확인을 받은 뒤 구현을 시작한다.

**v1.0 → v2.0 변경**: 범위에 **설정(`settingsStore`)** 추가, **여러 기기 동기화**를 실제 요구사항으로 채택, 그 전제조건인 **이메일 매직링크 로그인**을 이번 범위에 포함(사용자 승인 완료), 마이그레이션 전략을 "중앙 집중 1회 백필"에서 **"스토어별 자체 최초 동기화"**로 재설계(§4), 8단계 구현 계획으로 §7 교체.

## 0. 범위

사용자가 지정한 6개 도메인: **공부 기록(과목+세션), 프로필, 포인트, 플래너, 설정**.

| 포함 | 현재 스토어 | 비고 |
|---|---|---|
| ✅ 과목 + 공부 기록 | `timerStore.ts` (`subjects`, `sessions`) | `selectedSubjectId`, `isRunning/isPaused/elapsedSec`는 진행 중인 타이머의 순간 상태라 DB로 옮길 "기록"이 아님 — 로컬에 남긴다 |
| ✅ 프로필 | `profileStore.ts` (`nickname`, `gender`, `onboardingCompleted`) | `pointsStore.school`도 의미상 프로필 정보라 스키마에서는 `profiles`로 옮기는 걸 제안(§3 참고) |
| ✅ 포인트 | `pointsStore.ts` (`transactions`, `streakCount`, `lastStudyDate`, `milestonesAwarded`, `school`) | |
| ✅ 플래너 | `plannerStore.ts` (`tasks`) | |
| ✅ 설정 | `settingsStore.ts` (`notifyStudyReminder`, `notifyStreakWarning`, `notifyRankChange`, `theme`, `captureDefaultRatio`, `quietHours`, `awayDetectionEnabled`) | `membership: 'free'|'premium'` 필드도 같이 저장되지만 **DB에 저장한다고 "신뢰할 수 있는" 값이 되는 건 아니다** — RLS가 `auth.uid() = user_id`인 소유자에게 쓰기 권한을 주므로, 사용자가 자기 브라우저 콘솔에서 직접 `membership='premium'`으로 바꿔 쓸 수 있다. 지금은 UI에 토글도 없고 실제 결제 연동도 안 돼 있어 문제없지만, 나중에 실제 유료 기능 게이팅에 쓰려면 이 필드는 **서버(Express 백엔드/Stripe 웹훅)에서만 쓰도록 별도 처리**해야 한다는 점을 미리 남겨둔다 |
| ➕ 이메일 로그인(신규 범위) | `authStore.ts` 확장 | "여러 기기 동기화"의 전제조건이라 이번에 포함하기로 확정(§2-2) |
| ⛔ 상점/구매·장착 | `shopStore.ts` | **이번에도 사용자가 지정한 목록에 없어 범위 제외.** 캐릭터 커스터마이징이 시각적으로 여기 의존하므로, 이번 전환이 끝나면 가장 먼저 다뤄야 할 후속 후보로 다시 추천한다 |
| ⛔ 뽀모도로 진행 상태 | `pomodoroStore.ts` | `completedRoundsToday`/`roundsDateKey`만 영속화됨 — 완료된 뽀모도로는 이미 `timerStore.logSession()`을 통해 `sessions`(공부 기록)에 기록되므로 사실상 커버됨 |
| ⛔ 알림 목록/오디오/이탈감지 on-off 트리거/AI튜터 | `notificationStore`, `audioStore`, `awayStore`, `tutorStore` | 사용자가 지정하지 않음(단, `awayDetectionEnabled` **설정값**은 settingsStore 소속이라 포함됨 — 이탈감지 자체의 실시간 상태와는 다름) |

## 1. 현재 구조 분석

### 1-1. 각 스토어의 정확한 필드/타입

**`timerStore.ts`** (localStorage 키: `studylog-timer`)
```ts
subjects: Subject[]            // { id, name, color, archivedAt?: number }
sessions: StudySession[]       // { id, subjectId, startedAt, durationSec, dateKey }
selectedSubjectId: string | null   // ← 영속화 대상에서 제외(순간 상태)
```
`partialize`로 이미 `subjects`/`sessions`/`selectedSubjectId`만 저장하도록 걸러져 있다(다른 필드는 원래도 로컬에만 존재).

**`profileStore.ts`** (`studylog-profile`)
```ts
nickname: string
gender: 'boy' | 'girl'
onboardingCompleted: boolean
```

**`pointsStore.ts`** (`studylog-points`)
```ts
transactions: PointTransaction[]  // { id, type, amount, reason, dateKey, timestamp }
streakCount: number
lastStudyDate: string | null      // "YYYY-MM-DD"
milestonesAwarded: number[]
school: string | null
```
잔액(`balance()`)과 Study XP(`studyXpTotal()`)는 저장된 값이 아니라 `transactions` 배열을 매번 순수 함수(`pointsMath.ts`)로 reduce해서 계산한다 — **저장은 트랜잭션 로그만, 집계는 항상 클라이언트에서.**

**`plannerStore.ts`** (`studylog-planner`)
```ts
tasks: PlannerTask[]  // { id, dateKey, subjectId, title, targetType: 'time'|'checklist', targetMinutes?, completed }
```

**`settingsStore.ts`** (`studylog-settings`)
```ts
notifyStudyReminder: boolean
notifyStreakWarning: boolean
notifyRankChange: boolean
theme: 'light' | 'dark'
captureDefaultRatio: 'square' | 'story'
membership: 'free' | 'premium'   // §0 참고 — 서버 신뢰 불가 필드, 지금은 그냥 같이 저장만
quietHours: { enabled: boolean; start: string; end: string }  // "HH:MM"
awayDetectionEnabled: boolean
```
전부 사용자당 1개씩만 존재하는 스칼라/작은 객체라 프로필과 비슷하게 "사용자당 1행" 테이블로 매핑하기 좋다.

### 1-2. ID 체계 (중요 — 스키마 설계에 직결)

`utils/id.ts`의 `generateId(prefix)`가 `crypto.randomUUID()`를 우선 사용하되 없으면 `Date.now()+random` 폴백을 쓴다. 실제로 스토어마다 이 규칙을 다르게 적용 중이다:

- `subjects`: `generateId('subject')` → `subject-<uuid>`
- `sessions`: `session-${Date.now()}-${random36}` (UUID 아님, id.ts 이전부터 있던 직접 구현)
- `point_transactions`: `pt-study-${Date.now()}`, `pt-streak-${Date.now()}`, `pt-earn-${Date.now()}`, `pt-spend-${Date.now()}`
- `planner_tasks`: `task-${Date.now()}`

**전부 "네이티브 uuid 타입에 넣을 수 없는 문자열"이다.** 즉 DB 기본키를 Postgres `uuid` 타입으로 설계하면 기존 로컬 데이터를 그대로 못 넣는다. → **모든 기본키를 `text`로 설계**하고, 클라이언트가 생성한 id를 그대로 쓰는 걸 제안한다(§3). 이렇게 하면 마이그레이션 시 id 재매핑이 전혀 필요 없다 — "로컬 배열을 그대로 upsert"가 곧 마이그레이션이 된다.

### 1-3. 이미 존재하는 인증 인프라 (핵심 발견)

`authStore.ts` + `RoomConnection.tsx`가 **오늘 이미 앱 전체에서 익명 사용자 인증을 실행 중**이다:

- `RoomConnection`은 온보딩 통과 후 앱 루트에 무조건 마운트되고(`App.tsx`), 마운트되자마자 `initAuth()`를 호출한다 — 사용자가 스터디룸 탭을 연 적이 없어도 실행됨.
- `initAuth()`는 세션이 없으면 `supabase.auth.signInAnonymously()`로 즉시 익명 로그인하고 `userId`(=`auth.uid()`)를 저장한다.
- 지금은 이 `userId`가 오직 `room_seats.occupant_id`에만 쓰이지만, **모든 사용자가 이미 안정적인 `auth.uid()`를 하나씩 가지고 있다는 뜻**이다. 새로 인증 체계를 만들 필요가 없다 — 이 기존 `userId`를 그대로 6개 도메인의 소유자 키로 재사용하면 된다.
- 기존 `supabase/schema.sql`이 이미 `auth.users(id)` FK + `to authenticated` RLS 패턴을 쓰고 있어(`rooms`, `room_seats`), 이번 설계도 같은 컨벤션을 따른다.

### 1-4. 클라이언트 상태의 함정 (재확인)

`timerStore.ts`는 이미 한 번 겪은 문제를 주석으로 남겨뒀다: zustand persist의 `migrate`는 저장된 JSON에 **숫자 `version` 필드가 있을 때만** 실행되는데, 기존 사용자 데이터엔 그 필드가 아예 없어서 조용히 실행되지 않는다. 그래서 `migrate` 대신 `onRehydrateStorage`로 복구 로직을 넣었다. **이번 Supabase 동기화 레이어를 설계할 때도 같은 함정을 피해야 한다** — "버전 필드 기반 마이그레이션 트리거"에 의존하지 않고, 항상 무조건 실행되는 훅(`onRehydrateStorage`, 또는 앱 부팅 시 명시적 1회 체크)으로 백필 여부를 판단해야 한다.

## 2. 설계 원칙

1. **익명 우선, 이메일은 "업그레이드"** — 비밀번호 입력·가입 폼 같은 무거운 플로우를 새로 만들지 않는다. Supabase는 익명 세션을 이메일 매직링크(`signInWithOtp`, §3-1에서 채택)로 **같은 `auth.uid()`를 유지한 채 정식 계정으로 승격**시키는 기능을 지원한다. 즉 모든 테이블을 `user_id = auth.uid()`로 소유권을 걸어두면, 이메일 전환 기능을 추가했을 때 **데이터 마이그레이션이 전혀 필요 없다** — 같은 uid가 그대로 같은 행들을 계속 가리킨다. 이게 "익명 사용자 데이터 보존 + 여러 기기 동기화"의 핵심 해법이다.
2. **클라이언트 id 그대로 사용, 기본키는 `text`** — §1-2 참고. 재매핑 없는 멱등 백필을 위해.
3. **RLS로 사용자별 완전 격리** — 모든 신규 테이블에 `user_id uuid references auth.users(id)` + `auth.uid() = user_id` 정책. `room_seats`처럼 여러 사용자가 서로의 행을 읽어야 하는 공유 데이터가 아니라 순수 개인 데이터이므로, `select/insert/update/delete`를 하나의 `for all` 정책으로 묶어 단순하게 간다(기존 `schema.sql`의 세분화된 정책과 의도적으로 다름 — 이유는 데이터 성격 차이).
4. **집계 로직은 그대로 클라이언트에 둔다** — `pointsMath.ts`/`subjectMath.ts`의 순수 함수들을 SQL로 옮기지 않는다. Postgres에 집계 뷰를 만드는 것도 가능하지만, 지금 이 앱 규모에서는 불필요한 리스크다. DB는 "트랜잭션/세션 로그를 사용자별로 안전하게 보관하는 곳"이고, 잔액·XP·연속 출석 같은 파생값은 지금처럼 불러온 배열을 그대로 기존 순수 함수에 넣어 계산한다 — **이 부분은 스토어 로직을 거의 안 건드려도 된다.**
5. **로컬 우선 캐시 + 백그라운드 동기화 (제안)** — 아래 §2-1에서 대안과 함께 설명.
6. **이메일 로그인은 "여러 기기 동기화"의 필수 전제조건** — §2-2에서 설명.

### 2-2. 왜 이메일 로그인 없이는 "여러 기기 동기화"가 불가능한가

`supabase.auth.signInAnonymously()`는 **호출할 때마다, 그리고 기기(정확히는 브라우저의 로컬 세션)마다 새로운 익명 사용자를 만든다.** 지금 앱은 로그인 화면이 전혀 없고 `RoomConnection`이 앱 부팅 시 자동으로 익명 로그인만 시켜주므로, 폰에서 쓰던 익명 계정과 PC에서 쓰던 익명 계정은 **처음부터 서로 다른 `auth.uid()`를 가진 완전히 다른 사용자**다. 동기화 로직을 아무리 잘 짜도 "이 두 기기가 같은 사람"이라는 정보 자체가 시스템 어디에도 없다.

그래서 "여러 기기에서 동기화"를 실제로 동작하게 만들려면 **최소 하나의 로그인 방법**(이메일 매직링크)이 있어야 한다 — 두 기기가 같은 이메일로 로그인해야 비로소 같은 `auth.uid()`를 공유하게 된다. 이번 범위에 포함하기로 확정했다(사용자 승인 완료). 구체 설계는 §3-1, 구현 순서는 §7 Stage 1.5 참고.

이 전제를 세우고 나면, §1-3에서 관찰한 "모든 사용자가 이미 안정적인 `auth.uid()`를 가지고 있다"는 사실도 정확히 다시 읽어야 한다 — **기기 1개 안에서는** 안정적이다(같은 브라우저를 계속 쓰는 한 재로그인 없이 같은 uid 유지). 하지만 **기기를 넘나드는 안정성**은 이메일 로그인이 있어야만 생긴다.

### 2-1. 로컬 우선 vs 서버 단일 소스 — 트레이드오프와 제안

| | 로컬 우선 캐시 + 동기화 (제안) | 서버를 유일한 소스로 |
|---|---|---|
| 오프라인 동작 | 그대로 됨(지금처럼 즉시 반응) | 네트워크 필요, 로딩 상태 추가해야 함 |
| 기존 스토어 코드 변경량 | 작음 — persist는 그대로 두고 "쓰기 후 Supabase에도 반영" 훅만 추가 | 큼 — 모든 `set()` 호출을 비동기 API 호출로 재작성 |
| 초 단위 `tick()` 부하 | 로컬에만 씀(지금처럼), 세션 종료 시점에만 서버 반영 | 매초 서버 왕복은 비현실적 → 결국 로컬 버퍼링을 다시 만들어야 함 |
| 데이터 정합성 리스크 | 동기화 실패 시 로컬↔서버 불일치 가능(재시도/큐 필요) | 항상 일관됨 |

**제안: 로컬 우선 캐시 + 동기화.** 기존 zustand+persist 구조와 UX(즉시 반응, 오프라인 허용)를 그대로 유지하면서, 의미 있는 이벤트(과목 추가/보관, 세션 기록 완료, 포인트 트랜잭션 발생, 태스크 추가/완료/삭제, 프로필 수정)가 일어날 때만 Supabase에 **upsert**하는 얇은 동기화 계층을 추가한다. 앱 부팅 시 1회, 로컬에 없는(또는 로컬보다 최신인) 서버 데이터를 끌어와 합친다. 초당 도는 `tick()`(경과 시간 카운터)은 지금처럼 로컬에만 남긴다 — 세션이 끝나 `logSession()`이 실제 `StudySession` 레코드를 만드는 순간에만 서버로 나간다.

## 3. DB 스키마 제안

### 3-1. 이메일 로그인 방식 — 매직링크 (신규 테이블 불필요)

`auth.users`는 Supabase가 이미 관리하는 테이블이라 이메일 자체를 저장할 새 테이블은 필요 없다. 클라이언트 흐름만 추가한다:

1. 마이페이지에 "이메일로 계정 연결" 입력창 추가.
2. `supabase.auth.signInWithOtp({ email })` 호출 → Supabase가 매직링크 이메일 발송(비밀번호 관리 부담 없음, 기존 앱에 로그인 UI가 전혀 없었으므로 가장 단순한 방식).
3. 사용자가 메일의 링크를 클릭 → 그 브라우저의 세션이 해당 이메일 계정으로 전환.
4. **정확한 동작(같은 브라우저의 기존 익명 세션이 "업그레이드"되는지, 아니면 그 이메일로 이미 존재하는 별도 계정으로 "전환"되는지)은 Supabase의 최신 익명 로그인 연동 문서를 구현 단계(§7 Stage 1.5)에서 다시 확인해 확정한다** — 이 문서 작성 시점 기준으로는 "같은 브라우저에서 처음 이메일을 등록하면 업그레이드, 이미 다른 기기에서 그 이메일로 가입된 적이 있으면 그 기존 계정으로 로그인"이 Supabase의 의도된 동작이지만, 실제 배포된 SDK 버전으로 반드시 재검증한다.
5. 두 번째 기기에서 같은 이메일로 `signInWithOtp`를 다시 하면, 그 기기도 같은 `auth.uid()`로 로그인되어 §4의 동기화 로직이 그때부터 두 기기를 하나로 묶는다.

```sql
-- ── profiles ──────────────────────────────────────────────
-- profileStore(nickname, gender, onboardingCompleted) + pointsStore.school을
-- 여기로 합침 — 둘 다 "사용자 1명당 1행"인 프로필 성격 데이터라 스키마
-- 정규화 차원에서 통합을 제안 (스토어 분리와 DB 테이블 분리가 1:1일 필요는 없음).
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '나',
  gender text not null default 'boy' check (gender in ('boy', 'girl')),
  onboarding_completed boolean not null default false,
  school text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── subjects ──────────────────────────────────────────────
create table if not exists subjects (
  id text primary key,                 -- 클라이언트 생성 id 그대로 (subject-<uuid>)
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  archived_at timestamptz,             -- null = 활성. 절대 하드 삭제하지 않는 기존 정책 유지
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)                 -- 아래 복합 FK용
);

-- ── study_sessions ────────────────────────────────────────
create table if not exists study_sessions (
  id text primary key,                 -- session-<timestamp>-<random>
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text not null,
  started_at timestamptz not null,
  duration_sec integer not null check (duration_sec > 0),
  -- date_key는 Postgres `date` 타입이 아니라 문자열 그대로 보관한다: todayKey()는
  -- 브라우저의 로컬 시간대 기준 "YYYY-MM-DD"를 만드는데, 이걸 date 타입으로
  -- 저장하면 서버/클라이언트 시간대 차이로 날짜가 하루 밀리는 버그를 만들 수
  -- 있다. 문자열을 문자열 그대로 저장해 시간대 변환 지점을 아예 없앤다.
  date_key text not null,
  created_at timestamptz not null default now(),
  foreign key (subject_id, user_id) references subjects (id, user_id)
);

-- ── point_transactions ────────────────────────────────────
create table if not exists point_transactions (
  id text primary key,                 -- pt-study-<ts> 등
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('earn_study', 'earn_streak', 'earn_other', 'spend')),
  amount integer not null check (amount > 0),
  reason text not null,
  date_key text not null,
  occurred_at timestamptz not null,    -- 기존 PointTransaction.timestamp(ms epoch)
  created_at timestamptz not null default now()
);

-- ── point_state ───────────────────────────────────────────
-- streakCount/lastStudyDate/milestonesAwarded — 사용자당 1행, 트랜잭션 로그와
-- 별개로 관리(기존 pointsStore가 이미 이렇게 분리해 저장 중).
create table if not exists point_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  streak_count integer not null default 0,
  last_study_date text,
  milestones_awarded integer[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ── planner_tasks ─────────────────────────────────────────
create table if not exists planner_tasks (
  id text primary key,                 -- task-<ts>
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key text not null,
  subject_id text not null,
  title text not null,
  target_type text not null check (target_type in ('time', 'checklist')),
  target_minutes integer,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (subject_id, user_id) references subjects (id, user_id)
);

-- ── user_settings ─────────────────────────────────────────
create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notify_study_reminder boolean not null default true,
  notify_streak_warning boolean not null default true,
  notify_rank_change boolean not null default false,
  theme text not null default 'light' check (theme in ('light', 'dark')),
  capture_default_ratio text not null default 'square' check (capture_default_ratio in ('square', 'story')),
  -- membership은 저장은 하되 §0에서 밝힌 대로 서버 신뢰 필드가 아니다 —
  -- 실제 유료 게이팅에 쓰기 전까지는 단순 동기화 대상일 뿐이다.
  membership text not null default 'free' check (membership in ('free', 'premium')),
  quiet_hours jsonb not null default '{"enabled": false, "start": "22:00", "end": "07:00"}',
  away_detection_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ── 인덱스 ────────────────────────────────────────────────
create index if not exists idx_subjects_user on subjects (user_id);
create index if not exists idx_sessions_user_date on study_sessions (user_id, date_key);
create index if not exists idx_transactions_user_date on point_transactions (user_id, date_key);
create index if not exists idx_planner_user_date on planner_tasks (user_id, date_key);

-- ── RLS ───────────────────────────────────────────────────
alter table profiles enable row level security;
alter table subjects enable row level security;
alter table study_sessions enable row level security;
alter table point_transactions enable row level security;
alter table point_state enable row level security;
alter table planner_tasks enable row level security;
alter table user_settings enable row level security;

create policy "own profile" on profiles for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own subjects" on subjects for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sessions" on study_sessions for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own transactions" on point_transactions for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own point state" on point_state for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own planner tasks" on planner_tasks for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own settings" on user_settings for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

`subjects(id, user_id)`에 대한 복합 FK는 "다른 사용자의 과목 id를 가리키는 세션/할일을 못 만들게" 막는 안전장치다 — RLS는 "남의 행을 못 읽게"는 막아주지만 "내 세션이 남의 subject_id를 참조하는 것"까지는 막지 않기 때문에, 여기서는 DB 제약으로 한 번 더 조인다.

## 4. 마이그레이션 전략 — 스토어별 자체 최초 동기화

v1.0에서는 "중앙에서 한 번에 모든 스토어를 백필하는 단계"를 따로 뒀는데, 이번엔 **각 스토어가 자기 도메인의 최초 동기화를 스스로 책임지는 패턴**으로 바꾼다. 이유: (1) 스토어 하나씩 독립적으로 구현·테스트·배포할 수 있어 "각 단계마다 테스트/빌드/배포"라는 이번 요구사항과 잘 맞는다, (2) 하나의 큰 백필 트랜잭션이 중간에 실패했을 때 전체가 어중간한 상태로 남는 리스크가 없다.

모든 스토어가 공유하는 하나의 판단 함수(가칭 `resolveInitialSync`)를 만든다:

```
앱 부팅 → authStore 'ready'(auth.uid() 확보)
  → 이 user_id로 <해당 테이블>에 이미 행이 있는가?
      있음  → "서버가 먼저" → 서버 값을 pull해서 로컬 zustand 상태를 덮어씀
      없음  → "이 기기가 처음" → 로컬 zustand의 현재 값을 그대로 push(최초 백필)
  → 이후부터는 상태 변경 이벤트마다 upsert(증분 동기화, §2-1)
```

**"있으면 서버가 이긴다"는 규칙이 왜 안전한가 (§2-2 재확인)**: 순수 익명 상태에서는 기기마다 `auth.uid()`가 다르므로, 같은 uid로 두 번째 기기가 부팅되는 경우는 오직 **이메일 로그인으로 명시적으로 같은 계정에 로그인했을 때**뿐이다 — 즉 "서버에 이미 행이 있다"는 신호는 항상 "내가 방금 다른 기기의 데이터에 로그인해 들어왔다"는 뜻이지, 우연한 충돌이 아니다. 남은 진짜 리스크는 **두 기기 모두 이미 실데이터를 갖고 있는 상태에서 같은 이메일로 처음 로그인**하는 경우(기기 A가 먼저 push되어 있고, 기기 B가 나중에 로그인하면서 자기 로컬 데이터를 버리고 A의 서버 데이터로 덮어써짐) — 이건 진짜 데이터 손실이 될 수 있어 §6에 명시적으로 남겨둔다.

버전 필드에 의존하지 않고 "서버에 내 행이 있는가"를 직접 조회해 판단하므로 §1-4에서 확인한 `migrate` 함정을 그대로 재현하지 않는다.

### 롤백 계획
모든 단계가 "로컬 데이터에 얹는 부가 동기화"라서, 문제가 생기면 동기화 호출부만 되돌리면 앱은 지금과 완전히 동일하게 로컬 전용으로 동작한다 — 로컬 데이터 자체를 지우거나 변형하는 단계가 없으므로 되돌려도 사용자 데이터 손실이 없다.

## 5. 이메일 계정 전환 시나리오 (검증)

1. 사용자는 오늘도 앱을 열면 자동으로 익명 로그인되어 있고, 이번 작업이 끝나면 6개 도메인 데이터가 전부 그 `auth.uid()`에 묶여 Supabase에 있다(§4의 최초 동기화 완료 후).
2. 마이페이지에서 이메일을 입력하고 매직링크를 요청하면(§3-1) `signInWithOtp`가 호출된다.
3. 링크 클릭 시 Supabase가 **같은 `auth.uid()`를 유지한 채** 익명 세션을 정식 이메일 계정으로 연결한다.
4. 모든 테이블이 `user_id = auth.uid()`로 걸려 있으므로, 연결 직후 그대로 같은 행들이 계속 이 사용자 소유로 남는다 — **데이터 이관 스크립트가 필요 없다.**
5. 예외: "이미 다른 기기에서 같은 이메일로 가입된 적이 있다" + "이 기기에도 이미 실데이터가 있다"가 동시에 맞는 경우는 §4에서 밝힌 대로 이 기기의 로컬 데이터가 서버 값으로 덮어써질 수 있다 — §6에 열어둔다.

## 6. 확인이 필요한 미해결 사항

1. **두 기기 모두 실데이터가 있는 상태에서 같은 이메일로 첫 로그인하는 진짜 충돌** (§4, §5-5) — "서버가 이긴다" 기본 규칙대로 두고 넘어갈지, 아니면 이 경우만 예외적으로 "충돌 감지 시 사용자에게 선택하게 하는 UI"까지 이번 범위에 넣을지 결정이 필요하다. **기본값으로는 전자(서버가 이긴다, 별도 UI 없음)로 진행하되, 이 문서에 남겨둔 대로 명확히 인지하고 진행한다.**
2. **동기화 실패 시 사용자에게 알릴지** — 기본 제안은 "조용히 재시도 없이 넘어가고 다음 부팅 때 복구"인데, 좀 더 적극적으로(예: 작은 배너) 알리고 싶은지.
3. **`school` 필드를 `profiles`로 옮기는 스키마 정규화**(§3) 동의 여부 — 스토어 구조상 `pointsStore`에 있지만 의미상 프로필이라 옮기자고 제안했다. 스토어 코드 자체는 그대로 두고(하위 호환), DB 테이블 매핑만 이렇게 한다.
4. **`membership` 필드의 서버 신뢰 문제**(§0) — 지금 당장 막을 필요는 없지만, 실제 유료 기능 게이팅에 쓰기 전에는 반드시 서버 전용 쓰기 경로로 옮겨야 한다는 점을 인지하고 진행.

## 7. 구현 단계 (승인 후 진행 — 각 단계마다 테스트·빌드·배포)

**중요한 제약**: SQL 스키마 실행은 Supabase 대시보드의 SQL Editor에서만 가능하고, 나는 이 프로젝트의 Supabase 대시보드에 접근할 수 없다 — 기존 `supabase/schema.sql`도 같은 이유로 "SQL Editor에 붙여넣고 Run 하세요"라고 안내되어 있다. **Stage 0은 승인 즉시 사용자가 직접 실행해야 다음 단계 코드가 실제로 동작한다.**

| Stage | 내용 | 테스트 | 빌드 | 배포 |
|---|---|---|---|---|
| **0** (사용자 액션) | §3 SQL 전체를 `supabase/schema.sql`에 추가하고 Supabase SQL Editor에서 실행 | — | — | — |
| **1** | 공통 동기화 인프라: 각 스토어가 재사용할 `resolveInitialSync` 판단 함수 + upsert 에러 처리 규칙(§4). 아직 어느 스토어도 이걸 안 씀 | 새 순수 함수 단위 테스트 | `npm run build` | 사용자에게 보이는 변화 없음 — 안전하게 먼저 커밋/PR/main 병합 |
| **1.5** | 이메일 매직링크 로그인 UI(마이페이지에 입력창 1개 + `signInWithOtp` 연결, §3-1) | 폼 유효성 등 순수 로직 테스트 | `npm run build` | 커밋/PR/main 병합 후 실제 브라우저로 매직링크 발송까지 확인 |
| **2** | 프로필 동기화 (`profiles` 테이블 연결) — 가장 단순, 필드 4개 | 기존 profileStore 테스트 유지 + 동기화 판단 로직 테스트 | `npm run test && npm run build && npm run lint` | 커밋/PR/main 병합·배포 |
| **3** | 설정 동기화 (`user_settings`) | 위와 동일 패턴 | 동일 | 동일 |
| **4** | 포인트 동기화 (`point_transactions` + `point_state`) — 추가 전용 로그라 설계상 비교적 안전 | `pointsMath.ts` 테스트 그대로 + 동기화 계층 테스트 | 동일 | 동일 |
| **5** | 과목 동기화 (`subjects`) — 세션/플래너가 `subject_id`로 참조하므로 반드시 그 전에 완료 | `subjectMath.ts` 테스트 그대로 + 동기화 계층 테스트 | 동일 | 동일 |
| **6** | 공부 기록 동기화 (`study_sessions`) — 과목 이후 | 동일 패턴 | 동일 | 동일 |
| **7** | 플래너 동기화 (`planner_tasks`) — 과목 이후 | 동일 패턴 | 동일 | 동일 |
| **8** | 통합 검증: 실제 두 브라우저 세션으로 같은 이메일 로그인 → 한쪽에서 쓴 데이터가 다른 쪽에 실제로 나타나는지, 새로고침 유지되는지, 오프라인일 때 앱이 여전히 동작하는지 전체 확인 | 전체 회귀 테스트 | 전체 | 필요 시 버그 수정분만 추가 배포 |

Stage 2~7은 서로 독립적인 도메인이라 순서를 다소 바꿔도 되지만(과목이 세션/플래너보다 먼저여야 하는 건 고정), 표의 순서를 기본안으로 제안한다. 각 Stage 끝에서 실제 브라우저로 "로컬에 쓰고 → Supabase 테이블에 실제 값 들어가는지 → 새로고침해도 유지되는지"를 직접 확인한 뒤 다음 단계로 넘어간다.
