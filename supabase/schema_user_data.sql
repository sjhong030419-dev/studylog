-- 스터디로그 사용자 데이터 스키마 (공부 기록/과목/프로필/포인트/플래너/설정)
-- docs/StudyLog_Supabase_Data_Migration_Plan_v2.0.md §3 참고.
-- Supabase SQL Editor에 붙여넣고 Run 하세요. schema.sql(스터디룸)과는 별개 파일이며
-- 순서 의존성 없이 독립적으로 실행 가능합니다.

-- ── profiles ──────────────────────────────────────────────
-- profileStore(nickname, gender, onboardingCompleted) + pointsStore.school을
-- 여기로 합침 — 둘 다 "사용자 1명당 1행"인 프로필 성격 데이터라 스키마
-- 정규화 차원에서 통합.
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
  -- membership은 저장은 하되 서버 신뢰 필드가 아니다 — RLS가 소유자 본인에게
  -- 쓰기 권한을 주므로, 실제 유료 게이팅에 쓰기 전까지는 단순 동기화
  -- 대상일 뿐이다 (docs/StudyLog_Supabase_Data_Migration_Plan_v2.0.md §0).
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
