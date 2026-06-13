-- Step 4: 테스트 데이터 추가

-- 1. 테스트 사용자 생성 (Supabase Auth에서 먼저 생성해야 함)
-- 이 부분은 수동으로 처리:
-- 1) Supabase 콘솔 → Authentication → Users
-- 2) Add User 클릭
-- 3) Email: test@example.com, Password: Test123456!

-- 2. Users 테이블에 테스트 원장 추가
-- ⚠️ 주의: 아래 UUID는 Supabase Auth에서 생성된 사용자 UUID로 변경해야 합니다!
insert into public.users (id, email, display_name, role, provider)
values (
  '978aa66d-ad6e-4e78-9a75-b915f3094c3b',  -- Supabase Auth UUID로 변경 필요
  'jboom825@gmail.com',
  '김재범',
  'director',
  'email'
) on conflict(id) do nothing;

-- 3. Facilities 테이블에 테스트 어린이집 추가
insert into public.facilities (
  id,
  name,
  address,
  director_id,
  contact_email,
  contact_phone,
  fiscal_year_start,
  annual_days_base
)
values (
  gen_random_uuid(),
  '구립아이솔',
  '서울시 강서구 방화동',
  (select id from public.users where email = 'jboom825@gmail.com'),
  'jboom825@gmail.com',
  '02-2664-9574',
  3,
  20
) on conflict do nothing;

-- 4. Users 테이블의 facility_id 업데이트
update public.users
set facility_id = (
  select id from public.facilities
  where name = '구립아이솔'
)
where email = 'jboom825@gmail.com';

-- 5. 테스트 직원 추가
insert into public.employees (
  id,
  facility_id,
  user_id,
  name,
  position,
  email,
  phone,
  hire_date,
  status
)
values
  (
    gen_random_uuid(),
    (select id from public.facilities where name = '구립아이솔'),
    null,
    '박서준',
    '담임교사',
    'park@example.com',
    '010-2345-6789',
    '2021-08-01',
    'active'
  ),
  (
    gen_random_uuid(),
    (select id from public.facilities where name = '구립아이솔'),
    null,
    '이민지',
    '담임교사',
    'lee@example.com',
    '010-3456-7890',
    '2022-01-10',
    'active'
  ),
  (
    gen_random_uuid(),
    (select id from public.facilities where name = '구립아이솔'),
    null,
    '최유진',
    '보조교사',
    'choi@example.com',
    '010-4567-8901',
    '2023-06-20',
    'active'
  );

-- 6. 직원별 연차 잔액 초기화 (2026년)
insert into public.annual_leave_balance (
  id,
  employee_id,
  leave_year,
  base_days,
  additional_days,
  used_days,
  deducted_days
)
select
  gen_random_uuid(),
  e.id,
  2026,
  20,
  0,
  0,
  0
from public.employees e
where e.facility_id = (select id from public.facilities where name = '구립아이솔');

-- 7. 연차 정책 기준 설정
insert into public.leave_standards (
  id,
  facility_id,
  months_service_from,
  months_service_to,
  annual_days
)
values
  (
    gen_random_uuid(),
    (select id from public.facilities where name = '구립아이솔'),
    0,
    6,
    11
  ),
  (
    gen_random_uuid(),
    (select id from public.facilities where name = '구립아이솔'),
    6,
    36,
    15
  ),
  (
    gen_random_uuid(),
    (select id from public.facilities where name = '구립아이솔'),
    36,
    null,
    20
  );

-- 8. 시설 설정 초기화
insert into public.facility_settings (
  id,
  facility_id,
  allow_self_approval,
  auto_approve_half_day,
  weekends_count_as_leave
)
values (
  gen_random_uuid(),
  (select id from public.facilities where name = '구립아이솔'),
  false,
  true,
  false
);

-- 확인: 생성된 데이터
select '=== Users ===' as section;
select id, email, display_name, role from public.users;

select '=== Facilities ===' as section;
select id, name, address, director_id from public.facilities;

select '=== Employees ===' as section;
select id, name, position, email, hire_date from public.employees;
