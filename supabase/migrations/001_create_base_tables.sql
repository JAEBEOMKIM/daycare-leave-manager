-- Step 1: 기본 테이블 생성

-- Users 테이블 (facility_id 없이)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  role text default 'staff',
  provider text,
  provider_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Facilities 테이블 (director_id는 나중에 추가)
create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  fiscal_year_start integer default 3,
  annual_days_base integer default 20,
  contact_email text,
  contact_phone text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Employees 테이블
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  position text not null,
  email text,
  phone text,
  hire_date date not null,
  status text default 'active',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 연차 정책 기준 테이블
create table if not exists public.leave_standards (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  months_service_from integer not null,
  months_service_to integer,
  annual_days integer not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Annual Leave Balance 테이블
create table if not exists public.annual_leave_balance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_year integer not null,
  base_days integer not null default 0,
  additional_days integer default 0,
  used_days decimal(5,1) default 0,
  deducted_days integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(employee_id, leave_year)
);

-- Leave Requests 테이블
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  days_consumed decimal(5,1) not null,
  reason text,
  status text default 'pending',
  approved_by uuid references public.users(id),
  approved_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Facility Settings 테이블
create table if not exists public.facility_settings (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null unique references public.facilities(id) on delete cascade,
  allow_self_approval boolean default false,
  auto_approve_half_day boolean default true,
  weekends_count_as_leave boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
