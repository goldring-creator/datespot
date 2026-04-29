create extension if not exists "uuid-ossp";

create table places (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  category      text check (category in ('cafe','restaurant','exhibition','movie','bar','shopping','park','activity')),
  address       text,
  lat           float8,
  lng           float8,
  description   text,
  naver_url     text,
  instagram_url text,
  source_url    text,
  region        text[],
  tags          text[],
  expires_at    timestamptz,
  submitted_by  uuid references auth.users on delete set null,
  bookmark_count int default 0,
  is_active     boolean default true,
  created_at    timestamptz default now()
);

create table bookmarks (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users on delete cascade not null,
  place_id   uuid references places on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, place_id)
);

create table courses (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users on delete cascade not null,
  title           text not null,
  place_ids       uuid[] not null,
  scheduled_date  date,
  start_time      time,
  end_time        time,
  transport       text check (transport in ('subway','car')),
  ai_description  text,
  is_public       boolean default false,
  created_at      timestamptz default now()
);

-- RLS
alter table places enable row level security;
alter table bookmarks enable row level security;
alter table courses enable row level security;

-- places: 누구나 읽기, 로그인한 유저만 쓰기
create policy "places_read" on places for select using (is_active = true);
create policy "places_insert" on places for insert with check (auth.uid() is not null);

-- bookmarks: 본인 데이터만
create policy "bookmarks_own" on bookmarks using (auth.uid() = user_id);

-- courses: 본인만 + 공개 코스는 읽기 허용
create policy "courses_own" on courses using (auth.uid() = user_id);
create policy "courses_public_read" on courses for select using (is_public = true);

-- indexes for performance
create index idx_places_region on places using gin(region);
create index idx_places_is_active on places(is_active);
create index idx_bookmarks_user_id on bookmarks(user_id);
create index idx_bookmarks_place_id on bookmarks(place_id);
create index idx_courses_user_id on courses(user_id);

-- places: 제보자가 본인 장소 수정/삭제 가능
create policy "places_update_own" on places for update using (auth.uid() = submitted_by);
create policy "places_delete_own" on places for delete using (auth.uid() = submitted_by);
