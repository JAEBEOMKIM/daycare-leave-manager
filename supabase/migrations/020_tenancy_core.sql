-- ============================================================
-- 멀티테넌트 전환 (1/4): 테넌트(어린이집) + 프로필(로그인 사용자) 테이블
-- Supabase 대시보드 > SQL Editor 에서 020 → 021 → 022 → 023 순서로 실행하세요.
-- ============================================================

-- 테넌트 = 어린이집. 원장 1명이 어린이집 1곳을 소유.
create table if not exists public.kindergartens (
  id              text primary key,                 -- 'kg-001', 'kg-<uuid8>'
  name            text not null,
  business_no     text,
  phone           text,
  address         text,
  director_id     uuid references auth.users(id) on delete set null,
  status          text not null default 'pending'
                    check (status in ('pending','active','rejected','suspended')),
  active          boolean not null default false,    -- 사용여부 마스터 스위치
  valid_from      date,
  valid_until     date,                              -- 사용 기한(만료일)
  approved_at     timestamptz,
  rejected_reason text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 원장 1명 : 어린이집 1곳
create unique index if not exists kindergartens_director_uniq
  on public.kindergartens(director_id) where director_id is not null;

-- 로그인 사용자(원장 + 총괄관리자). auth.users 와 1:1
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  role            text not null default 'director' check (role in ('director','admin')),
  kindergarten_id text references public.kindergartens(id) on delete set null,
  status          text not null default 'pending'
                    check (status in ('pending','active','rejected','suspended')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.kindergartens enable row level security;
alter table public.profiles      enable row level security;
