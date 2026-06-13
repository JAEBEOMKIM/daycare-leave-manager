-- Step 2: Foreign Key 관계 추가

-- 1. users 테이블에 facility_id 추가 (nullable)
alter table public.users
add column if not exists facility_id uuid;

-- 2. 해당 컬럼에 외래키 제약 추가
alter table public.users
add constraint fk_users_facility_id
  foreign key (facility_id) references public.facilities(id) on delete set null;

-- 3. facilities 테이블에 director_id 추가 (처음엔 nullable)
alter table public.facilities
add column if not exists director_id uuid;

-- 4. 해당 컬럼에 외래키 제약 추가
alter table public.facilities
add constraint fk_facilities_director_id
  foreign key (director_id) references public.users(id);
