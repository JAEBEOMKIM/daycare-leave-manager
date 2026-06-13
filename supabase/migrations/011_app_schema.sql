-- ============================================================
-- LeaveSync 전체 앱 스키마 (직원/연차/이력/기준/직급/대체교사)
-- Supabase 대시보드 > SQL Editor 에 붙여넣어 1회 실행하세요.
-- (프로토타입: 인증 생략 상태이므로 anon 전체 허용 RLS)
-- ============================================================

-- 직급
create table if not exists public.positions (
  id text primary key,
  kindergarten_id text,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 연차 기준표 (입사일=근속 기준)
create table if not exists public.leave_tiers (
  id text primary key,
  min_years int not null default 0,
  days numeric not null default 0,
  label text
);

-- 직원
create table if not exists public.staff (
  id text primary key,
  kindergarten_id text,
  name text not null,
  staff_number text,
  position_id text,
  employment_type text,
  status text,
  hire_date date,
  resignation_date date,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 직원별 연차 잔액 (연도별)
create table if not exists public.leave_balances (
  id text primary key,
  staff_id text not null,
  year int not null,
  total_days numeric default 0,
  used_days numeric default 0,
  special_addition numeric default 0,
  special_deduction numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 연차 추가/차감 조정 이력
create table if not exists public.leave_adjustments (
  id text primary key,
  staff_id text not null,
  year int not null,
  adjustment_type text not null,
  days numeric not null,
  reason text,
  created_at timestamptz default now()
);

-- 연차 사용 이력
create table if not exists public.leave_history (
  id text primary key,
  staff_id text not null,
  year int,
  leave_type text,
  start_date date,
  end_date date,
  days_used numeric,
  reason text,
  sub_name text,
  sub_phone text,
  sub_start date,
  sub_end date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 대체교사 지원일 (연도별 잔액)
create table if not exists public.substitute_balances (
  id text primary key,
  staff_id text not null,
  year int not null,
  total_days numeric default 0,
  is_custom boolean default false,
  used_days numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 대체교사 월별 사용 내역
create table if not exists public.substitute_usages (
  id text primary key,
  staff_id text not null,
  year int not null,
  month int not null,
  days_used numeric default 0,
  note text,
  created_at timestamptz default now()
);

-- ---------- RLS (프로토타입: anon 전체 허용) ----------
do $$
declare t text;
begin
  foreach t in array array[
    'positions','leave_tiers','staff','leave_balances','leave_adjustments',
    'leave_history','substitute_balances','substitute_usages'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_all', t);
    execute format(
      'create policy %I on public.%I for all using (true) with check (true);',
      t || '_all', t
    );
  end loop;
end $$;
