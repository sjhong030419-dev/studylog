-- 스터디로그 실시간 스터디룸 스키마
-- Supabase SQL Editor에 붙여넣고 Run 하세요.

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default substr(md5(random()::text), 1, 6),
  seat_count int not null default 6,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists room_seats (
  room_id uuid not null references rooms(id) on delete cascade,
  seat_index int not null,
  occupant_id uuid references auth.users(id),
  occupant_nickname text,
  claimed_at timestamptz,
  primary key (room_id, seat_index)
);

alter table rooms enable row level security;
alter table room_seats enable row level security;

-- 로그인(익명 포함)한 사용자는 방/좌석을 조회할 수 있음
create policy "rooms are readable by any signed-in user"
  on rooms for select
  to authenticated
  using (true);

create policy "seats are readable by any signed-in user"
  on room_seats for select
  to authenticated
  using (true);

-- 빈 좌석만 내가 점유할 수 있고, 내가 점유한 좌석만 비울 수 있음 (동시 클릭 방지)
create policy "claim empty seat or release own seat"
  on room_seats for update
  to authenticated
  using (occupant_id is null or occupant_id = auth.uid())
  with check (occupant_id is null or occupant_id = auth.uid());

-- 아무나 방을 만들 수 있음 (생성자 = 본인으로 강제)
create policy "authenticated users can create rooms"
  on rooms for insert
  to authenticated
  with check (created_by = auth.uid());

-- 기본 스터디룸 1개 + 좌석 6석 시드 데이터
insert into rooms (id, name, seat_count)
values ('00000000-0000-0000-0000-000000000001', '기본 스터디룸', 6)
on conflict (id) do nothing;

insert into room_seats (room_id, seat_index)
select '00000000-0000-0000-0000-000000000001', generate_series(0, 5)
on conflict (room_id, seat_index) do nothing;

-- Realtime이 room_seats 테이블 변경사항을 브로드캐스트하도록 등록
alter publication supabase_realtime add table room_seats;
